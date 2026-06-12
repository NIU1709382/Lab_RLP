// ═══════════════════════════════════════════════════════════════════════════════
//  Care-E · Capa 1 (Arduino) — L'Executiu (MAIN COMPLET)
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
#include <FastLED.h> // Llibreria de LEDs

// ══════════════════════════════════════════════════════════════════════
// ── CONFIGURACIÓ LEDS ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
#define PIN_NEOPIXEL 11
#define NUM_LEDS     45
#define BRIGHTNESS   50 // Límita la brillantor per seguretat (0-255)

CRGB leds[NUM_LEDS];

// ══════════════════════════════════════════════════════════════════════
// ── ESTRUCTURA D'ESTATS D'ÀNIM I LEDS ─────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
struct EstatAnim {
    const char* nom;
    int cella_d;   // CH 0
    int cella_e;   // CH 1
    int ull_d;     // CH 2  (-1 = DINÀMIC)
    int ull_e;     // CH 3  (-1 = DINÀMIC)
    int coll_sup;  // CH 6
    int coll_inf;  // CH 7
    int coll_gir;  // CH 8  (-1 = DINÀMIC)
    int color_id;  // ID per seleccionar color/efecte
};

// IDs de color i efecte per llegibilitat
#define LED_OFF       0
#define LED_CIAN      1
#define LED_DARK_BLUE 2
#define LED_YELLOW    3
#define LED_LILA      4
#define LED_BLUE      5
#define LED_RED       6
#define LED_GREEN     7

static const EstatAnim ESTATS[] = {
    //  nom                CelD   CelE  UllD  UllE  CollSup CollInf CollGir   ColorID
    { "BASE/NEUTRAL",      122,   45,   30,   25,   140,     0,    75,      LED_CIAN },
    { "TRIST",             122,   45,    0,   50,   100,     0,    75,      LED_DARK_BLUE },
    { "CONTENT",            45,  120,   30,   25,   140,     0,    75,      LED_YELLOW },
    { "BUSCANT",            45,  120,   15,   37,   120,     0,    -1,      LED_LILA },
    { "ESCOLTANT",         122,   45,   30,   25,   130,    35,    75,      LED_BLUE },
    { "PENSANT",            45,  120,   -1,   -1,   140,     0,    75,      LED_CIAN }, // Els ulls seran dinàmics en python
    { "ESPANTAT",           45,  120,   30,   25,    60,    70,    75,      LED_RED },
};
static const int NUM_ESTATS = (int)(sizeof(ESTATS) / sizeof(ESTATS[0]));

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

// Límits celles
#define CELLA_DRET_OBRIR   0
#define CELLA_DRET_TANCAR  80
#define CELLA_ESQ_OBRIR    80
#define CELLA_ESQ_TANCAR   0

// Límits ulls
#define ULL_DRET_BAIXAR    0
#define ULL_DRET_PUJAR     30
#define ULL_ESQ_BAIXAR     50
#define ULL_ESQ_PUJAR      25

// Límits medicació 1
#define MED1_RECT_DISPENSAR   60
#define MED1_CERCLE_DISPENSAR 120
#define MED1_RECT_RECOLLIR    145
#define MED1_CERCLE_RECOLLIR  35

// Límits medicació 2
#define MED2_RECT_DISPENSAR   50
#define MED2_CERCLE_DISPENSAR 110
#define MED2_RECT_RECOLLIR    135
#define MED2_CERCLE_RECOLLIR  25

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

int estat_led_actual = LED_OFF; // Variable per rastrejar quin efecte LED fer anar

// ── Prototips ─────────────────────────────────────────────────────────────────
void llegirComanda();
void processarComanda(const String &cmd);
void verificarHeartbeat();
void actualitzarSensors();
void actualitzarMotors();
void enviarTelemetria();
void actualitzarLedsAsincron();
void aplicarEstatFacial(int index_estat);

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
    
    // Leds
    FastLED.addLeds<WS2812B, PIN_NEOPIXEL, GRB>(leds, NUM_LEDS);
    FastLED.setBrightness(BRIGHTNESS);
    fill_solid(leds, NUM_LEDS, CRGB::Black);
    FastLED.show();

    // Iniciar a NEUTRAL
    aplicarEstatFacial(0); // Index 0 es BASE/NEUTRAL

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
    verificarHeartbeat();    // 2. Comprovar si la RPi segueix viva
    actualitzarSensors();    // 3. Tick dels ultrasons asíncrons
    actualitzarMotors();     // 4. Aplicar ramp i seguretat per obstacle
    actualitzarMedicacio();  // 5. Avançar màquines d'estats dels servos
    actualitzarLedsAsincron(); // 6. Actualitzar LEDs (animacions)
    enviarTelemetria();      // 7. Enviar dades cap a la RPi
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
//  Comandes amb args:   "ULLS:90:45", "CELLES:80:100", "VEL:150", "TRACK:..."
//  Medicació:           "REC_MED1", "REC_MED2", "CERCLE_MED1", "CERCLE_MED2"
//  Expressions:         "EXP:SORPRESA", "EXP:ENFADAT", "EXP:NEUTRAL", "ANIM:TRIST", etc.

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
    else if (cmd.startsWith("TRACK:")) {
        // Seguiment continu RPi: "TRACK:AngleCollGir:AngleCollSup:VelMotor1:VelMotor2"
        int sep1 = cmd.indexOf(':', 6);
        int sep2 = cmd.indexOf(':', sep1 + 1);
        int sep3 = cmd.indexOf(':', sep2 + 1);
        
        if (sep1 > 0 && sep2 > 0 && sep3 > 0) {
            int coll_gir = cmd.substring(6, sep1).toInt();
            int coll_sup = cmd.substring(sep1 + 1, sep2).toInt();
            int vel_m1   = cmd.substring(sep2 + 1, sep3).toInt();
            int vel_m2   = cmd.substring(sep3 + 1).toInt();
            
            movimentCollGir(coll_gir);
            movimentCollSup(coll_sup);
            
            if (!mode_segur) {
                if (vel_m1 >= 0) motorEndavant(motor1, vel_m1);
                else             motorEnrere(motor1, abs(vel_m1));
                
                if (vel_m2 >= 0) motorEndavant(motor2, vel_m2);
                else             motorEnrere(motor2, abs(vel_m2));
            }
        }
    }

    // ── Servos facials (Ordres directes) ───────────────────────────────────────
    else if (cmd.startsWith("ULLS:")) {
        int sep = cmd.indexOf(':', 5);
        if (sep > 0) {
            int dret = cmd.substring(5, sep).toInt();
            int esq  = cmd.substring(sep + 1).toInt();
            movimentUlls(dret, esq);
            Serial.println("OK:ULLS_MOGUTS");
        } else {
            Serial.println("ERR: No s'ha trobat el segon ':'");
        }
    }
    
    // ── Expressions i Estats ──────────────────────────────────────────────────
    else if (cmd.startsWith("EXP:")) {
        String exp = cmd.substring(4);
        if      (exp == "SORPRESA") expressioSorpresa(); // Assumint q estan a control_servo_conjunt.h
        else if (exp == "ENFADAT")  expressioEnfadat();
        else if (exp == "NEUTRAL")  expressioNeutral();
    }
    else if (cmd.startsWith("ANIM:")) {
        String anim = cmd.substring(5);
        for(int i = 0; i < NUM_ESTATS; i++){
            // Converteix "BASE/NEUTRAL" a "BASE_NEUTRAL" per compatibilitat o simplement busca
            String estat_nom = String(ESTATS[i].nom);
            estat_nom.replace("/", "_");
            
            if(anim == estat_nom || anim == String(ESTATS[i].nom)) {
                aplicarEstatFacial(i);
                Serial.print("OK:ANIM_SET:"); Serial.println(anim);
                break;
            }
        }
    }
    
    // ── Leds directes ─────────────────────────────────────────────────────────
    else if (cmd.startsWith("LED:")) {
         String accio = cmd.substring(4);
         if (accio == "OFF") estat_led_actual = LED_OFF;
         else if (accio == "VERMELL") estat_led_actual = LED_RED;
         else if (accio == "VERD") estat_led_actual = LED_GREEN;
         else if (accio == "BLAU") estat_led_actual = LED_BLUE;
         else if (accio == "CIAN") estat_led_actual = LED_CIAN;
         else if (accio == "GROC") estat_led_actual = LED_YELLOW;
    }

    // ── Coll (Ordres directes) ────────────────────────────────────────────────
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

// ── Funció d'ajut per Estats ──────────────────────────────────────────────────
void aplicarEstatFacial(int index_estat) {
    if(index_estat < 0 || index_estat >= NUM_ESTATS) return;
    
    const EstatAnim &e = ESTATS[index_estat];
    
    estat_led_actual = e.color_id;

    // Els DINAMIC (-1) seran ignorats aquí, RPi ho controlarà via ULLS:/COLL:
    if (e.ull_d >= 0) moureServo(CH_ULL_DRET, e.ull_d);
    if (e.ull_e >= 0) moureServo(CH_ULL_ESQ,  e.ull_e);
    
    moureServo(CH_COLL_SUP, e.coll_sup);
    if (e.coll_gir >= 0) moureServo(CH_COLL_GIR, e.coll_gir);

    moureServo(CH_CELLA_DRET, e.cella_d);
    moureServo(CH_CELLA_ESQ,  e.cella_e);
    moureServo(CH_COLL_INF,   e.coll_inf);
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
        estat_led_actual = LED_RED; // Alarma visual
        Serial.println("ERR:HEARTBEAT_TIMEOUT");
    }
    else if (!timeout && mode_segur) {
        // La RPi ha tornat → sortim del mode segur
        mode_segur = false;
        estat_led_actual = LED_CIAN; // Torna a normal
        Serial.println("INFO:HEARTBEAT_RESTORED");
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  3. ACTUALITZAR SENSORS
//  Crida el tick asíncron de cada ultraso.
//  Si es detecta obstacle → atura els motors immediatament.
// ═══════════════════════════════════════════════════════════════════════════════

void actualitzarSensors() {
    // Escombrat seqüencial ràpid asíncron per evitar crosstalk real (adaptació per a loop continu)
    static int sensor_index = 0;
    static unsigned long ultim_canvi_sensor = 0;
    
    unsigned long ara = millis();
    
    // Donem 20ms a cada sensor asíncronament
    if(ara - ultim_canvi_sensor > 20) {
        sensor_index = (sensor_index + 1) % 3;
        ultim_canvi_sensor = ara;
    }
    
    if(sensor_index == 0) actualitzarUltraso(ultraso1);
    if(sensor_index == 1) actualitzarUltraso(ultraso2);
    if(sensor_index == 2) actualitzarUltraso(ultraso3);

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
//  6. ACTUALITZAR LEDS (Animacions asíncrones)
// ═══════════════════════════════════════════════════════════════════════════════

void actualitzarLedsAsincron() {
    static unsigned long ultim_actualitzacio = 0;
    static uint8_t index_animacio = 0;
    unsigned long ara = millis();

    // Només actualitzem cada 30ms (uns 30 frames per segon)
    if (ara - ultim_actualitzacio < 30) return;
    ultim_actualitzacio = ara;
    index_animacio++;

    switch (estat_led_actual) {
        case LED_OFF:
            fill_solid(leds, NUM_LEDS, CRGB::Black);
            break;
            
        case LED_CIAN:
            fill_solid(leds, NUM_LEDS, CRGB(0, 255, 255));
            break;
            
        case LED_DARK_BLUE:
            fill_solid(leds, NUM_LEDS, CRGB(0, 0, 100)); // Blau fosc, trist
            break;
            
        case LED_YELLOW:
            fill_solid(leds, NUM_LEDS, CRGB(255, 200, 0)); // Content
            break;
            
        case LED_LILA: // Efecte BUSCANT (Polsació)
        {
            // Utilitza onades sinusoïdals basades en el temps per fer polsació natural
            uint8_t bri = beatsin8(40, 20, 150); // Batega 40 cops/minut entre brillor 20 i 150
            fill_solid(leds, NUM_LEDS, CHSV(190, 255, bri)); // 190 és lila/morat a l'escala HSV
            break;
        }
            
        case LED_BLUE:
            fill_solid(leds, NUM_LEDS, CRGB::Blue);
            break;
            
        case LED_RED: // Efecte ESPANTAT (Parpelleig ràpid)
        {
            if (index_animacio % 8 < 4) {
                fill_solid(leds, NUM_LEDS, CRGB::Red);
            } else {
                fill_solid(leds, NUM_LEDS, CRGB::Black);
            }
            break;
        }
        case LED_GREEN:
             fill_solid(leds, NUM_LEDS, CRGB::Green);
             break;
    }
    
    FastLED.show();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  7. ENVIAR TELEMETRIA
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
    static bool medicacio_activa_anterior = false;
    bool med_activa = medicacioEnCurs();
    if (medicacio_activa_anterior && !med_activa) {
        Serial.println("MED:OK");
    }
    medicacio_activa_anterior = med_activa;
}