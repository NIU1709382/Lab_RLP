#ifndef CONTROL_ENCODERS_H
#define CONTROL_ENCODERS_H
#include <Arduino.h>

void inicialitzarEncoder(int pin_a, int pin_b, int index);
void resetEncoder(int index);
long getEncoderCount(int index);

#endif
