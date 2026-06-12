#include "control_servo_conjunt.h"
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

// ── Constants PCA9685 ─────────────────────────────────────────────────────────
#define SERVOMIN  150
#define SERVOMAX  590

#define CH_CELLA_DRET   0
#define CH_CELLA_ESQ    1
#define CH_ULL_DRET     2
#define CH_ULL_ESQ      3
#define CH_MED_REC1     4
#define CH_MED_REC2     5
#define CH_MED_CERCLE1  6
#define CH_MED_CERCLE2  7

// Angles per defecte (neutral)
#define ANGLE_CELLA_NEUTRAL  90
#define ANGLE_ULL_NEUTRAL    90
#define MED_OBERT           145
#define MED_TANCAT           60
#define MED_TEMPS_OBERT     1000  // ms comporta oberta
#define MED_TEMPS_TANCAT     800  // ms d'espera post-tancament

// ── Màquina d'estats genèrica per a dispensadors ─────────────────────────────
// Cada dispensador té el seu propi estat independent.
struct EstatDispensador {
    int  pas;             // 0=aturat, 1=obrint, 2=esperant_obert, 3=tancant, 4=espera_final
    unsigned long temps;  // millis() de l'últim canvi d'estat
    int  canal;           // canal PCA9685
};

static EstatDispensador dispensadors[4] = {
    {0, 0, CH_MED_REC1},
    {0, 0, CH_MED_REC2},
    {0, 0, CH_MED_CERCLE1},
    {0, 0, CH_MED_CERCLE2}
};

// ── Inicialització ────────────────────────────────────────────────────────────

void inicialitzarServos() {
    Wire.begin();
    pwm.begin();
    pwm.setPWMFreq(50);
    delay(10);

    // Posició neutral de partida
    moureServo(CH_CELLA_DRET,  ANGLE_CELLA_NEUTRAL);
    moureServo(CH_CELLA_ESQ,   ANGLE_CELLA_NEUTRAL);
    moureServo(CH_ULL_DRET,    ANGLE_ULL_NEUTRAL);
    moureServo(CH_ULL_ESQ,     ANGLE_ULL_NEUTRAL);
}

// ── Primitiva ─────────────────────────────────────────────────────────────────

void moureServo(int canal, int angle) {
    angle = constrain(angle, 0, 180);
    int pulse = map(angle, 0, 180, SERVOMIN, SERVOMAX);
    pwm.setPWM(canal, 0, pulse);
}

// ── Expressions ──────────────────────────────────────────────────────────────

void expressioNeutral() {
    moureServo(CH_CELLA_DRET, ANGLE_CELLA_NEUTRAL);
    moureServo(CH_CELLA_ESQ,  ANGLE_CELLA_NEUTRAL);
}

void expressioSorpresa() {
    moureServo(CH_CELLA_DRET, 80);
    moureServo(CH_CELLA_ESQ,   0);
}

void expressioEnfadat() {
    moureServo(CH_CELLA_DRET,  0);
    moureServo(CH_CELLA_ESQ,  80);
}

// ── Moviment per coordenades (enviat per la RPi) ──────────────────────────────
// La RPi envia angles ja calculats (pot incloure Filtre Kalman)

void movimentCelles(int angle_dret, int angle_esq) {
    moureServo(CH_CELLA_DRET, angle_dret);
    moureServo(CH_CELLA_ESQ,  angle_esq);
}

void movimentUlls(int angle_dret, int angle_esq) {
    moureServo(CH_ULL_DRET, angle_dret);
    moureServo(CH_ULL_ESQ,  angle_esq);
}

// ── Inici de seqüències de medicació ─────────────────────────────────────────

static void iniciarDispensador(int idx) {
    if (dispensadors[idx].pas == 0) {
        dispensadors[idx].pas = 1;
    }
}

void iniciarMedRec1()    { iniciarDispensador(0); }
void iniciarMedRec2()    { iniciarDispensador(1); }
void iniciarMedCercle1() { iniciarDispensador(2); }
void iniciarMedCercle2() { iniciarDispensador(3); }

// ── Motor de la màquina d'estats (cridar des de loop()) ───────────────────────

static void actualitzarDispensador(EstatDispensador &d) {
    unsigned long ara = millis();

    switch (d.pas) {
        case 0:
            // Aturat, res a fer
            break;

        case 1:
            // Obrim la comporta
            moureServo(d.canal, MED_OBERT);
            d.temps = ara;
            d.pas   = 2;
            break;

        case 2:
            // Esperem que la medicació caigui
            if (ara - d.temps >= MED_TEMPS_OBERT) {
                moureServo(d.canal, MED_TANCAT);
                d.temps = ara;
                d.pas   = 3;
            }
            break;

        case 3:
            // Esperem confirmació de tancament
            if (ara - d.temps >= MED_TEMPS_TANCAT) {
                d.pas = 0; // Seqüència completada
                // El care.ino enviarà "MED_OK" a la RPi en detectar pas==0
            }
            break;
    }
}

void actualitzarMedicacio() {
    for (int i = 0; i < 4; i++) {
        actualitzarDispensador(dispensadors[i]);
    }
}

bool medicacioEnCurs() {
    for (int i = 0; i < 4; i++) {
        if (dispensadors[i].pas != 0) return true;
    }
    return false;
}
