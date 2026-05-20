#include <Arduino.h>
#include "control_motor.h"

volatile long encoderCount = 0;


void inicialitzarMotor(int rpwm, int lpwm, int encA, int encB)
{
    pinMode(rpwm, OUTPUT);
    pinMode(lpwm, OUTPUT);

    pinMode(encA, INPUT_PULLUP);
    pinMode(encB, INPUT_PULLUP);
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

void readEncoder(int encB) {
  int b = digitalRead(encB);

  if (b > 0) {
    encoderCount++;
  } else {
    encoderCount--;
  }
}