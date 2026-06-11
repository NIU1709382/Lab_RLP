// ═══════════════════════════════════════════════════════════════════════════════
//  Care-E · Capa 1 (Arduino) — L'Executiu
//
//  Arquitectura de tres capes:
//    Núvol ← Raspberry Pi ←→ [Serial] ←→ Arduino ← Sensors/Motors
//
//  Aquest fitxer orquestra el loop() principal. Mai utilitza delay().
//  Tota la lògica de temps va amb millis().
// ═══════════════════════════════════════════════════════════════════════════════

#include "control_encoders.h"
#include "control_ultraso.h"
#include "control_motor.h"
#include "control_servo_conjunt.h"
#include "config.h"

// ── Pins ──────────────────────────────────────────────────────────────────────

#define ENCODER_A1  3
#define ENCODER_B1  12
#define ENCODER_A2  2
#define ENCODER_B2  13

#define PIN_TRIG1  A0
#define PIN_ECHO1  A1
#define PIN_TRIG2  A2
#define PIN_ECHO2  A3
#define PIN_TRIG3  8
#define PIN_ECHO3  7

#define RPWM1  9
#define LPWM1  10
#define RPWM2  5
#define LPWM2  6

// ── Objectes globals ──────────────────────────────────────────────────────────

Motor motor1;
Motor motor2;

Ultraso ultraso1;
Ultraso ultraso2;
Ultraso ultraso3;

// ── Variables d'estat del sistema ────────────────────────────────────────────

unsigned long ultim_heartbeat   = 0;   // millis() de l'últim missatge rebut
unsigned long ultim_telemetria  = 0;   // millis() de l'últim enviament
bool          mode_segur        = false;
String        buffer_serial     = "";

// ═══════════════════════════════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════════════════════════════

void setup() {
    Serial.begin(SERIAL_BAUD);

    // Motors (increment de ramp = 8: ràpid però suau)
    motor1 = inicialitzarMotor(RPWM1, LPWM1, 8);
    motor2 = inicialitzarMotor(RPWM2, LPWM2, 8);

    // Ultrasons
    inicialitzarUltraso(ultraso1, PIN_TRIG1, PIN_ECHO1);
    inicialitzarUltraso(ultraso2, PIN_TRIG2, PIN_ECHO2);
    inicialitzarUltraso(ultraso3, PIN_TRIG3, PIN_ECHO3);

    // Encoders
    inicialitzarEncoder(ENCODER_A1, ENCODER_B1, 0);
    inicialitzarEncoder(ENCODER_A2, ENCODER_B2, 1);

    // Servos (PCA9685 via I2C)
    inicialitzarServos();

    // Esperem que la RPi estigui llesta
    ultim_heartbeat = millis();

    Serial.println("READY");
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LOOP PRINCIPAL
//  Ordre important: primers la seguretat, després el moviment, després la comms.
// ═══════════════════════════════════════════════════════════════════════════════

void loop() {
    llegirComanda();         // 1. Llegir i processar Serial (no bloqueja)
    //verificarHeartbeat();    // 2. Comprovar si la RPi segueix viva
    //actualitzarSensors();    // 3. Tick dels ultrasons asíncrons
    //actualitzarMotors();     // 4. Aplicar ramp i seguretat per obstacle
    actualitzarMedicacio();  // 5. Avançar màquines d'estats dels servos
    //enviarTelemetria();      // 6. Enviar dades cap a la RPi
}

// ═══════════════════════════════════════════════════════════════════════════════
//  1. LLEGIR COMANDA
//  Protocol: una línia de text per comanda, acabada en '\n'.
//  Exemples: "ENDAVANT", "ULLS:90:45", "HEARTBEAT"
// ═══════════════════════════════════════════════════════════════════════════════

void llegirComanda() {
    while (Serial.available()) {
        char c = Serial.read();
        if (c == '\n') {
            buffer_serial.trim();
            if (buffer_serial.length() > 0) {
                processarComanda(buffer_serial);
            }
            buffer_serial = "";
        } else if (buffer_serial.length() < 64) {
            // Limitem la longitud del buffer per evitar overflow de memòria
            buffer_serial += c;
        }
    }
}

// ── Parser de comandes ────────────────────────────────────────────────────────
//
//  Comandes simples:    "ENDAVANT", "ENRERE", "PARAR", "HEARTBEAT"
//  Comandes amb args:   "ULLS:90:45", "CELLES:80:100", "VEL:150"
//  Medicació:           "REC_MED1", "REC_MED2", "CERCLE_MED1", "CERCLE_MED2"
//  Expressions:         "EXP:SORPRESA", "EXP:ENFADAT", "EXP:NEUTRAL"

void processarComanda(const String &cmd) {
    // Qualsevol comanda vàlida és un heartbeat implícit
    ultim_heartbeat = millis();

    // ── Moviment ─────────────────────────────────────────────────────────────
    if (cmd == "ENDAVANT") {
        if (!mode_segur) {
            motorEndavant(motor1, 150);
            motorEndavant(motor2, 150);
        }
    }
    else if (cmd == "ENRERE") {
        motorEnrere(motor1, 150);
        motorEnrere(motor2, 150);
    }
    else if (cmd == "PARAR") {
        pararMotor(motor1);
        pararMotor(motor2);
    }
    else if (cmd.startsWith("VEL:")) {
        // "VEL:150" → velocitat personalitzada
        int vel = cmd.substring(4).toInt();
        vel = constrain(vel, 0, 255);
        motorEndavant(motor1, vel);
        motorEndavant(motor2, vel);
    }
    else if (cmd.startsWith("GIRA:")) {
        // "GIRA:DRET:120" o "GIRA:ESQU:120"
        int sep = cmd.indexOf(':', 5);
        if (sep > 0) {
            String dir = cmd.substring(5, sep);
            int vel    = cmd.substring(sep + 1).toInt();
            vel = constrain(vel, 0, 255);
            if (dir == "DRET") {
                motorEndavant(motor1, vel);
                motorEnrere(motor2, vel);
            } else if (dir == "ESQU") {
                motorEnrere(motor1, vel);
                motorEndavant(motor2, vel);
            }
        }
    }

    // ── Servos facials ────────────────────────────────────────────────────────
    // "ULLS:90:45"   → ull dret 90°, ull esquerre 45°
    // "CELLES:80:100"
    else if (cmd.startsWith("ULLS:")) {
        int sep = cmd.indexOf(':', 5);
        
        // --- DEBUG ---
        Serial.print("DEBUG -> Comanda crua: ["); Serial.print(cmd); Serial.println("]");
        Serial.print("DEBUG -> Index separador: "); Serial.println(sep);
        
        if (sep > 0) {
            String str_dret = cmd.substring(5, sep);
            String str_esq  = cmd.substring(sep + 1);
            
            Serial.print("DEBUG -> Text tallat dret: ["); Serial.print(str_dret); Serial.println("]");
            Serial.print("DEBUG -> Text tallat esq:  ["); Serial.print(str_esq); Serial.println("]");
            
            int dret = str_dret.toInt();
            int esq  = str_esq.toInt();
            
            Serial.print("DEBUG -> Numeros finals: dret="); Serial.print(dret);
            Serial.print(" | esq="); Serial.println(esq);
            // -------------

            movimentUlls(dret, esq);
            Serial.println("OK:ULLS_MOGUTS");
        } else {
            Serial.println("ERR: No s'ha trobat el segon ':'");
        }
        
    }
    // ── Expressions ──────────────────────────────────────────────────────────
    else if (cmd.startsWith("EXP:")) {
        String exp = cmd.substring(4);
        if      (exp == "SORPRESA") expressioSorpresa();
        else if (exp == "ENFADAT")  expressioEnfadat();
        else if (exp == "NEUTRAL")  expressioNeutral();
    }
    // ── Coll ──────────────────────────────────────────────────────────────────
    else if (cmd.startsWith("COLL:SUP:")) {
        int angle = cmd.substring(9).toInt();
        movimentCollSup(angle);
    }
    else if (cmd.startsWith("COLL:GIR:")) {
        int angle = cmd.substring(9).toInt();
        movimentCollGir(angle);
    }

    // ── Medicació ─────────────────────────────────────────────────────────────
    else if (cmd == "REC_MED1")    iniciarMedRec1();
    else if (cmd == "REC_MED2")    iniciarMedRec2();
    else if (cmd == "CERCLE_MED1") iniciarMedCercle1();
    else if (cmd == "CERCLE_MED2") iniciarMedCercle2();

    // ── Heartbeat explícit ────────────────────────────────────────────────────
    else if (cmd == "HEARTBEAT") {
        Serial.println("HB:OK");
    }

    // ── Reset encoders ────────────────────────────────────────────────────────
    else if (cmd == "RESET_ENC") {
        resetEncoder(0);
        resetEncoder(1);
        Serial.println("ENC:RESET");
    }

    // ── Comanda desconeguda ───────────────────────────────────────────────────
    else {
        Serial.print("ERR:CMD_UNKNOWN:");
        Serial.println(cmd);
    }
} 

// ═══════════════════════════════════════════════════════════════════════════════
//  2. VERIFICAR HEARTBEAT
//  Si la Raspberry no envia res en HEARTBEAT_TIMEOUT_MS ms → mode segur.
//  En mode segur: motors aturats. Servos i sensors continuen funcionant.
// ═══════════════════════════════════════════════════════════════════════════════

void verificarHeartbeat() {
    bool timeout = (millis() - ultim_heartbeat) > HEARTBEAT_TIMEOUT_MS;

    if (timeout && !mode_segur) {
        // Entrem en mode segur
        mode_segur = true;
        pararMotorEmergencia(motor1);
        pararMotorEmergencia(motor2);
        Serial.println("ERR:HEARTBEAT_TIMEOUT");
    }
    else if (!timeout && mode_segur) {
        // La RPi ha tornat → sortim del mode segur
        mode_segur = false;
        Serial.println("INFO:HEARTBEAT_RESTORED");
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  3. ACTUALITZAR SENSORS
//  Crida el tick asíncron de cada ultraso.
//  Si es detecta obstacle → atura els motors immediatament.
// ═══════════════════════════════════════════════════════════════════════════════

void actualitzarSensors() {
    actualitzarUltraso(ultraso1);
    actualitzarUltraso(ultraso2);
    actualitzarUltraso(ultraso3);

    // Reflex local de seguretat: independent de la RPi
    // Si qualsevol sensor frontal detecta obstacle prop → atura i avisa
    bool obstacle = deteccioObjecte(ultraso1, DISTANCIA_SEGURETAT_CM)
                 || deteccioObjecte(ultraso2, DISTANCIA_SEGURETAT_CM)
                 || deteccioObjecte(ultraso3, DISTANCIA_SEGURETAT_CM);

    if (obstacle && !motorAturat(motor1)) {
        // Aturem els motors però NO posem mode_segur
        // (la RPi pot ordenar enrere per esquivar)
        pararMotor(motor1);
        pararMotor(motor2);
        Serial.println("WARN:OBSTACLE");
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  4. ACTUALITZAR MOTORS
//  Aplica el ramp suau cap a vel_objectiu a cada iteració.
//  En mode segur: els motors ja estan aturats i es rebutgen noves ordres.
// ═══════════════════════════════════════════════════════════════════════════════

void actualitzarMotors() {
    if (mode_segur) {
        // Assegurem que estiguin aturats (pot ser que hagin rebut una ordre
        // just abans que saltés el timeout)
        pararMotorEmergencia(motor1);
        pararMotorEmergencia(motor2);
        return;
    }

    actualitzarMotor(motor1);
    actualitzarMotor(motor2);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  5. ACTUALITZAR MEDICACIÓ
//  Delegat a control_servo_conjunt. Aquí gestionem la notificació de fi.
// ═══════════════════════════════════════════════════════════════════════════════

// (La funció actualitzarMedicacio() del .cpp avança les màquines d'estats)
// Aquí detectem quan una seqüència acaba per notificar la RPi.

static bool medicacio_activa_anterior = false;

// Sobreescrivim la crida per afegir notificació
// (en C++ Arduino no hi ha hooks, fem-ho aquí directament)
// La funció real s'anomena des del loop() de dalt.

// ── Nota: actualitzarMedicacio() ja es crida directament des del loop().
//    La notificació de fi es fa a enviarTelemetria() comprovant medicacioEnCurs().

// ═══════════════════════════════════════════════════════════════════════════════
//  6. ENVIAR TELEMETRIA
//  Format: clau:valor, una línia per paquet.
//  Freqüència: cada TELEMETRIA_INTERVAL_MS ms.
//
//  Missatges:
//    DIST1:12.50   → distància sensor 1 en cm (-1 si timeout)
//    DIST2:34.20
//    DIST3:8.70
//    ENC0:1234     → ticks encoder motor 1
//    ENC1:-567     → ticks encoder motor 2
//    MODE:SEGUR    → si estem en mode segur
//    MODE:OK       → si estem en mode normal
//    MED:OK        → quan una seqüència de medicació acaba
// ═══════════════════════════════════════════════════════════════════════════════

void enviarTelemetria() {
    unsigned long ara = millis();
    if (ara - ultim_telemetria < TELEMETRIA_INTERVAL_MS) return;
    ultim_telemetria = ara;

    // ── Distàncies ────────────────────────────────────────────────────────────
    Serial.print("DIST1:"); Serial.println(getDistancia(ultraso1), 2);
    Serial.print("DIST2:"); Serial.println(getDistancia(ultraso2), 2);
    Serial.print("DIST3:"); Serial.println(getDistancia(ultraso3), 2);

    // ── Encoders ──────────────────────────────────────────────────────────────
    Serial.print("ENC0:"); Serial.println(getEncoderCount(0));
    Serial.print("ENC1:"); Serial.println(getEncoderCount(1));

    // ── Mode del sistema ──────────────────────────────────────────────────────
    Serial.println(mode_segur ? "MODE:SEGUR" : "MODE:OK");

    // ── Notificació de fi de medicació ────────────────────────────────────────
    bool med_activa = medicacioEnCurs();
    if (medicacio_activa_anterior && !med_activa) {
        Serial.println("MED:OK");
    }
    medicacio_activa_anterior = med_activa;
}
