#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

#include "control_servo_conjunt.h"

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

#define SERVOMIN  100
#define SERVOMAX  500

void inicialitzarServos() {

    pwm.begin();
    pwm.setPWMFreq(50);

}

//cada servo té un canal assignat
void moureServo(int canal, int angle) {

    int pulse = map(angle, 0, 180, SERVOMIN, SERVOMAX);

    pwm.setPWM(canal, 0, pulse);

}