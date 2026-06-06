#include "control_encoders.h"
#include "control_ultraso.h"
#include "control_motor.h"
#include "control_servo_conjunt.h"

//motors
#define ENCODER_A1 3
#define ENCODER_B1 12
#define ENCODER_A2 2
#define ENCODER_B2 13

const int RPWM1 = 9;
const int LPWM1 = 10;
const int RPWM2 = 5;
const int LPWM2 = 6;

//sensors ultraso
const int PIN_ECHO1 = A1;
const int PIN_TRIG1 = A0;
const int PIN_ECHO2 = A3;
const int PIN_TRIG2 = A2;
const int PIN_ECHO3 = 7;
const int PIN_TRIG3 = 8;

void setup(){

    Serial.begin(9600);

    inicialitzarUltraso(PIN_ECHO1, PIN_TRIG1);
    inicialitzarUltraso(PIN_ECHO2, PIN_TRIG2);
    inicialitzarUltraso(PIN_ECHO3, PIN_TRIG3);

    inicialitzarServos();

    inicialitzarMotor(RPWM1, LPWM1);
    inicialitzarMotor(RPWM2, LPWM2);

    inicialitzarEncoder(ENCODER_A1, ENCODER_B1, 0);
    inicialitzarEncoder(ENCODER_A2, ENCODER_B2, 1);

}

void loop() {
  llegirComanda();
}

void llegirComanda() {
  static String buffer = "";
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      processarComanda(buffer);
      buffer = "";
    } else {
      buffer += c;
    }
  }
}

void processarComanda(String cmd) {
  if (cmd == "REC_MED1") {
    medRec1();
  }
  else if (cmd == "REC_MED2") {
    medRec2();
  }
  else if (cmd == "CERCLE_MED1") {
    medCercle1();
  }
  else if (cmd == "CERCLE_MED2") {
    medCercle2();
  }
  else if (cmd == "MOV_CELL") {
    movimentCelles();
  }
  else if (cmd == "MOV_ULLS") {
    movimentUlls();
  }
  else if (cmd == "ENDAVANT"){
    motorEndavant(RPWM1, LPWM1, 150);
    motorEndavant(RPWM2, LPWM2, 150);
  }
  else if (cmd == "ENRERE"){
    motorEnrere(RPWM1, LPWM1, 150);
    motorEnrere(RPWM2, LPWM2, 150);
  }
  else if (cmd == "PARAR"){
    pararMotor(RPWM1, LPWM1);
    pararMotor(RPWM2, LPWM2);
  }
  else {
    Serial.println("Comanda desconeguda");
  }
}