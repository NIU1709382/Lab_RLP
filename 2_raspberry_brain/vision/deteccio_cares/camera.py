#controlar la camera i obtenir les imatges
import cv2

class Camera:
    def __init__(self, id_camera=0): #agafa la USB per defecte
        self.cap = cv2.VideoCapture(id_camera)

    def get_fotograma(self):
        ret, fotograma = self.cap.read()
        if not ret:
            print("No s'ha pogut obtenir el fotograma de la càmera")
        return fotograma

    def alliberarCamera(self):
        self.cap.release()