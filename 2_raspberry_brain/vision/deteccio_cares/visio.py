import cv2
import threading

class Visio:

    def __init__(self, camera, detector_cares, reconeixement, seguiment):
        self.camera = camera
        self.detector_cares = detector_cares
        self.reconeixement = reconeixement 
        self.seguiment = seguiment
        
        #Variables per al Multithreading
        self.reconeixent_ara_mateix = False
        self.nom_reconegut_thread = "Analitzant" # Guardarà l'últim nom reconegut
    
    def _tasca_reconeixement(self, imatge_cara):
        "Quan acaba, allibera el sistema per analitzar la següent foto. "
        try:
            nom = self.reconeixement.reconeixerCares(imatge_cara)
            self.nom_reconegut_thread = nom
            print(f"Persona analitzada: {nom}")
        except Exception as e:
            print(f"Error en el fil: {e}")
        finally:
            self.reconeixent_ara_mateix = False

    def run(self):
        while True:
            fotograma = self.camera.get_fotograma()
            if fotograma is None:
                break

            #detecció
            cares = self.detector_cares.detectar_cares(fotograma)
            fotograma = self.detector_cares.dibuixarVoltant(fotograma, cares)

            centre_x, centre_y = None, None

            for cara in cares:
                x, y, w, h = cara
                centre_x = x + w // 2
                centre_y = y + h // 2
                
                #reconeixement
                if self.reconeixement is not None:
                    if not self.reconeixent_ara_mateix:
                        self.reconeixent_ara_mateix = True

                        
                        # Retallem la cara i fem una còpia per evitar errors de memòria
                        imatge_cara = fotograma[y:y+h, x:x+w].copy()
                    
                        fil = threading.Thread(target=self._tasca_reconeixement, args=(imatge_cara,), daemon=True)
                        fil.start()
                
                # Dibuixem l'últim nom 
                cv2.putText(fotograma, self.nom_reconegut_thread, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)

            #seguiment
            kalman_x, kalman_y = self.seguiment.predir_i_actualitzar(centre_x, centre_y)
            
            if kalman_x is not None and kalman_y is not None:
                cv2.circle(fotograma, (kalman_x, kalman_y), 5, (0, 0, 255), -1)
                

            cv2.imshow('Detecció i Seguiment', fotograma)

            if cv2.waitKey(1) == ord('q'):
                break
                
        self.camera.alliberarCamera()
        cv2.destroyAllWindows()