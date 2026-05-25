


#EXEMPLE DE CÒDIG PER CONTROLAR LA CÀMERA I OBTENIR LES IMATGES
#NOMES ES UN ESQUELET DE REFERÈNCIA, CAL ADAPTAR-LO I ACABAR-LO

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image      # per publicar imatges
from std_msgs.msg import String        # per publicar qui s'ha detectat

# TODO: importar el codi de detecció de cares que ha d estar dins de la carpeta de visó              AQUI S HA DE POSAR EL CODI DE DETECCIÓ DE CARES FET PER L AINA
# from .deteccio_cares import ...

class CameraNode(Node):

    def __init__(self):
        super().__init__('camera_node')
        self.get_logger().info('Camera Node iniciat!')

        # Publisher — publica la imatge de la càmera
        self.pub_imatge = self.create_publisher(Image, '/camera/image', 10)

        # Publisher — publica el nom de la persona detectada
        # Exemple: publica "Joan" quan reconeix en Joan
        self.pub_persona = self.create_publisher(String, '/persona_detectada', 10)

        # TODO: inicialitzar la càmera real (OV5647 a la Raspberry)
        # TODO: inicialitzar el detector de cares

        self.timer = self.create_timer(0.1, self.update)
        self.get_logger().info('Camera Node llest!')

    def update(self):
        # TODO: capturar imatge de la càmera
        # TODO: passar-la pel detector de cares
        # TODO: publicar imatge i persona detectada
        pass

def main(args=None):
    rclpy.init(args=args)
    node = CameraNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()