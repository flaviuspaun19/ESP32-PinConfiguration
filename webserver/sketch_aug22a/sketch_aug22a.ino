  #include "WiFi.h"
#include "SPIFFS.h"
#include "ESPAsyncWebServer.h"
#include "ArduinoJson.h"

const int ledPin = 2;

const char *ssid = "Flav";
const char *password = "12345678";

char *ledState = (char *)"OFF";

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

void notifyClients()
{
  ws.textAll(ledState);
}

void handleJSON(const String &msg)
{
  StaticJsonDocument<200> doc;
  DeserializationError err = deserializeJson(doc, msg);

  if (err)
  {
    Serial.println("JSON parse failed.");
    return;
  }

  const char *name = doc["name"];
  int age = doc["age"];

  Serial.println("Received JSON Object:");
  Serial.printf("name: %s\n", name);
  Serial.printf("age: %d\n", age);
}

void onWsEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len)
{
  if (type == WS_EVT_CONNECT)
  {
    Serial.println("WebSocket client connection received");
  }
  else if (type == WS_EVT_DISCONNECT)
  {
    Serial.println("WebSocket client connection finished");
  }
  else if (type == WS_EVT_DATA)
  {
    String msg;
    for (size_t i = 0; i < len; i++)
    {
      msg += (char)data[i];
    }
    Serial.println("Received: " + msg);

    if (msg == "toggleON")
    {
      ledState = (char *)"ON";
      digitalWrite(ledPin, HIGH);
      notifyClients();
    }
    else if (msg == "toggleOFF")
    {
      ledState = (char *)"OFF";
      digitalWrite(ledPin, LOW);
      notifyClients();
    }
    else if (msg.startsWith("{"))
    {
      handleJSON(msg);
      return;
    }
    else
    {
      Serial.print("Received message from web: ");
      Serial.println(msg);
      String confirmationMessage = "Mesajul '" + msg + "' a ajuns cu succes!";
      client->text(confirmationMessage);
    }
  }
}

void initWebServer()
{
  if (!SPIFFS.begin(true))
  {
    Serial.println("An error has occurred while mounting SPIFFS");
    return;
  }
  else
  {
    Serial.println("SPIFFS mounted successfully");
  }

  server.addHandler(&ws);

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/index.html", "text/html");
  });

  server.on("/models/esp32.glb", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/models/esp32_draco.glb", "model/gltf-binary");
  });

  server.serveStatic("/", SPIFFS, "/");

  ws.onEvent(onWsEvent);

  server.begin();
}

void setup()
{
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);
  WiFi.begin(ssid, password);
  delay(5000);
  //Serial.println(WiFi.softAPIP());
  initWebServer();

  while(WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(1000);
  }
  Serial.println();
  Serial.println("WiFi connected");
  Serial.println("Ip Adress: ");
  Serial.println(WiFi.localIP());
  Serial.print("Total space: ");
  Serial.print(SPIFFS.totalBytes());
  Serial.println(" bytes");
  Serial.print("Used space: ");
  Serial.print(SPIFFS.usedBytes());
  Serial.println(" bytes");
}

void loop()
{
}
