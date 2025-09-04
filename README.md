# ESP32 Pin Configuration Simulator
This project is a full-stack IoT application that combines a detailed 3D web interface with a physical ESP32 microcontroller. The goal is to provide a complete, hands-on experience by bridging the gap between a virtual simulator and real-world hardware, allowing for remote pin control and visualization.

> Note:  This project is a work in progress and has not been fully completed. The key issues are outlined below.

-----------------------------------------------------------------------------------------------------------------------------------

## Key Features
* **Interactive 3D Web Interface**: An intuitive web app with a 3D model of the ESP32 for easy pin selection and configuration.

* **Embedded Web Server**: A lightweight web server runs directly on the ESP32, which serves all the web files.

* **Hardware Integration**: The front-end is designed to communicate with the ESP32's server, enabling real-time control of the device's GPIO pins.

-----------------------------------------------------------------------------------------------------------------------------------

## Technical Problems
The project is currently not finished due to significant technical problems with resource limitations on the ESP32.

* **File Size Limitation**: The primary `.glb` 3D model file is too large to be uploaded to the ESP32's flash memory. This prevents the embedded web server from serving the model, making the core visualization feature non-functional in the final hardware implementation.

* **IDE Integration Issues**: Efforts to integrate the project directly into the Arduino IDE were unsuccessful due to the same file size constraint, as the IDE's framework could not handle the large asset.

### Proposed Solutions
To resolve these issues and complete the project, the following solutions are being considered:

* **3D Model Optimization**: Use 3D modeling software like Blender to perform polygon decimation, drastically reducing the number of vertices and faces in the model.

* **Texture Compression**: Optimize and compress the model's textures using technologies like WebP or JPEG, as texture files often account for the majority of the total size.

* **Draco Compression**: Apply Draco compression to the `.glb` file. This open-source library is specifically designed to compress 3D meshes and can significantly reduce the file size without a noticeable loss of visual quality.

-----------------------------------------------------------------------------------------------------------------------------------

## Technologies Used
* **Embedded C++ (Arduino Framework)**: For the microcontroller logic and the embedded web server running on the ESP32.

* **HTML, CSS, JavaScript**: To build the interactive 3D web interface.

* **Vite**: Used as the modern build tool for a fast and efficient front-end development environment.

* **Node.js & npm**: To manage project dependencies.

-----------------------------------------------------------------------------------------------------------------------------------

## Getting Started
This project has two main parts: the Arduino sketch for the ESP32 and the web files for the user interface.

### To View Locally (Frontend Only)
If you want to view the web interface and explore the 3D model without the hardware component, follow these steps:

1. **Clone the repository**:
```bash
git clone https://github.com/flaviuspaun19/ESP32-PinConfiguration.git
```
2. **Go into the project**:
```bash
cd ESP32-PinConfiguration
```
3. **Install dependencies**:
```bash
npm install
```
4. **Start the development server**:
```bash
npm run dev
```

The simulator will be available in your browser, typically at `http://localhost:5173`.

### To use with the ESP32 Hardware
The following steps are for using the project with the physical ESP32, but please be aware of the technical problems noted above.

1. **Prepare the ESP32**: Open the Arduino IDE and load the sketch from the src/ directory.

> Note: The web assets from the data/ folder cannot be uploaded to the ESP32 due to their size.

2. **Upload the code**: Upload the Arduino sketch to your ESP32.

3. **Connect & Test**: Connect to the ESP32's Wi-Fi access point or join the same local network and then access it by navigating to the ESP32's IP adress in your browser.
  
