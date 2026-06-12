#include "control_encoders.h"

static volatile long _comptes[2] = {0, 0};
static int _pins_b[2] = {0, 0};

static void isr0() { _comptes[0] += (digitalRead(_pins_b[0]) == HIGH) ? 1 : -1; }
static void isr1() { _comptes[1] += (digitalRead(_pins_b[1]) == HIGH) ? 1 : -1; }

void inicialitzarEncoder(int pin_a, int pin_b, int index) {
    if (index < 0 || index > 1) return;
    _pins_b[index] = pin_b;
    pinMode(pin_a, INPUT_PULLUP);
    pinMode(pin_b, INPUT_PULLUP);
    if (index == 0) attachInterrupt(digitalPinToInterrupt(pin_a), isr0, RISING);
    else            attachInterrupt(digitalPinToInterrupt(pin_a), isr1, RISING);
}

void resetEncoder(int index) {
    if (index < 0 || index > 1) return;
    noInterrupts();
    _comptes[index] = 0;
    interrupts();
}

long getEncoderCount(int index) {
    if (index < 0 || index > 1) return 0;
    noInterrupts();
    long v = _comptes[index];
    interrupts();
    return v;
}
