#ifndef CONTROL_SERVO_H
#define CONTROL_SERVO_H

#include <Servo.h>

void inicialitzarServo(int pin, Servo &servo);
void moureServo(int inici, int final, Servo &servo);

#endif