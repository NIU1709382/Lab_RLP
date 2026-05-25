
#PER ARRENCAR NOMES LA SIMULACIO, SENSE ARRANCAR ELS NODES DE HARDWARE REAL (ARDUINO)


from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    """
    Arrenca només els nodes necessaris per la simulació:
    SLAM + Arduino (mode simulació, sense hardware real)
    Executa amb:
        ros2 launch robot_bringup simulacio.launch.py
    """
    return LaunchDescription([
        Node(
            package='robot_slam',
            executable='slam_node',
            name='slam_node',
            output='screen'
        ),
    ])