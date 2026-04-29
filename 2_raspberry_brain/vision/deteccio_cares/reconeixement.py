#farem servir la llibreria face_recognition
from deepface import DeepFace
import cv2
import os

class ReconeixementCares:
    def __init__(self, usuaris_path, path_temporal = 'temporal'):
        self.usuaris_path = usuaris_path
        self.path_temporal = os.path.join(path_temporal, "frame.jpg")

        # Crear carpeta temp si no existeix
        os.makedirs(path_temporal, exist_ok=True)

        # Cargar paths dels nostres usuaris
        self.usuaris_noms = []
        for usuari in os.listdir(self.usuaris_path):
            path = os.path.join(self.usuaris_path, usuari)
            nom = os.path.splitext(usuari)[0]
            self.usuaris_noms.append((nom, path))

    def reconeixerCares(self, fotograma):
        # Guardar el fotograma temporalment
        cv2.imwrite(self.path_temporal, fotograma)

        for(nom, path) in self.usuaris_noms:
            try:
                # Comparar el fotograma amb la imatge de l'usuari
                resultat = DeepFace.verify(self.path_temporal, path,enforce_detection=False)
                if resultat['verified']:
                    return nom
            except Exception as e:
                print(f"Error al reconèixer {nom}: {e}")

        return "Desconegut"