#ifndef CONTROL_ENCODERS_H
#define CONTROL_ENCODERS_H

#include <Arduino.h>

// inicialitza un encoder
void inicialitzarEncoder(int encA, int encB, int id);

// lectura
long getEncoderCount(int id);

// reset
void resetEncoder(int id);

#endif