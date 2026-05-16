import cv2
import numpy as np

class FiltreKalmanCara:
    def __init__(self):
        self.kalman = cv2.KalmanFilter(4, 2)
        
        self.kalman.measurementMatrix = np.array([[1, 0, 0, 0],
                                                  [0, 1, 0, 0]], np.float32)

        self.kalman.transitionMatrix = np.array([[1, 0, 1, 0],
                                                 [0, 1, 0, 1],
                                                 [0, 0, 1, 0],
                                                 [0, 0, 0, 1]], np.float32)

        self.kalman.processNoiseCov = np.eye(4, dtype=np.float32) * 0.03
        self.kalman.measurementNoiseCov = np.eye(2, dtype=np.float32) * 0.5
        
        self.inicialitzat = False

    def predir_i_actualitzar(self, centre_x, centre_y):
        """
        Fa la predicció i l'actualitza amb la nova detecció.
        Retorna la posició (X, Y) predita.
        """
        if not self.inicialitzat:
            if centre_x is None or centre_y is None:
                return None, None
            self.kalman.statePre = np.array([[centre_x], [centre_y], [0], [0]], dtype=np.float32)
            self.kalman.statePost = np.array([[centre_x], [centre_y], [0], [0]], dtype=np.float32)
            self.inicialitzat = True
            return int(centre_x), int(centre_y)

        prediccio = self.kalman.predict()

        if centre_x is not None and centre_y is not None:
            mesura = np.array([[np.float32(centre_x)], [np.float32(centre_y)]])
            estimacio = self.kalman.correct(mesura)
            return int(estimacio[0, 0]), int(estimacio[1, 0])
        
        return int(prediccio[0, 0]), int(prediccio[1, 0])
    