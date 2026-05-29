import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Range
from geometry_msgs.msg import Twist

# ─────────────────────────────────────────────────────────────────
# CONFIGURACIÓ
# ─────────────────────────────────────────────────────────────────

DIST_PERILL = 0.35
DIST_PRECAU = 0.65

VEL_AVANT = 2.0
VEL_LENTA = 1.0
VEL_GIRA  = 2.0

DUR_RECULA    = 20
DUR_GIR_CURT  = 25
DUR_GIR_LLARG = 50

AVANT    = "AVANÇANT"
RECULA   = "RECULANT"
GIRA_ESQ = "GIRANT_ESQ"
GIRA_DRE = "GIRANT_DRE"


class NavegacioNode(Node):

    def __init__(self):
        super().__init__('navegacio_node')
        self.get_logger().info('Navegació Node iniciant...')

        # ── Subscribers — escolta els sensors ──────────────────
        # Rep lectures del sensors_node via tòpics ROS
        self.sub_centre = self.create_subscription(
            Range, '/sensors/ultrasonic/centre',
            self.callback_centre, 10)
        self.sub_esquerre = self.create_subscription(
            Range, '/sensors/ultrasonic/esquerre',
            self.callback_esquerre, 10)
        self.sub_dret = self.create_subscription(
            Range, '/sensors/ultrasonic/dret',
            self.callback_dret, 10)

        # ── Publisher — envia ordres de moviment ───────────────
        # sensors_node llegeix aquest tòpic i aplica als motors
        self.pub_cmd_vel = self.create_publisher(Twist, '/cmd_vel', 10)

        # ── Variables d'estat ──────────────────────────────────
        self.dc = 4.0
        self.de = 4.0
        self.dd = 4.0

        self.estat        = AVANT
        self.comptador    = 0
        self.encallaments = 0
        self.sentit_alt   = 1

        # ── Timer — decideix moviment a 20Hz ───────────────────
        self.timer = self.create_timer(0.05, self.update)

        self.get_logger().info('Navegació Node llest!')

    # ─────────────────────────────────────────────────────────────
    # CALLBACKS
    # ─────────────────────────────────────────────────────────────
    def callback_centre(self, msg):
        self.dc = msg.range

    def callback_esquerre(self, msg):
        self.de = msg.range

    def callback_dret(self, msg):
        self.dd = msg.range

    # ─────────────────────────────────────────────────────────────
    # LÒGICA DE NAVEGACIÓ (20 Hz)
    # ─────────────────────────────────────────────────────────────
    def update(self):
        ve, vd = self._decideix(self.dc, self.de, self.dd)
        self._publica_twist(ve, vd)

        if self.comptador % 20 == 0:
            self.get_logger().info(
                f'Estat: {self.estat} | C:{self.dc:.2f} E:{self.de:.2f} D:{self.dd:.2f}')

    def _decideix(self, dc, de, dd):
        # ── Reculant ───────────────────────────────────────────
        if self.estat == RECULA:
            self.comptador -= 1
            if self.comptador <= 0:
                dur = DUR_GIR_LLARG if self.encallaments > 2 else DUR_GIR_CURT
                self.estat      = GIRA_ESQ if self.sentit_alt > 0 else GIRA_DRE
                self.comptador  = dur
                self.sentit_alt *= -1
            return -VEL_LENTA, -VEL_LENTA

        # ── Girant ─────────────────────────────────────────────
        if self.estat in (GIRA_ESQ, GIRA_DRE):
            self.comptador -= 1
            if self.comptador <= 0:
                self.estat        = AVANT
                self.encallaments = max(0, self.encallaments - 1)
            if self.estat == GIRA_ESQ:
                return -VEL_GIRA, VEL_GIRA
            else:
                return VEL_GIRA, -VEL_GIRA

        # ── Avançant ───────────────────────────────────────────
        obs_front = dc < DIST_PERILL
        obs_esq   = de < DIST_PERILL
        obs_dre   = dd < DIST_PERILL
        pre_front = dc < DIST_PRECAU
        pre_esq   = de < DIST_PRECAU
        pre_dre   = dd < DIST_PRECAU

        if obs_front or (obs_esq and obs_dre):
            self.encallaments += 1
            self.estat         = RECULA
            self.comptador     = DUR_RECULA
            return -VEL_LENTA, -VEL_LENTA

        if pre_front and pre_esq and not pre_dre:
            self.estat     = GIRA_DRE
            self.comptador = DUR_GIR_CURT
            return VEL_GIRA, -VEL_GIRA

        if pre_front and pre_dre and not pre_esq:
            self.estat     = GIRA_ESQ
            self.comptador = DUR_GIR_CURT
            return -VEL_GIRA, VEL_GIRA

        if pre_front:
            self.encallaments += 1
            if de >= dd:
                self.estat     = GIRA_ESQ
                self.comptador = DUR_GIR_CURT
                return -VEL_GIRA, VEL_GIRA
            else:
                self.estat     = GIRA_DRE
                self.comptador = DUR_GIR_CURT
                return VEL_GIRA, -VEL_GIRA

        if pre_esq:
            return VEL_AVANT, VEL_LENTA

        if pre_dre:
            return VEL_LENTA, VEL_AVANT

        self.encallaments = max(0, self.encallaments - 1)
        return VEL_AVANT, VEL_AVANT

    # ─────────────────────────────────────────────────────────────
    # FUNCIONS AUXILIARS
    # ─────────────────────────────────────────────────────────────
    def _publica_twist(self, vel_esq, vel_dre):
        msg = Twist()
        msg.linear.x  = (vel_esq + vel_dre) / 2.0
        msg.angular.z = (vel_dre - vel_esq) / 2.0
        self.pub_cmd_vel.publish(msg)

    def destroy_node(self):
        self.get_logger().info('Navegació Node aturat.')
        super().destroy_node()


def main(args=None):
    rclpy.init(args=args)
    node = NavegacioNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()