#include <Servo.h>

Servo servo1;  

void setup() {
  servo1.attach(9);  // connectat al pin9
}

void loop() {
  // Gira de 0 a 180 graus
  for (int pos = 0; pos <= 180; pos += 1) {
    servo1.write(pos);              // va a la posició pos
    delay(15);                       // Espera 15ms para que el motor llegue
  }
  
  // Gira de 180 a 0 graus
  for (int pos = 180; pos >= 0; pos -= 1) {
    servo1.write(pos);              // va a la posició pos
    delay(15);                       // Espera 15ms
  }
}