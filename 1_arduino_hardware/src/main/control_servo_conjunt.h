#ifndef CONTROL_SERVO_CONJUNT_H
#define CONTROL_SERVO_CONJUNT_H

#include <Arduino.h>

// ── Mapa de Canals PCA9685 ────────────────────────────────────────────────────
#define CH_CELLA_DRET   0
#define CH_CELLA_ESQ    1
#define CH_ULL_DRET     2
#define CH_ULL_ESQ      3
#define CH_MED_1        4  // Controla rectangle i cercle del dispensador 1
#define CH_MED_2        5  // Controla rectangle i cercle del dispensador 2
#define CH_COLL_SUP     6
#define CH_COLL_INF     7
#define CH_COLL_GIR     8

// ── Inicialització ────────────────────────────────────────────────────────────
void inicialitzarServos();

// ── Primitiva de moviment ─────────────────────────────────────────────────────
// canal: 0-15 (PCA9685), angle: 0-180
void moureServo(int canal, int angle);

// ── Expressions facials ───────────────────────────────────────────────────────
void expressioSorpresa();
void expressioEnfadat();
void expressioNeutral();

// Moviment de celles i ulls (coordenades enviades per la RPi via Serial)
// angle_dret i angle_esq: 0-180
void movimentCelles(int angle_dret, int angle_esq);
void movimentUlls(int angle_dret, int angle_esq);

// ── Moviment del Coll ─────────────────────────────────────────────────────────
void movimentCollSup(int angle);
void movimentCollGir(int angle);
// void movimentCollInf(int angle); // Reservat per a quan es calibri el pin 7

// ── Medicació (màquina d'estats, cridar des de loop()) ────────────────────────
// Mantenen la mateixa interfície per a l'Executiu, però internament compartiran 
// els canals CH_MED_1 i CH_MED_2 alternant els angles configurats.
void iniciarMedRec1();
void iniciarMedRec2();
void iniciarMedCercle1();   
void iniciarMedCercle2();   

// Ha de ser cridat a cada iteració de loop()
void actualitzarMedicacio();

// Retorna true si hi ha alguna seqüència de medicació en curs
bool medicacioEnCurs();

#endif