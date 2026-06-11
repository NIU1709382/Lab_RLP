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

    // Engeguem el robot amb cara neutral
    expressioNeutral();
}

// ── Primitiva de moviment (La funció vital que faltava) ───────────────────────
void moureServo(int canal, int angle) {
    angle = constrain(angle, 0, 180);
    int pulse = map(angle, 0, 180, SERVOMIN, SERVOMAX);
    pwm.setPWM(canal, 0, pulse);
}

// ── Moviment independent per coordenades (Faltava) ────────────────────────────
void movimentCelles(int angle_dret, int angle_esq) {
    moureServo(CH_CELLA_DRET, angle_dret);
    moureServo(CH_CELLA_ESQ,  angle_esq);
}

void movimentUlls(int angle_dret, int angle_esq) {
    moureServo(CH_ULL_DRET, angle_dret);
    moureServo(CH_ULL_ESQ,  angle_esq);
}

// ── Expressions Facials (Basades en la teva calibració) ───────────────────────
void expressioSorpresa() {
    moureServo(CH_CELLA_DRET, 0);   // Obrir
    moureServo(CH_CELLA_ESQ, 80);   // Obrir
    moureServo(CH_ULL_DRET, 30);    // Pujar
    moureServo(CH_ULL_ESQ, 25);     // Pujar
}

void expressioEnfadat() {
    moureServo(CH_CELLA_DRET, 80);  // Tancar
    moureServo(CH_CELLA_ESQ, 0);    // Tancar
    moureServo(CH_ULL_DRET, 0);     // Baixar
    moureServo(CH_ULL_ESQ, 50);     // Baixar
}

void expressioNeutral() {
    moureServo(CH_CELLA_DRET, 40);  // Mig camí
    moureServo(CH_CELLA_ESQ, 40);   // Mig camí
    moureServo(CH_ULL_DRET, 15);    // Mig camí
    moureServo(CH_ULL_ESQ, 37);     // Mig camí
}

// ── Coll ──────────────────────────────────────────────────────────────────────
void movimentCollSup(int angle) { moureServo(CH_COLL_SUP, angle); }
void movimentCollGir(int angle) { moureServo(CH_COLL_GIR, angle); }

// ── Màquina d'estats per a dispensadors ───────────────────────────────────────
#define MED_TEMPS_OBERT     1000
#define MED_TEMPS_TANCAT     800

struct EstatDispensador {
    int pas;              // 0=aturat, 1=obrint, 2=esperant, 3=tancant
    unsigned long temps; 
    int canal;            
    int angle_dispensar;  // DINÀMIC: L'angle que s'usarà per obrir
    int angle_recollir;   // DINÀMIC: L'angle que s'usarà per tancar
};

static EstatDispensador dispensadors[2] = {
    {0, 0, CH_MED_1, 0, 0},
    {0, 0, CH_MED_2, 0, 0}
};

// Funcions d'activació amb els teus valors exactes
void iniciarMedRec1() {
    if (dispensadors[0].pas == 0) {
        dispensadors[0].angle_dispensar = 60;
        dispensadors[0].angle_recollir = 145;
        dispensadors[0].pas = 1;
    }
}
void iniciarMedCercle1() {
    if (dispensadors[0].pas == 0) {
        dispensadors[0].angle_dispensar = 120;
        dispensadors[0].angle_recollir = 35;
        dispensadors[0].pas = 1;
    }
}
void iniciarMedRec2() {
    if (dispensadors[1].pas == 0) {
        dispensadors[1].angle_dispensar = 50;
        dispensadors[1].angle_recollir = 135;
        dispensadors[1].pas = 1;
    }
}
void iniciarMedCercle2() {
    if (dispensadors[1].pas == 0) {
        dispensadors[1].angle_dispensar = 110;
        dispensadors[1].angle_recollir = 25;
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
            d.pas = 2;
            break;
        case 2:
            if (ara - d.temps >= MED_TEMPS_OBERT) {
                moureServo(d.canal, d.angle_recollir);
                d.temps = ara;
                d.pas = 3;
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