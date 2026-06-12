#include "control_encoders.h"
#include "control_ultraso.h"
#include "control_motor.h"
#include "control_servo_conjunt.h"
#include "config.h"
#include <FastLED.h> // <-- Afegida llibreria de LEDs

// ══════════════════════════════════════════════════════════════════════
// ── CONFIGURACIÓ LEDS ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
#define PIN_NEOPIXEL 11
#define NUM_LEDS     45
#define BRIGHTNESS   50 // Límita la brillantor per seguretat (0-255)

CRGB leds[NUM_LEDS];

// ══════════════════════════════════════════════════════════════════════
// ── ESTRUCTURA D'ESTATS (Actualitzada amb LEDs) ───────────────────────
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
    { "PENSANT",            45,  120,   -1,   -1,   140,     0,    75,      LED_CIAN },
    { "ESPANTAT",           45,  120,   30,   25,    60,    70,    75,      LED_RED },
};
static const int NUM_ESTATS = (int)(sizeof(ESTATS) / sizeof(ESTATS[0]));

// ══════════════════════════════════════════════════════════════════════
// ── Pins Motors ───────────────────────────────────────────────────────
#define ENCODER_A1 3
#define ENCODER_B1 12
#define ENCODER_A2 2
#define ENCODER_B2 13

const int RPWM1 = 9;
const int LPWM1 = 10;
const int RPWM2 = 5;
const int LPWM2 = 6;

// ── Pins Ultrasons ────────────────────────────────────────────────────
const int PIN_ECHO1 = A1;
const int PIN_TRIG1 = A0;
const int PIN_ECHO2 = A3;
const int PIN_TRIG2 = A2;
const int PIN_ECHO3 = 7;
const int PIN_TRIG3 = 8;

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

// Límits coll
#define COLL_SUP_BAIXAR    80
#define COLL_SUP_PUJAR     120
#define COLL_INF_NEUTRAL   90   // Pendent de calibrar
#define COLL_GIR_ESQUERRA  30
#define COLL_GIR_DRETA     120
#define COLL_GIR_CENTRE    75

// ── Variables Globals ─────────────────────────────────────────────────
Motor motor1;
Motor motor2;

Ultraso ultraso1;
Ultraso ultraso2;
Ultraso ultraso3;

int mode = 0;
int estat_led_actual = LED_OFF; // Variable per rastrejar quin efecte LED fer anar

// ── Prototips ─────────────────────────────────────────────────────────
void mostrarMenu();
void testServosRapid();
void testServoManual();
void testCelles();
void testUlls();
void testColl();
void testMedicacio();
void testMotors();
void testUltrasons();
void testEncoders();
void testTotServos();
void testAnims();
void esperarIActualitzar(unsigned long temps_ms);
int  llegirIntSerial(const char* missatge);
void actualitzarLedsAsincron(); // Nou prototip

// ══════════════════════════════════════════════════════════════════════
void mostrarMenu() {
    Serial.println();
    Serial.println(F("╔══════════════════════════════╗"));
    Serial.println(F("║    CARE-E  TEST MENU         ║"));
    Serial.println(F("╠══════════════════════════════╣"));
    Serial.println(F("║ SERVOS                       ║"));
    Serial.println(F("║  1  - Servo manual (canal+a) ║"));
    Serial.println(F("║  2  - Test ràpid tots servos ║"));
    Serial.println(F("║  3  - Test celles            ║"));
    Serial.println(F("║  4  - Test ulls              ║"));
    Serial.println(F("║  5  - Test coll              ║"));
    Serial.println(F("║  6  - Test medicació         ║"));
    Serial.println(F("╠══════════════════════════════╣"));
    Serial.println(F("║ MOTORS                       ║"));
    Serial.println(F("║  7  - Test motors            ║"));
    Serial.println(F("╠══════════════════════════════╣"));
    Serial.println(F("║ SENSORS                      ║"));
    Serial.println(F("║  8  - Test ultrasons         ║"));
    Serial.println(F("║  9  - Test encoders          ║"));
    Serial.println(F("║ 10  - Test estats d'ànim     ║"));
    Serial.println(F("╠══════════════════════════════╣"));
    Serial.println(F("║  0  - PARAR / Menú           ║"));
    Serial.println(F("╚══════════════════════════════╝"));
}

// ══════════════════════════════════════════════════════════════════════
void setup() {
    Serial.begin(SERIAL_BAUD);

    inicialitzarUltraso(ultraso1, PIN_TRIG1, PIN_ECHO1);
    inicialitzarUltraso(ultraso2, PIN_TRIG2, PIN_ECHO2);
    inicialitzarUltraso(ultraso3, PIN_TRIG3, PIN_ECHO3);

    inicialitzarServos();

    motor1 = inicialitzarMotor(RPWM1, LPWM1, 5);
    motor2 = inicialitzarMotor(RPWM2, LPWM2, 5);

    inicialitzarEncoder(ENCODER_A1, ENCODER_B1, 0);
    inicialitzarEncoder(ENCODER_A2, ENCODER_B2, 1);

    // Inicialitzem LEDs
    FastLED.addLeds<WS2812B, PIN_NEOPIXEL, GRB>(leds, NUM_LEDS);
    FastLED.setBrightness(BRIGHTNESS);
    fill_solid(leds, NUM_LEDS, CRGB::Black);
    FastLED.show();

    Serial.println(F("Care-E Arduino — Sistema inicialitzat OK"));
    mostrarMenu();
}

// ══════════════════════════════════════════════════════════════════════
void loop() {
    if (Serial.available()) {
        String entrada = Serial.readStringUntil('\n');
        entrada.trim();
        mode = entrada.toInt();
        Serial.print(F(">> Mode: "));
        Serial.println(mode);
    }

    switch (mode) {
        case 1:  testServoManual();  break;
        case 2:  testTotServos();    break;
        case 3:  testCelles();       break;
        case 4:  testUlls();         break;
        case 5:  testColl();         break;
        case 6:  testMedicacio();    break;
        case 7:  testMotors();       break;
        case 8:  testUltrasons();    break;
        case 9:  testEncoders();     break;
        case 10: testAnims();        break;

        case 0:
            pararMotor(motor1);
            pararMotor(motor2);
            actualitzarMotor(motor1);
            actualitzarMotor(motor2);
            estat_led_actual = LED_OFF; // Apagar LEDs quan es para
            mostrarMenu();
            mode = -1;
            break;

        case -1:
            // Mode espera — mantenim els actuadors asíncrons vius
            actualitzarMedicacio();
            actualitzarMotor(motor1);
            actualitzarMotor(motor2);
            actualitzarUltraso(ultraso1);
            actualitzarUltraso(ultraso2);
            actualitzarUltraso(ultraso3);
            actualitzarLedsAsincron(); // Actualitza LEDs en stand-by
            break;

        default:
            Serial.println(F("Opció no reconeguda. Introdueix 0 per al menú."));
            mode = -1;
            break;
    }
}

// ══════════════════════════════════════════════════════════════════════
// ── Utilitats ─────────────────────────────────────────────────────────

void esperarIActualitzar(unsigned long temps_ms) {
    unsigned long inici = millis();
    while (millis() - inici < temps_ms) {
        actualitzarMotor(motor1);
        actualitzarMotor(motor2);
        actualitzarUltraso(ultraso1);
        actualitzarUltraso(ultraso2);
        actualitzarUltraso(ultraso3);
        actualitzarMedicacio();
        actualitzarLedsAsincron(); // Actualitzem la llum durant les esperes
        delay(5);
    }
}

// Bloqueja fins que arriba un enter per Serial i el retorna
int llegirIntSerial(const char* missatge) {
    while (Serial.available()) Serial.read(); // Buidar buffer
    Serial.println(missatge);
    while (Serial.available() == 0) {
        esperarIActualitzar(10);
    }
    return Serial.readStringUntil('\n').toInt();
}

// ══════════════════════════════════════════════════════════════════════
// ── 1. Test Servo Manual ──────────────────────────────────────────────
void testServoManual() {
    Serial.println(F("\n--- TEST SERVO MANUAL ---"));
    Serial.println(F("Canals disponibles:"));
    Serial.println(F("  0: Cella dreta  (obrir:0  / tancar:80)"));
    Serial.println(F("  1: Cella esq    (obrir:80 / tancar:0)"));
    Serial.println(F("  2: Ull dret     (baixar:0 / pujar:30)"));
    Serial.println(F("  3: Ull esq      (baixar:50/ pujar:25)"));
    Serial.println(F("  4: Med 1        (rect disp:60, rec:145 | cir disp:120, rec:35)"));
    Serial.println(F("  5: Med 2        (rect disp:50, rec:135 | cir disp:110, rec:25)"));
    Serial.println(F("  6: Coll sup     (baixar:80 / pujar:120)"));
    Serial.println(F("  7: Coll inf     (pendent calibrar)"));
    Serial.println(F("  8: Coll gir     (esq:30 / centre:75 / dreta:120)"));

    int canal = llegirIntSerial("Canal (0-15):");
    int angle = llegirIntSerial("Angle (0-180):");

    Serial.print(F("-> Movent canal "));
    Serial.print(canal);
    Serial.print(F(" a "));
    Serial.print(angle);
    Serial.println(F("°"));

    moureServo(canal, angle);
    mode = -1;
    mostrarMenu();
}

// ══════════════════════════════════════════════════════════════════════
// ── 2. Test ràpid de tots els servos ──────────────────────────────────
void testTotServos() {
    Serial.println(F("\n--- TEST RÀPID TOTS ELS SERVOS ---"));

    struct { int canal; int pos_a; int pos_b; const char* nom; } servos[] = {
        { CH_CELLA_DRET, CELLA_DRET_TANCAR,   CELLA_DRET_OBRIR,    "Cella dreta"   },
        { CH_CELLA_ESQ,  CELLA_ESQ_TANCAR,    CELLA_ESQ_OBRIR,     "Cella esq"     },
        { CH_ULL_DRET,   ULL_DRET_BAIXAR,     ULL_DRET_PUJAR,      "Ull dret"      },
        { CH_ULL_ESQ,    ULL_ESQ_BAIXAR,      ULL_ESQ_PUJAR,       "Ull esq"       },
        { CH_COLL_SUP,   COLL_SUP_BAIXAR,     COLL_SUP_PUJAR,      "Coll superior" },
        { CH_COLL_GIR,   COLL_GIR_ESQUERRA,   COLL_GIR_DRETA,      "Coll gir"      },
    };

    int n = sizeof(servos) / sizeof(servos[0]);
    for (int i = 0; i < n; i++) {
        Serial.print(F("  -> "));
        Serial.print(servos[i].nom);
        Serial.print(F(": pos_a ("));
        Serial.print(servos[i].pos_a);
        Serial.println(F(")"));
        moureServo(servos[i].canal, servos[i].pos_a);
        esperarIActualitzar(700);

        Serial.print(F("  -> "));
        Serial.print(servos[i].nom);
        Serial.print(F(": pos_b ("));
        Serial.print(servos[i].pos_b);
        Serial.println(F(")"));
        moureServo(servos[i].canal, servos[i].pos_b);
        esperarIActualitzar(700);
    }

    Serial.println(F("Test completat. Tornant a posició neutra..."));
    moureServo(CH_CELLA_DRET, 90);
    moureServo(CH_CELLA_ESQ,  90);
    moureServo(CH_ULL_DRET,   90);
    moureServo(CH_ULL_ESQ,    90);
    moureServo(CH_COLL_SUP,   100);
    moureServo(CH_COLL_INF,   COLL_INF_NEUTRAL);
    moureServo(CH_COLL_GIR,   COLL_GIR_CENTRE);

    mode = -1;
    mostrarMenu();
}

// ══════════════════════════════════════════════════════════════════════
// ── 3. Test Celles ────────────────────────────────────────────────────
void testCelles() {
    Serial.println(F("\n--- TEST CELLES ---"));

    Serial.println(F("Obrint celles..."));
    moureServo(CH_CELLA_DRET, CELLA_DRET_OBRIR);
    moureServo(CH_CELLA_ESQ,  CELLA_ESQ_OBRIR);
    esperarIActualitzar(1000);

    Serial.println(F("Tancant celles..."));
    moureServo(CH_CELLA_DRET, CELLA_DRET_TANCAR);
    moureServo(CH_CELLA_ESQ,  CELLA_ESQ_TANCAR);
    esperarIActualitzar(1000);

    Serial.println(F("Expressio Sorpresa (obrir)..."));
    moureServo(CH_CELLA_DRET, CELLA_DRET_OBRIR);
    moureServo(CH_CELLA_ESQ,  CELLA_ESQ_OBRIR);
    esperarIActualitzar(1200);

    Serial.println(F("Expressio Enfadat (tancar)..."));
    moureServo(CH_CELLA_DRET, CELLA_DRET_TANCAR);
    moureServo(CH_CELLA_ESQ,  CELLA_ESQ_TANCAR);
    esperarIActualitzar(1200);

    // Test individual
    int angle = llegirIntSerial("Angle cella dreta (0-180, -1 per saltar):");
    if (angle >= 0) moureServo(CH_CELLA_DRET, angle);
    angle = llegirIntSerial("Angle cella esquerra (0-180, -1 per saltar):");
    if (angle >= 0) moureServo(CH_CELLA_ESQ, angle);

    mode = -1;
    mostrarMenu();
}

// ══════════════════════════════════════════════════════════════════════
// ── 4. Test Ulls ──────────────────────────────────────────────────────
void testUlls() {
    Serial.println(F("\n--- TEST ULLS ---"));

    Serial.println(F("Pujant ulls..."));
    moureServo(CH_ULL_DRET, ULL_DRET_PUJAR);
    moureServo(CH_ULL_ESQ,  ULL_ESQ_PUJAR);
    esperarIActualitzar(1000);

    Serial.println(F("Baixant ulls..."));
    moureServo(CH_ULL_DRET, ULL_DRET_BAIXAR);
    moureServo(CH_ULL_ESQ,  ULL_ESQ_BAIXAR);
    esperarIActualitzar(1000);

    Serial.println(F("Posició neutra (centre)..."));
    moureServo(CH_ULL_DRET, (ULL_DRET_BAIXAR + ULL_DRET_PUJAR) / 2);
    moureServo(CH_ULL_ESQ,  (ULL_ESQ_BAIXAR  + ULL_ESQ_PUJAR)  / 2);
    esperarIActualitzar(800);

    // Test individual
    int angle = llegirIntSerial("Angle ull dret (0-180, -1 per saltar):");
    if (angle >= 0) moureServo(CH_ULL_DRET, angle);
    angle = llegirIntSerial("Angle ull esquerra (0-180, -1 per saltar):");
    if (angle >= 0) moureServo(CH_ULL_ESQ, angle);

    mode = -1;
    mostrarMenu();
}

// ══════════════════════════════════════════════════════════════════════
// ── 5. Test Coll ──────────────────────────────────────────────────────
void testColl() {
    Serial.println(F("\n--- TEST COLL ---"));
    Serial.println(F("Submenú:"));
    Serial.println(F("  1 - Coll sup   (pujar/baixar)"));
    Serial.println(F("  2 - Coll inf   (calibrar)"));
    Serial.println(F("  3 - Coll gir   (esquerra/centre/dreta)"));
    Serial.println(F("  4 - Seqüència completa"));
    Serial.println(F("  5 - Manual (canal + angle)"));

    int sub = llegirIntSerial("Opció:");

    switch (sub) {
        case 1:
            Serial.println(F("Coll SUP pujant..."));
            moureServo(CH_COLL_SUP, COLL_SUP_PUJAR);
            esperarIActualitzar(1000);
            Serial.println(F("Coll SUP baixant..."));
            moureServo(CH_COLL_SUP, COLL_SUP_BAIXAR);
            esperarIActualitzar(1000);
            Serial.println(F("Coll SUP neutral (100)..."));
            moureServo(CH_COLL_SUP, 100);
            break;

        case 2:
            Serial.println(F("Calibrant coll INF — introdueix angles per provar:"));
            {
                int a = llegirIntSerial("Angle coll inferior:");
                moureServo(CH_COLL_INF, a);
                Serial.print(F("Aplicat: "));
                Serial.println(a);
            }
            break;

        case 3:
            Serial.println(F("Coll GIR — esquerra..."));
            moureServo(CH_COLL_GIR, COLL_GIR_ESQUERRA);
            esperarIActualitzar(1000);
            Serial.println(F("Coll GIR — centre..."));
            moureServo(CH_COLL_GIR, COLL_GIR_CENTRE);
            esperarIActualitzar(1000);
            Serial.println(F("Coll GIR — dreta..."));
            moureServo(CH_COLL_GIR, COLL_GIR_DRETA);
            esperarIActualitzar(1000);
            Serial.println(F("Coll GIR — tornant centre..."));
            moureServo(CH_COLL_GIR, COLL_GIR_CENTRE);
            break;

        case 4:
            Serial.println(F("Seqüència completa de coll..."));
            moureServo(CH_COLL_SUP, 100);
            moureServo(CH_COLL_INF, COLL_INF_NEUTRAL);
            moureServo(CH_COLL_GIR, COLL_GIR_CENTRE);
            esperarIActualitzar(800);
            moureServo(CH_COLL_GIR, COLL_GIR_ESQUERRA);
            esperarIActualitzar(800);
            moureServo(CH_COLL_GIR, COLL_GIR_DRETA);
            esperarIActualitzar(800);
            moureServo(CH_COLL_GIR, COLL_GIR_CENTRE);
            esperarIActualitzar(500);
            moureServo(CH_COLL_SUP, COLL_SUP_PUJAR);
            esperarIActualitzar(800);
            moureServo(CH_COLL_SUP, COLL_SUP_BAIXAR);
            esperarIActualitzar(800);
            moureServo(CH_COLL_SUP, 100);
            Serial.println(F("Seqüència acabada."));
            break;

        case 5: {
            int canal = llegirIntSerial("Canal coll (6=sup, 7=inf, 8=gir):");
            int angle = llegirIntSerial("Angle (0-180):");
            moureServo(canal, angle);
            break;
        }

        default:
            Serial.println(F("Opció no vàlida."));
            break;
    }

    mode = -1;
    mostrarMenu();
}

// ══════════════════════════════════════════════════════════════════════
// ── 6. Test Medicació ─────────────────────────────────────────────────
void testMedicacio() {
    Serial.println(F("\n--- TEST MEDICACIÓ ---"));
    Serial.println(F("Submenú:"));
    Serial.println(F("  1 - Med1 rect dispensar  (-> 60)"));
    Serial.println(F("  2 - Med1 rect recollir   (-> 145)"));
    Serial.println(F("  3 - Med1 cercle dispensar(-> 120)"));
    Serial.println(F("  4 - Med1 cercle recollir (-> 35)"));
    Serial.println(F("  5 - Med2 rect dispensar  (-> 50)"));
    Serial.println(F("  6 - Med2 rect recollir   (-> 135)"));
    Serial.println(F("  7 - Med2 cercle dispensar(-> 110)"));
    Serial.println(F("  8 - Med2 cercle recollir (-> 25)"));
    Serial.println(F("  9 - Seqüència auto Med1 (màq. estats)"));
    Serial.println(F(" 10 - Seqüència auto Med2 (màq. estats)"));
    Serial.println(F(" 11 - Manual (canal 4 o 5 + angle)"));

    int sub = llegirIntSerial("Opció:");

    switch (sub) {
        case 1:
            Serial.println(F("Med1 rect — dispensar..."));
            moureServo(CH_MED_1, MED1_RECT_DISPENSAR);
            break;
        case 2:
            Serial.println(F("Med1 rect — recollir..."));
            moureServo(CH_MED_1, MED1_RECT_RECOLLIR);
            break;
        case 3:
            Serial.println(F("Med1 cercle — dispensar..."));
            moureServo(CH_MED_1, MED1_CERCLE_DISPENSAR);
            break;
        case 4:
            Serial.println(F("Med1 cercle — recollir..."));
            moureServo(CH_MED_1, MED1_CERCLE_RECOLLIR);
            break;
        case 5:
            Serial.println(F("Med2 rect — dispensar..."));
            moureServo(CH_MED_2, MED2_RECT_DISPENSAR);
            break;
        case 6:
            Serial.println(F("Med2 rect — recollir..."));
            moureServo(CH_MED_2, MED2_RECT_RECOLLIR);
            break;
        case 7:
            Serial.println(F("Med2 cercle — dispensar..."));
            moureServo(CH_MED_2, MED2_CERCLE_DISPENSAR);
            break;
        case 8:
            Serial.println(F("Med2 cercle — recollir..."));
            moureServo(CH_MED_2, MED2_CERCLE_RECOLLIR);
            break;
        case 9:
            Serial.println(F("Iniciant seqüència automàtica Med1 (màquina d'estats)..."));
            iniciarMedRec1();
            while (medicacioEnCurs()) {
                esperarIActualitzar(10);
            }
            Serial.println(F("Med1 completada."));
            break;
        case 10:
            Serial.println(F("Iniciant seqüència automàtica Med2 (màquina d'estats)..."));
            iniciarMedRec2();
            while (medicacioEnCurs()) {
                esperarIActualitzar(10);
            }
            Serial.println(F("Med2 completada."));
            break;
        case 11: {
            int canal = llegirIntSerial("Canal medicació (4=Med1, 5=Med2):");
            int angle = llegirIntSerial("Angle (0-180):");
            moureServo(canal, angle);
            break;
        }
        default:
            Serial.println(F("Opció no vàlida."));
            break;
    }

    mode = -1;
    mostrarMenu();
}

// ══════════════════════════════════════════════════════════════════════
// ── 7. Test Motors ────────────────────────────────────────────────────
void testMotors() {
    Serial.println(F("\n--- TEST MOTORS ---"));

    Serial.println(F("Gir esquerra (m1 enrere, m2 endavant)..."));
    motorEnrere(motor1, 120);
    motorEndavant(motor2, 120);
    esperarIActualitzar(2000); 

    Serial.println(F("Parar final."));
    pararMotor(motor1);
    pararMotor(motor2);
    esperarIActualitzar(1200);

    mode = -1;
    mostrarMenu();
}

// ══════════════════════════════════════════════════════════════════════
// ── 8. Test Ultrasons ─────────────────────────────────────────────────
void testUltrasons() {
    Serial.println(F("\n--- TEST ULTRASONS (Escombrat seqüencial) ---"));
    Serial.println(F("Fem 10 lectures netes i sortim."));

    // Fem 10 lectures per tenir una mostra representativa i sense crosstalk
    for (int i = 0; i < 10; i++) {
        
        unsigned long inici = millis();
        while (millis() - inici < 40) { actualitzarUltraso(ultraso1); }
        delay(20); 

        inici = millis();
        while (millis() - inici < 40) { actualitzarUltraso(ultraso2); }
        delay(20);

        inici = millis();
        while (millis() - inici < 40) { actualitzarUltraso(ultraso3); }

        Serial.print(F("U1: "));
        Serial.print(getDistancia(ultraso1));
        Serial.print(F(" cm  |  U2: "));
        Serial.print(getDistancia(ultraso2));
        Serial.print(F(" cm  |  U3: "));
        Serial.print(getDistancia(ultraso3));
        Serial.println(F(" cm"));
        
        delay(100);
    }
    
    mode = -1;
    mostrarMenu();
}

// ══════════════════════════════════════════════════════════════════════
// ── 9. Test Encoders ──────────────────────────────────────────────────
void testEncoders() {
    Serial.print(F("Encoder 0: "));
    Serial.print(getEncoderCount(0));
    Serial.print(F("  |  Encoder 1: "));
    Serial.println(getEncoderCount(1));
    delay(200);
}

// ══════════════════════════════════════════════════════════════════════
// ── 10. Test Ànim / Estats Emocionals ─────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

// ── Nova funció asíncrona per controlar els LEDs sense aturar res ──────
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
    }
    
    FastLED.show();
}

static void efectePensant(unsigned long durada_ms) {
    const int ULL_D_MIN =  0, ULL_D_MAX = 30;
    const int ULL_E_MIN = 50, ULL_E_MAX = 25;
    unsigned long inici = millis();
    
    // Per a l'efecte pensant "Rotació" en color cian, afegim un color de fons base i un píxel que volta
    while (millis() - inici < durada_ms) {
        // Càlcul ràpid per la rotació del LED
        int pos = (millis() / 50) % NUM_LEDS; // Es mou cada 50ms
        fill_solid(leds, NUM_LEDS, CRGB(0, 50, 50)); // Base fosca cian
        leds[pos] = CRGB::Cyan; // Punt brillant girant
        FastLED.show();
        
        // Moviment de servos (asíncron integrat)
        int cicle = (millis() - inici) / 300;
        bool fase_alta = (cicle % 2 == 0);
        moureServo(CH_ULL_DRET, fase_alta ? ULL_D_MAX : ULL_D_MIN);
        moureServo(CH_ULL_ESQ,  fase_alta ? ULL_E_MAX : ULL_E_MIN);
        
        esperarIActualitzar(10); // Cridem freqüentment per mantenir fluïdesa
    }
    // Restaura color original després de l'efecte
    estat_led_actual = LED_CIAN;
}

static void efecteBuscant(unsigned long durada_ms) {
    const int posicions[] = { COLL_GIR_ESQUERRA, COLL_GIR_CENTRE,
                               COLL_GIR_DRETA,    COLL_GIR_CENTRE };
    unsigned long inici = millis();
    int idx = 0;
    while (millis() - inici < durada_ms) {
        moureServo(CH_COLL_GIR, posicions[idx % 4]);
        esperarIActualitzar(500); // L'efecte LED lila de batec el fa esperarIActualitzar automàticament
        idx++;
    }
    moureServo(CH_COLL_GIR, COLL_GIR_CENTRE);
}

// ── Aplica un estat als servos amb transicions orgàniques ──────────────
static void aplicarEstat(const EstatAnim &e) {
    // 1. Canvi d'il·luminació immediat (ajuda a la percepció del canvi)
    estat_led_actual = e.color_id;

    // 2. Moviment reactiu (Ulls): Els ulls sempre van primer
    if (e.ull_d >= 0) moureServo(CH_ULL_DRET, e.ull_d);
    if (e.ull_e >= 0) moureServo(CH_ULL_ESQ,  e.ull_e);
    
    // Si l'estat és de sorpresa o espant, volem que tot sigui brusc.
    if (strcmp(e.nom, "ESPANTAT") != 0 && strcmp(e.nom, "CONTENT") != 0) {
        esperarIActualitzar(150); 
    }

    // 3. Moviment d'orientació (Coll)
    moureServo(CH_COLL_SUP, e.coll_sup);
    if (e.coll_gir >= 0) moureServo(CH_COLL_GIR, e.coll_gir);

    if (strcmp(e.nom, "TRIST") == 0) {
        esperarIActualitzar(300); // Triga més a arronsar les celles si està trist
    } else {
        esperarIActualitzar(100);
    }

    // 4. Moviment expressiu (Celles i Coll Inferior)
    moureServo(CH_CELLA_DRET, e.cella_d);
    moureServo(CH_CELLA_ESQ,  e.cella_e);
    moureServo(CH_COLL_INF,   e.coll_inf);
}

static void executarEfecteDinamic(const EstatAnim &e, unsigned long ms) {
    if (strcmp(e.nom, "PENSANT") == 0) {
        efectePensant(ms);
    } 
    else if (strcmp(e.nom, "BUSCANT") == 0) {
        efecteBuscant(ms);
    } 
    else if (strcmp(e.nom, "TRIST") == 0) {
        unsigned long inici = millis();
        while (millis() - inici < ms) {
            esperarIActualitzar(800);
            moureServo(CH_COLL_SUP, e.coll_sup - 15);
            esperarIActualitzar(600);
            moureServo(CH_COLL_SUP, e.coll_sup);     
            esperarIActualitzar(1200);
        }
    }
    else if (strcmp(e.nom, "CONTENT") == 0) {
        if (ms > 1000) {
            esperarIActualitzar(400);
            moureServo(CH_COLL_SUP, e.coll_sup - 20); 
            esperarIActualitzar(150);
            moureServo(CH_COLL_SUP, e.coll_sup + 10); 
            esperarIActualitzar(150);
            moureServo(CH_COLL_SUP, e.coll_sup);      
            esperarIActualitzar(ms - 700);
        } else {
            esperarIActualitzar(ms);
        }
    }
    else {
        esperarIActualitzar(ms);
    }
}

static void imprimirLlistaEstats() {
    for (int i = 0; i < NUM_ESTATS; i++) {
        Serial.print(F("  "));
        Serial.print(i);
        Serial.print(F(" - "));
        Serial.println(ESTATS[i].nom);
    }
}

void testAnims() {
    Serial.println(F("\n--- TEST ESTATS D'ANIM ---"));
    Serial.println(F("Submenu:"));
    Serial.println(F("  1 - Recorrer TOTS els estats (auto)"));
    Serial.println(F("  2 - Estat concret"));
    Serial.println(F("  3 - Mantenir estat (fins '0')"));

    int sub = llegirIntSerial("Opcio:");

    switch (sub) {
        case 1: {
            Serial.println(F("Iniciant sequencia automatica..."));
            const unsigned long TEMPS_ESTAT = 3000; // Incrementat per veure millor l'efecte de llums

            for (int i = 0; i < NUM_ESTATS; i++) {
                Serial.print(F("  -> "));
                Serial.println(ESTATS[i].nom);
                aplicarEstat(ESTATS[i]);
                executarEfecteDinamic(ESTATS[i], TEMPS_ESTAT);
            }

            Serial.println(F("Sequencia acabada. Tornant a NEUTRAL..."));
            aplicarEstat(ESTATS[0]);
            esperarIActualitzar(800);
            break;
        }

        case 2: {
            imprimirLlistaEstats();
            int idx = llegirIntSerial("Numero d'estat:");
            if (idx < 0 || idx >= NUM_ESTATS) {
                Serial.println(F("Index fora de rang."));
                break;
            }

            const EstatAnim &e = ESTATS[idx];
            Serial.print(F("-> Aplicant: "));
            Serial.println(e.nom);
            aplicarEstat(e);

            Serial.print(F("   Cella D/E  : ")); Serial.print(e.cella_d);  Serial.print(F(" / ")); Serial.println(e.cella_e);
            Serial.print(F("   Ull   D/E  : "));
            if (e.ull_d < 0) Serial.print(F("DIN")); else Serial.print(e.ull_d);
            Serial.print(F(" / "));
            if (e.ull_e < 0) Serial.println(F("DIN")); else Serial.println(e.ull_e);
            Serial.print(F("   Coll S/I/G : ")); Serial.print(e.coll_sup); Serial.print(F(" / ")); Serial.print(e.coll_inf); Serial.print(F(" / "));
            if (e.coll_gir < 0) Serial.println(F("DIN")); else Serial.println(e.coll_gir);

            executarEfecteDinamic(e, 3000);
            break;
        }

        case 3: {
            imprimirLlistaEstats();
            int idx = llegirIntSerial("Numero d'estat:");
            if (idx < 0 || idx >= NUM_ESTATS) {
                Serial.println(F("Index fora de rang."));
                break;
            }

            const EstatAnim &e = ESTATS[idx];
            Serial.print(F("-> Mantenint: "));
            Serial.println(e.nom);
            Serial.println(F("   (envia '0' per sortir)"));
            aplicarEstat(e);

            while (true) {
                if (Serial.available()) {
                    String in = Serial.readStringUntil('\n');
                    in.trim();
                    if (in.toInt() == 0) break;
                }
                executarEfecteDinamic(e, 600);
            }
            Serial.println(F("Sortint del mode mantenir."));
            break;
        }

        default:
            Serial.println(F("Opcio no valida."));
            break;
    }

    mode = -1;
    mostrarMenu();
}