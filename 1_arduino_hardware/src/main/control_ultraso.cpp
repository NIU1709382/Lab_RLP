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

// ── Màquina d'estats asíncrona ────────────────────────────────────────────────
//
//  Estat 1 (esperant_eco = false):
//    Si han passat ULTRASO_INTERVAL_MS des de l'últim TRIG → dispara TRIG 10µs
//    i posa esperant_eco = true.
//
//  Estat 2 (esperant_eco = true):
//    Llegim el pin ECHO manualment (polling ràpid, <1µs per crida).
//    - Quan ECHO puja: guardem micros() com eco_inici.
//    - Quan ECHO baixa: calculem la durada → distància.
//    - Si portem >30ms esperant i ECHO no ha baixat: timeout, distancia = -1.
//
//  Avantatge: mai bloqueja. El pitjor cas és ~2µs per tick de loop().

bool actualitzarUltraso(Ultraso &u) {
    unsigned long ara = millis();
    unsigned long ara_us = micros();

    if (!u.esperant_eco) {
        // ── Fase TRIG ────────────────────────────────────────────────────────
        if (ara - u.ultim_trig >= ULTRASO_INTERVAL_MS) {
            digitalWrite(u.pin_trig, LOW);
            delayMicroseconds(2);
            digitalWrite(u.pin_trig, HIGH);
            delayMicroseconds(10);
            digitalWrite(u.pin_trig, LOW);

            u.ultim_trig   = ara;
            u.esperant_eco = true;
            u.eco_actiu    = false;
            u.eco_inici    = 0;
        }
        return false; // Cap mesura nova aquest tick

    } else {
        // ── Fase ECHO (polling sense bloqueig) ───────────────────────────────
        bool echo_alt = digitalRead(u.pin_echo);

        if (!u.eco_actiu && echo_alt) {
            // Flac pujant: comencem a comptar
            u.eco_inici  = ara_us;
            u.eco_actiu  = true;
        }

        if (u.eco_actiu && !echo_alt) {
            // Flanc baixant: tenim la durada
            unsigned long duracio = ara_us - u.eco_inici;
            u.distancia_cm  = (duracio * 0.0343f) / 2.0f;
            u.esperant_eco  = false;
            u.eco_actiu     = false;
            return true; // Nova mesura disponible
        }

        // Timeout: si portem >30ms i no ha baixat l'ECHO
        if (u.esperant_eco && (ara - u.ultim_trig > 30)) {
            u.distancia_cm  = ULTRASO_TIMEOUT;
            u.esperant_eco  = false;
            u.eco_actiu     = false;
            return true; // Mesura de timeout disponible
        }

        return false;
    }
}

float getDistancia(const Ultraso &u) {
    return u.distancia_cm;
}

bool deteccioObjecte(const Ultraso &u, float llindar_cm) {
    // ULTRASO_TIMEOUT (-1) no es considera detecció
    if (u.distancia_cm < 0) return false;
    return u.distancia_cm < llindar_cm;
}
