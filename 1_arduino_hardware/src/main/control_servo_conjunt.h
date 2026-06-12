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

// ── Límits de cada servo (angles màxims calibrats) ────────────────────────────
// Celles
#define CELLA_DRET_MIN   0
#define CELLA_DRET_MAX   80   // tancat
#define CELLA_ESQ_MIN    0
#define CELLA_ESQ_MAX    80   // tancat

// Ulls
#define ULL_DRET_MIN     0
#define ULL_DRET_MAX     30   // pujat
#define ULL_ESQ_MIN      25   // pujat
#define ULL_ESQ_MAX      50   // baixat

// Coll
#define COLL_GIR_MIN     0
#define COLL_GIR_MAX     150
#define COLL_GIR_CENTRE  75
#define COLL_SUP_MIN     60
#define COLL_SUP_MAX     140
#define COLL_SUP_NORMAL  140

// Medicació 1
#define MED1_RECT_DISPENSAR    60
#define MED1_CERCLE_DISPENSAR  120
#define MED1_RECT_RECOLLIR     145
#define MED1_CERCLE_RECOLLIR   35

// Medicació 2
#define MED2_RECT_DISPENSAR    50
#define MED2_CERCLE_DISPENSAR  110
#define MED2_RECT_RECOLLIR     135
#define MED2_CERCLE_RECOLLIR   25

// ── Funcions ──────────────────────────────────────────────────────────────────
void inicialitzarServos();
void moureServo(int canal, int angle);

void expressioSorpresa();
void expressioEnfadat();
void expressioNeutral();

void movimentCelles(int angle_dret, int angle_esq);
void movimentUlls(int angle_dret, int angle_esq);
void movimentCollSup(int angle);
void movimentCollGir(int angle);

void iniciarMedRec1();
void iniciarMedRec2();
void iniciarMedCercle1();
void iniciarMedCercle2();
void actualitzarMedicacio();
bool medicacioEnCurs();

#endif
