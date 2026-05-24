#ifndef CONTROL_MOTOR_H
#define CONTROL_MOTOR_H

void inicialitzarMotor(int rpwm, int lpwm);

void motorEndavant(int rpwm, int lpwm, int velocitat);

void motorEnrere(int rpwm, int lpwm, int velocitat);

void pararMotor(int rpwm, int lpwm);

#endif