/*
* Feito para o projeto Passa ou Repassa - Professor THIAGO
* Feira cultural IEPAM 2024
* TURMA DO 8° ANO
* FEITO POR "HIRO" (MATHEUS)
*/

const int button1Pin = 7;
const int button2Pin = 8;
const int buttonMiscPin = 2;

bool button1State = false;
bool button2State = false;
bool buttonMiscState = false;

bool button1PrevState = false;
bool button2PrevState = false;
bool buttonMiscPrevState = false;

void setup() {
  Serial.begin(115200);

  pinMode(button1Pin, INPUT_PULLUP);
  pinMode(button2Pin, INPUT_PULLUP);
  pinMode(buttonMiscPin, INPUT_PULLUP);
}

void loop() {
  checkButtons();
  serialPing();
}

void checkButtons() {
  button1State = digitalRead(button1Pin) == LOW;
  button2State = digitalRead(button2Pin) == LOW;
  buttonMiscState = digitalRead(buttonMiscPin) == LOW;
  
  if (button1State && !button1PrevState) {
    sendButtonPress(1);
  }
  
  button1PrevState = button1State;
  
  if (button2State && !button2PrevState) {
    sendButtonPress(2);
  }

  button2PrevState = button2State;

  if (buttonMiscState && !buttonMiscPrevState) {
    sendButtonPress(3);
  }

  buttonMiscPrevState = buttonMiscState;
}

void sendButtonPress(int buttonID) {
  String data = String(buttonID);
  Serial.println(data);
}


void serialPing() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    if (command == "PI") {
      Serial.println("PO");
    }
  }
}