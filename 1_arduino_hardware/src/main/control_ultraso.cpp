#include "control_ultraso.h"

void inicialitzarUltraso(Ultraso &u, int pin_trig, int pin_echo) {
    u.pin_trig      = pin_trig;
    u.pin_echo      = pin_echo;
    u.distancia_cm  = ULTRASO_TIMEOUT;
    u.ultim_trig    = 0;
    u.esperant_eco  = false;
    u.eco_inici     = 0;
    u.eco_actiu     = false;
    pinMode(pin_trig, OUTPUT);
    pinMode(pin_echo, INPUT);
    digitalWrite(pin_trig, LOW);
}

bool actualitzarUltraso(Ultraso &u) {
    unsigned long ara_ms = millis();

    // Llança un nou ping si han passat prou ms
    if (!u.esperant_eco && (ara_ms - u.ultim_trig >= ULTRASO_INTERVAL_MS)) {
        digitalWrite(u.pin_trig, LOW);
        delayMicroseconds(2);
        digitalWrite(u.pin_trig, HIGH);
        delayMicroseconds(10);
        digitalWrite(u.pin_trig, LOW);
        u.ultim_trig   = ara_ms;
        u.esperant_eco = true;
    }

    // Llegeix l'eco (pulseIn bloqueja màxim 30ms; acceptable per al nostre loop)
    if (u.esperant_eco) {
        long duracio = pulseIn(u.pin_echo, HIGH, 30000UL);
        u.esperant_eco = false;
        if (duracio > 0) {
            u.distancia_cm = duracio * 0.034f / 2.0f;
            return true;
        } else {
            u.distancia_cm = ULTRASO_TIMEOUT;
            return false;
        }
    }
    return false;
}

float getDistancia(const Ultraso &u) {
    return u.distancia_cm;
}

bool deteccioObjecte(const Ultraso &u, float llindar_cm) {
    return (u.distancia_cm > 0.0f && u.distancia_cm < llindar_cm);
}
