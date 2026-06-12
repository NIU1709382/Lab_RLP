#ifndef CONTROL_ULTRASO_H
#define CONTROL_ULTRASO_H

#include <Arduino.h>

// Valor especial: sensor sense resposta (timeout)
#define ULTRASO_TIMEOUT -1.0f

// Interval mínim entre mesures (ms). HC-SR04 necessita ~60ms entre pings.
#define ULTRASO_INTERVAL_MS 65

struct Ultraso {
    int pin_trig;
    int pin_echo;
    float distancia_cm;       // última mesura vàlida (-1 si timeout)
    unsigned long ultim_trig; // millis() de l'últim TRIG
    bool esperant_eco;        // true entre TRIG i fi de pulseIn asíncron

    // Per a la lectura asíncrona sense bloqueig
    unsigned long eco_inici;  // micros() quan ECHO puja
    bool eco_actiu;           // true mentre ECHO és HIGH
};

void inicialitzarUltraso(Ultraso &u, int pin_trig, int pin_echo);

// Crida des de loop(). Gestiona el cicle TRIG→ECHO sense bloqueig.
// Retorna true si hi ha una nova mesura disponible aquest tick.
bool actualitzarUltraso(Ultraso &u);

// Retorna la distància en cm de l'última mesura. -1 si timeout.
float getDistancia(const Ultraso &u);

bool deteccioObjecte(const Ultraso &u, float llindar_cm);

#endif
