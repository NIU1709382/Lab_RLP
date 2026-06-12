#include "control_motor.h"

Motor inicialitzarMotor(int rpwm, int lpwm, int increment) {
    Motor m;
    m.rpwm        = rpwm;
    m.lpwm        = lpwm;
    m.vel_actual  = 0;
    m.vel_objectiu = 0;
    m.endavant    = true;
    m.increment   = increment;

    pinMode(rpwm, OUTPUT);
    pinMode(lpwm, OUTPUT);
    analogWrite(rpwm, 0);
    analogWrite(lpwm, 0);
    return m;
}

// ── Establir objectius (no mouen el motor immediatament) ─────────────────────

void motorEndavant(Motor &m, int velocitat) {
    velocitat     = constrain(velocitat, 0, 255);
    m.endavant    = true;
    m.vel_objectiu = velocitat;
}

void motorEnrere(Motor &m, int velocitat) {
    velocitat     = constrain(velocitat, 0, 255);
    m.endavant    = false;
    m.vel_objectiu = velocitat;
}

void pararMotor(Motor &m) {
    m.vel_objectiu = 0;
    // El ramp s'encarregarà de frenar suaument
}

void pararMotorEmergencia(Motor &m) {
    m.vel_objectiu = 0;
    m.vel_actual   = 0;
    analogWrite(m.rpwm, 0);
    analogWrite(m.lpwm, 0);
}

// ── Motor loop (cridar des de loop() principal) ───────────────────────────────

void actualitzarMotor(Motor &m) {
    // Ramp suau cap a l'objectiu
    if (m.vel_actual < m.vel_objectiu) {
        m.vel_actual = min(m.vel_actual + m.increment, m.vel_objectiu);
    } else if (m.vel_actual > m.vel_objectiu) {
        m.vel_actual = max(m.vel_actual - m.increment, m.vel_objectiu);
    }

    // Si ara estem aturats, tallem les dues sortides
    if (m.vel_actual == 0) {
        analogWrite(m.rpwm, 0);
        analogWrite(m.lpwm, 0);
        return;
    }

    // Aplica en la direcció correcta
    if (m.endavant) {
        analogWrite(m.lpwm, 0);
        analogWrite(m.rpwm, m.vel_actual);
    } else {
        analogWrite(m.rpwm, 0);
        analogWrite(m.lpwm, m.vel_actual);
    }
}

bool motorAturat(const Motor &m) {
    return m.vel_actual == 0 && m.vel_objectiu == 0;
}
