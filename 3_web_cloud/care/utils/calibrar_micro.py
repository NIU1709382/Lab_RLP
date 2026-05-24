# calibrar_micro.py
import sounddevice as sd
import numpy as np

SAMPLE_RATE = 16000

print("=" * 40)
print("MICRÒFONS DISPONIBLES:")
print("=" * 40)

# Llista tots els dispositius
devices = sd.query_devices()
for i, d in enumerate(devices):
    if d['max_input_channels'] > 0:  # només micròfons
        print(f"  [{i}] {d['name']} (canals: {d['max_input_channels']})")

print(f"\nMicròfon per defecte: {sd.query_devices(kind='input')['name']}")
print("=" * 40)
print("=" * 40)
print("CALIBRACIÓ DEL MICRÒFON")
print("=" * 40)

# Test 1: Silenci ambient
print("\n1. Queda't en silenci 3 segons...")
input("   Prem Enter quan estiguis llest")
audio = sd.rec(int(3 * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=1, dtype='int16')
sd.wait()
volum_silenci = np.abs(audio).mean()
print(f"   Volum ambient: {volum_silenci:.0f}")

# Test 2: Parla normal
print("\n2. Parla en veu normal 3 segons...")
input("   Prem Enter i comença a parlar")
audio = sd.rec(int(3 * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=1, dtype='int16')
sd.wait()
volum_veu = np.abs(audio).mean()
print(f"   Volum veu: {volum_veu:.0f}")

# Recomanació
llindar = volum_silenci * 3
print(f"\n{'='*40}")
print(f"Volum ambient:  {volum_silenci:.0f}")
print(f"Volum veu:      {volum_veu:.0f}")
print(f"Llindar recomanat: {llindar:.0f}")
print(f"{'='*40}")
print(f"\nAfegeix això a utils.py:")
print(f"silenci_llindar={llindar:.0f}")