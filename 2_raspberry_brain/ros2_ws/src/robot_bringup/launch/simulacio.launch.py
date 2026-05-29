
#PER ARRENCAR NOMES LA SIMULACIO, SENSE ARRANCAR ELS NODES DE HARDWARE REAL (ARDUINO)


from sympy import python

from launch import LaunchDescription
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():

    return LaunchDescription([

        # ─────────────────────────────────────────────
        # SENSORS + Coppelia
        # ─────────────────────────────────────────────
        Node(
            package='robot_slam',
            executable='sensors_node',
            name='sensors_node',
            output='screen'
        ),

        # ─────────────────────────────────────────────
        # NAVEGACIÓ
        # ─────────────────────────────────────────────
        Node(
            package='robot_slam',
            executable='navegacio_node',
            name='navegacio_node',
            output='screen'
        ),

        # ─────────────────────────────────────────────
        # SLAM / MAPA
        # ─────────────────────────────────────────────
        Node(
            package='robot_slam',
            executable='slam_node',
            name='slam_node',
            output='screen'
        ),
    ])

