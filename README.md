![Logo](4_design_models/logo.jpeg)
# Care-E: Assistent Robòtic Autònom per a la Gestió de Medicació

**Care-E** és un projecte d'assistència robòtica pensat per millorar la qualitat de vida de la gent gran mitjançant la dispensació de medicació, la detecció de cares i la interacció amb familiars a través d'una plataforma web.

## Índex

- [Descripció](#descripció)
- [Arquitectura del Repositori](#arquitectura-del-repositori)
- [Dependències](#dependències)
- [SetUp i instal·lació](#setup-i-instal·lació)
- [Components](#components)
- [Detalls](#detalls)
  - [Software](#software)
  - [Hardware](#hardware)
- [Llibreries i eines utilitzades](#llibreries-i-eines-utilitzades)
- [Requisits de Maquinari](#requisits-de-maquinari)
- [Conceptes tècnics](#conceptes-tècnics)
- [Vídeo de demostració](#vídeo-de-demostració)
- [Next Steps](#next-steps)
- [Referències](#referències)
- [Desenvolupadors](#desenvolupadors)

## Descripció



## Arquitectura del Repositori

Aquest projecte segueix una estructura de monorepo dividida en quatre parts principals:

* `/1_arduino_hardware`
  - Codi Arduino en C++ per controlar el xassís, servos, ultrasons i engranatges.
  - Inclou esbossos d'exemple i un menú serial per provar moviments, tests de motors i dispensació.

* `/2_raspberry_brain`
  - Pipeline de visió per computador amb Python.
  - `vision/mainRecCares.py` inicia la càmera i fa la detecció i el reconeixement de cares.
  - La carpeta `vision/deteccio_cares` conté els mòduls de detecció (`dlib`), reconeixement (`DeepFace`) i filtre de Kalman.

* `/3_web_cloud`
  - Aplicació web `care` construïda amb Next.js.
  - Serveis backend que gestionen comandes del robot, TTS, veu i accions de dispensació.
  - API routes per a `robot-action`, `robot-voice`, `tts` i altres funcionalitats.

* `/4_design_models`
  - Arxius de disseny 3D i fitxers STL del xassís i del dispensador.

## Dependències

### Python / Conda

El projecte de visió i la resta de lògiques Python es gestionen des de `environment.yml`.

Conté paquets com:

- `opencv-python`
- `dlib`
- `deepface`
- `tensorflow`
- `flask`
- `requests`
- `python-dotenv`

### Node.js

L'aplicació web `3_web_cloud/care` usa `package.json` amb:

- `next` 16
- `react` 19
- `react-dom`
- `@google-cloud/text-to-speech`
- `@google/genai`
- `@supabase/supabase-js`
- `@supabase/ssr`
- `google-auth-library`
- `tailwindcss`

## SetUp i instal·lació

### Entorn Python

1. Crear l'entorn Conda amb `environment.yml`:
   - `conda env create -f environment.yml`
2. Activar l'entorn:
   - `conda activate care`
3. Comprovar que Python 3.12 està activat.

### Aplicació web

1. Anar a `3_web_cloud/care`.
2. Instal·lar dependències Node:
   - `npm install`
3. Executar en mode desenvolupament:
   - `npm run dev`

### Arduino

1. Obrir `1_arduino_hardware/src/care.ino` en l'IDE d'Arduino.
2. Carregar el firmware a una placa Arduino UNO.
3. Connectar els servos, els motors i els sensors segons el cablejat definit a `src/`.

## Components

| Nom                           | Unitats | Preu        |
|-------------------------------|---------|-------------|
| Cámara Fisheye 5MP            |   1     |  29,95€     |
| Raspberry Pi 5 /4 B           |   1     |  97,95€     |
| Arduino Uno                   |   1     |  23,95€     |
| Controlador PWM 16 canales    |   1     |  7,20€      |
| Servomotor digital MG996R     |   5     |  6,50€      |
| Micro servo miniatura SG90    |   4     |  2,30 €     |
| Sensor de ultrasonidos HC-SR04|   3     |  1,80 €     |
| Motor 20D - 250:1 (12V)       |   2     |  37,95 €    |
| Controladora motor            |   2     |   €         |
| Micro USB                     |   1     |   €         |
| Bateria 14V                   |   1     |   €         |
| Power bank                    |   1     |   €         |
| Step down 5V                  |   1     |   €         |
| Step down 12V                 |   1     |   €         |
| Altaveu                       |   1     |   €         |
| **Total**                     |         | ** €**      |

## Detalls

### Software

### Hardware

## Llibreries i eines utilitzades

- Python: `opencv-python`, `dlib`, `deepface`, `tensorflow`, `flask`, `requests`, `python-dotenv`.
- Node: `next`, `react`, `@google-cloud/text-to-speech`, `@google/genai`, `@supabase/supabase-js`, `tailwindcss`.
- Desenvolupament: Arduino IDE, Conda, Git.

## Requisits de Maquinari
* **Processament:** Raspberry Pi 5 (Cervell) + Arduino UNO R3 (Controlador de maquinari).
* **Sensors:** Càmera Fisheye 5MP, Micròfon USB, 3x Ultrasons HC-SR04.
* **Actuadors:** 2x Motors DC 250:1 (Tracció), Servo 360º (Dispensador), Servos MG996R (Pan & Tilt).
* **Energia:** Bateria LiPo 3S 11.1V amb reguladors DC-DC (5.1V / 3A).

## Conceptes tècnics
1. **Navegació Autònoma:** Sistema de tracció per erugues amb evasió d'obstacles mitjançant sensors d'ultrasons (HC-SR04) i algoritmes de cerca de l'usuari.
2. **Visió per Computador:** Reconeixement de persones en temps real utilitzant YOLOv8 i una càmera Fisheye per garantir que la medicació s'entrega a la persona correcta.
3. **Interacció Cognitiva (IA):** Integració amb Google Gemini i reconeixement de veu per actuar com un assistent empàtic, resolent dubtes sobre salut i horaris.
4. **Dispensació Segura:** Mecanisme de maquinari dissenyat en 3D amb sistema de *feedback* en llaç tancat per garantir l'entrega correcta de les pastilles.
5. **Plataforma Cloud:** Dashboard web per a familiars i metges per gestionar els horaris de medicació i rebre alertes en temps real.


## Vídeo de demostració

## Next Steps

## Referències

## Desenvolupadors
- **Martí Bertarns Arasanz** - Universitat Autònoma de Barcelona (UAB)
- **Marc Cantero Priego** - Universitat Autònoma de Barcelona (UAB)
- **Bernat Domene** - Universitat Autònoma de Barcelona (UAB)
- **Martí Serra Prat** - Universitat Autònoma de Barcelona (UAB)
- **Aina Vidal i Vázquez** - Universitat Autònoma de Barcelona (UAB) 
