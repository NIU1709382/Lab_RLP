// ═══════════════════════════════════════════════════════════════════════════════
//  Care-E · Capa 1 (Arduino) — L'Executiu (MAIN COMPLET)
//
//  Arquitectura de tres capes:
//    Núvol ← Raspberry Pi ←→ [Serial] ←→ Arduino ← Sensors/Motors
//
//  Aquest fitxer orquestra el loop() principal. Mai utilitza delay().
//  Tota la lògica de temps va amb millis() i màquines d'estat asíncrones.
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
    { "BASE/NEUTRAL",      122,   45,   30,   25,   140,     20,    75,      LED_CIAN },
    { "TRIST",             122,   45,    0,   50,   100,      0,    75,      LED_DARK_BLUE },
    { "CONTENT",            45,  120,   30,   25,   140,      0,    75,      LED_YELLOW },
    { "BUSCANT",            45,  120,   15,   37,   120,      0,    -1,      LED_LILA },
    { "ESCOLTANT",         122,   45,   30,   25,   130,     35,    75,      LED_BLUE },
    { "PENSANT",            45,  120,   -1,   -1,   140,      0,    75,      LED_CIAN }, 
    { "ESPANTAT",           45,  120,   30,   25,    60,     70,    75,      LED_RED },
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

// ── CALIBRATGE ACTUALITZAT (SERVOS) ───────────────────────────────────────────

// Límits celles
#define CELLA_DRET_OBRIR   45
#define CELLA_DRET_TANCAR  122
#define CELLA_ESQ_OBRIR    120
#define CELLA_ESQ_TANCAR   45

// Límits ulls
#define ULL_DRET_BAIXAR    0
#define ULL_DRET_PUJAR     30
#define ULL_ESQ_BAIXAR     50
#define ULL_ESQ_PUJAR      25

// Límits coll
#define COLL_GIR_ESQUERRA  30
#define COLL_GIR_DRETA     120
#define COLL_GIR_CENTRE    75
#define COLL_SUP_BAIXAR    60
#define COLL_SUP_PUJAR     140
#define COLL_INF_BAIXAR    0
#define COLL_INF_PUJAR     70

// Límits medicació 1 (CH_MED_1)
#define MED1_RECT_DISPENSAR   43
#define MED1_CERCLE_DISPENSAR 103
#define MED1_RECT_RECOLLIR    128
#define MED1_CERCLE_RECOLLIR  18

// Límits medicació 2 (CH_MED_2)
#define MED2_RECT_DISPENSAR   48
#define MED2_CERCLE_DISPENSAR 105
#define MED2_RECT_RECOLLIR    133
#define MED2_CERCLE_RECOLLIR  20

// ── Paràmetres físics per moure per distància ─────────────────────────────────
#define TICKS_PER_VOLTA   340.0f  // [CAL AJUSTAR] Ticks d'encoder per volta completa del motor
#define DIAMETRE_RODA_CM  10.0f   // [CAL AJUSTAR] Diàmetre de l'eruga/roda en cm
const float TICKS_PER_CM = TICKS_PER_VOLTA / (PI * DIAMETRE_RODA_CM);

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

// Variables d'animació i llums
int estat_led_actual = LED_OFF; 
int estat_anim_actual = 0;             // Índex de l'estat d'ànim actiu
unsigned long inici_estat_anim = 0;    // Moment en què s'ha canviat d'estat

// Variables estat de moviment per distància
bool movent_per_distancia = false;
long target_enc_0 = 0;
long target_enc_1 = 0;

// ── Prototips ─────────────────────────────────────────────────────────────────
void llegirComanda();
void processarComanda(const String &cmd);
void verificarHeartbeat();
void actualitzarSensors();
void actualitzarMotors();
void enviarTelemetria();
void actualitzarLedsAsincron();
void aplicarEstatFacial(int index_estat);
void actualitzarAnimacionsDinamiques();
void iniciarMovimentDistancia(float dist_cm, int velocitat);
void actualitzarMovimentDistancia();

// ═══════════════════════════════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════════════════════════════

void setup() {
    Serial.begin(SERIAL_BAUD);

    // Motors
    motor1 = inicialitzarMotor(RPWM1, LPWM1, 8);
    motor2 = inicialitzarMotor(RPWM2, LPWM2, 8);

    // Ultrasons
    inicialitzarUltraso(ultraso1, PIN_TRIG1, PIN_ECHO1);
    inicialitzarUltraso(ultraso2, PIN_TRIG2, PIN_ECHO2);
    inicialitzarUltraso(ultraso3, PIN_TRIG3, PIN_ECHO3);

    // Encoders
    inicialitzarEncoder(ENCODER_A1, ENCODER_B1, 0);
    inicialitzarEncoder(ENCODER_A2, ENCODER_B2, 1);

    // Servos
    inicialitzarServos();
    
    // Leds
    FastLED.addLeds<WS2812B, PIN_NEOPIXEL, GRB>(leds, NUM_LEDS);
    FastLED.setBrightness(BRIGHTNESS);
    fill_solid(leds, NUM_LEDS, CRGB::Black);
    FastLED.show();

    // Iniciar a NEUTRAL
    aplicarEstatFacial(0); 

    ultim_heartbeat = millis();
    Serial.println("READY");
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LOOP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

void loop() {
    llegirComanda();               // 1. Llegir i processar Serial (no bloqueja)
    //verificarHeartbeat();        // 2. Comprovar si la RPi segueix viva (descomentar per prod)
    //actualitzarSensors();        // 3. Tick dels ultrasons asíncrons
    actualitzarMovimentDistancia();// 4. Comprova si hem arribat a la distància
    actualitzarMotors();           // 5. Aplicar ramp i seguretat per obstacle
    actualitzarMedicacio();        // 6. Avançar màquines d'estats dels servos (si n'hi ha actius)
    actualitzarAnimacionsDinamiques(); // 7. Moviments orgànics dels estats (ulls/coll)
    actualitzarLedsAsincron();     // 8. Actualitzar LEDs (animacions)
    enviarTelemetria();            // 9. Enviar dades cap a la RPi
}

// ═══════════════════════════════════════════════════════════════════════════════
//  1. LLEGIR I PROCESSAR COMANDES
// ═══════════════════════════════════════════════════════════════════════════════

void llegirComanda() {
    static unsigned long ultim_caracter_rebut = 0;
    
    while (Serial.available()) {
        char c = Serial.read();
        ultim_caracter_rebut = millis();
        
        if (c == '\n' || c == '\r') {
            buffer_serial.trim();
            if (buffer_serial.length() > 0) {
                processarComanda(buffer_serial);
                buffer_serial = "";
            }
        } 
        else if (buffer_serial.length() < 64) {
            buffer_serial += c;
        }
    }
    
    if (buffer_serial.length() > 0 && (millis() - ultim_caracter_rebut > 50)) {
        buffer_serial.trim();
        processarComanda(buffer_serial);
        buffer_serial = "";
    }
}

void processarComanda(const String &cmd) {
    ultim_heartbeat = millis();

    if (cmd.startsWith("ENDAVANT") || cmd.startsWith("ENRERE") || cmd == "PARAR" || cmd.startsWith("GIRARD") || cmd.startsWith("GIRARE") || cmd.startsWith("TRACK:")) {
        movent_per_distancia = false; 
    }

    if (cmd.startsWith("ENDAVANT")) {
        int vel = VEL_MOTORS_DEFAULT;
        int sep = cmd.indexOf(':');
        if (sep > 0) vel = cmd.substring(sep + 1).toInt();
        
        vel = constrain(vel, 0, 255);
        if (!mode_segur) {
            motorEnrere(motor1, vel);
            motorEndavant(motor2, vel);
        }
    }
    else if (cmd.startsWith("ENRERE")) {
        int vel = VEL_MOTORS_DEFAULT;
        int sep = cmd.indexOf(':');
        if (sep > 0) vel = cmd.substring(sep + 1).toInt();
        
        vel = constrain(vel, 0, 255);
        motorEndavant(motor1, vel);
        motorEnrere(motor2, vel);
    }
    else if (cmd == "PARAR") {
        pararMotor(motor1);
        pararMotor(motor2);
    }
    else if (cmd.startsWith("GIRARD")) {
        int vel = VEL_MOTORS_DEFAULT;
        int sep = cmd.indexOf(':');
        if (sep > 0) vel = cmd.substring(sep + 1).toInt();
        
        vel = constrain(vel, 0, 255);
        motorEnrere(motor1, vel);
        motorEnrere(motor2, vel);
    }
    else if (cmd.startsWith("GIRARE")) {
        int vel = VEL_MOTORS_DEFAULT;
        int sep = cmd.indexOf(':');
        if (sep > 0) vel = cmd.substring(sep + 1).toInt();
        
        vel = constrain(vel, 0, 255);
        motorEndavant(motor1, vel);
        motorEndavant(motor2, vel);
    }
    else if (cmd.startsWith("MOVE_DIST:")) {
        int sep = cmd.indexOf(':', 10);
        if (sep > 0) {
            float dist_cm = cmd.substring(10, sep).toFloat();
            int vel = cmd.substring(sep + 1).toInt();
            iniciarMovimentDistancia(dist_cm, vel);
            Serial.println("OK:MOVE_DIST_STARTED");
        }
    }
    else if (cmd.startsWith("TRACK:")) {
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
    
    // ── Expressions i Estats Unificats ───────────────────────────────────────
    else if (cmd.startsWith("EXP:")) {
        String exp = cmd.substring(4);
        bool trobat = false;

        // 1. Cercar als estats dinàmics
        for(int i = 0; i < NUM_ESTATS; i++){
            String estat_nom = String(ESTATS[i].nom);
            estat_nom.replace("/", "_"); 
            
            if(exp == estat_nom || exp == String(ESTATS[i].nom)) {
                aplicarEstatFacial(i);
                Serial.print("OK:EXP_SET:"); Serial.println(exp);
                trobat = true;
                break;
            }
        }

        // 2. Fallback per funcions manuals antigues
        if (!trobat) {
            if      (exp == "SORPRESA") { expressioSorpresa(); Serial.println("OK:EXP_SET:SORPRESA"); }
            else if (exp == "ENFADAT")  { expressioEnfadat();  Serial.println("OK:EXP_SET:ENFADAT"); }
            else if (exp == "NEUTRAL")  { aplicarEstatFacial(0); Serial.println("OK:EXP_SET:NEUTRAL"); }
            else {
                Serial.print("ERR:EXP_UNKNOWN:"); 
                Serial.println(exp);
            }
        }
    }
    
    // ── Leds i Coll Directe ─────────────────────────────────────────────────
    else if (cmd.startsWith("LED:")) {
         String accio = cmd.substring(4);
         if (accio == "OFF") estat_led_actual = LED_OFF;
         else if (accio == "VERMELL") estat_led_actual = LED_RED;
         else if (accio == "VERD") estat_led_actual = LED_GREEN;
         else if (accio == "BLAU") estat_led_actual = LED_BLUE;
         else if (accio == "CIAN") estat_led_actual = LED_CIAN;
         else if (accio == "GROC") estat_led_actual = LED_YELLOW;
    }
    else if (cmd.startsWith("COLL:SUP:")) {
        int angle = cmd.substring(9).toInt();
        movimentCollSup(angle);
    }
    else if (cmd.startsWith("COLL:GIR:")) {
        int angle = cmd.substring(9).toInt();
        movimentCollGir(angle);
    }
    else if (cmd.startsWith("COLL:INF:")) {
        int angle = cmd.substring(9).toInt();
        moureServo(CH_COLL_INF, angle);
    }

    // ── Dispenses de Medicació Explícites ───────────────────────────────────
    else if (cmd == "DISP_RECT1")  moureServo(CH_MED_1, MED1_RECT_DISPENSAR);
    else if (cmd == "REC_RECT1")   moureServo(CH_MED_1, MED1_RECT_RECOLLIR);
    else if (cmd == "DISP_CERC1")  moureServo(CH_MED_1, MED1_CERCLE_DISPENSAR);
    else if (cmd == "REC_CERC1")   moureServo(CH_MED_1, MED1_CERCLE_RECOLLIR);

    else if (cmd == "DISP_RECT2")  moureServo(CH_MED_2, MED2_RECT_DISPENSAR);
    else if (cmd == "REC_RECT2")   moureServo(CH_MED_2, MED2_RECT_RECOLLIR);
    else if (cmd == "DISP_CERC2")  moureServo(CH_MED_2, MED2_CERCLE_DISPENSAR);
    else if (cmd == "REC_CERC2")   moureServo(CH_MED_2, MED2_CERCLE_RECOLLIR);


    else if (cmd == "DISP4") {
        moureServo(CH_MED_2, MED2_CERCLE_RECOLLIR);
        moureServo(CH_MED_2, MED2_CERCLE_DISPENSAR);
    }
    
    // Fallback per les màquines d'estats antigues (si n'hi havia d'actuants)
    else if (cmd == "AUTO_REC1")   iniciarMedRec1();
    else if (cmd == "AUTO_REC2")   iniciarMedRec2();
    // ────────────────────────────────────────────────────────────────────────
    
    else if (cmd == "HEARTBEAT") {
        Serial.println("HB:OK");
    }
    else if (cmd == "RESET_ENC") {
        resetEncoder(0);
        resetEncoder(1);
        Serial.println("ENC:RESET");
    }
    else {
        Serial.print("ERR:CMD_UNKNOWN:");
        Serial.println(cmd);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MOVIMENT PER DISTÀNCIA
// ═══════════════════════════════════════════════════════════════════════════════

void iniciarMovimentDistancia(float dist_cm, int velocitat) {
    if (mode_segur) return;
    
    long ticks_a_moure = dist_cm * TICKS_PER_CM;
    long actual_0 = getEncoderCount(0);
    long actual_1 = getEncoderCount(1);
    
    target_enc_0 = actual_0 + ticks_a_moure;
    target_enc_1 = actual_1 + ticks_a_moure; 
    
    movent_per_distancia = true;
    velocitat = abs(velocitat); 
    velocitat = constrain(velocitat, 0, 255);
    
    if (dist_cm > 0) {
        motorEndavant(motor1, velocitat);
        motorEndavant(motor2, velocitat);
    } else {
        motorEnrere(motor1, velocitat);
        motorEnrere(motor2, velocitat);
    }
}

void actualitzarMovimentDistancia() {
    if (!movent_per_distancia) return;
    
    if (mode_segur) {
        movent_per_distancia = false;
        return;
    }
    
    long actual_0 = getEncoderCount(0);
    long actual_1 = getEncoderCount(1);
    
    bool m0_fi = false;
    bool m1_fi = false;
    
    if (motor1.endavant && actual_0 >= target_enc_0) m0_fi = true;
    if (!motor1.endavant && actual_0 <= target_enc_0) m0_fi = true;
    
    if (motor2.endavant && actual_1 >= target_enc_1) m1_fi = true;
    if (!motor2.endavant && actual_1 <= target_enc_1) m1_fi = true;
    
    if (m0_fi) pararMotor(motor1);
    if (m1_fi) pararMotor(motor2);
    
    if (m0_fi && m1_fi) {
        movent_per_distancia = false;
        Serial.println("MOVE_DIST:OK");
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MÀQUINES D'ESTATS D'ANIMACIÓ I LEDS (SENSE DELAY)
// ═══════════════════════════════════════════════════════════════════════════════

// Estableix les posicions base i inicialitza els temporitzadors
void aplicarEstatFacial(int index_estat) {
    if(index_estat < 0 || index_estat >= NUM_ESTATS) return;
    
    estat_anim_actual = index_estat;
    inici_estat_anim = millis();
    
    const EstatAnim &e = ESTATS[index_estat];
    estat_led_actual = e.color_id;

    if (e.ull_d >= 0) moureServo(CH_ULL_DRET, e.ull_d);
    if (e.ull_e >= 0) moureServo(CH_ULL_ESQ,  e.ull_e);
    
    moureServo(CH_COLL_SUP, e.coll_sup);
    if (e.coll_gir >= 0) moureServo(CH_COLL_GIR, e.coll_gir);

    moureServo(CH_CELLA_DRET, e.cella_d);
    moureServo(CH_CELLA_ESQ,  e.cella_e);
    moureServo(CH_COLL_INF,   e.coll_inf);
}

// Actualitza els moviments de coll i ulls dinàmics a cada volta del loop()
void actualitzarAnimacionsDinamiques() {
    if (estat_anim_actual < 0 || estat_anim_actual >= NUM_ESTATS) return;
    
    const EstatAnim &e = ESTATS[estat_anim_actual];
    unsigned long temps_estat = millis() - inici_estat_anim;

    if (strcmp(e.nom, "PENSANT") == 0) {
        // Mou els ulls de dalt a baix de manera asíncrona cada 300ms
        int cicle = temps_estat / 300;
        bool fase_alta = (cicle % 2 == 0);
        moureServo(CH_ULL_DRET, fase_alta ? ULL_DRET_PUJAR : ULL_DRET_BAIXAR);
        moureServo(CH_ULL_ESQ,  fase_alta ? ULL_ESQ_PUJAR : ULL_ESQ_BAIXAR);
    }
    else if (strcmp(e.nom, "BUSCANT") == 0) {
        // El coll rota a les 3 posicions cada mig segon
        int cicle = (temps_estat / 500) % 4;
        if (cicle == 0) moureServo(CH_COLL_GIR, COLL_GIR_ESQUERRA);
        if (cicle == 1) moureServo(CH_COLL_GIR, COLL_GIR_CENTRE);
        if (cicle == 2) moureServo(CH_COLL_GIR, COLL_GIR_DRETA);
        if (cicle == 3) moureServo(CH_COLL_GIR, COLL_GIR_CENTRE);
    }
    else if (strcmp(e.nom, "TRIST") == 0) {
        // Simulació de respiració o sospir lent (Baixa el cap i el puja lentament cada cert temps)
        int cicle = (temps_estat / 1000) % 3;
        if (cicle == 0) moureServo(CH_COLL_SUP, e.coll_sup - 15);
        else moureServo(CH_COLL_SUP, e.coll_sup);
    }
    else if (strcmp(e.nom, "CONTENT") == 0) {
        // Petits bots d'emoció amb el cap
        int cicle = temps_estat % 2000; // Repeteix cada 2 segons
        if (cicle < 150) moureServo(CH_COLL_SUP, e.coll_sup - 20);
        else if (cicle < 300) moureServo(CH_COLL_SUP, e.coll_sup + 10);
        else moureServo(CH_COLL_SUP, e.coll_sup);
    }
}

// Controla tots els parpellejos i ones de color (Inclou el "rotating pixel" de PENSANT)
void actualitzarLedsAsincron() {
    static unsigned long ultim_actualitzacio = 0;
    static uint8_t index_animacio = 0;
    unsigned long ara = millis();

    if (ara - ultim_actualitzacio < 30) return;
    ultim_actualitzacio = ara;
    index_animacio++;

    switch (estat_led_actual) {
        case LED_OFF:       
            fill_solid(leds, NUM_LEDS, CRGB::Black); 
            break;
            
        case LED_CIAN:
            // Si l'estat és PENSANT, afegim l'efecte de "càrrega" / rotació
            if (estat_anim_actual >= 0 && strcmp(ESTATS[estat_anim_actual].nom, "PENSANT") == 0) {
                fill_solid(leds, NUM_LEDS, CRGB(0, 50, 50)); 
                int pos = (ara / 50) % NUM_LEDS; 
                leds[pos] = CRGB::Cyan;
            } else {
                fill_solid(leds, NUM_LEDS, CRGB(0, 255, 255));
            }
            break;
            
        case LED_DARK_BLUE: 
            fill_solid(leds, NUM_LEDS, CRGB(0, 0, 100)); 
            break;
            
        case LED_YELLOW:    
            fill_solid(leds, NUM_LEDS, CRGB(255, 200, 0)); 
            break;
            
        case LED_BLUE:      
            fill_solid(leds, NUM_LEDS, CRGB::Blue); 
            break;
            
        case LED_GREEN:     
            fill_solid(leds, NUM_LEDS, CRGB::Green); 
            break;
            
        case LED_LILA: {
            uint8_t bri = beatsin8(40, 20, 150); 
            fill_solid(leds, NUM_LEDS, CHSV(190, 255, bri)); 
            break;
        }
        
        case LED_RED: {
            if (index_animacio % 8 < 4) fill_solid(leds, NUM_LEDS, CRGB::Red);
            else                        fill_solid(leds, NUM_LEDS, CRGB::Black);
            break;
        }
    }
    FastLED.show();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GESTIÓ DE SEGURETAT I TELEMETRIA
// ═══════════════════════════════════════════════════════════════════════════════

void verificarHeartbeat() {
    bool timeout = (millis() - ultim_heartbeat) > HEARTBEAT_TIMEOUT_MS;

    if (timeout && !mode_segur) {
        mode_segur = true;
        movent_per_distancia = false;
        pararMotorEmergencia(motor1);
        pararMotorEmergencia(motor2);
        estat_led_actual = LED_RED; 
        Serial.println("ERR:HEARTBEAT_TIMEOUT");
    }
    else if (!timeout && mode_segur) {
        mode_segur = false;
        estat_led_actual = LED_CIAN; 
        Serial.println("INFO:HEARTBEAT_RESTORED");
    }
}

void actualitzarSensors() {
    static int sensor_index = 0;
    static unsigned long ultim_canvi_sensor = 0;
    
    unsigned long ara = millis();
    
    if(ara - ultim_canvi_sensor > 20) {
        sensor_index = (sensor_index + 1) % 3;
        ultim_canvi_sensor = ara;
    }
    
    if(sensor_index == 0) actualitzarUltraso(ultraso1);
    if(sensor_index == 1) actualitzarUltraso(ultraso2);
    if(sensor_index == 2) actualitzarUltraso(ultraso3);

    bool obstacle = deteccioObjecte(ultraso1, DISTANCIA_SEGURETAT_CM)
                 || deteccioObjecte(ultraso2, DISTANCIA_SEGURETAT_CM)
                 || deteccioObjecte(ultraso3, DISTANCIA_SEGURETAT_CM);

    if (obstacle && (!motorAturat(motor1) || !motorAturat(motor2)) && motor1.endavant) {
        pararMotor(motor1);
        pararMotor(motor2);
        movent_per_distancia = false;
        Serial.println("WARN:OBSTACLE");
    }
}

void actualitzarMotors() {
    if (mode_segur) {
        pararMotorEmergencia(motor1);
        pararMotorEmergencia(motor2);
        return;
    }
    actualitzarMotor(motor1);
    actualitzarMotor(motor2);
}

void enviarTelemetria() {
    unsigned long ara = millis();
    if (ara - ultim_telemetria < TELEMETRIA_INTERVAL_MS) return;
    ultim_telemetria = ara;

    Serial.print("DIST1:"); Serial.println(getDistancia(ultraso1), 2);
    Serial.print("DIST2:"); Serial.println(getDistancia(ultraso2), 2);
    Serial.print("DIST3:"); Serial.println(getDistancia(ultraso3), 2);

    Serial.print("ENC0:"); Serial.println(getEncoderCount(0));
    Serial.print("ENC1:"); Serial.println(getEncoderCount(1));

    Serial.println(mode_segur ? "MODE:SEGUR" : "MODE:OK");

    static bool medicacio_activa_anterior = false;
    bool med_activa = medicacioEnCurs();
    if (medicacio_activa_anterior && !med_activa) {
        Serial.println("MED:OK");
    }
    medicacio_activa_anterior = med_activa;
}