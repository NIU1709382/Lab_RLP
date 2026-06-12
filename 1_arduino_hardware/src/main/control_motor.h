#ifndef CONTROL_MOTOR_H
#define CONTROL_MOTOR_H
#include <Arduino.h>

struct Motor {
    int  rpwm;
    int  lpwm;
    int  vel_actual;
    int  vel_objectiu;
    bool endavant;
    int  increment;
};

Motor inicialitzarMotor(int rpwm, int lpwm, int increment = 5);
void  motorEndavant(Motor &m, int velocitat);
void  motorEnrere(Motor &m, int velocitat);
void  pararMotor(Motor &m);
void  actualitzarMotor(Motor &m);
void  pararMotorEmergencia(Motor &m);
bool  motorAturat(const Motor &m);

#endif
