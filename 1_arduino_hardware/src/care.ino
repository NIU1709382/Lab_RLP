#include <Servo.h>
#include "control_servo.h"

//constants
const int PIN_SERVO = 9;

//variables
Servo servo1;

void setup(){

    inicialitzarServo(PIN_SERVO, servo1);

}


void loop(){
    moureServo(0, 180, servo1);
    moureServo(180, 0, servo1);
}