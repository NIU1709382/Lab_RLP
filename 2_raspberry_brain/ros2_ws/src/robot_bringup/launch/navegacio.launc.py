from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    """
    Arrenca només SLAM + Arduino per provar la navegació.
    Executa amb:
        ros2 launch robot_bringup navegacio.launch.py
    """
    return LaunchDescription([
        Node(
            package='robot_slam',
            executable='slam_node',
            name='slam_node',
            output='screen'
        ),
        Node(
            package='robot_arduino',
            executable='arduino_node',
            name='arduino_node',
            output='screen'
        ),
    ])