import cv2
from camera import Camera
from detector import DetectorCares

def main():

    camara = Camera()
    detector = DetectorCares('haarcascade_frontalface_default.xml')
    while True:
        fotograma = camara.get_fotograma()
        if fotograma is None:
            break

        # Detectar cares
        cares = detector.detectar_cares(fotograma)

        # Dibuixar rectangles al voltant de les cares detectades
        fotograma = detector.dibuixarVoltant(fotograma, cares)

        # Mostrar el fotograma
        cv2.imshow('Detecció cares', fotograma)

        # Sortir si es prem la tecla 'q'
        if cv2.waitKey(1) == ord('q'):
            break
    camara.alliberarCamera()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()