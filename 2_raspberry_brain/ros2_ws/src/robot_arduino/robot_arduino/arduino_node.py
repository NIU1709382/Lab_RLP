





#EXEMPLE DE NODE PER COMUNICAR AMB ARDUINO PER USB
#L'Arduino ha d'enviar dades en format JSON per aquest node, i rebre ordres també en format JSON. Aquest node publica les dades dels sensors a ROS i rep ordres de velocitat i servos per enviar-les a l'Arduino.
#Aixo es aproximat, no amb els components exactes ni funcions exactes, es una mica d esquelet de referencia per començar a implementar la comunicació Arduino-ROS. Cal adaptar-ho al teu robot i al codi de l'Arduino.







import rclpy
from rclpy.node import Node

# Tipus de missatges ROS
from sensor_msgs.msg import Range, Imu      # ultrasons i IMU
from std_msgs.msg import Float32MultiArray, Int32MultiArray  # servos i encoders
from geometry_msgs.msg import Twist          # ordres de velocitat

import serial
import json

# ─────────────────────────────────────────────────────────────────
# PARÀMETRES
# ─────────────────────────────────────────────────────────────────
PORT_ARDUINO = '/dev/ttyUSB0'  # canvia si cal (/dev/ttyACM0)
BAUD_RATE    = 115200
NUM_SERVOS   = 8
ROBOT_REAL   = False           # False = simulació, True = robot real


class ArduinoNode(Node):

    def __init__(self):
        super().__init__('arduino_node')
        self.get_logger().info('Arduino Node iniciat!')

        # ── Connexió USB amb Arduino ───────────────────────────
        self.serial_conn = None
        if ROBOT_REAL:
            try:
                self.serial_conn = serial.Serial(PORT_ARDUINO, BAUD_RATE, timeout=1)
                self.get_logger().info(f'Connectat a Arduino: {PORT_ARDUINO}')
            except Exception as e:
                self.get_logger().error(f'Error Arduino: {e}')

        # ── Publishers — publica dades cap a altres nodes ──────

        # Sensors ultrasons HC-SR04 (un tòpic per sensor)
        self.pub_us_centre   = self.create_publisher(Range, '/sensors/ultrasonic/centre', 10)
        self.pub_us_esquerre = self.create_publisher(Range, '/sensors/ultrasonic/esquerre', 10)
        self.pub_us_dret     = self.create_publisher(Range, '/sensors/ultrasonic/dret', 10)

        # IMU — giroscopi + acceleròmetre (opcional, si el robot en té)
        self.pub_imu = self.create_publisher(Imu, '/sensors/imu', 10)

        # Encoders — posició actual dels motors (ticks)
        # Int32MultiArray → [encoder_esquerre, encoder_dret]
        self.pub_encoders = self.create_publisher(
            Int32MultiArray, '/sensors/encoders', 10)

        # ── Subscribers — rep ordres d'altres nodes ────────────

        # Ordres de velocitat del slam_node
        # Twist.linear.x  → endavant/enrere
        # Twist.angular.z → gir esquerre/dret
        self.sub_cmd_vel = self.create_subscription(
            Twist, '/cmd_vel', self.callback_velocitat, 10)

        # Ordres dels servos del node de gestos/veu
        # Float32MultiArray → [servo0, servo1, ..., servo7]
        # Cada valor és l'angle en graus (0-180)
        self.sub_servos = self.create_subscription(
            Float32MultiArray, '/servos/angles', self.callback_servos, 10)

        # ── Timer — llegeix Arduino cada 0.05 segons ───────────
        self.timer = self.create_timer(0.05, self.update)

        self.get_logger().info('Arduino Node llest!')

    # ─────────────────────────────────────────────────────────────
    # LECTURA DE L'ARDUINO
    # ─────────────────────────────────────────────────────────────
    def update(self):
        """
        Llegeix les dades de l'Arduino per USB i les publica a ROS.
        L'Arduino ha d'enviar JSON cada cicle, per exemple:
        {
          "uc": 0.45,          → ultrasò centre (metres)
          "ue": 1.20,          → ultrasò esquerre (metres)
          "ud": 0.80,          → ultrasò dret (metres)
          "enc": [1024, 1020], → encoders [esq, dre] (ticks)
          "imu": {             → IMU (opcional)
            "ax": 0.1, "ay": 0.0, "az": 9.8,
            "gx": 0.0, "gy": 0.0, "gz": 0.01
          }
        }
        """
        if not ROBOT_REAL or self.serial_conn is None:
            return

        try:
            linia = self.serial_conn.readline().decode('utf-8').strip()
            if not linia:
                return

            dades = json.loads(linia)

            # Publiquem ultrasons
            self._publica_ultrasonic(self.pub_us_centre,   dades.get('uc', 4.0))
            self._publica_ultrasonic(self.pub_us_esquerre, dades.get('ue', 4.0))
            self._publica_ultrasonic(self.pub_us_dret,     dades.get('ud', 4.0))

            # Publiquem encoders si venen
            if 'enc' in dades:
                msg = Int32MultiArray()
                msg.data = dades['enc']
                self.pub_encoders.publish(msg)

            # Publiquem IMU si ve
            if 'imu' in dades:
                self._publica_imu(dades['imu'])

        except Exception as e:
            self.get_logger().warn(f'Error llegint Arduino: {e}')

    # ─────────────────────────────────────────────────────────────
    # CALLBACKS — rep ordres i les envia a l'Arduino
    # ─────────────────────────────────────────────────────────────
    def callback_velocitat(self, msg):
        """
        Rep ordres de velocitat (Twist) i les converteix
        a velocitats dels dos motors (cinemàtica diferencial).
        """
        if not ROBOT_REAL or self.serial_conn is None:
            return

        try:
            vel_linear  = msg.linear.x
            vel_angular = msg.angular.z

            # Cinemàtica diferencial: converteix linear+angular a L/R
            vel_esq = vel_linear - vel_angular
            vel_dre = vel_linear + vel_angular

            # Limitem a rang segur [-1.0, 1.0]
            vel_esq = max(-1.0, min(1.0, vel_esq))
            vel_dre = max(-1.0, min(1.0, vel_dre))

            ordre = json.dumps({'ve': vel_esq, 'vd': vel_dre}) + '\n'
            self.serial_conn.write(ordre.encode('utf-8'))

        except Exception as e:
            self.get_logger().warn(f'Error enviant velocitat: {e}')

    def callback_servos(self, msg):
        """
        Rep angles dels 8 servos i els envia a l'Arduino.
        msg.data = [angle0, angle1, ..., angle7] en graus (0-180)
        """
        if not ROBOT_REAL or self.serial_conn is None:
            return

        try:
            if len(msg.data) != NUM_SERVOS:
                self.get_logger().warn(
                    f'Esperava {NUM_SERVOS} servos, rebut {len(msg.data)}')
                return

            angles = [max(0.0, min(180.0, a)) for a in msg.data]
            ordre  = json.dumps({'servos': angles}) + '\n'
            self.serial_conn.write(ordre.encode('utf-8'))

        except Exception as e:
            self.get_logger().warn(f'Error enviant servos: {e}')

    # ─────────────────────────────────────────────────────────────
    # FUNCIONS AUXILIARS
    # ─────────────────────────────────────────────────────────────
    def _publica_ultrasonic(self, publisher, distancia):
        """Publica una lectura d'ultrasons en format estàndard ROS."""
        msg = Range()
        msg.header.stamp    = self.get_clock().now().to_msg()
        msg.header.frame_id = 'base_link'
        msg.radiation_type  = Range.ULTRASOUND
        msg.field_of_view   = 0.26   # ~15 graus
        msg.min_range       = 0.02   # 2cm mínim HC-SR04
        msg.max_range       = 4.0    # 4m màxim HC-SR04
        msg.range           = float(distancia)
        publisher.publish(msg)

    def _publica_imu(self, imu_dades):
        """Publica dades de la IMU en format estàndard ROS."""
        msg = Imu()
        msg.header.stamp    = self.get_clock().now().to_msg()
        msg.header.frame_id = 'base_link'

        # Acceleròmetre (m/s²)
        msg.linear_acceleration.x = imu_dades.get('ax', 0.0)
        msg.linear_acceleration.y = imu_dades.get('ay', 0.0)
        msg.linear_acceleration.z = imu_dades.get('az', 9.8)

        # Giroscopi (rad/s)
        msg.angular_velocity.x = imu_dades.get('gx', 0.0)
        msg.angular_velocity.y = imu_dades.get('gy', 0.0)
        msg.angular_velocity.z = imu_dades.get('gz', 0.0)

        self.pub_imu.publish(msg)

    def destroy_node(self):
        """Tanca la connexió USB en aturar el node."""
        if self.serial_conn:
            self.serial_conn.close()
            self.get_logger().info('Connexió Arduino tancada.')
        super().destroy_node()


# ─────────────────────────────────────────────────────────────────
# PUNT D'ENTRADA
# ─────────────────────────────────────────────────────────────────
def main(args=None):
    rclpy.init(args=args)
    node = ArduinoNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()