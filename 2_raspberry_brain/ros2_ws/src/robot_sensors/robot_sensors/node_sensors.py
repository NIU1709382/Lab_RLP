import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Range, Image, Imu
from geometry_msgs.msg import Twist
import numpy as np

# ─────────────────────────────────────────────────────────────────
# CONFIGURACIÓ
# ─────────────────────────────────────────────────────────────────

ROBOT_REAL    = False
TEN_IMU       = False
HOST_COPPELIA = '172.31.96.1'

DIST_MIN = 0.05
DIST_MAX = 4.0

FREQ_ULTRASONS = 20.0
FREQ_CAMERA    = 10.0


class SensorsNode(Node):

    def __init__(self):
        super().__init__('sensors_node')
        self.get_logger().info('Sensors Node iniciant...')

        if not ROBOT_REAL:
            self._init_coppelia()
        else:
            self._init_hardware_real()

        # ── Publishers ─────────────────────────────────────────
        self.pub_us_centre   = self.create_publisher(Range, '/sensors/ultrasonic/centre', 10)
        self.pub_us_esquerre = self.create_publisher(Range, '/sensors/ultrasonic/esquerre', 10)
        self.pub_us_dret     = self.create_publisher(Range, '/sensors/ultrasonic/dret', 10)
        self.pub_camera      = self.create_publisher(Image, '/camera/image_raw', 10)

        if TEN_IMU:
            self.pub_imu = self.create_publisher(Imu, '/imu/data', 10)

        # ── Subscriber — rep ordres de velocitat ───────────────
        # El navegacio_node publica aquí i nosaltres apliquem als motors
        self.sub_cmd_vel = self.create_subscription(
            Twist, '/cmd_vel', self.callback_cmd_vel, 10)

        # ── Timers ─────────────────────────────────────────────
        self.timer_sensors = self.create_timer(1.0 / FREQ_ULTRASONS, self.update_sensors)
        self.timer_camera  = self.create_timer(1.0 / FREQ_CAMERA,    self.update_camera)

        self.get_logger().info('Sensors Node llest!')

    # ─────────────────────────────────────────────────────────────
    # INICIALITZACIÓ
    # ─────────────────────────────────────────────────────────────
    def _init_coppelia(self):
        from coppeliasim_zmqremoteapi_client import RemoteAPIClient

        self.get_logger().info(f'Connectant a CoppeliaSim ({HOST_COPPELIA})...')
        self.client = RemoteAPIClient(host=HOST_COPPELIA)
        self.sim    = self.client.getObject('sim')
        self.client.setStepping(True)

        # Sensors
        self.h_sensor_c = self.sim.getObject('/Xassis_Fisic/Proximity_Frontal')
        self.h_sensor_e = self.sim.getObject('/Xassis_Fisic/Proximity_Esquerre')
        self.h_sensor_d = self.sim.getObject('/Xassis_Fisic/Proximity_Dreta')
        self.h_camera   = self.sim.getObject('/Xassis_Fisic/Vision_sensor')

        # Motors — els controla sensors_node via /cmd_vel
        self.h_motor_esq = self.sim.getObject('/Xassis_Fisic/Joint_Motor_Esquerre')
        self.h_motor_dre = self.sim.getObject('/Xassis_Fisic/Joint_Motor_Dret')

        self.sim.startSimulation()
        self.get_logger().info('CoppeliaSim connectat!')

    def _init_hardware_real(self):
        """
        TODO: inicialitzar sensors reals.
        - Ultrasons via Arduino (USB serial)
        - Càmera via picamera2 o cv2.VideoCapture
        - IMU via smbus2
        """
        self.get_logger().warn('Mode robot real — pendent implementar')

    # ─────────────────────────────────────────────────────────────
    # ACTUALITZACIÓ SENSORS (20 Hz)
    # ─────────────────────────────────────────────────────────────
    def update_sensors(self):
        if ROBOT_REAL:
            # TODO: llegir ultrasons reals de l'Arduino
            return

        try:
            self.client.step()

            dc = self._llegeix_ultrasonic(self.h_sensor_c)
            de = self._llegeix_ultrasonic(self.h_sensor_e)
            dd = self._llegeix_ultrasonic(self.h_sensor_d)

            self._publica_range(self.pub_us_centre,   dc, 'ultrasonic_centre')
            self._publica_range(self.pub_us_esquerre, de, 'ultrasonic_esquerre')
            self._publica_range(self.pub_us_dret,     dd, 'ultrasonic_dret')

        except Exception as e:
            self.get_logger().warn(f'Error sensors: {e}')

    # ─────────────────────────────────────────────────────────────
    # ACTUALITZACIÓ CÀMERA (10 Hz)
    # ─────────────────────────────────────────────────────────────
    def update_camera(self):
        if ROBOT_REAL:
            # TODO: llegir càmera real
            return

        try:
            img_raw, resol = self.sim.getVisionSensorImg(self.h_camera)
            w, h = resol[0], resol[1]

            img_array = np.frombuffer(img_raw, dtype=np.uint8).reshape((h, w, 3))
            img_array = np.flipud(img_array)

            msg = Image()
            msg.header.stamp    = self.get_clock().now().to_msg()
            msg.header.frame_id = 'camera_frame'
            msg.height          = h
            msg.width           = w
            msg.encoding        = 'rgb8'
            msg.step            = w * 3
            msg.data            = img_array.tobytes()

            self.pub_camera.publish(msg)

        except Exception as e:
            self.get_logger().warn(f'Error càmera: {e}')

    # ─────────────────────────────────────────────────────────────
    # CALLBACK VELOCITAT
    # ─────────────────────────────────────────────────────────────
    def callback_cmd_vel(self, msg):
        """
        Rep ordres de velocitat del navegacio_node i les aplica
        als motors de CoppeliaSim.
        Twist.linear.x  → velocitat endavant/enrere
        Twist.angular.z → velocitat de gir
        """
        if ROBOT_REAL:
            # TODO: enviar velocitats a l'Arduino
            return

        # Convertim Twist (linear+angular) a velocitats L/R
        vel_linear  = msg.linear.x
        vel_angular = msg.angular.z

        ve = vel_linear - vel_angular
        vd = vel_linear + vel_angular

        try:
            self.sim.setJointTargetVelocity(self.h_motor_esq, ve)
            self.sim.setJointTargetVelocity(self.h_motor_dre, vd)
        except Exception as e:
            self.get_logger().warn(f'Error motors: {e}')

    # ─────────────────────────────────────────────────────────────
    # FUNCIONS AUXILIARS
    # ─────────────────────────────────────────────────────────────
    def _llegeix_ultrasonic(self, handle):
        estat, dist, _, _, _ = self.sim.readProximitySensor(handle)
        if estat and DIST_MIN <= dist <= DIST_MAX:
            return dist
        return DIST_MAX

    def _publica_range(self, publisher, distancia, frame_id):
        msg = Range()
        msg.header.stamp    = self.get_clock().now().to_msg()
        msg.header.frame_id = frame_id
        msg.radiation_type  = Range.ULTRASOUND
        msg.field_of_view   = 0.2618
        msg.min_range       = DIST_MIN
        msg.max_range       = DIST_MAX
        msg.range           = float(distancia)
        publisher.publish(msg)

    def destroy_node(self):
        if not ROBOT_REAL:
            try:
                self.sim.setJointTargetVelocity(self.h_motor_esq, 0)
                self.sim.setJointTargetVelocity(self.h_motor_dre, 0)
                self.sim.stopSimulation()
                self.get_logger().info('Simulació aturada.')
            except:
                pass
        super().destroy_node()


def main(args=None):
    rclpy.init(args=args)
    node = SensorsNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()