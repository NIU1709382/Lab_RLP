# s'encarrega de la detecció
import cv2

class DetectorCares:
    def __init__(self, model_path):
        self.model = cv2.CascadeClassifier(cv2.data.haarcascades + model_path)

    def detectar_cares(self, fotograma):
        gris = cv2.cvtColor(fotograma, cv2.COLOR_BGR2GRAY)
        cares = self.model.detectMultiScale(gris, scaleFactor=1.1, minNeighbors=5)
        return cares
    
    def dibuixarVoltant(self, fotograma, cares):
        for (x, y, w, h) in cares:
            cv2.rectangle(fotograma, (x, y), (x + w, y + h), (255, 0, 0), 2)
        return fotograma