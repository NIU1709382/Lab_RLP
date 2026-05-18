#include <Arduino.h>
#include "control_motor.h"

void inicialitzarMotor(int rpwm, int lpwm)
{
    pinMode(rpwm, OUTPUT);
    pinMode(lpwm, OUTPUT);
}

void motorEndavant(int rpwm, int lpwm, int velocitat)
{
    analogWrite(rpwm, velocitat);
    analogWrite(lpwm, 0);
}

void motorEnrere(int rpwm, int lpwm, int velocitat)
{
    analogWrite(rpwm, 0);
    analogWrite(lpwm, velocitat);
}

void pararMotor(int rpwm, int lpwm)
{
    analogWrite(rpwm, 0);
    analogWrite(lpwm, 0);
}