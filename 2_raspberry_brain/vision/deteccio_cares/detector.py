import cv2
import dlib

class DetectorCares:
    def __init__(self):
        # Inicialitzem el detector HOG de dlib
        self.detector = dlib.get_frontal_face_detector()

    def detectar_cares(self, fotograma):
        # Convertir a escala de grisos per accelerar la detecció
        gris = cv2.cvtColor(fotograma, cv2.COLOR_BGR2GRAY)
        
        # Executar la detecció
        cares_dlib = self.detector(gris, 0)
        
        cares_valides = []
        for cara in cares_dlib:
            # dlib retorna un objecte propi, l'adaptem a la nostra tupla (x, y, w, h)

            x = cara.left()
            y = cara.top()
            w = cara.width()
            h = cara.height()
            
            # Evitem coordenades negatives si la cara surt de la pantalla
            x = max(0, x)
            y = max(0, y)
            
            cares_valides.append((x, y, w, h))
            
        return cares_valides

    def dibuixarVoltant(self, fotograma, cares):
        for (x, y, w, h) in cares:
            cv2.rectangle(fotograma, (x, y), (x + w, y + h), (0, 255, 0), 2)
        return fotograma