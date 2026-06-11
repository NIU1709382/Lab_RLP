![Logo](4_design_models/logo.jpeg)
# Care-E: Assistent Robòtic Autònom per a la Gestió de Medicació

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

Aquest projecte consisteix en el desenvolupament d'un robot assistencial intel·ligent destinat a millorar la qualitat de vida de les persones grans que viuen soles. L'objectiu principal és oferir suport en les activitats quotidianes, augmentar la seguretat de l'usuari i proporcionar una eina de comunicació i acompanyament tant per a la persona com per als seus familiars.

El robot integra tecnologies de visió artificial, intel·ligència artificial, navegació autònoma i interacció per veu per actuar de manera proactiva dins de l'entorn domèstic.


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

* ![Fritzing](https://img.shields.io/badge/Fritzing-0075A2?style=for-the-badge&logo=fritzing&logoColor=white)
* ![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)
* ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
* ![Arduino](https://img.shields.io/badge/Arduino-00979D?style=for-the-badge&logo=arduino&logoColor=white)
* ![CoppeliaSim](https://img.shields.io/badge/CoppeliaSim-000000?style=for-the-badge&logo=coppeliasim&logoColor=white)
* ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
* ![Autodesk Fusion](https://img.shields.io/badge/Autodesk_Fusion-0696D7?style=for-the-badge&logo=autodesk&logoColor=white)
* ![Blender](https://img.shields.io/badge/Blender-E87D0D?style=for-the-badge&logo=blender&logoColor=white)


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

En aquesta secció mostrem els components principals utilitzats per tal de dur a terme el projecte, així com les unitats utilitzades de cadascun i el seu preu corresponent. 

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
| Controladora motor            |   2     |  5,95€      |
| Micro USB                     |   1     |  10€        |
| Bateria 14V                   |   1     |  20€        |
| Power bank 5000mAh            |   1     |  12€        |
| Step down 5V                  |   1     |  6,30€      |
| Step down 12V                 |   1     |  4,50€      |
| Altaveu                       |   1     |  4,30€      |
| Amplificador                  |   1     |  6,50€      |
| **Total**                     |         |** 357,55€** |

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
