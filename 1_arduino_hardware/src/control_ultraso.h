#ifndef CONTROL_ULTRASO_H
#define CONTROL_ULTRASO_H

void inicialitzarUltraso(int pinecho, int pintrig);
float mesuraDistancia(int pinecho, int pintrig);
bool deteccioObjecte(float distancia, float llindar);


#endif