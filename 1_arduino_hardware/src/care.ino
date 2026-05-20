#include <Servo.h>
#include "control_servo.h"
#include "control_ultraso.h"
#include "control_motor.h"
//#include "control_servo_conjunt.h"


//constants
const int PIN_SERVO1 = 9;
const int PIN_ECHO1 = 11;
const int PIN_TRIG1 = 12;
const int RPWM1 = 5;
const int LPWM1 = 6;
#define ENCODER_A 2
#define ENCODER_B 3


//variables
Servo servo1;

void setup(){

    Serial.begin(9600);

    //inicialitzarServo(PIN_SERVO1, servo1);
    //inicialitzarUltraso(PIN_ECHO1, PIN_TRIG1);
    //inicialitzarServos();
    inicialitzarMotor(RPWM1, LPWM1, ENCODER_A, ENCODER_B);

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

    //moureServo(0, 0);
    //delay(1000);

    //moureServo(0, 90);
    //delay(1000);

    //moureServo(0, 180);
    //delay(1000);

    //prova motor
    motorEndavant(RPWM1, LPWM1, 150);

    delay(2000);

    pararMotor(RPWM1, LPWM1);

    delay(1000);

    motorEnrere(RPWM1, LPWM1, 150);

    delay(2000);

    pararMotor(RPWM1, LPWM1);

    delay(1000);

}