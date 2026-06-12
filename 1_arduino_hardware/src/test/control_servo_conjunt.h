#ifndef CONTROL_SERVO_CONJUNT_H
#define CONTROL_SERVO_CONJUNT_H

#include <Arduino.h>

// ── Mapa de Canals PCA9685 ────────────────────────────────────────────────────
#define CH_CELLA_DRET   0
#define CH_CELLA_ESQ    1
#define CH_ULL_DRET     2
#define CH_ULL_ESQ      3
#define CH_MED_1        4  
#define CH_MED_2        5  
#define CH_COLL_SUP     6
#define CH_COLL_INF     7
#define CH_COLL_GIR     8

// ── Inicialització ────────────────────────────────────────────────────────────
void inicialitzarServos();

// ── Primitiva de moviment ─────────────────────────────────────────────────────
void moureServo(int canal, int angle);

// ── Expressions facials ───────────────────────────────────────────────────────
void expressioSorpresa();
void expressioEnfadat();
void expressioNeutral();
void movimentCelles(int angle_dret, int angle_esq);
void movimentUlls(int angle_dret, int angle_esq);

// ── Moviment del Coll ─────────────────────────────────────────────────────────
void movimentCollSup(int angle);
void movimentCollInf(int angle);
void movimentCollGir(int angle);

// ── Medicació ─────────────────────────────────────────────────────────────────
void iniciarMedRec1();
void iniciarMedRec2();
void iniciarMedCercle1();   
void iniciarMedCercle2();   
void actualitzarMedicacio();
bool medicacioEnCurs();

#endif