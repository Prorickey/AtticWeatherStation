#include <Wire.h>
#include <Adafruit_Sensor.h>
#include "Adafruit_BME680.h"
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "*********";
const char* password = "********";

// Server endpoint - Update this to your actual server URL
const char* serverURL = "http://192.168.7.10:3456/api/sensor-data";

// Create BME680 object with I2C
Adafruit_BME680 bme; // default I2C address 0x76

// Timing variables
unsigned long lastReading = 0;
const unsigned long readingInterval = 60 * 1000; // 60 seconds

// Connection retry variables
int wifiRetryCount = 0;
const int maxWifiRetries = 3;
unsigned long lastWifiRetry = 0;
const unsigned long wifiRetryInterval = 30000; // 30 seconds

void setup() {
  Serial.begin(115200);
  while (!Serial);

  // Initialize WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected! IP address: ");
  Serial.println(WiFi.localIP());

  // Initialize the BME680 sensor
  if (!bme.begin()) {
    Serial.println("Could not find a valid BME680 sensor, check wiring!");
    while (1);
  }

  // Set up oversampling and filter initialization
  bme.setTemperatureOversampling(BME680_OS_8X);
  bme.setHumidityOversampling(BME680_OS_2X);
  bme.setPressureOversampling(BME680_OS_4X);
  bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
  bme.setGasHeater(320, 150); // 320°C for 150 ms
  
  Serial.println("BME680 sensor initialized successfully");
}

void loop() {
  // Check WiFi connection and reconnect if necessary
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, attempting to reconnect...");
    WiFi.begin(ssid, password);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 10) {
      delay(1000);
      Serial.print(".");
      attempts++;
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nWiFi reconnected!");
    } else {
      Serial.println("\nFailed to reconnect WiFi");
      return;
    }
  }

  // Check if it's time for a new reading
  unsigned long currentMillis = millis();
  if (currentMillis - lastReading >= readingInterval) {
    lastReading = currentMillis;
    
    // Tell BME680 to begin measurement
    if (!bme.performReading()) {
      Serial.println("Failed to perform reading :(");
      return;
    }

    // Print sensor values to Serial
    Serial.print("Temperature = ");
    Serial.print(bme.temperature);
    Serial.println(" *C");

    Serial.print("Pressure = ");
    Serial.print(bme.pressure / 100.0);
    Serial.println(" hPa");

    Serial.print("Humidity = ");
    Serial.print(bme.humidity);
    Serial.println(" %");

    Serial.print("Gas resistance = ");
    Serial.print(bme.gas_resistance / 1000.0);
    Serial.println(" KOhms");

    // Send data to server
    sendSensorData();
    
    Serial.println("---");
  }
}

void sendSensorData() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    
    http.begin(client, serverURL);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(10000); // 10 second timeout
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["temperature"] = bme.temperature;
    doc["humidity"] = bme.humidity;
    doc["pressure"] = bme.pressure / 100.0; // Convert to hPa
    doc["gasResistance"] = bme.gas_resistance / 1000.0; // Convert to KOhms
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    Serial.println("Sending data: " + jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
      
      if (httpResponseCode == 201) {
        Serial.println("Data sent successfully!");
      } else {
        Serial.println("Server returned error code: " + String(httpResponseCode));
      }
    } else {
      Serial.println("Error sending data. HTTP error code: " + String(httpResponseCode));
      Serial.println("Possible causes: Server not running, network issues, or incorrect URL");
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected - cannot send data");
  }
}
