#ifndef CONTROL_MOTOR_H
#define CONTROL_MOTOR_H

#include <Arduino.h>

// Estat independent per a cada motor.
// Elimina el bug del vel_actual_R global compartit.
struct Motor {
    int rpwm;
    int lpwm;
    int vel_actual;       // velocitat actual (0-255)
    int vel_objectiu;     // velocitat objectiu (0-255, negatiu = enrere)
    bool endavant;        // direcció actual
    int increment;        // graus de ramp per tick (default 5)
};

// Inicialitza un motor i retorna l'struct configurat
Motor inicialitzarMotor(int rpwm, int lpwm, int increment = 5);

// Estableix l'objectiu de velocitat (no aplica immediatament)
// velocitat: 0-255
void motorEndavant(Motor &m, int velocitat);
void motorEnrere(Motor &m, int velocitat);
void pararMotor(Motor &m);

// Ha de ser cridat a cada iteració de loop()
// Aplica el ramp suau cap a vel_objectiu
void actualitzarMotor(Motor &m);

// Atura físicament i immediatament (emergència)
void pararMotorEmergencia(Motor &m);

// Retorna true si el motor està físicament aturat
bool motorAturat(const Motor &m);

#endif
