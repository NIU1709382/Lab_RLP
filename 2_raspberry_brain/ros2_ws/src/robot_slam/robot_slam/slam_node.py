import rclpy
from rclpy.node import Node

import numpy as np
import math
import os

from sensor_msgs.msg import Range, Image
from geometry_msgs.msg import Twist, PoseStamped, TransformStamped
from nav_msgs.msg import OccupancyGrid

from tf2_ros import TransformBroadcaster

# ─────────────────────────────────────────────────────────────────
# CONFIGURACIÓ
# ─────────────────────────────────────────────────────────────────

# Sensors a 90° (ES QUEDEN AIXÍ)
ANGLE_SENSOR_CENTRE   =  0.0
ANGLE_SENSOR_ESQUERRE =  1.5708
ANGLE_SENSOR_DRET     = -1.5708

OFFSET_LATERAL_ESQUERRE =  0.10
OFFSET_LATERAL_DRET     = -0.10

DIST_MIN = 0.05
DIST_MAX = 4.0

# Mapa
RESOLUCIO_M = 0.05
MIDA_MAPA   = 300
CENTRE_MAPA = MIDA_MAPA // 2

# Log Odds
LOG_ODDS_OCUPAT =  0.7
LOG_ODDS_BUIT   = -0.4

LOG_ODDS_MAX =  3.0
LOG_ODDS_MIN = -3.0

# Càmera
LLINDAR_OBSTACLE_CAMERA = 40
LLINDAR_LLIURE_CAMERA   = 180
FRANJA_INFERIOR = 0.6

# Guardar mapa
GUARDAR_MAPA = True
FITXER_MAPA  = 'mapa_guardat.npy'

# ─────────────────────────────────────────────────────────────────

class SlamNode(Node):

    def __init__(self):

        super().__init__('slam_node')

        self.get_logger().info('SLAM Node iniciant...')

        # ─────────────────────────────────────────────────────────
        # MAPA
        # ─────────────────────────────────────────────────────────

        if GUARDAR_MAPA and os.path.exists(FITXER_MAPA):

            self.mapa_log_odds = np.load(FITXER_MAPA)

            self.get_logger().info(
                'Mapa carregat.')

        else:

            self.mapa_log_odds = np.zeros(
                (MIDA_MAPA, MIDA_MAPA),
                dtype=np.float32)

            self.get_logger().info(
                'Mapa nou creat.')

        # ─────────────────────────────────────────────────────────
        # POSICIÓ ROBOT
        # ─────────────────────────────────────────────────────────

        self.robot_x   = 0.0
        self.robot_y   = 0.0
        self.robot_yaw = 0.0

        self.ultima_t = None

        # ─────────────────────────────────────────────────────────
        # ÚLTIMS SENSORS
        # ─────────────────────────────────────────────────────────

        self.dc = DIST_MAX
        self.de = DIST_MAX
        self.dd = DIST_MAX

        self.ultima_imatge = None

        # ─────────────────────────────────────────────────────────
        # SUBSCRIBERS
        # ─────────────────────────────────────────────────────────

        self.create_subscription(
            Range,
            '/sensors/ultrasonic/centre',
            self.callback_centre,
            10)

        self.create_subscription(
            Range,
            '/sensors/ultrasonic/esquerre',
            self.callback_esquerre,
            10)

        self.create_subscription(
            Range,
            '/sensors/ultrasonic/dret',
            self.callback_dret,
            10)

        self.create_subscription(
            Image,
            '/camera/image_raw',
            self.callback_camera,
            10)

        # Odometria estimada amb cmd_vel
        self.create_subscription(
            Twist,
            '/cmd_vel',
            self.callback_cmd_vel,
            10)

        # ─────────────────────────────────────────────────────────
        # PUBLISHERS
        # ─────────────────────────────────────────────────────────

        self.pub_mapa = self.create_publisher(
            OccupancyGrid,
            '/map',
            10)

        self.pub_pose = self.create_publisher(
            PoseStamped,
            '/robot_pose',
            10)

        self.tf_broadcaster = TransformBroadcaster(self)

        # ─────────────────────────────────────────────────────────
        # TIMERS
        # ─────────────────────────────────────────────────────────

        self.timer_update = self.create_timer(
            0.1,
            self.update_mapa)

        self.timer_publica = self.create_timer(
            0.5,
            self.publica)

        self.get_logger().info('SLAM Node llest!')

    # ─────────────────────────────────────────────────────────────
    # CALLBACKS
    # ─────────────────────────────────────────────────────────────

    def callback_centre(self, msg):
        self.dc = msg.range

    def callback_esquerre(self, msg):
        self.de = msg.range

    def callback_dret(self, msg):
        self.dd = msg.range

    def callback_camera(self, msg):
        self.ultima_imatge = msg

    # ─────────────────────────────────────────────────────────────
    # ODOMETRIA SIMPLE
    # ─────────────────────────────────────────────────────────────

    def callback_cmd_vel(self, msg):

        ara = self.get_clock().now().nanoseconds / 1e9

        if self.ultima_t is None:
            self.ultima_t = ara
            return

        dt = ara - self.ultima_t
        self.ultima_t = ara

        if dt > 0.5:
            return

        vel_linear  = msg.linear.x
        vel_angular = msg.angular.z

        self.robot_x += (
            vel_linear *
            math.cos(self.robot_yaw) *
            dt)

        self.robot_y += (
            vel_linear *
            math.sin(self.robot_yaw) *
            dt)

        self.robot_yaw += vel_angular * dt

        self.robot_yaw = math.atan2(
            math.sin(self.robot_yaw),
            math.cos(self.robot_yaw))

    # ─────────────────────────────────────────────────────────────
    # UPDATE MAPA
    # ─────────────────────────────────────────────────────────────

    def update_mapa(self):

        lectures = [

            (
                self.dc,
                ANGLE_SENSOR_CENTRE,
                0.0
            ),

            (
                self.de,
                ANGLE_SENSOR_ESQUERRE,
                OFFSET_LATERAL_ESQUERRE
            ),

            (
                self.dd,
                ANGLE_SENSOR_DRET,
                OFFSET_LATERAL_DRET
            ),
        ]

        for dist, angle_rel, offset_lat in lectures:

            self.actualitza_raig(
                dist,
                angle_rel,
                offset_lat)

        # CÀMERA
        if self.ultima_imatge is not None:

            self.actualitza_camera(
                self.ultima_imatge)

            self.ultima_imatge = None

    # ─────────────────────────────────────────────────────────────
    # RAYCASTING ULTRASONS
    # ─────────────────────────────────────────────────────────────

    def actualitza_raig(self,
                        dist,
                        angle_rel,
                        offset_lat):

        ha_detectat = dist < DIST_MAX

        sx = (
            self.robot_x -
            offset_lat *
            math.sin(self.robot_yaw)
        )

        sy = (
            self.robot_y +
            offset_lat *
            math.cos(self.robot_yaw)
        )

        angle_abs = (
            self.robot_yaw +
            angle_rel
        )

        dist_raig = (
            dist if ha_detectat
            else DIST_MAX
        )

        num_passos = int(
            dist_raig /
            (RESOLUCIO_M / 2)
        )

        for i in range(1, num_passos + 1):

            d = i * (RESOLUCIO_M / 2)

            xp = sx + d * math.cos(angle_abs)
            yp = sy + d * math.sin(angle_abs)

            cx, cy = self.pos_a_cel(xp, yp)

            if not (
                0 <= cx < MIDA_MAPA and
                0 <= cy < MIDA_MAPA
            ):
                break

            # obstacle
            if ha_detectat and i == num_passos:

                self.mapa_log_odds[cy, cx] = min(
                    self.mapa_log_odds[cy, cx]
                    + LOG_ODDS_OCUPAT,
                    LOG_ODDS_MAX)

            # lliure
            else:

                self.mapa_log_odds[cy, cx] = max(
                    self.mapa_log_odds[cy, cx]
                    + LOG_ODDS_BUIT,
                    LOG_ODDS_MIN)

    # ─────────────────────────────────────────────────────────────
    # PROCESSAMENT CÀMERA
    # ─────────────────────────────────────────────────────────────

    def actualitza_camera(self, img_msg):

        try:

            h = img_msg.height
            w = img_msg.width

            img = np.frombuffer(
                img_msg.data,
                dtype=np.uint8).reshape((h, w, 3))

            y_inici = int(h * FRANJA_INFERIOR)

            franja = img[y_inici:, :]

            gris = np.mean(
                franja,
                axis=2).astype(np.uint8)

            w_sector = w // 3

            sectors = [

                (
                    gris[:, :w_sector],
                    ANGLE_SENSOR_ESQUERRE,
                    OFFSET_LATERAL_ESQUERRE
                ),

                (
                    gris[:, w_sector:2*w_sector],
                    ANGLE_SENSOR_CENTRE,
                    0.0
                ),

                (
                    gris[:, 2*w_sector:],
                    ANGLE_SENSOR_DRET,
                    OFFSET_LATERAL_DRET
                )
            ]

            for sector_img, angle_rel, offset_lat in sectors:

                valor_mitja = np.mean(sector_img)

                angle_abs = (
                    self.robot_yaw +
                    angle_rel
                )

                dist_visual = (
                    0.3 +
                    (valor_mitja / 255.0) * 1.7
                )

                sx = (
                    self.robot_x -
                    offset_lat *
                    math.sin(self.robot_yaw)
                )

                sy = (
                    self.robot_y +
                    offset_lat *
                    math.cos(self.robot_yaw)
                )

                if valor_mitja < LLINDAR_OBSTACLE_CAMERA:

                    xp = sx + (
                        dist_visual *
                        math.cos(angle_abs)
                    )

                    yp = sy + (
                        dist_visual *
                        math.sin(angle_abs)
                    )

                    cx, cy = self.pos_a_cel(xp, yp)

                    if (
                        0 <= cx < MIDA_MAPA and
                        0 <= cy < MIDA_MAPA
                    ):

                        self.mapa_log_odds[cy, cx] = min(
                            self.mapa_log_odds[cy, cx]
                            + LOG_ODDS_OCUPAT * 0.5,
                            LOG_ODDS_MAX)

        except Exception as e:

            self.get_logger().warn(
                f'Error càmera: {e}')

    # ─────────────────────────────────────────────────────────────
    # PUBLICACIÓ
    # ─────────────────────────────────────────────────────────────

    def publica(self):

        self.publica_mapa()
        self.publica_pose()

    # ─────────────────────────────────────────────────────────────

    def publica_mapa(self):

        msg = OccupancyGrid()

        msg.header.stamp = (
            self.get_clock().now().to_msg())

        msg.header.frame_id = 'map'

        msg.info.resolution = RESOLUCIO_M
        msg.info.width  = MIDA_MAPA
        msg.info.height = MIDA_MAPA

        msg.info.origin.position.x = (
            -CENTRE_MAPA * RESOLUCIO_M)

        msg.info.origin.position.y = (
            -CENTRE_MAPA * RESOLUCIO_M)

        prob = 1.0 / (
            1.0 + np.exp(-self.mapa_log_odds)
        )

        grid = np.full(
            (MIDA_MAPA, MIDA_MAPA),
            -1,
            dtype=np.int8)

        grid[prob > 0.65] = 100
        grid[prob < 0.35] = 0

        msg.data = grid.flatten().tolist()

        self.pub_mapa.publish(msg)

    # ─────────────────────────────────────────────────────────────

    def publica_pose(self):

        msg = PoseStamped()

        msg.header.stamp = (
            self.get_clock().now().to_msg())

        msg.header.frame_id = 'map'

        msg.pose.position.x = self.robot_x
        msg.pose.position.y = self.robot_y

        msg.pose.orientation.z = math.sin(
            self.robot_yaw / 2)

        msg.pose.orientation.w = math.cos(
            self.robot_yaw / 2)

        self.pub_pose.publish(msg)

        # TF

        t = TransformStamped()

        t.header.stamp = (
            self.get_clock().now().to_msg())

        t.header.frame_id = 'map'
        t.child_frame_id  = 'base_link'

        t.transform.translation.x = self.robot_x
        t.transform.translation.y = self.robot_y

        t.transform.rotation.z = math.sin(
            self.robot_yaw / 2)

        t.transform.rotation.w = math.cos(
            self.robot_yaw / 2)

        self.tf_broadcaster.sendTransform(t)

    # ─────────────────────────────────────────────────────────────
    # AUXILIARS
    # ─────────────────────────────────────────────────────────────

    def pos_a_cel(self, x, y):

        cx = int(
            CENTRE_MAPA +
            x / RESOLUCIO_M)

        cy = int(
            CENTRE_MAPA +
            y / RESOLUCIO_M)

        return cx, cy

    # ─────────────────────────────────────────────────────────────

    def destroy_node(self):

        if GUARDAR_MAPA:

            np.save(
                FITXER_MAPA,
                self.mapa_log_odds)

            self.get_logger().info(
                'Mapa guardat.')

        super().destroy_node()

# ─────────────────────────────────────────────────────────────────

def main(args=None):

    rclpy.init(args=args)

    node = SlamNode()

    rclpy.spin(node)

    node.destroy_node()

    rclpy.shutdown()

# ─────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    main()

