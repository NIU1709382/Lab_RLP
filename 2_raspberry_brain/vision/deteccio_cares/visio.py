import cv2

class visio:

    def __init__(self, camera, detector_cares, reconeixement):
        self.camera = camera
        self.detector_cares = detector_cares
        self.reconeixement = reconeixement

    def run(self):
        while True:
            fotograma = self.camera.get_fotograma()
            if fotograma is None:
                break

            # Detectar cares
            cares = self.detector_cares.detectar_cares(fotograma)

            # Dibuixar rectangles al voltant de les cares detectades
            fotograma = self.detector_cares.dibuixarVoltant(fotograma, cares)

            # Reconèixer les cares detectades
            for (x, y, w, h) in cares:
                imatge_cara = fotograma[y:y+h, x:x+w]

                nom = self.reconeixement.reconeixerCares(imatge_cara)
                # Mostrar si es reconeix alguna cara

                if nom == "Desconegut":
                    print("Desconegut")
                else:
                    print("Cara reconeguda: ", nom)

            # Mostrar el fotograma
            cv2.imshow('Detecció cares', fotograma)

            # Sortir si es prem la tecla 'q'
            if cv2.waitKey(1) == ord('q'):
                break
        self.camera.alliberarCamera()
        cv2.destroyAllWindows()
