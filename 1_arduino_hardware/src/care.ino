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

//mode inicial
int mode = 0;

void testServos();
void testMotors();
void testUltrasons();
void testEncoders();


void mostrarMenu() {

    Serial.println("===== MENU =====");
    Serial.println("1 - Tests servos");
    Serial.println("2 - Tests motors");
    Serial.println("3 - Tests ultrasons");
    Serial.println("4 - Tests encoders");
    Serial.println("5 - Moviment Celles");
    Serial.println("6 - Moviment Ulls");
    Serial.println("7 - Medicació rect 1");
    Serial.println("8 - Medicació cercle 1");
    Serial.println("9 - Medicació rect 2");
    Serial.println("10 - Medicació cercle 2");

    Serial.println("0 - Sortir");
    Serial.println("================");
}


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

    mostrarMenu();

}


void loop(){

    // LLEGIR SERIAL
    if (Serial.available()) {
        char c = Serial.read();
        mode = c - '0';

        Serial.print("Mode seleccionat: ");
        Serial.println(mode);
    }

    switch(mode) {

        case 1:
            testServos();
            break;

        case 2:
            testMotors();
            break;

        case 3:
            testUltrasons();
            break;

        case 4:
            testEncoders();
            break;
        case 5:
            movimentCelles();
            break;
        case 6:
            movimentUlls();
            break;
        case 7:
            medRec1();
            break;

        case 8:
            medCercle1();
            break;
        case 9:
            medRec2();
            break;
        case 10:
            medCercle2();
            break;

        case 0:
            pararMotor(RPWM1, LPWM1);
            pararMotor(RPWM2, LPWM2);
            break;
        default:
            Serial.println('Mode incorrecte');
            break;
    }
    
}


void testServos(){

    moureServo(8, 150);
    delay(1000);


}

void testMotors(){
    motorEndavant(RPWM1, LPWM1, 150);

    delay(2000);

    pararMotor(RPWM1, LPWM1);

    delay(1000);

    motorEnrere(RPWM1, LPWM1, 150);

    delay(2000);

    pararMotor(RPWM1, LPWM1);

    delay(1000);

}

void testUltrasons(){
    float distancia = mesuraDistancia(PIN_ECHO1, PIN_TRIG1);

    if(deteccioObjecte(distancia, 20)){
        Serial.print("Objeto detectat a: ");
        Serial.print(distancia);
        Serial.println(" cm");
    }
    else{
        Serial.println("Cap objecte detectat");
    }

    delay(500); // Espera entre lectures

}

//moure encoder manual i veure si funciona
void testEncoders(){
    Serial.print("Encoder 1: ");
    Serial.println(getEncoderCount(0));

    Serial.print("Encoder 2: ");
    Serial.println(getEncoderCount(1));

    delay(200);
}
