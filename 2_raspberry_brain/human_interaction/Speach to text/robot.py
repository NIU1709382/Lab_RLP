import pyttsx3
import speech_recognition as sr
import ollama
import time

# --- ABANS HEU DE ISNTALAR AIXO ---
# pip install pyttsx3
# pip install SpeechRecognition
# pip install PyAudio
# pip install ollama


def parlar_segur(text):
    print(f"🤖 CARE-E: {text}")
    engine_temp = pyttsx3.init()
    engine_temp.setProperty('rate', 170)
    voices = engine_temp.getProperty('voices')
    
    for voice in voices:
        if "spanish" in voice.name.lower() or "es-ES" in voice.id:
            engine_temp.setProperty('voice', voice.id)
            break
            
    engine_temp.say(text)
    engine_temp.runAndWait()
    engine_temp.stop()
    del engine_temp

def escoltar():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("\n👂 Escuchando...")
        recognizer.adjust_for_ambient_noise(source, duration=0.5)
        audio = recognizer.listen(source)
    try:
        text = recognizer.recognize_google(audio, language="es-ES")
        print(f"Tú: {text}")
        return text.lower()
    except:
        return ""
    
def cargar_personalitat(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def demanar_a_ollama(pregunta):
    print("🧠 CARE-E está pensando...")
    response = ollama.chat(model='llama3.2:3b', messages=[
        {
            'role': 'system', 
            'content': cargar_personalitat('../prompts/personalitat.txt')
        },
        {'role': 'user', 'content': pregunta},
    ], options={
        'temperature': 0.1
    })
    return response['message']['content']

# --- BUCLE PRINCIPAL ---
print("🚀 CARE-E activado (Modo Español). Di su nombre para hablarle.")

while True:
    frase = escoltar()
    
    # Paraules clau adaptades a com podria entendre el nom en castellà
    paraules_clau = ["care-e", "keri", "quiere", "carrie", "caeré", "cari"]
    
    if any(nom in frase for nom in paraules_clau):
        for nom in paraules_clau:
            frase = frase.replace(nom, "")
        
        frase = frase.strip()
        
        if not frase:
            resposta = "¡Hola! ¿Me llamabas? Soy CARE-E."
        elif "adiós" in frase or "salir" in frase or "adeu" in frase:
            parlar_segur("¡Hasta pronto! Me quedo a la espera.")
            continue 
        else:
            resposta = demanar_a_ollama(frase)
        
        time.sleep(0.5)
        parlar_segur(resposta)
    
    elif frase != "":
        print(f"☁️ (Frase ignorada)")