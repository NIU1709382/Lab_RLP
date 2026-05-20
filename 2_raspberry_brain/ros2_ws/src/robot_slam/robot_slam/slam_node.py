import rclpy
from rclpy.node import Node
from nav_msgs.msg import OccupancyGrid
from geometry_msgs.msg import PoseStamped
import numpy as np
import math

class SlamNode(Node):
    def __init__(self):
        super().__init__('slam_node')
        self.get_logger().info('SLAM Node iniciat!')
        
        # Publishers — publica el mapa i la posició
        self.map_pub = self.create_publisher(OccupancyGrid, '/map', 10)
        self.pose_pub = self.create_publisher(PoseStamped, '/robot_pose', 10)
        
        # Timer — actualitza cada 0.1 segons
        self.timer = self.create_timer(0.1, self.update)
        
        self.get_logger().info('Esperant connexió amb CoppeliaSim...')

    def update(self):
        self.get_logger().info('Update!')

def main(args=None):
    rclpy.init(args=args)
    node = SlamNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
