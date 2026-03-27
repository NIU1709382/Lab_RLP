# 🤖 Care-E: Assistent Robòtic Autònom per a la Gestió de Medicació

**Care-E** és un prototip de robot assistencial dissenyat per millorar la qualitat de vida de la gent gran mitjançant la dispensació autònoma de medicaments i l'acompanyament cognitiu.

## ✨ Característiques Principals

1. 🧭 **Navegació Autònoma:** Sistema de tracció per erugues amb evasió d'obstacles mitjançant sensors d'ultrasons (HC-SR04) i algoritmes de cerca de l'usuari.
2. 👁️ **Visió per Computador:** Reconeixement de persones en temps real utilitzant YOLOv8 i una càmera Fisheye per garantir que la medicació s'entrega a la persona correcta.
3. 🗣️ **Interacció Cognitiva (IA):** Integració amb Google Gemini i reconeixement de veu per actuar com un assistent empàtic, resolent dubtes sobre salut i horaris.
4. 💊 **Dispensació Segura:** Mecanisme de maquinari dissenyat en 3D amb sistema de *feedback* en llaç tancat per garantir l'entrega correcta de les pastilles.
5. ☁️ **Plataforma Cloud:** Dashboard web per a familiars i metges per gestionar els horaris de medicació i rebre alertes en temps real.

## 📂 Arquitectura del Repositori

Aquest projecte utilitza una arquitectura de *Monorepo* dividida per dominis tecnològics:

* `/1_arduino_hardware`: Lògica de control de motors de baix nivell, actuadors i lectura de sensors d'ultrasons (C++).
* `/2_raspberry_brain`: Cervell central. Inclou la visió artificial, la comunicació amb Gemini, la navegació d'alt nivell i la gestió d'estats (Python).
* `/3_web_cloud`: Interfície d'usuari (Frontend) i lògica de base de dades per al control familiar.
* `/4_cad_models`: Arxius de disseny 3D (.STL) del xassís i el dispensador.

## ⚙️ Requisits de Maquinari
* **Processament:** Raspberry Pi 5 (Cervell) + Arduino UNO R3 (Controlador de maquinari).
* **Sensors:** Càmera Fisheye 5MP, Micròfon USB, 3x Ultrasons HC-SR04.
* **Actuadors:** 2x Motors DC 250:1 (Tracció), Servo Feetech amb Feedback (Dispensador), Servos MG996R (Pan & Tilt).
* **Energia:** Bateria LiPo 3S 11.1V amb reguladors DC-DC (5.1V / 3A).

---
*Projecte desenvolupat per: Martí Bertrans, Marc Cantero, Aina Vidal, Martí Serra, Bernat Domene.*