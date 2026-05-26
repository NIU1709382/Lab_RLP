#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

#include "control_servo_conjunt.h"

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

#define SERVOMIN  150
#define SERVOMAX  600

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