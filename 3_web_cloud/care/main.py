import time
import uuid
from supabase import create_client

SUPABASE_URL = "https://bekapgqkbucjukigthvl.supabase.co"
SUPABASE_KEY = "sb_publishable_boGbYRPaDWRO8xunSZlSCQ_pvkRbfvG"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

ROBOT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

res = supabase.table("robots").select("id, owner_id, name").eq("id", ROBOT_ID).execute()

def get_wifi_signal():
    try:
        with open("/proc/net/wireless", "r") as f:
            lines = f.readlines()
            for line in lines:
                if "wlan0" in line:
                    # Extrae el valor de 'link' (calidad de 0 a 70 generalmente)
                    data = line.split()
                    link_quality = float(data[2].replace(".", ""))
                    
                    # Convertimos a porcentaje (la calidad máxima suele ser 70)
                    percentage = int((link_quality / 70) * 100)
                    
                    if percentage >= 80: return "excellent"
                    if percentage >= 50: return "good"
                    if percentage >= 20: return "fair"
                    return "poor"
        return "no signal"
    except Exception:
        return "ethernet/error"

if not res.data:
    # Primer arrencada — crea el robot sense owner
    supabase.table("robots").insert({
        "id":     ROBOT_ID,
        "name":   "Care-E",
        "status": "offline",
    }).execute()
    print("=" * 40)
    print(f"  Care-E Robot ID:")
    print(f"  {ROBOT_ID}")
    print("=" * 40)
    print("Introdueix aquest ID a la web per vincular el robot")
else:
    robot = res.data[0]
    if robot.get("owner_id"):
        # Ja està vinculat
        print(f"✓ Care-E funcionant correctament")
        print(f"  Robot: {robot.get('name', 'Care-E')}")
    else:
        # Existeix però sense owner
        print("=" * 40)
        print(f"  Care-E Robot ID:")
        print(f"  {ROBOT_ID}")
        print("=" * 40)
        print("Esperant que l'usuari vinculi el robot a la web...")

# Heartbeat con señal dinámica
while True:
    # Obtenemos la calidad real en cada iteración
    current_signal = get_wifi_signal()
    supabase.table("robots").update({
        "status":  "online",
        "battery": None, # Como hablamos antes, queda vacío por estar enchufado
        "signal":  current_signal, # Aquí enviamos "excellent", "good", etc.
    }).eq("id", ROBOT_ID).execute()
    
    print(f"Ping ✓ | Signal: {current_signal}")
    time.sleep(10)