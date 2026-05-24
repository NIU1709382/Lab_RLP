# utils.py
import os
import json
import base64
import tempfile
import subprocess
import requests
import sys
from config import API_URL, PENDING_FILE
import sounddevice as sd
import numpy as np
from scipy.io.wavfile import write

SAMPLE_RATE = 16000

def get_wifi_signal():
    """Llegeix la qualitat del senyal Wi-Fi intern de la Raspberry Pi."""
    try:
        with open("/proc/net/wireless", "r") as f:
            for line in f.readlines():
                if "wlan0" in line:
                    data = line.split()
                    quality = float(data[2].replace(".", ""))
                    pct = int((quality / 70) * 100)
                    if pct >= 80: return "excellent"
                    if pct >= 50: return "good"
                    if pct >= 20: return "fair"
                    return "poor"
        return "no signal"
    except Exception:
        return "excellent"

def carregar_pendents():
    if os.path.exists(PENDING_FILE):
        try:
            with open(PENDING_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def guardar_pendents(pendents):
    try:
        with open(PENDING_FILE, "w", encoding="utf-8") as f:
            json.dump(pendents, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ Error guardant pendents: {e}")

def enviar_log_servidor(payload):
    try:
        r = requests.post(f"{API_URL}/api/robot-action", json=payload, timeout=5)
        return r.status_code == 200
    except Exception:
        return False

def flush_pendents():
    pendents = carregar_pendents()
    if not pendents:
        return

    print(f"📤 Intentant enviar {len(pendents)} logs pendents...")
    restants = []
    enviats = 0

    for payload in pendents:
        if enviar_log_servidor(payload):
            enviats += 1
        else:
            restants.append(payload)

    guardar_pendents(restants)

    if enviats > 0:
        print(f"   ✅ {enviats} logs pendents enviats.")
    if restants:
        print(f"   ⚠️ Queden {len(restants)} pendents.")

def reproduir_audio_base64(audio_b64):
    try:
        audio_bytes = base64.b64decode(audio_b64)
        
        # ⭐ Ruta fixa en lloc de tempfile (evita problemes a Windows)
        temp_path = os.path.join(os.getcwd(), "temp_audio.mp3")
        
        with open(temp_path, "wb") as f:
            f.write(audio_bytes)
        
        print(f"🎵 Fitxer guardat: {temp_path}")
        
        import pygame
        pygame.mixer.init()
        pygame.mixer.music.load(temp_path)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
        pygame.mixer.quit()
        
        os.remove(temp_path)
        print("✅ Reproduït correctament")
        return True
        
    except Exception as e:
        import traceback
        print(f"⚠️ Error: {traceback.format_exc()}")
        return False

def gravar_fins_silenci(max_durada=30, silenci_llindar=780, silenci_durada=1.5,):
    # 🔔 PITID INICIAL: Tono agut i curt (1000Hz) per avisar de que ja pot parlar
    print("🔔 [BIP INICIAL]")
    fer_bip(tipus="inici")
    
    print("🎤 Escoltant... (para de parlar per enviar)")
    
    chunk_size = 1024
    chunks = []
    chunks_silence = 0
    chunks_per_second = SAMPLE_RATE / chunk_size
    max_silence_chunks = int(silenci_durada * chunks_per_second)
    max_chunks = int(max_durada * chunks_per_second)
    ha_parlat = False  # evitar tallar si no ha dit res encara

    with sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype='int16',
        blocksize=chunk_size
    ) as stream:
        for _ in range(max_chunks):
            chunk, _ = stream.read(chunk_size)
            chunks.append(chunk.copy())

            volum = np.abs(chunk).mean()

            if volum > silenci_llindar:
                ha_parlat = True
                chunks_silence = 0
            else:
                if ha_parlat:
                    chunks_silence += 1
                    if chunks_silence >= max_silence_chunks:
                        print(f"🔇 Silenci detectat, tallant...")
                        break

    # 🔕 PITID FINAL: Tono una mica més greu (600Hz) indicant que s'ha tancat el micro
    print("🔕 [BIP FINAL]")
    fer_bip(tipus="fi")

    audio = np.concatenate(chunks, axis=0)

    fitxer = "veu_pacient.wav"
    write(fitxer, SAMPLE_RATE, audio)
    durada_real = len(audio) / SAMPLE_RATE
    print(f"✅ Gravació acabada: {durada_real:.1f} segons")
    return fitxer

def fer_bip(tipus="inici"):
    """
    Genera un bip professional tipus assistent virtual (chime).
    - 'inici': Dos tons ascendents (desperta)
    - 'fi': Dos tons descendents (s'apaga)
    """
    try:
        # 1. Silenci inicial per despertar l'altaveu (evita que es mengi el so)
        silenci_inicial = np.zeros(int(SAMPLE_RATE * 0.15), dtype=np.float64)
        
        def crea_nota(freq, durada):
            """Sintetitza una nota amb harmònics i fade in/out per sonar natural."""
            t = np.linspace(0, durada, int(SAMPLE_RATE * durada), False)
            
            # Barregem la freqüència principal amb harmònics perquè soni rodó i suau
            ona = (0.6 * np.sin(2 * np.pi * freq * t) + 
                   0.3 * np.sin(2 * np.pi * (freq * 2) * t) + 
                   0.1 * np.sin(2 * np.pi * (freq * 3) * t))
            
            # Envolupant: Suavitzem els extrems (fade) per evitar "clics"
            fade_len = int(SAMPLE_RATE * 0.02) # 20ms de suavitzat
            envelope = np.ones_like(t)
            envelope[:fade_len] = np.linspace(0, 1, fade_len)
            envelope[-fade_len:] = np.linspace(1, 0, fade_len)
            
            return ona * envelope

        # Notes base (Acord major bonic i clar)
        freq_greu = 587.33  # Nota Re (D5)
        freq_aguda = 739.99 # Nota Fa# (F#5)

        if tipus == "inici":
            # To ascendent: Greu -> curt silenci -> Agut
            nota1 = crea_nota(freq_greu, 0.1)
            silenci_mig = np.zeros(int(SAMPLE_RATE * 0.04))
            nota2 = crea_nota(freq_aguda, 0.15)
        else:
            # To descendent: Agut -> curt silenci -> Greu
            nota1 = crea_nota(freq_aguda, 0.1)
            silenci_mig = np.zeros(int(SAMPLE_RATE * 0.04))
            nota2 = crea_nota(freq_greu, 0.15)

        # Unim els trossos d'àudio
        audio_combinat = np.concatenate((silenci_inicial, nota1, silenci_mig, nota2))
        
        # Convertim l'àudio a int16 i baixem una mica el volum general (* 20000 en comptes de 32767)
        audio_final = (audio_combinat * 20000).astype(np.int16)
        
        sd.play(audio_final, SAMPLE_RATE)
        sd.wait()
    except Exception as e:
        print(f"⚠️ No s'ha pogut reproduir el bip: {e}")