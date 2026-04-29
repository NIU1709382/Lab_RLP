# s'encarrega de la detecció
import cv2

class DetectorCares:
    def __init__(self, model_path):
        self.modelCara = cv2.CascadeClassifier(cv2.data.haarcascades + model_path)
        self.modelUlls = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

    def detectar_cares(self, fotograma):
        gris = cv2.cvtColor(fotograma, cv2.COLOR_BGR2GRAY)
        cares = self.modelCara.detectMultiScale(gris, scaleFactor=1.1, minNeighbors=7, minSize=(50, 50))

        cares_valides = []
        for (x, y, w, h) in cares:
            regio_cara = gris[y:y+h, x:x+w]
            ulls = self.modelUlls.detectMultiScale(regio_cara, scaleFactor=1.1, minNeighbors=5)
            if len(ulls) >= 2:  # Si es detecten almenys dos ulls, considerem que és una cara vàlida
                cares_valides.append((x, y, w, h))

        return cares_valides

    def dibuixarVoltant(self, fotograma, cares):
        for (x, y, w, h) in cares:
            cv2.rectangle(fotograma, (x, y), (x + w, y + h), (0, 0, 255), 2)
        return fotograma