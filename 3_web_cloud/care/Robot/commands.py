# commands.py
import datetime
import requests
import os
from config import API_URL, ROBOT_ID
from dispensing import activar_motor
from utils import reproduir_audio_base64

def processar_comandes(commands, token):
    for cmd in commands:
        cmd_type = cmd.get("type")
        if cmd_type == "dispense_manual":
            _processar_dispense_manual(cmd, token)
        elif cmd_type == "speak":
            _processar_speak(cmd, token)
        else:
            print(f"⚠️ Tipus de comanda desconegut: {cmd_type}")

def _processar_dispense_manual(cmd, token):
    slot_info = cmd.get("slot_inventory", {})
    dose_demanada = cmd.get("dose", 1)
    slot_num = slot_info.get("slot", "?")
    med_name = slot_info.get("medication_name", "Desconegut")
    pastilles_disponibles = slot_info.get("pill_count", 0)

    print(f"\n🎮 ORDRE MANUAL: {dose_demanada}x {med_name} del Slot {slot_num}")

    if pastilles_disponibles < dose_demanada:
        print(f"   ❌ Inventari insuficient ({pastilles_disponibles}/{dose_demanada})")
        pastilles_reals = activar_motor(slot_num, pastilles_disponibles, pastilles_disponibles) if pastilles_disponibles > 0 else 0
        status = "failed_inventory"
    else:
        pastilles_reals = activar_motor(slot_num, dose_demanada, pastilles_disponibles)
        status = "dispensed" if pastilles_reals == dose_demanada else "failed_inventory"

    try:
        requests.post(f"{API_URL}/api/robot-action", json={
            "robot_id": ROBOT_ID,
            "robot_token": token,
            "action": "dispense",
            "payload": {
                "schedule_id": None,
                "slot_inventory_id": cmd.get("slot_inventory_id"),
                "dose": dose_demanada,
                "dose_real": pastilles_reals,
                "status": status,
                "command_id": cmd.get("id"),
                "dispensed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            }
        }, timeout=5)
        print(f"   ✅ Resultat reportat: {pastilles_reals}/{dose_demanada}")
    except Exception as e:
        print(f"   ⚠️ Error reportant: {e}")

def _processar_speak(cmd, token):
    message_text = cmd.get("message_text", "")
    audio_b64 = cmd.get("audio_base64")

    print(f"\n🔊 MISSATGE DEL CUIDADOR: \"{message_text}\"")

    if not audio_b64:
        print("   ❌ No hi ha àudio")
        _reportar_speak(cmd.get("id"), token, ok=False, error="No s'ha rebut àudio")
        return

    ok = reproduir_audio_base64(audio_b64)
    print(f"   {'✅ Reproduït' if ok else '❌ Error reproduint'}")
    _reportar_speak(cmd.get("id"), token, ok=ok, error="Error reproduint àudio" if not ok else None)

def _reportar_speak(command_id, token, ok, error=None):
    try:
        requests.post(f"{API_URL}/api/robot-action", json={
            "robot_id": ROBOT_ID,
            "robot_token": token,
            "action": "speak",
            "payload": {
                "command_id": command_id,
                "status": "ok" if ok else "failed",
                "error_message": error,
            }
        }, timeout=5)
    except Exception as e:
        print(f"   ⚠️ Error reportant speak: {e}")

# ⭐ UNA SOLA DEFINICIÓ de _parlar
def _parlar(text, token, robot_parlant=None):
    """Genera TTS via servidor i reprodueix al robot."""
    print(f"🔊 Care-E: \"{text}\"")

    if robot_parlant:
        robot_parlant.set()

    try:
        r = requests.post(
            f"{API_URL}/api/tts",
            json={"robot_id": ROBOT_ID, "robot_token": token, "text": text},
            timeout=15
        )

        if r.status_code == 200:
            audio_b64 = r.json().get("audio_base64")
            if audio_b64:
                reproduir_audio_base64(audio_b64)
            else:
                print("⚠️ No s'ha rebut àudio")
        else:
            print(f"⚠️ Error TTS: {r.status_code}")

    except Exception as e:
        print(f"⚠️ Error parlant: {e}")

    finally:
        if robot_parlant:
            robot_parlant.clear()

def gestionar_veu(token, pausar_wake_word=None, robot_parlant=None):
    """Flux complet: gravar → enviar → respondre."""
    from utils import gravar_fins_silenci

    print("🎤 Care-E escoltant...")

    if pausar_wake_word:
        pausar_wake_word.set()

    try:
        fitxer = gravar_fins_silenci(
            max_durada=30,
            silenci_llindar=750,
            silenci_durada=1.5,
        )

        try:
            with open(fitxer, "rb") as f:
                r = requests.post(
                    f"{API_URL}/api/robot-voice",
                    files={"audio": ("audio.wav", f, "audio/wav")},
                    data={"robot_id": ROBOT_ID, "robot_token": token},
                    timeout=30
                )

            if r.status_code == 200:
                data = r.json()
                print(f"📝 Transcripció: {data.get('transcript')}")
                print(f"🎯 Intenció: {data.get('intent')}")
                _parlar(data.get('response_text', ''), token, robot_parlant)
            else:
                print(f"⚠️ Error HTTP {r.status_code}: {r.text}")
                _parlar("Ho sento, ha hagut un problema.", token, robot_parlant)

        except Exception as e:
            print(f"⚠️ Error: {e}")
            _parlar("No tinc connexió ara mateix.", token, robot_parlant)

        if os.path.exists(fitxer):
            os.remove(fitxer)

    finally:
        if pausar_wake_word:
            pausar_wake_word.clear()
        print("🎤 Wake word reactivat")