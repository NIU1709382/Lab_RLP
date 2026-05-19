import cv2
import numpy as np
import matplotlib.pyplot as plt
from coppeliasim_zmqremoteapi_client import RemoteAPIClient

print("Carregant l'algorisme de Fusió 3D Robust (OV5647 + Tri-Ultrasons HC-SR04)...")
client = RemoteAPIClient()
sim = client.getObject('sim')
client.setStepping(True)

# 1. Handles del Xassís i Motors
xassis_handle = sim.getObject('/Xassis_Fisic') 
cam_handle = sim.getObject('/Xassis_Fisic/Vision_sensor')
motor_esq = sim.getObject('/Xassis_Fisic/Joint_Motor_Esquerre')
motor_dre = sim.getObject('/Xassis_Fisic/Joint_Motor_Dret')

# 2. Handles dels 3 Sensors d'Ultrasons
sensor_centre = sim.getObject('/Xassis_Fisic/Proximity_Frontal')
sensor_esq = sim.getObject('/Xassis_Fisic/Proximity_Esquerre')
sensor_dre = sim.getObject('/Xassis_Fisic/Proximity_Dreta')

# Configuració de la lent de la càmera (OV5647 Fisheye configurada a 120 graus)
focal_lineal = 180.0
center = (320, 240)

# Configuració d'OpenCV (ORB de qualitat)
orb = cv2.ORB_create(nfeatures=600)
núvol_punts_3d = []

# Finestra del Mapa 3D
plt.ion()
fig = plt.figure(figsize=(8, 6))
ax = fig.add_subplot(111, projection='3d')

print("Sincronitzant telemetria del maquinari en 3D...")
sim.startSimulation()

try:
    # El tanc avança lentament per poder escanejar de forma precisa
    sim.setJointTargetVelocity(motor_esq, 2)
    sim.setJointTargetVelocity(motor_dre, 2)
    
    while True:
        client.step()
        
        # Obtenir posició absoluta real del robot (Odomètria del simulador)
        pos_real = sim.getObjectPosition(xassis_handle, -1) 
        robot_x_real = pos_real[0]
        robot_y_real = pos_real[1] 
        robot_z_real = pos_real[2] # Alçada real del tanc respecte al terra
        
        # Llegim els 5 valors que retorna la nova API de CoppeliaSim
        estat_c, dist_c, _, _, _ = sim.readProximitySensor(sensor_centre)
        estat_e, dist_e, _, _, _ = sim.readProximitySensor(sensor_esq)
        estat_d, dist_d, _, _, _ = sim.readProximitySensor(sensor_dre)
        
        # Filtre de distància màxima realista (4.0 metres de rang útil pel HC-SR04)
        dist_c = dist_c if (estat_c and 0.02 <= dist_c <= 4.0) else 4.0
        dist_e = dist_e if (estat_e and 0.02 <= dist_e <= 4.0) else 4.0
        dist_d = dist_d if (estat_d and 0.02 <= dist_d <= 4.0) else 4.0
        
        # Captura de la imatge de la càmera OV5647
        imatge_pura, resolucio = sim.getVisionSensorImg(cam_handle, 0)
        if not imatge_pura: continue
            
        amplada, alcada = resolucio[0], resolucio[1]
        img_np = np.frombuffer(imatge_pura, dtype=np.uint8).reshape((alcada, amplada, 3))
        img_np = cv2.flip(img_np, 0)
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        img_actual_gris = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        punts_clau, _ = orb.detectAndCompute(img_actual_gris, None)
        img_visual = img_bgr.copy()
        
        if punts_clau:
            for pt in punts_clau:
                x_pixel, y_pixel = pt.pt
                
                # Pintem el punt a la pantalla d'OpenCV
                cv2.circle(img_visual, (int(x_pixel), int(y_pixel)), 2, (0, 255, 0), -1)
                
                # Projecció d'angles respecte al centre de la lent
                angle_horitzontal = (x_pixel - center[0]) / focal_lineal
                angle_vertical = -(y_pixel - center[1]) / focal_lineal # Angle d'alçada vertical
                
                # FUSIÓ LÒGICA: Triem la distància d'ultrasons segons el sector horitzontal
                if x_pixel < 213:    # Sector Esquerre
                    distancia_real_sensor = dist_e
                elif x_pixel > 426:  # Sector Dret
                    distancia_real_sensor = dist_d
                else:                # Sector Central
                    distancia_real_sensor = dist_c
                
                # Mapegem en 3D fusionant la distància real amb la inclinació de la imatge
                if distancia_real_sensor < 4.0 and y_pixel < 440:
                    x_punt_global = robot_x_real + (angle_horitzontal * distancia_real_sensor)
                    y_punt_global = robot_y_real + distancia_real_sensor
                    
                    # L'ALÇADA REAL ACTUALITZADA: Alçada del robot + correcció vertical de la imatge
                    z_punt_global = robot_z_real + (angle_vertical * distancia_real_sensor) + 0.15
                    
                    núvol_punts_3d.append([x_punt_global, y_punt_global, z_punt_global])
            
            # REFRESCAR EL GRÀFIC 3D
            ax.clear()
            if len(núvol_punts_3d) > 0:
                mapa_np = np.array(núvol_punts_3d)
                # Mantenim els darrers 2500 punts per a un rendiment fluid en 3D
                if len(mapa_np) > 2500: mapa_np = mapa_np[-2500:]
                
                # A CoppeliaSim l'alçada és l'eix Z, ho passem correctament al scatter de Matplotlib
                ax.scatter(mapa_np[:, 0], mapa_np[:, 1], mapa_np[:, 2], c='green', s=2, alpha=0.5)
            
            # Dibuixem el robot com una bola vermella tridimensional
            ax.scatter(robot_x_real, robot_y_real, robot_z_real, c='red', s=100, marker='o', label='Robot')
            
            # Ajust dels marges del visor en 3D
            ax.set_xlim(robot_x_real - 5, robot_x_real + 5)
            ax.set_ylim(robot_y_real - 2, robot_y_real + 10) 
            ax.set_zlim(robot_z_real - 1, robot_z_real + 4) # Rang d'alçada de l'habitació
            
            ax.set_title("Mapeig SLAM 3D - Fusió Multi-Sensor")
            ax.set_xlabel("Esquerra / Dreta (X)")
            ax.set_ylabel("Avanç Real Tanc (Y)")
            ax.set_zlabel("Alçada de l'Entorn (Z)")
            
            plt.draw()
            plt.pause(0.001)

        cv2.imshow("Stream de Video Real - Camara Raspberry Pi", img_visual)
        if cv2.waitKey(1) & 0xFF == ord('q'): break

finally:
    print("\n[SLAM] Aturant simulació i exportant mapa 3D...")
    if len(núvol_punts_3d) > 0:
        mapa_final_np = np.array(núvol_punts_3d)
        np.savetxt("mapa_3d_fusionat.txt", mapa_final_np, fmt='%.4f', header='X Y Z (Coordenades globals 3D reals)')
        print(f"¡Èxit! S'ha guardat el fitxer 'mapa_3d_fusionat.txt' amb {len(mapa_final_np)} punts.")
    
    plt.ioff()
    plt.show()
    cv2.destroyAllWindows()
    sim.stopSimulation()