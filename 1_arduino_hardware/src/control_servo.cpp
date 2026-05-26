#include <Arduino.h>
#include <Servo.h>
#include "control_servo.h"

void inicialitzarServo(int pin, Servo &servo){

    servo.attach(pin);

}


void moureServo(int inici, int final, Servo &servo){

    if(inici < final){

        for (int pos = inici; pos <= final; pos += 1) {
        servo.write(pos);              // va a la posició pos
        delay(15);                       // Espera 15ms para que el motor llegue
        }
    }
    else{

        for (int pos = inici; pos >= final; pos -= 1) {
        servo.write(pos);              // va a la posició pos
        delay(15);                       // Espera 15ms
        }

    }


}

void anarPosicio(int angle, Servo &servo){
    servo.write(angle);
}
