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


void loop(){

    //prova ultraso + servo
    //float distancia = mesuraDistancia(PIN_ECHO1, PIN_TRIG1);

    //if(deteccioObjecte(distancia, 20)){
       // Serial.print("Objeto detectat a: ");
        //Serial.print(distancia);
        //Serial.println(" cm");
        //moureServo(0, 180, servo1);
    //}
    //else{
        //Serial.println("Cap objecte detectat");
    //}

    //delay(500); // Espera entre lectures

    //prova servos conjunt

    moureServo(0, 0);
    delay(1000);

    moureServo(0, 90);
    delay(1000);

    moureServo(0, 180);
    delay(1000);

    moureServo(1, 0);
    delay(1000);

    moureServo(1, 90);
    delay(1000);

    moureServo(1, 180);
    delay(1000);

    //prova motor
    //motorEndavant(RPWM1, LPWM1, 150);

    //delay(2000);

    //pararMotor(RPWM1, LPWM1);

    //delay(1000);

    //motorEnrere(RPWM1, LPWM1, 150);

    //delay(2000);

    //pararMotor(RPWM1, LPWM1);

    //delay(1000);

}