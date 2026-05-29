import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Range, Image
from nav_msgs.msg import OccupancyGrid
from geometry_msgs.msg import Twist
import numpy as np
import math
import os

# ─────────────────────────────────────────────────────────────────
# CONFIGURACIÓ
# ─────────────────────────────────────────────────────────────────

# Mapa
RESOLUCIO_M  = 0.05   # metres per cel·la (5cm)
MIDA_MAPA    = 300    # cel·les (300x300 = 15x15 metres)
CENTRE_MAPA  = MIDA_MAPA // 2

# Log-odds — sistema probabilístic per actualitzar el mapa
# Cada lectura suma o resta d'una probabilitat acumulada
LOG_ODDS_OCUPAT =  0.7   # +0.7 quan detectem obstacle
LOG_ODDS_BUIT   = -0.4   # -0.4 quan confirmem espai lliure
LOG_ODDS_MAX    =  3.0   # límit màxim (evita certesa absoluta)
LOG_ODDS_MIN    = -3.0   # límit mínim

# Angles dels sensors respecte al robot (radians)
ANGLE_CENTRE   =  0.0
ANGLE_ESQUERRE =  1.5708   # 90°
ANGLE_DRET     = -1.5708   # -90°

# Distàncies
DIST_MAX = 4.0
DIST_MIN = 0.05

# Guardar/carregar mapa
GUARDAR_MAPA  = True
FITXER_MAPA   = '/mnt/c/Users/berna/Lab_RLP/2_raspberry_brain/ros2_ws/mapa_guardat.npy'

# Detecció d'obstacles per càmera
# Píxels molt foscos = obstacle (paret, moble...)
# Píxels molt clars = terra navegable
LLINDAR_OBSTACLE_CAMERA = 40    # per sota d'aquest valor (0-255) = obstacle
LLINDAR_LLIURE_CAMERA   = 180   # per sobre d'aquest valor = terra lliure
FRANJA_INFERIOR = 0.6           # analitzem el 40% inferior de la imatge
                                 # (la part que veu el terra i obstacles propers)


class MapaNode(Node):

    def __init__(self):
        super().__init__('mapa_node')
        self.get_logger().info('Mapa Node iniciant...')

        # ── Mapa d'ocupació (log-odds) ─────────────────────────
        # Cada cel·la guarda la probabilitat logarítmica d'estar ocupada
        # 0 = desconegut, >0 = obstacle, <0 = lliure
        if GUARDAR_MAPA and os.path.exists(FITXER_MAPA):
            self.mapa_log_odds = np.load(FITXER_MAPA)
            self.get_logger().info(f'Mapa carregat de {FITXER_MAPA}')
        else:
            self.mapa_log_odds = np.zeros((MIDA_MAPA, MIDA_MAPA), dtype=np.float32)
            self.get_logger().info('Mapa nou creat')

        # ── Posició del robot ──────────────────────────────────
        # Calculada per odometria (integrant /cmd_vel)
        self.robot_x   = 0.0
        self.robot_y   = 0.0
        self.robot_yaw = 0.0
        self.ultima_t  = None   # temps de l'última actualització

        # Posició inicial al centre del mapa
        self.origen_x = 0.0
        self.origen_y = 0.0

        # ── Últimes lectures dels sensors ──────────────────────
        self.dc = DIST_MAX
        self.de = DIST_MAX
        self.dd = DIST_MAX
        self.ultima_imatge = None

        # ── Subscribers ────────────────────────────────────────
        self.create_subscription(
            Range, '/sensors/ultrasonic/centre',
            self.callback_us_centre, 10)
        self.create_subscription(
            Range, '/sensors/ultrasonic/esquerre',
            self.callback_us_esquerre, 10)
        self.create_subscription(
            Range, '/sensors/ultrasonic/dret',
            self.callback_us_dret, 10)

        # Rep la imatge de la càmera
        self.create_subscription(
            Image, '/camera/image_raw',
            self.callback_camera, 10)

        # Rep les velocitats per calcular l'odometria
        # (si no tenim encoders, estimem la posició per les ordres enviades)
        self.create_subscription(
            Twist, '/cmd_vel',
            self.callback_odometria, 10)

        # ── Publisher — publica el mapa a RViz2 ────────────────
        self.pub_mapa = self.create_publisher(OccupancyGrid, '/map', 10)

        # ── Timers ─────────────────────────────────────────────
        # Actualitza el mapa amb les lectures dels sensors (10 Hz)
        self.timer_mapa = self.create_timer(0.1, self.update_mapa)

        # Publica el mapa a RViz2 (2 Hz — no cal més sovint)
        self.timer_publica = self.create_timer(0.5, self.publica_mapa)

        self.get_logger().info('Mapa Node llest!')

    # ─────────────────────────────────────────────────────────────
    # CALLBACKS — reben dades dels altres nodes
    # ─────────────────────────────────────────────────────────────
    def callback_us_centre(self, msg):
        self.dc = msg.range

    def callback_us_esquerre(self, msg):
        self.de = msg.range

    def callback_us_dret(self, msg):
        self.dd = msg.range

    def callback_camera(self, msg):
        """Guarda la última imatge rebuda per processar-la al update."""
        self.ultima_imatge = msg

    def callback_odometria(self, msg):
        """
        Estima la posició del robot integrant les velocitats rebudes.
        És una odometria simple — acumula error amb el temps.
        Quan hi hagi IMU real, es podrà corregir.
        """
        ara = self.get_clock().now().nanoseconds / 1e9   # temps en segons

        if self.ultima_t is None:
            self.ultima_t = ara
            return

        dt = ara - self.ultima_t
        self.ultima_t = ara

        if dt > 0.5:   # salt de temps massa gran, ignorem
            return

        # Integrem velocitat → posició
        vel_linear  = msg.linear.x
        vel_angular = msg.angular.z

        self.robot_x   += vel_linear * math.cos(self.robot_yaw) * dt
        self.robot_y   += vel_linear * math.sin(self.robot_yaw) * dt
        self.robot_yaw += vel_angular * dt

        # Normalitzem l'angle entre -π i π
        self.robot_yaw = math.atan2(
            math.sin(self.robot_yaw),
            math.cos(self.robot_yaw))

    # ─────────────────────────────────────────────────────────────
    # ACTUALITZACIÓ DEL MAPA (10 Hz)
    # ─────────────────────────────────────────────────────────────
    def update_mapa(self):
        """
        Actualitza el mapa amb les lectures actuals dels sensors.
        Combina ultrasons i càmera.
        """
        # ── Actualitzar amb ultrasons ──────────────────────────
        lectures_us = [
            (self.dc, ANGLE_CENTRE,   0.0),
            (self.de, ANGLE_ESQUERRE,  0.10),
            (self.dd, ANGLE_DRET,     -0.10),
        ]
        for dist, angle_rel, offset_lat in lectures_us:
            self._actualitza_raig_ultrasonic(dist, angle_rel, offset_lat)

        # ── Actualitzar amb càmera ─────────────────────────────
        if self.ultima_imatge is not None:
            self._actualitza_amb_camera(self.ultima_imatge)
            self.ultima_imatge = None   # processem cada imatge un cop

    def _actualitza_raig_ultrasonic(self, dist, angle_rel, offset_lat):
        """
        Traça un raig des del sensor fins a la distància detectada.
        - Les cel·les del raig → marcades com a lliures
        - La cel·la final (obstacle) → marcada com a ocupada
        """
        ha_detectat = dist < DIST_MAX

        # Posició real del sensor (desplaçat lateralment del centre)
        sx = self.robot_x - offset_lat * math.sin(self.robot_yaw)
        sy = self.robot_y + offset_lat * math.cos(self.robot_yaw)

        angle_abs  = self.robot_yaw + angle_rel
        dist_raig  = dist if ha_detectat else DIST_MAX
        num_passos = int(dist_raig / (RESOLUCIO_M / 2))

        for i in range(1, num_passos + 1):
            d  = i * (RESOLUCIO_M / 2)
            xp = sx + d * math.cos(angle_abs)
            yp = sy + d * math.sin(angle_abs)

            cx, cy = self._pos_a_cel(xp, yp)
            if not (0 <= cx < MIDA_MAPA and 0 <= cy < MIDA_MAPA):
                break

            if ha_detectat and i == num_passos:
                # Cel·la final → obstacle
                self.mapa_log_odds[cy, cx] = min(
                    self.mapa_log_odds[cy, cx] + LOG_ODDS_OCUPAT, LOG_ODDS_MAX)
            else:
                # Cel·les del raig → lliures
                self.mapa_log_odds[cy, cx] = max(
                    self.mapa_log_odds[cy, cx] + LOG_ODDS_BUIT, LOG_ODDS_MIN)

    def _actualitza_amb_camera(self, img_msg):
        """
        Analitza la franja inferior de la imatge per detectar obstacles.
        Píxels foscos = obstacle, píxels clars = terra lliure.
        Projecta els obstacles detectats al mapa segons la posició del robot.
        """
        try:
            # Convertim el missatge ROS a array numpy
            h = img_msg.height
            w = img_msg.width
            img = np.frombuffer(img_msg.data, dtype=np.uint8).reshape((h, w, 3))

            # Analitzem només la franja inferior (on es veuen obstacles propers)
            y_inici = int(h * FRANJA_INFERIOR)
            franja  = img[y_inici:, :]

            # Convertim a escala de grisos
            gris = np.mean(franja, axis=2).astype(np.uint8)

            # Dividim la imatge en 3 sectors: esquerre, centre, dret
            w_sector = w // 3
            sectors = [
                (gris[:, :w_sector],          ANGLE_ESQUERRE, 0.10),
                (gris[:, w_sector:2*w_sector], ANGLE_CENTRE,  0.0),
                (gris[:, 2*w_sector:],         ANGLE_DRET,   -0.10),
            ]

            for sector_img, angle_rel, offset_lat in sectors:
                valor_mitja = np.mean(sector_img)

                angle_abs = self.robot_yaw + angle_rel

                # Estimem distància visual: píxels foscos = obstacle proper
                # Escala simple: 0 (molt fosc) = 0.3m, 255 (molt clar) = 2.0m
                dist_visual = 0.3 + (valor_mitja / 255.0) * 1.7

                sx = self.robot_x - offset_lat * math.sin(self.robot_yaw)
                sy = self.robot_y + offset_lat * math.cos(self.robot_yaw)

                if valor_mitja < LLINDAR_OBSTACLE_CAMERA:
                    # Obstacle detectat per càmera → reforcem cel·la
                    xp = sx + dist_visual * math.cos(angle_abs)
                    yp = sy + dist_visual * math.sin(angle_abs)
                    cx, cy = self._pos_a_cel(xp, yp)
                    if 0 <= cx < MIDA_MAPA and 0 <= cy < MIDA_MAPA:
                        self.mapa_log_odds[cy, cx] = min(
                            self.mapa_log_odds[cy, cx] + LOG_ODDS_OCUPAT * 0.5,
                            LOG_ODDS_MAX)

                elif valor_mitja > LLINDAR_LLIURE_CAMERA:
                    # Terra clar → reforcem espai lliure
                    num_passos = int(dist_visual / (RESOLUCIO_M / 2))
                    for i in range(1, num_passos):
                        d  = i * (RESOLUCIO_M / 2)
                        xp = sx + d * math.cos(angle_abs)
                        yp = sy + d * math.sin(angle_abs)
                        cx, cy = self._pos_a_cel(xp, yp)
                        if 0 <= cx < MIDA_MAPA and 0 <= cy < MIDA_MAPA:
                            self.mapa_log_odds[cy, cx] = max(
                                self.mapa_log_odds[cy, cx] + LOG_ODDS_BUIT * 0.3,
                                LOG_ODDS_MIN)

        except Exception as e:
            self.get_logger().warn(f'Error processant càmera: {e}')

    # ─────────────────────────────────────────────────────────────
    # PUBLICACIÓ DEL MAPA (2 Hz)
    # ─────────────────────────────────────────────────────────────
    def publica_mapa(self):
        """
        Converteix el mapa log-odds al format OccupancyGrid de ROS i publica.
        OccupancyGrid: 0=lliure, 100=obstacle, -1=desconegut
        """
        msg = OccupancyGrid()
        msg.header.stamp    = self.get_clock().now().to_msg()
        msg.header.frame_id = 'map'

        msg.info.resolution = RESOLUCIO_M
        msg.info.width      = MIDA_MAPA
        msg.info.height     = MIDA_MAPA

        # Origen del mapa (cantonada inferior esquerre)
        msg.info.origin.position.x = self.origen_x - (CENTRE_MAPA * RESOLUCIO_M)
        msg.info.origin.position.y = self.origen_y - (CENTRE_MAPA * RESOLUCIO_M)

        # Convertim log-odds → probabilitat → format 0-100
        prob = 1.0 / (1.0 + np.exp(-self.mapa_log_odds))
        grid = np.full((MIDA_MAPA, MIDA_MAPA), -1, dtype=np.int8)
        grid[prob > 0.65] = 100   # obstacle
        grid[prob < 0.35] = 0     # lliure

        msg.data = grid.flatten().tolist()
        self.pub_mapa.publish(msg)

    # ─────────────────────────────────────────────────────────────
    # FUNCIONS AUXILIARS
    # ─────────────────────────────────────────────────────────────
    def _pos_a_cel(self, x, y):
        """Converteix coordenades del món (metres) a cel·les del mapa."""
        cx = int(CENTRE_MAPA + (x - self.origen_x) / RESOLUCIO_M)
        cy = int(CENTRE_MAPA + (y - self.origen_y) / RESOLUCIO_M)
        return cx, cy

    def destroy_node(self):
        """Guarda el mapa en aturar el node."""
        if GUARDAR_MAPA:
            np.save(FITXER_MAPA, self.mapa_log_odds)
            self.get_logger().info(f'Mapa guardat a {FITXER_MAPA}')
        super().destroy_node()


def main(args=None):
    rclpy.init(args=args)
    node = MapaNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
