#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

#include "control_servo_conjunt.h"

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

#define SERVOMIN  150
#define SERVOMAX  590

void inicialitzarServos() {
    Wire.begin();
    pwm.begin();
    pwm.setPWMFreq(50);

}


//cada servo té un canal assignat
void moureServo(int canal, int angle) {

    int pulse = map(angle, 0, 180, SERVOMIN, SERVOMAX);

    pwm.setPWM(canal, 0, pulse);

}

void movimentCelles(){
    //dreta
    moureServo(0, 0);
    //esquerra
    moureServo(1, 80);
    delay(1000);

    //dreta
    moureServo(0, 80);
    //esquerra
    moureServo(1, 0);
    delay(1000);

}

void movimentUlls(){
    //dreta
    moureServo(2, 5);
    //esquerra
    moureServo(3, 50);
    delay(1000);

    //dreta
    moureServo(2, 30);
    //esquerra
    moureServo(3, 25);
    delay(1000);

}

void medRec1(){
    moureServo(4, 145);
    delay(1000);
    moureServo(4, 60);
    delay(1000);
}

void medRec2(){
    moureServo(5, 135);
    delay(1000);
    moureServo(5, 50);
    delay(1000);

}

void medCercle1(){
    moureServo(4, 35);
    delay(1000);
    moureServo(4, 120);
    delay(1000);

}

void medCercle2(){
    moureServo(5, 25);
    delay(1000);
    moureServo(5, 110);
    delay(1000);

}