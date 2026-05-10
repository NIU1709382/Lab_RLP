// Definim pins
const int pinecho = 11;
const int pintrig = 12;

//variables
float durada;
float distancia;

void setup() {
  Serial.begin(9600);       
  pinMode(pintrig, OUTPUT); //emet soroll
  pinMode(pinecho, INPUT);  // rep soroll
}

void loop() {
  // netejem trig
  Serial.print("Comencem");
  digitalWrite(pintrig, LOW);
  delayMicroseconds(2);
  
  // envia senyal durant 10 ms
  digitalWrite(pintrig, HIGH);
  delayMicroseconds(10);
  digitalWrite(pintrig, LOW);
  
  //calcula quant triga en tornar
  durada = pulseIn(pinecho, HIGH);
  
  distancia = (durada * 0.034) / 2;
  
  // Lógica de detección
  if (distancia < 20) {
    Serial.print("Objeto detectat a: ");
    Serial.print(distancia);
    Serial.println(" cm");
  } else {
    Serial.println("Cap objecte detectat");
  }
  
  delay(500); // Espera entre lectures
}