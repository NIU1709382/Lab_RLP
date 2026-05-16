import os
import sys
import dlib

from deteccio_cares.camera import Camera
from deteccio_cares.detector import DetectorCares
from deteccio_cares.reconeixement import ReconeixementCares
from deteccio_cares.kalman import FiltreKalmanCara
from deteccio_cares.visio import Visio

camera = Camera()
detector_cares = DetectorCares()
reconeixement = ReconeixementCares('deteccio_cares/dades/usuaris')
filtre_kalman = FiltreKalmanCara()

pipeline = Visio(camera, detector_cares, reconeixement, filtre_kalman)
pipeline.run()