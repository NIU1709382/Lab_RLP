#ifndef CONTROL_ULTRASO_H
#define CONTROL_ULTRASO_H
#include <Arduino.h>

#define ULTRASO_TIMEOUT     -1.0f
#define ULTRASO_INTERVAL_MS  65

struct Ultraso {
    int   pin_trig;
    int   pin_echo;
    float distancia_cm;
    unsigned long ultim_trig;
    bool  esperant_eco;
    unsigned long eco_inici;
    bool  eco_actiu;
};

void  inicialitzarUltraso(Ultraso &u, int pin_trig, int pin_echo);
bool  actualitzarUltraso(Ultraso &u);
float getDistancia(const Ultraso &u);
bool  deteccioObjecte(const Ultraso &u, float llindar_cm);

#endif
