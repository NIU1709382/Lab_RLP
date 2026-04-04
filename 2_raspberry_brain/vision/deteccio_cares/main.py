import cv2
from camera import Camera
from detector import DetectorCares
from reconeixement import ReconeixementCares

def main():

    camara = Camera()
    detector = DetectorCares('haarcascade_frontalface_default.xml')
    reconeixement = ReconeixementCares('dades/usuaris')
    while True:
        fotograma = camara.get_fotograma()
        if fotograma is None:
            break

        # Detectar cares
        cares = detector.detectar_cares(fotograma)

        # Dibuixar rectangles al voltant de les cares detectades
        fotograma = detector.dibuixarVoltant(fotograma, cares)

        # Reconèixer les cares detectades
        for (x, y, w, h) in cares:
            imatge_cara = fotograma[y:y+h, x:x+w]

            nom = reconeixement.reconeixerCares(imatge_cara)
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
    camara.alliberarCamera()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()