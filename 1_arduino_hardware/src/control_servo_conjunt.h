#ifndef CONTROL_SERVO_H
#define CONTROL_SERVO_H

void inicialitzarServos();

void moureServo(int canal, int angle);

//ulls
void movimentCelles();
void movimentUlls();

//medicació
void medRec1();
void medRec2();
void medCercle1();
void medCercle2();

#endif