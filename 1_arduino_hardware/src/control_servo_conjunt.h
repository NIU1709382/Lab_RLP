#ifndef CONTROL_SERVO_CONJUNT_H   // <-- guard corregit (era CONTROL_SERVO_H, en conflicte)
#define CONTROL_SERVO_CONJUNT_H

#include <Arduino.h>

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

// ── Medicació (màquina d'estats, cridar des de loop()) ────────────────────────
void iniciarMedRec1();
void iniciarMedRec2();
void iniciarMedCercle1();   // Reservat per al dispensador circular 1
void iniciarMedCercle2();   // Reservat per al dispensador circular 2

// Ha de ser cridat a cada iteració de loop()
void actualitzarMedicacio();

// Retorna true si hi ha alguna seqüència de medicació en curs
bool medicacioEnCurs();

#endif
