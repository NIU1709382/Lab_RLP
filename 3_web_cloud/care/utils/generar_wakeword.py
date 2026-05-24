# generar_wakeword.py
from openwakeword.train import generate_clips

generate_clips(
    phrase="Care-E",           # la teva wake word
    n=1000,                    # nombre de clips a generar
    output_dir="./care_e_clips",
    language="es"              # més proper al català
)

print("✅ Clips generats a ./care_e_clips")