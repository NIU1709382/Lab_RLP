#farem servir la llibreria face_recognition
from deepface import DeepFace
import cv2
import os

#converteix a embbedings
class ReconeixementCares:
    def __init__(self, usuaris_path, path_temporal = 'temporal', umbral = 0.5, model = 'VGG-Face'):
        self.usuaris_path = usuaris_path
        self.path_temporal = os.path.join(path_temporal, "frame.jpg")
        self.umbral = umbral
        self.model = model

        # Crear carpeta temp si no existeix
        os.makedirs(path_temporal, exist_ok=True)

        #una carpeta per usuari
        self.usuaris = self.carregar_usuaris()
    
    def carregar_usuaris(self):

        usuaris = {}
        for entrada in os.listdir(self.usuaris_path):
            path_entrada = os.path.join(self.usuaris_path, entrada)

            #subcarpeta per persona
            if os.path.isdir(path_entrada):
                nom = entrada
                fotos = [
                    os.path.join(path_entrada, f)
                    for f in os.listdir(path_entrada)
                    if f.lower().endswith(('.png', '.jpg', '.jpeg'))
                ]
                if fotos:
                    usuaris[nom] = fotos
        return usuaris
    
    def verificar_fotos(self, fotos):
        vots = 0
        distancies = []

        for path_foto in fotos:
            resultat = DeepFace.verify(
                self.path_temporal,
                path_foto,
                model_name=self.model,
                enforce_detection=False
            )
            #distàncies entre embbedings
            distancies.append(resultat['distance'])
            if resultat['verified']:
                vots += 1
        if distancies:
            dist_mitja = sum(distancies) / len(distancies)
        else: 
            dist_mitja = 1.0
        return vots, len(fotos), dist_mitja


    def reconeixerCares(self, fotograma):
        # Guardar el fotograma temporalment
        cv2.imwrite(self.path_temporal, fotograma)

        millor_nom = "Desconegut"
        millor_puntuacio = -1

        for nom, fotos in self.usuaris.items():
            vots, total, dist_mitja = self.verificar_fotos(fotos)
            ratio = vots / total

            #ha de superar el umbral i ser la millor puntuacio
            if ratio >= self.umbral and ratio > millor_puntuacio:
                millor_puntuacio = ratio
                millor_nom = nom

        return millor_nom