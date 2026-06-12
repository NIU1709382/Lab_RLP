#include "control_servo_conjunt.h"
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

#define SERVOMIN  150
#define SERVOMAX  590

// ── Inicialització ────────────────────────────────────────────────────────────
void inicialitzarServos() {
    Wire.begin();
    pwm.begin();
    pwm.setPWMFreq(50);
    delay(10);
    expressioNeutral();
}

// ── Primitiva de moviment ─────────────────────────────────────────────────────
void moureServo(int canal, int angle) {
    angle = constrain(angle, 0, 180);
    int pulse = map(angle, 0, 180, SERVOMIN, SERVOMAX);
    pwm.setPWM(canal, 0, pulse);
}

// ── Moviments per coordenades ─────────────────────────────────────────────────
void movimentCelles(int angle_dret, int angle_esq) {
    moureServo(CH_CELLA_DRET, constrain(angle_dret, CELLA_DRET_MIN, CELLA_DRET_MAX));
    moureServo(CH_CELLA_ESQ,  constrain(angle_esq,  CELLA_ESQ_MIN,  CELLA_ESQ_MAX));
}

void movimentUlls(int angle_dret, int angle_esq) {
    moureServo(CH_ULL_DRET, constrain(angle_dret, ULL_DRET_MIN, ULL_DRET_MAX));
    moureServo(CH_ULL_ESQ,  constrain(angle_esq,  ULL_ESQ_MIN,  ULL_ESQ_MAX));
}

void movimentCollSup(int angle) {
    moureServo(CH_COLL_SUP, constrain(angle, COLL_SUP_MIN, COLL_SUP_MAX));
}

void movimentCollGir(int angle) {
    moureServo(CH_COLL_GIR, constrain(angle, COLL_GIR_MIN, COLL_GIR_MAX));
}

// ── Expressions facials ───────────────────────────────────────────────────────
void expressioSorpresa() {
    moureServo(CH_CELLA_DRET, 0);
    moureServo(CH_CELLA_ESQ,  80);
    moureServo(CH_ULL_DRET,   30);
    moureServo(CH_ULL_ESQ,    25);
}

void expressioEnfadat() {
    moureServo(CH_CELLA_DRET, 80);
    moureServo(CH_CELLA_ESQ,  0);
    moureServo(CH_ULL_DRET,   0);
    moureServo(CH_ULL_ESQ,    50);
}

void expressioNeutral() {
    moureServo(CH_CELLA_DRET, 40);
    moureServo(CH_CELLA_ESQ,  40);
    moureServo(CH_ULL_DRET,   15);
    moureServo(CH_ULL_ESQ,    37);
}

// ── Màquina d'estats dispensadors ────────────────────────────────────────────
#define MED_TEMPS_OBERT   1000
#define MED_TEMPS_TANCAT   800

struct EstatDispensador {
    int           pas;
    unsigned long temps;
    int           canal;
    int           angle_dispensar;
    int           angle_recollir;
};

static EstatDispensador dispensadors[2] = {
    {0, 0, CH_MED_1, 0, 0},
    {0, 0, CH_MED_2, 0, 0}
};

void iniciarMedRec1() {
    if (dispensadors[0].pas == 0) {
        dispensadors[0].angle_dispensar = MED1_RECT_DISPENSAR;
        dispensadors[0].angle_recollir  = MED1_RECT_RECOLLIR;
        dispensadors[0].pas = 1;
    }
}
void iniciarMedCercle1() {
    if (dispensadors[0].pas == 0) {
        dispensadors[0].angle_dispensar = MED1_CERCLE_DISPENSAR;
        dispensadors[0].angle_recollir  = MED1_CERCLE_RECOLLIR;
        dispensadors[0].pas = 1;
    }
}
void iniciarMedRec2() {
    if (dispensadors[1].pas == 0) {
        dispensadors[1].angle_dispensar = MED2_RECT_DISPENSAR;
        dispensadors[1].angle_recollir  = MED2_RECT_RECOLLIR;
        dispensadors[1].pas = 1;
    }
}
void iniciarMedCercle2() {
    if (dispensadors[1].pas == 0) {
        dispensadors[1].angle_dispensar = MED2_CERCLE_DISPENSAR;
        dispensadors[1].angle_recollir  = MED2_CERCLE_RECOLLIR;
        dispensadors[1].pas = 1;
    }
}

static void actualitzarDispensador(EstatDispensador &d) {
    unsigned long ara = millis();
    switch (d.pas) {
        case 0: break;
        case 1:
            moureServo(d.canal, d.angle_dispensar);
            d.temps = ara;
            d.pas   = 2;
            break;
        case 2:
            if (ara - d.temps >= MED_TEMPS_OBERT) {
                moureServo(d.canal, d.angle_recollir);
                d.temps = ara;
                d.pas   = 3;
            }
            break;
        case 3:
            if (ara - d.temps >= MED_TEMPS_TANCAT) d.pas = 0;
            break;
    }
}

void actualitzarMedicacio() {
    actualitzarDispensador(dispensadors[0]);
    actualitzarDispensador(dispensadors[1]);
}

bool medicacioEnCurs() {
    return (dispensadors[0].pas != 0 || dispensadors[1].pas != 0);
}
