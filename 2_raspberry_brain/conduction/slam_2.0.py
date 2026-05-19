"""
SLAM v2 — Correccions aplicades:
  1. Angles dels sensors: tots tres apunten frontalment (0°) però desplaçats lateralment
  2. Filtre del terra: ignorem lectures < DIST_MIN_TERRA per evitar falses deteccions a l'arrencada
  3. Lògica antiencallament a les cantonades: gir llarg + recula suficient
"""

import cv2
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from coppeliasim_zmqremoteapi_client import RemoteAPIClient
import math

# ─────────────────────────────────────────────────────────────────
# PARÀMETRES — AJUSTA AQUÍ SENSE TOCAR RES MÉS
# ─────────────────────────────────────────────────────────────────

# ▶ Angles dels sensors respecte al robot (radians).
#   Si TOTS TRES apunten endavant (Cas A de la imatge), posa 0.0 a tots.
#   Si estan en ventall (±30°, ±45°...) ajusta els laterals.
ANGLE_SENSOR_CENTRE   =  0.0            # frontal pur
ANGLE_SENSOR_ESQUERRE =  0.0            # endavant però offset físic a l'esquerra
ANGLE_SENSOR_DRET     =  0.0            # endavant però offset físic a la dreta

# ▶ Offset lateral dels sensors respecte al centre del robot (metres).
#   Mira a CoppeliaSim quant separats estan físicament en l'eix Y local.
OFFSET_LATERAL_ESQUERRE =  0.10         # metres cap a l'esquerra
OFFSET_LATERAL_DRET     = -0.10         # metres cap a la dreta

# ▶ Rang vàlid del HC-SR04
DIST_MIN_HC    = 0.05   # mínim real del sensor (evita lectures del terra i el propi xassís)
DIST_MAX_HC    = 4.0    # màxim útil

# ▶ Llindars de navegació
DIST_PERILL    = 0.35   # obstacle imminent → recular
DIST_PRECAU    = 0.65   # obstacle proper → girar

# ▶ Velocitats
VEL_AVANT      = 2.5
VEL_LENTA      = 1.0
VEL_GIRA       = 2.2

# ▶ Mapa
RESOLUCIO_M    = 0.05
MIDA_MAPA      = 300
CENTRE_MAPA    = MIDA_MAPA // 2

# ─────────────────────────────────────────────────────────────────
# MAPA D'OCUPACIÓ (Occupancy Grid amb Log-Odds)
# ─────────────────────────────────────────────────────────────────
mapa_log_odds = np.zeros((MIDA_MAPA, MIDA_MAPA), dtype=np.float32)
trajectoria   = []

LOG_ODDS_OCUPAT =  0.7
LOG_ODDS_BUIT   = -0.4
LOG_ODDS_MAX    =  3.0
LOG_ODDS_MIN    = -3.0


def pos_a_cel(x_mon, y_mon, x0, y0):
    cx = int(CENTRE_MAPA + (x_mon - x0) / RESOLUCIO_M)
    cy = int(CENTRE_MAPA + (y_mon - y0) / RESOLUCIO_M)
    return cx, cy


def actualitza_mapa(robot_x, robot_y, robot_yaw,
                    lectures,   # llista de (dist, estat, angle_rel, offset_lat)
                    x0, y0):
    """
    Traça el raig de cada sensor i actualitza el mapa.
    offset_lat: desplaçament lateral del sensor al robot (metres, eix Y local del robot)
    """
    for dist, estat, angle_rel, offset_lat in lectures:
        # Posició real del sensor (no del centre del robot)
        # Rotació del offset lateral al marc global
        sx = robot_x - offset_lat * math.sin(robot_yaw)
        sy = robot_y + offset_lat * math.cos(robot_yaw)

        angle_abs  = robot_yaw + angle_rel
        dist_raig  = dist if estat else DIST_MAX_HC
        hi_ha_obs  = estat

        num_mostres = int(dist_raig / (RESOLUCIO_M / 2))
        for pas in range(1, num_mostres + 1):
            d = pas * (RESOLUCIO_M / 2)
            xp = sx + d * math.cos(angle_abs)
            yp = sy + d * math.sin(angle_abs)
            cx, cy = pos_a_cel(xp, yp, x0, y0)

            if not (0 <= cx < MIDA_MAPA and 0 <= cy < MIDA_MAPA):
                break

            if hi_ha_obs and pas == num_mostres:
                mapa_log_odds[cy, cx] = min(
                    mapa_log_odds[cy, cx] + LOG_ODDS_OCUPAT, LOG_ODDS_MAX)
            else:
                mapa_log_odds[cy, cx] = max(
                    mapa_log_odds[cy, cx] + LOG_ODDS_BUIT, LOG_ODDS_MIN)


# ─────────────────────────────────────────────────────────────────
# NAVEGACIÓ REACTIVA AMB ANTIENCALLAMENT
# ─────────────────────────────────────────────────────────────────
ESTAT_AVANT  = "AVANÇANT"
ESTAT_GIRA_E = "GIRANT_ESQ"
ESTAT_GIRA_D = "GIRANT_DRE"
ESTAT_RECULA = "RECULANT"

estat_nav        = ESTAT_AVANT
comptador        = 0
sentit_alt       = 1       # alterna el sentit de gir per no fer cercles
encallaments     = 0       # compta quantes vegades consecutives s'ha encallat
DURACIO_GIR_CURT = 20
DURACIO_GIR_LLARG= 45      # gir llarg per sortir de cantonades
DURACIO_RECULA   = 20


def decideix_moviment(dc, de, dd, estat_c, estat_e, estat_d):
    global estat_nav, comptador, sentit_alt, encallaments

    # Valors efectius (si no detecta res, és camí lliure)
    vc = dc if estat_c else DIST_MAX_HC
    ve = de if estat_e else DIST_MAX_HC
    vd = dd if estat_d else DIST_MAX_HC

    # ── Estat RECULANT ──────────────────────────────────────────
    if estat_nav == ESTAT_RECULA:
        comptador -= 1
        if comptador <= 0:
            # Després de recular, fem un gir llarg (anticantonada)
            duracio = DURACIO_GIR_LLARG if encallaments > 1 else DURACIO_GIR_CURT
            if sentit_alt > 0:
                estat_nav = ESTAT_GIRA_E
            else:
                estat_nav = ESTAT_GIRA_D
            comptador = duracio
        return -VEL_LENTA, -VEL_LENTA, estat_nav, "Reculant..."

    # ── Estat GIRANT ────────────────────────────────────────────
    if estat_nav in (ESTAT_GIRA_E, ESTAT_GIRA_D):
        comptador -= 1
        if comptador <= 0:
            estat_nav = ESTAT_AVANT
            encallaments = 0   # reset al sortir del gir
        if estat_nav == ESTAT_GIRA_E:
            return -VEL_GIRA, VEL_GIRA, estat_nav, "Girant esquerre"
        else:
            return  VEL_GIRA,-VEL_GIRA, estat_nav, "Girant dret"

    # ── Estat AVANÇANT: detecció d'obstacles ────────────────────
    obs_front = vc < DIST_PERILL
    obs_esq   = ve < DIST_PERILL
    obs_dre   = vd < DIST_PERILL

    pre_front = vc < DIST_PRECAU
    pre_esq   = ve < DIST_PRECAU
    pre_dre   = vd < DIST_PRECAU

    # Obstacle molt proper → recular
    if obs_front or (obs_esq and obs_dre):
        encallaments += 1
        sentit_alt   *= -1
        estat_nav     = ESTAT_RECULA
        comptador     = DURACIO_RECULA
        return -VEL_LENTA, -VEL_LENTA, estat_nav, "⚠ Obstacle! Reculant"

    # Obstacle frontal + lateral esquerre → girar dret
    if pre_front and pre_esq and not pre_dre:
        estat_nav = ESTAT_GIRA_D
        comptador = DURACIO_GIR_CURT
        return VEL_GIRA, -VEL_GIRA, estat_nav, "Obstacle esq → giro dret"

    # Obstacle frontal + lateral dret → girar esquerre
    if pre_front and pre_dre and not pre_esq:
        estat_nav = ESTAT_GIRA_E
        comptador = DURACIO_GIR_CURT
        return -VEL_GIRA, VEL_GIRA, estat_nav, "Obstacle dre → giro esq"

    # Obstacle frontal general → triem el costat amb més espai
    if pre_front:
        encallaments += 1
        if ve >= vd:
            estat_nav = ESTAT_GIRA_E
            comptador = DURACIO_GIR_CURT
            return -VEL_GIRA, VEL_GIRA, estat_nav, "Precaució → giro esq"
        else:
            estat_nav = ESTAT_GIRA_D
            comptador = DURACIO_GIR_CURT
            return  VEL_GIRA,-VEL_GIRA, estat_nav, "Precaució → giro dre"

    # Correcció lateral suau
    if pre_esq:
        return VEL_AVANT, VEL_LENTA, ESTAT_AVANT, "Correc. dreta"
    if pre_dre:
        return VEL_LENTA, VEL_AVANT, ESTAT_AVANT, "Correc. esquerra"

    encallaments = max(0, encallaments - 1)   # relaxem si anem bé
    return VEL_AVANT, VEL_AVANT, ESTAT_AVANT, "Camí lliure"


# ─────────────────────────────────────────────────────────────────
# VISUALITZACIÓ
# ─────────────────────────────────────────────────────────────────
def dibuixa(ax_mapa, ax_cam, ax_info,
            mapa_log, traj, rcx, rcy, yaw,
            img_cam, estat, desc, dc, de, dd, pas):

    # Panell 1 — Mapa
    ax_mapa.clear()
    prob = 1.0 / (1.0 + np.exp(-mapa_log))
    rgb  = np.ones((MIDA_MAPA, MIDA_MAPA, 3), dtype=np.uint8) * 180
    rgb[prob > 0.65] = [30,  30,  30]
    rgb[prob < 0.35] = [240, 240, 240]

    ax_mapa.imshow(rgb, origin='lower')

    if len(traj) > 1:
        t = np.array(traj)
        ax_mapa.plot(t[:, 0], t[:, 1], color='#00BFFF', lw=1.2, alpha=0.7)

    ax_mapa.annotate("",
        xy=(rcx + 6*math.cos(yaw), rcy + 6*math.sin(yaw)),
        xytext=(rcx, rcy),
        arrowprops=dict(arrowstyle='->', color='red', lw=2.5))
    ax_mapa.plot(rcx, rcy, 'ro', ms=5, zorder=5)

    for ang, col, d in [(ANGLE_SENSOR_CENTRE,'#FFD700', dc),
                         (ANGLE_SENSOR_ESQUERRE,'#FF8C00', de),
                         (ANGLE_SENSOR_DRET,'#FF8C00', dd)]:
        a = yaw + ang
        dc2 = min(d, DIST_MAX_HC) / RESOLUCIO_M
        ax_mapa.plot([rcx, rcx + dc2*math.cos(a)],
                     [rcy, rcy + dc2*math.sin(a)],
                     color=col, lw=0.8, alpha=0.5, ls='--')

    marge = 70
    ax_mapa.set_xlim(max(0, rcx-marge), min(MIDA_MAPA, rcx+marge))
    ax_mapa.set_ylim(max(0, rcy-marge), min(MIDA_MAPA, rcy+marge))
    ax_mapa.set_title(f"Mapa SLAM 2D — Pas {pas}", fontsize=9, fontweight='bold')
    ax_mapa.set_xlabel("X"); ax_mapa.set_ylabel("Y")

    llegenda = [
        mpatches.Patch(color='#1E1E1E', label='Obstacle'),
        mpatches.Patch(color='#F0F0F0', label='Lliure'),
        mpatches.Patch(color='#B4B4B4', label='Desconegut'),
        mpatches.Patch(color='#00BFFF', label='Trajectòria'),
    ]
    ax_mapa.legend(handles=llegenda, loc='upper right', fontsize=6)

    # Panell 2 — Càmera
    ax_cam.clear()
    if img_cam is not None:
        ax_cam.imshow(cv2.cvtColor(img_cam, cv2.COLOR_BGR2RGB))
    ax_cam.set_title("Càmera OV5647", fontsize=9)
    ax_cam.axis('off')

    # Panell 3 — Telemetria
    ax_info.clear(); ax_info.axis('off')
    color_e = {'AVANÇANT':'#00CC44','GIRANT_ESQ':'#FFA500',
                'GIRANT_DRE':'#FFA500','RECULANT':'#FF4444'}.get(estat,'white')
    txt = (f"ESTAT:     {estat}\n"
           f"Acció:     {desc}\n\n"
           f"── HC-SR04 ──────────\n"
           f"Centre:    {dc:.2f} m\n"
           f"Esquerre:  {de:.2f} m\n"
           f"Dret:      {dd:.2f} m\n\n"
           f"── Mapa ─────────────\n"
           f"Robot cel: ({rcx},{rcy})\n"
           f"Yaw:       {math.degrees(yaw):.1f}°\n"
           f"Explorat:  {int(np.sum(np.abs(mapa_log)>0.1))} cel·les\n")
    ax_info.text(0.05, 0.95, txt,
                 transform=ax_info.transAxes, fontsize=9,
                 verticalalignment='top', fontfamily='monospace',
                 bbox=dict(boxstyle='round', facecolor=color_e, alpha=0.15))
    ax_info.set_title("Telemetria", fontsize=9)


# ─────────────────────────────────────────────────────────────────
# PROGRAMA PRINCIPAL
# ─────────────────────────────────────────────────────────────────
def main():
    print("=" * 52)
    print("  SLAM v2 — OV5647 + HC-SR04 x3 — CoppeliaSim")
    print("=" * 52)

    client = RemoteAPIClient()
    sim    = client.getObject('sim')
    client.setStepping(True)

    xassis_h    = sim.getObject('/Xassis_Fisic')
    cam_h       = sim.getObject('/Xassis_Fisic/Vision_sensor')
    motor_esq_h = sim.getObject('/Xassis_Fisic/Joint_Motor_Esquerre')
    motor_dre_h = sim.getObject('/Xassis_Fisic/Joint_Motor_Dret')
    sensor_c_h  = sim.getObject('/Xassis_Fisic/Proximity_Frontal')
    sensor_e_h  = sim.getObject('/Xassis_Fisic/Proximity_Esquerre')
    sensor_d_h  = sim.getObject('/Xassis_Fisic/Proximity_Dreta')

    pos_ini      = sim.getObjectPosition(xassis_h, -1)
    robot_x0, robot_y0 = pos_ini[0], pos_ini[1]
    print(f"Origen del mapa: ({robot_x0:.2f}, {robot_y0:.2f})")

    plt.ion()
    fig = plt.figure(figsize=(15, 6))
    fig.patch.set_facecolor('#1a1a2e')
    ax_mapa = fig.add_subplot(1, 3, 1)
    ax_cam  = fig.add_subplot(1, 3, 2)
    ax_info = fig.add_subplot(1, 3, 3)
    for ax in [ax_mapa, ax_cam, ax_info]:
        ax.set_facecolor('#16213e')
    plt.suptitle("Robot Autònom — SLAM Reactiu v2", color='white',
                 fontsize=12, fontweight='bold')
    plt.tight_layout()

    sim.startSimulation()
    print("Simulació iniciada. Ctrl+C per aturar.")

    pas = 0
    img_cam_actual = None

    try:
        while True:
            client.step()
            pas += 1

            # ── Odometria ──────────────────────────────────────
            pos    = sim.getObjectPosition(xassis_h, -1)
            orient = sim.getObjectOrientation(xassis_h, -1)
            rx, ry = pos[0], pos[1]
            yaw    = orient[2]

            # ── Lectura HC-SR04 ────────────────────────────────
            estat_c, raw_c, _, _, _ = sim.readProximitySensor(sensor_c_h)
            estat_e, raw_e, _, _, _ = sim.readProximitySensor(sensor_e_h)
            estat_d, raw_d, _, _, _ = sim.readProximitySensor(sensor_d_h)

            # Filtre rang vàlid (DIST_MIN_HC elimina lectures del terra/xassís)
            def filtra(estat, raw):
                if estat and DIST_MIN_HC <= raw <= DIST_MAX_HC:
                    return True, raw
                return False, DIST_MAX_HC

            estat_c, dc = filtra(estat_c, raw_c)
            estat_e, de = filtra(estat_e, raw_e)
            estat_d, dd = filtra(estat_d, raw_d)

            # ── Actualitzar mapa ───────────────────────────────
            lectures = [
                (dc, estat_c, ANGLE_SENSOR_CENTRE,   0.0),
                (de, estat_e, ANGLE_SENSOR_ESQUERRE,  OFFSET_LATERAL_ESQUERRE),
                (dd, estat_d, ANGLE_SENSOR_DRET,      OFFSET_LATERAL_DRET),
            ]
            actualitza_mapa(rx, ry, yaw, lectures, robot_x0, robot_y0)

            rcx, rcy = pos_a_cel(rx, ry, robot_x0, robot_y0)
            if not trajectoria or trajectoria[-1] != (rcx, rcy):
                trajectoria.append((rcx, rcy))

            # ── Càmera (cada 3 steps) ──────────────────────────
            if pas % 3 == 0:
                try:
                    raw_img, res = sim.getVisionSensorImg(cam_h, 0)
                    if raw_img:
                        w, h = res[0], res[1]
                        img = np.frombuffer(raw_img, dtype=np.uint8).reshape((h, w, 3))
                        img = cv2.flip(img, 0)
                        img_cam_actual = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

                        # HUD: distància frontal
                        hi, wi = img_cam_actual.shape[:2]
                        ratio  = min(dc / DIST_MAX_HC, 1.0)
                        col_b  = (0, int(255*ratio), int(255*(1-ratio)))
                        cv2.rectangle(img_cam_actual,
                                      (wi//2-40, hi-20), (wi//2+40, hi-8),
                                      (50,50,50), -1)
                        cv2.rectangle(img_cam_actual,
                                      (wi//2-40, hi-20),
                                      (int(wi//2-40+80*ratio), hi-8),
                                      col_b, -1)
                        cv2.putText(img_cam_actual, f"Frontal: {dc:.2f}m",
                                    (wi//2-55, hi-24),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200,200,200), 1)
                        if dc < DIST_PERILL:
                            cv2.putText(img_cam_actual, "! OBSTACLE !",
                                        (wi//2-60, 30),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2)
                except Exception:
                    pass

            # ── Navegació ──────────────────────────────────────
            ve, vd, estat_nav, desc = decideix_moviment(
                dc, de, dd, estat_c, estat_e, estat_d)
            sim.setJointTargetVelocity(motor_esq_h, ve)
            sim.setJointTargetVelocity(motor_dre_h, vd)

            # ── Log consola (cada 50 steps) ────────────────────
            if pas % 50 == 0:
                print(f"[{pas:5d}] ({rx:.2f},{ry:.2f}) yaw={math.degrees(yaw):.0f}° "
                      f"C:{dc:.2f} E:{de:.2f} D:{dd:.2f} → {estat_nav}")

            # ── Refresc visual (cada 10 steps) ────────────────
            if pas % 10 == 0:
                dibuixa(ax_mapa, ax_cam, ax_info,
                        mapa_log_odds, trajectoria, rcx, rcy, yaw,
                        img_cam_actual, estat_nav, desc, dc, de, dd, pas)
                plt.draw(); plt.pause(0.001)

            if img_cam_actual is not None:
                cv2.imshow("Camara Robot", img_cam_actual)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

    except KeyboardInterrupt:
        print("\n[Ctrl+C] Aturant...")

    finally:
        sim.setJointTargetVelocity(motor_esq_h, 0)
        sim.setJointTargetVelocity(motor_dre_h, 0)

        print("\nGuardant resultats...")
        prob_f = 1.0 / (1.0 + np.exp(-mapa_log_odds))
        img_f  = np.ones((MIDA_MAPA, MIDA_MAPA, 3), dtype=np.uint8) * 180
        img_f[prob_f > 0.65] = [30, 30, 30]
        img_f[prob_f < 0.35] = [240, 240, 240]
        if len(trajectoria) > 1:
            for i in range(1, len(trajectoria)):
                cv2.line(img_f, trajectoria[i-1], trajectoria[i], (0,180,255), 1)
        cv2.imwrite("mapa_slam_final.png", img_f)
        np.savetxt("mapa_occupancy.txt", prob_f, fmt='%.3f')
        if trajectoria:
            np.savetxt("trajectoria.txt", np.array(trajectoria),
                       fmt='%d', header='cx cy')
        print(f"  ✓ mapa_slam_final.png  |  trajectoria: {len(trajectoria)} punts")

        plt.ioff(); plt.show()
        cv2.destroyAllWindows()
        sim.stopSimulation()
        print("Fi.")


if __name__ == "__main__":
    main()