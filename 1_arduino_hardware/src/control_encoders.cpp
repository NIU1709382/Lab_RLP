#include "control_encoders.h"

// suport per tenir 2 encoders
volatile long encoderCount[2] = {0, 0};

int encoderA_pin[2];
int encoderB_pin[2];

// ISR encoder 0
void ISR_encoder0() {
  if (digitalRead(encoderB_pin[0])) encoderCount[0]++;
  else encoderCount[0]--;
}

// ISR encoder 1
void ISR_encoder1() {
  if (digitalRead(encoderB_pin[1])) encoderCount[1]++;
  else encoderCount[1]--;
}

void inicialitzarEncoder(int encA, int encB, int id) {

  encoderA_pin[id] = encA;
  encoderB_pin[id] = encB;

  pinMode(encA, INPUT_PULLUP);
  pinMode(encB, INPUT_PULLUP);

  if (id == 0) {
    attachInterrupt(digitalPinToInterrupt(encA), ISR_encoder0, RISING);
  } else if (id == 1) {
    attachInterrupt(digitalPinToInterrupt(encA), ISR_encoder1, RISING);
  }
}

long getEncoderCount(int id) {
  return encoderCount[id];
}

void resetEncoder(int id) {
  encoderCount[id] = 0;
}