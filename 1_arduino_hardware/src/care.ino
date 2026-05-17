#include <Servo.h>
#include "control_servo.h"
#include "control_ultraso.h"


//constants
const int PIN_SERVO = 9;
const int PIN_ECHO = 11;
const int PIN_TRIG = 12;

//variables
Servo servo1;

void setup(){

    Serial.begin(9600);

    inicialitzarServo(PIN_SERVO, servo1);
    inicialitzarUltraso(PIN_ECHO, PIN_TRIG);


}


void loop(){
    //moureServo(0, 180, servo1);

    float distancia = mesuraDistancia(PIN_ECHO, PIN_TRIG);

    if(deteccioObjecte(distancia, 20)){
        Serial.print("Objeto detectat a: ");
        Serial.print(distancia);
        Serial.println(" cm");
        moureServo(0, 180, servo1);
    }
    else{
        Serial.println("Cap objecte detectat");
    }

    delay(500); // Espera entre lectures

}