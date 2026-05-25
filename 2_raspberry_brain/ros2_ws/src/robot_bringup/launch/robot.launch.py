
#ESQUELET DE LANCEMENT PRINCIPAL
#Es el punt d'entrada per arrencar TOTS els nodes del robot. En aquest arxiu, definim quins nodes s'han d'executar i com s'han de configurar. (EL MAIN ENTRE COMETES)
#ELS TRES ARCHIUS A DINS D AQUESTA CARPETA NOMES SON ORIENTATIUS I DE ESQUELET

from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    """
    Arxiu de llançament principal — arrenca TOTS els nodes del robot.
    Executa amb:
        ros2 launch robot_bringup robot.launch.py
    """
    return LaunchDescription([

        # ── Node SLAM ─────────────────────────────────────────
        # Mapa + navegació autònoma
        Node(
            package='robot_slam',
            executable='slam_node',
            name='slam_node',
            output='screen'
        ),

        # ── Node Arduino ──────────────────────────────────────
        # Sensors + motors + servos
        Node(
            package='robot_arduino',
            executable='arduino_node',
            name='arduino_node',
            output='screen'
        ),

        # ── Node Càmera ───────────────────────────────────────
        # Reconeixement de cares
        Node(
            package='robot_camera',
            executable='camera_node',
            name='camera_node',
            output='screen'
        ),

        # ── Node Veu ──────────────────────────────────────────
        # Parla + escolta + Gemini
        Node(
            package='robot_veu',
            executable='veu_node',
            name='veu_node',
            output='screen'
        ),
    ])