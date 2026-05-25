import rclpy
from rclpy.node import Node
from tf2_ros import TransformBroadcaster
from geometry_msgs.msg import TransformStamped

# ── Tipus de missatges ROS estàndard ──────────────────────────────────────────
# OccupancyGrid → format estàndard ROS per publicar mapes 2D
# PoseStamped   → format estàndard ROS per publicar posicions (x, y, orientació)
# Twist         → format estàndard ROS per enviar velocitats als motors
from nav_msgs.msg import OccupancyGrid
from geometry_msgs.msg import PoseStamped, Twist

# Llibreries normals de Python (igual que abans)
from coppeliasim_zmqremoteapi_client import RemoteAPIClient
import numpy as np
import math
import cv2

# ─────────────────────────────────────────────────────────────────
# PARÀMETRES — AJUSTA AQUÍ SENSE TOCAR RES MÉS
# ─────────────────────────────────────────────────────────────────
ANGLE_SENSOR_CENTRE   =  0.0
ANGLE_SENSOR_ESQUERRE =  0.0
ANGLE_SENSOR_DRET     =  0.0

OFFSET_LATERAL_ESQUERRE =  0.10
OFFSET_LATERAL_DRET     = -0.10

DIST_MIN_HC    = 0.05
DIST_MAX_HC    = 4.0
DIST_PERILL    = 0.35
DIST_PRECAU    = 0.65

VEL_AVANT      = 2.5
VEL_LENTA      = 1.0
VEL_GIRA       = 2.2

RESOLUCIO_M    = 0.05
MIDA_MAPA      = 300
CENTRE_MAPA    = MIDA_MAPA // 2

LOG_ODDS_OCUPAT =  0.7
LOG_ODDS_BUIT   = -0.4
LOG_ODDS_MAX    =  3.0
LOG_ODDS_MIN    = -3.0

ESTAT_AVANT  = "AVANÇANT"
ESTAT_GIRA_E = "GIRANT_ESQ"
ESTAT_GIRA_D = "GIRANT_DRE"
ESTAT_RECULA = "RECULANT"

DURACIO_GIR_CURT  = 20
DURACIO_GIR_LLARG = 45
DURACIO_RECULA    = 20

# ─────────────────────────────────────────────────────────────────
# CLASSE PRINCIPAL — EL NODE ROS
# ─────────────────────────────────────────────────────────────────
# En ROS 2, tot el programa és una classe que hereta de Node.
# Això li dóna accés a totes les funcions de ROS (publishers, timers, logs...)
class SlamNode(Node):

    def __init__(self):
        # Registra el node a ROS amb el nom 'slam_node'
        # Altres nodes el podran veure amb aquest nom
        super().__init__('slam_node')
        self.get_logger().info('SLAM Node iniciat!')
        self.tf_broadcaster = TransformBroadcaster(self)

        # ── Connexió amb CoppeliaSim ───────────────────────────
        # NOTA: la IP 172.31.96.1 és la IP de Windows vista des de WSL
        # Quan el robot sigui real, aquesta part desapareix i
        # llegim directament els sensors físics per USB (Arduino)
        self.get_logger().info('Connectant amb CoppeliaSim...')
        self.client = RemoteAPIClient(host='172.31.96.1')
        self.sim    = self.client.getObject('sim')
        self.client.setStepping(True)

        # Obtenim els handles dels objectes de l'escena
        self.xassis_h    = self.sim.getObject('/Xassis_Fisic')
        self.motor_esq_h = self.sim.getObject('/Xassis_Fisic/Joint_Motor_Esquerre')
        self.motor_dre_h = self.sim.getObject('/Xassis_Fisic/Joint_Motor_Dret')
        self.sensor_c_h  = self.sim.getObject('/Xassis_Fisic/Proximity_Frontal')
        self.sensor_e_h  = self.sim.getObject('/Xassis_Fisic/Proximity_Esquerre')
        self.sensor_d_h  = self.sim.getObject('/Xassis_Fisic/Proximity_Dreta')
        self.cam_h       = self.sim.getObject('/Xassis_Fisic/Vision_sensor')

        pos_ini = self.sim.getObjectPosition(self.xassis_h, -1)
        self.robot_x0 = pos_ini[0]
        self.robot_y0 = pos_ini[1]

        # ── Publishers ROS ─────────────────────────────────────
        # Un publisher és com un "emissor de ràdio" — publica dades
        # a un tòpic perquè altres nodes les puguin llegir.
        #
        # create_publisher(tipus_missatge, nom_topic, cua)
        #   tipus_missatge → el format de les dades
        #   nom_topic      → el "canal" on es publiquen
        #   cua            → quants missatges es guarden si ningú llegeix

        # Publica el mapa d'ocupació → rviz2 o nav2 el llegiran
        self.map_pub = self.create_publisher(OccupancyGrid, '/map', 10)

        # Publica la posició del robot → nav2 o altres nodes la llegiran
        self.pose_pub = self.create_publisher(PoseStamped, '/robot_pose', 10)

        # ── Variables internes ─────────────────────────────────
        self.mapa_log_odds = np.zeros((MIDA_MAPA, MIDA_MAPA), dtype=np.float32)
        self.trajectoria   = []
        self.estat_nav     = ESTAT_AVANT
        self.comptador     = 0
        self.sentit_alt    = 1
        self.encallaments  = 0
        self.pas           = 0

        # Iniciem la simulació
        self.sim.startSimulation()
        self.get_logger().info('Simulació iniciada!')

        # ── Timer ROS ──────────────────────────────────────────
        # En ROS no fem servir while True — usem un timer.
        # create_timer(segons, funcio) crida la funció cada X segons.
        # Aquí cada 0.05s (20 vegades per segon) cridem self.update()
        self.timer = self.create_timer(0.05, self.update)

    # ─────────────────────────────────────────────────────────────
    # FUNCIÓ PRINCIPAL — S'EXECUTA CADA 0.05 SEGONS
    # ─────────────────────────────────────────────────────────────
    def update(self):
        self.client.step()
        self.pas += 1

        # ── Odometria ──────────────────────────────────────────
        pos    = self.sim.getObjectPosition(self.xassis_h, -1)
        orient = self.sim.getObjectOrientation(self.xassis_h, -1)
        rx, ry = pos[0], pos[1]
        yaw    = orient[2]

        # ── Lectura sensors HC-SR04 ────────────────────────────
        estat_c, raw_c, _, _, _ = self.sim.readProximitySensor(self.sensor_c_h)
        estat_e, raw_e, _, _, _ = self.sim.readProximitySensor(self.sensor_e_h)
        estat_d, raw_d, _, _, _ = self.sim.readProximitySensor(self.sensor_d_h)

        estat_c, dc = self._filtra(estat_c, raw_c)
        estat_e, de = self._filtra(estat_e, raw_e)
        estat_d, dd = self._filtra(estat_d, raw_d)

        # ── Actualitzar mapa ───────────────────────────────────
        lectures = [
            (dc, estat_c, ANGLE_SENSOR_CENTRE,   0.0),
            (de, estat_e, ANGLE_SENSOR_ESQUERRE,  OFFSET_LATERAL_ESQUERRE),
            (dd, estat_d, ANGLE_SENSOR_DRET,      OFFSET_LATERAL_DRET),
        ]
        self._actualitza_mapa(rx, ry, yaw, lectures)

        rcx, rcy = self._pos_a_cel(rx, ry)
        if not self.trajectoria or self.trajectoria[-1] != (rcx, rcy):
            self.trajectoria.append((rcx, rcy))

        # ── Navegació ──────────────────────────────────────────
        ve, vd, self.estat_nav, desc = self._decideix_moviment(
            dc, de, dd, estat_c, estat_e, estat_d)
        self.sim.setJointTargetVelocity(self.motor_esq_h, ve)
        self.sim.setJointTargetVelocity(self.motor_dre_h, vd)

        # ── Publicar a ROS cada 10 passos ──────────────────────
        # Aquí és on ROS entra en joc — publiquem el mapa i la posició
        # perquè altres nodes (nav2, rviz2...) els puguin usar
        if self.pas % 30 == 0:
            self._publica_mapa()       # envia el mapa al tòpic /map
            self._publica_posicio(rx, ry, yaw)  # envia posició al tòpic /robot_pose

        # ── Log consola cada 50 passos ─────────────────────────
        # get_logger().info() és el print() de ROS
        # Té avantatges: timestamp automàtic, nivells (info/warn/error)
        if self.pas % 50 == 0:
            self.get_logger().info(
                f'[{self.pas}] ({rx:.2f},{ry:.2f}) yaw={math.degrees(yaw):.0f}° '
                f'C:{dc:.2f} E:{de:.2f} D:{dd:.2f} → {self.estat_nav}')

    # ─────────────────────────────────────────────────────────────
    # PUBLICADORS ROS — converteixen les dades al format estàndard
    # ─────────────────────────────────────────────────────────────
    def _publica_mapa(self):
        """
        Converteix el mapa log-odds al format OccupancyGrid de ROS.
        OccupancyGrid és una graella de valors 0-100:
          0   → lliure
          100 → ocupat (obstacle)
          -1  → desconegut
        """
        msg = OccupancyGrid()

        # Header → informació de temps i sistema de referència
        # Necessari perquè ROS sàpiga quan s'ha generat el missatge
        msg.header.stamp    = self.get_clock().now().to_msg()
        msg.header.frame_id = 'map'  # sistema de referència del mapa

        # Metadades del mapa
        msg.info.resolution = RESOLUCIO_M      # metres per cel·la
        msg.info.width      = MIDA_MAPA
        msg.info.height     = MIDA_MAPA

        # Convertim log-odds → probabilitat → format 0-100 de ROS
        prob = 1.0 / (1.0 + np.exp(-self.mapa_log_odds))
        grid = np.full((MIDA_MAPA, MIDA_MAPA), -1, dtype=np.int8)
        grid[prob > 0.65] = 100   # obstacle
        grid[prob < 0.35] = 0     # lliure

        msg.data = grid.flatten().tolist()

        # Publiquem al tòpic /map — RViz2 i nav2 ho rebran automàticament
        self.map_pub.publish(msg)

    def _publica_posicio(self, rx, ry, yaw):
        """
        Publica la posició del robot al tòpic /robot_pose.
        PoseStamped inclou posició (x,y,z) i orientació (quaternió).
        """
        msg = PoseStamped()
        msg.header.stamp    = self.get_clock().now().to_msg()
        msg.header.frame_id = 'map'

        msg.pose.position.x = rx
        msg.pose.position.y = ry
        msg.pose.position.z = 0.0

        # Convertim yaw (angle simple) a quaternió (format estàndard 3D de ROS)
        msg.pose.orientation.z = math.sin(yaw / 2)
        msg.pose.orientation.w = math.cos(yaw / 2)

        self.pose_pub.publish(msg)

        # Publica la transformada TF
        t = TransformStamped()
        t.header.stamp = self.get_clock().now().to_msg()
        t.header.frame_id = 'map'
        t.child_frame_id = 'base_link'
        t.transform.translation.x = rx
        t.transform.translation.y = ry
        t.transform.translation.z = 0.0
        t.transform.rotation.z = math.sin(yaw / 2)
        t.transform.rotation.w = math.cos(yaw / 2)
        self.tf_broadcaster.sendTransform(t)

    # ─────────────────────────────────────────────────────────────
    # FUNCIONS INTERNES (igual que slam_2.0.py, sense canvis)
    # ─────────────────────────────────────────────────────────────
    def _filtra(self, estat, raw):
        if estat and DIST_MIN_HC <= raw <= DIST_MAX_HC:
            return True, raw
        return False, DIST_MAX_HC

    def _pos_a_cel(self, x_mon, y_mon):
        cx = int(CENTRE_MAPA + (x_mon - self.robot_x0) / RESOLUCIO_M)
        cy = int(CENTRE_MAPA + (y_mon - self.robot_y0) / RESOLUCIO_M)
        return cx, cy

    def _actualitza_mapa(self, robot_x, robot_y, robot_yaw, lectures):
        for dist, estat, angle_rel, offset_lat in lectures:
            sx = robot_x - offset_lat * math.sin(robot_yaw)
            sy = robot_y + offset_lat * math.cos(robot_yaw)
            angle_abs  = robot_yaw + angle_rel
            dist_raig  = dist if estat else DIST_MAX_HC
            hi_ha_obs  = estat
            num_mostres = int(dist_raig / (RESOLUCIO_M / 2))
            for pas in range(1, num_mostres + 1):
                d  = pas * (RESOLUCIO_M / 2)
                xp = sx + d * math.cos(angle_abs)
                yp = sy + d * math.sin(angle_abs)
                cx, cy = self._pos_a_cel(xp, yp)
                if not (0 <= cx < MIDA_MAPA and 0 <= cy < MIDA_MAPA):
                    break
                if hi_ha_obs and pas == num_mostres:
                    self.mapa_log_odds[cy, cx] = min(
                        self.mapa_log_odds[cy, cx] + LOG_ODDS_OCUPAT, LOG_ODDS_MAX)
                else:
                    self.mapa_log_odds[cy, cx] = max(
                        self.mapa_log_odds[cy, cx] + LOG_ODDS_BUIT, LOG_ODDS_MIN)

    def _decideix_moviment(self, dc, de, dd, estat_c, estat_e, estat_d):
        vc = dc if estat_c else DIST_MAX_HC
        ve = de if estat_e else DIST_MAX_HC
        vd = dd if estat_d else DIST_MAX_HC

        if self.estat_nav == ESTAT_RECULA:
            self.comptador -= 1
            if self.comptador <= 0:
                duracio = DURACIO_GIR_LLARG if self.encallaments > 1 else DURACIO_GIR_CURT
                self.estat_nav = ESTAT_GIRA_E if self.sentit_alt > 0 else ESTAT_GIRA_D
                self.comptador = duracio
            return -VEL_LENTA, -VEL_LENTA, self.estat_nav, "Reculant..."

        if self.estat_nav in (ESTAT_GIRA_E, ESTAT_GIRA_D):
            self.comptador -= 1
            if self.comptador <= 0:
                self.estat_nav = ESTAT_AVANT
                self.encallaments = 0
            if self.estat_nav == ESTAT_GIRA_E:
                return -VEL_GIRA, VEL_GIRA, self.estat_nav, "Girant esquerre"
            else:
                return  VEL_GIRA,-VEL_GIRA, self.estat_nav, "Girant dret"

        obs_front = vc < DIST_PERILL
        obs_esq   = ve < DIST_PERILL
        obs_dre   = vd < DIST_PERILL
        pre_front = vc < DIST_PRECAU
        pre_esq   = ve < DIST_PRECAU
        pre_dre   = vd < DIST_PRECAU

        if obs_front or (obs_esq and obs_dre):
            self.encallaments += 1
            self.sentit_alt   *= -1
            self.estat_nav     = ESTAT_RECULA
            self.comptador     = DURACIO_RECULA
            return -VEL_LENTA, -VEL_LENTA, self.estat_nav, "⚠ Obstacle! Reculant"
        if pre_front and pre_esq and not pre_dre:
            self.estat_nav = ESTAT_GIRA_D
            self.comptador = DURACIO_GIR_CURT
            return VEL_GIRA, -VEL_GIRA, self.estat_nav, "Obstacle esq → giro dret"
        if pre_front and pre_dre and not pre_esq:
            self.estat_nav = ESTAT_GIRA_E
            self.comptador = DURACIO_GIR_CURT
            return -VEL_GIRA, VEL_GIRA, self.estat_nav, "Obstacle dre → giro esq"
        if pre_front:
            self.encallaments += 1
            if ve >= vd:
                self.estat_nav = ESTAT_GIRA_E
                self.comptador = DURACIO_GIR_CURT
                return -VEL_GIRA, VEL_GIRA, self.estat_nav, "Precaució → giro esq"
            else:
                self.estat_nav = ESTAT_GIRA_D
                self.comptador = DURACIO_GIR_CURT
                return  VEL_GIRA,-VEL_GIRA, self.estat_nav, "Precaució → giro dre"
        if pre_esq:
            return VEL_AVANT, VEL_LENTA, ESTAT_AVANT, "Correc. dreta"
        if pre_dre:
            return VEL_LENTA, VEL_AVANT, ESTAT_AVANT, "Correc. esquerra"

        self.encallaments = max(0, self.encallaments - 1)
        return VEL_AVANT, VEL_AVANT, ESTAT_AVANT, "Camí lliure"

    def destroy_node(self):
        """S'executa quan fas Ctrl+C — atura la simulació netament"""
        self.get_logger().info('Aturant simulació...')
        self.sim.setJointTargetVelocity(self.motor_esq_h, 0)
        self.sim.setJointTargetVelocity(self.motor_dre_h, 0)
        self.sim.stopSimulation()
        super().destroy_node()


# ─────────────────────────────────────────────────────────────────
# PUNT D'ENTRADA
# ─────────────────────────────────────────────────────────────────
def main(args=None):
    rclpy.init(args=args)      # arrenca ROS 2
    node = SlamNode()          # crea el node (crida __init__)
    rclpy.spin(node)           # manté el node viu (substitueix el while True)
    node.destroy_node()        # neteja quan s'atura
    rclpy.shutdown()           # apaga ROS 2

if __name__ == '__main__':
    main()