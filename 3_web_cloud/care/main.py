import time
import uuid
from supabase import create_client

SUPABASE_URL = "https://bekapgqkbucjukigthvl.supabase.co"
SUPABASE_KEY = "sb_publishable_boGbYRPaDWRO8xunSZlSCQ_pvkRbfvG"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

ROBOT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

res = supabase.table("robots").select("id, owner_id, name").eq("id", ROBOT_ID).execute()

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

# Heartbeat
while True:
    supabase.table("robots").update({
        "status":  "online",
        "battery": 20,
        "signal":  "excellent",
    }).eq("id", ROBOT_ID).execute()
    print("Ping ✓")
    time.sleep(10)