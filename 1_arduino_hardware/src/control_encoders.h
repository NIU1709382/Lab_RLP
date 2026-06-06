#ifndef CONTROL_ENCODERS_H
#define CONTROL_ENCODERS_H

#include <Arduino.h>

// Inicialitza l'encoder (id: 0 o 1)
void inicialitzarEncoder(int encA, int encB, int id);

// Lectura atòmica (segura des del loop principal)
long getEncoderCount(int id);

// Reset atòmic
void resetEncoder(int id);

#endif
