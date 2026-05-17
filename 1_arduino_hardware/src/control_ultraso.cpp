#include <Arduino.h>
#include "control_ultraso.h"

void inicialitzarUltraso(int pinecho, int pintrig)
{
    pinMode(pintrig, OUTPUT); //emet soroll
    pinMode(pinecho, INPUT);  // rep soroll

}

float mesuraDistancia(int pinecho, int pintrig){

    long durada;
    float distancia;
    // netejem trig
    digitalWrite(pintrig, LOW);
    delayMicroseconds(2);
    
    // envia senyal durant 10 ms
    digitalWrite(pintrig, HIGH);
    delayMicroseconds(10);
    digitalWrite(pintrig, LOW);
    
    //calcula quant triga en tornar
    durada = pulseIn(pinecho, HIGH);
    
    distancia = (durada * 0.034) / 2;

    return distancia; 

}

bool deteccioObjecte(float distancia, float llindar){
    return distancia < llindar;

}