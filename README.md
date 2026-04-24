# 🛸 Tello-Web: Autonomous Drone Simulation & Mission Control

<div align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.dot-js&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/YOLOv8-00FFFF?style=for-the-badge&logo=ultralytics&logoColor=black" />
</div>

---

### 🌐 Overview
**Tello-Web** is a high-performance, Three.js-based 3D simulation environment and autonomous flight control system integrated with **YOLOv8**. Designed for DJI Tello drones, it bridges the gap between virtual testing and real-world autonomous missions.

---

## ✨ Key Features

- **🕹️ Professional Parkour Simulator:** Physics-based 3D simulation with fluid graphics powered by Three.js.

![Tello Drone](public/tello3d.png)

- **🧠 YOLOv8 Autonomous Navigation:** Real-time AI detection of directional signs (Up, Down, Left, Right) and fire/smoke hazards.
- **🛠️ Mission Editor:** Create custom parkour courses using drag-and-drop. Save and load maps via LocalStorage.
- **🎥 FPV Video Streaming:** Live 30 FPS camera feed from the drone to the Python backend via WebSockets.

![Tello Drone](public/tellopy.png)

- **🌉 Tello Bridge:** A robust communication layer compatible with the `djitellopy` API, connecting Web and Python ecosystems.

---

## 🚀 Getting Started

### 1. Launch the Web Simulator
Initialize the frontend development environment:
```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Prepare the AI Backend
Install the required Python packages:
```bash
pip install ultralytics opencv-python websockets numpy
```

### 3. Initiate Autonomous Flight
Ensure the Web UI is running (Bridge connection established), then execute:
```bash
python sim_test.py
```

---

## 🎮 Control Guide

### Simulator Camera
| Key | Action |
| :--- | :--- |
| **Left Click + Drag** | Rotate Camera |
| **W / A / S / D** | Movement (Noclip) |
| **Q / E** | Altitude (Up / Down) |

### Course Editor
- **Click on Object:** Select and enter drag mode.
- **Left Panel:** Add new elements (Walls, Directional Signs, Hazards).
- **DELETE:** Remove selected object.
- **SAVE:** Persist the parkour layout.

### Autonomous Mode (`sim_test.py`)
- **T:** Takeoff
- **L:** Land
- **Q:** Terminate Program

---

## 🏗️ Technology Stack

- **Frontend:** [Vite](https://vitejs.dev/), [Three.js](https://threejs.org/), Vanilla CSS
- **Backend / AI:** Python 3.10+, [Ultralytics YOLOv8](https://ultralytics.com/), OpenCV, WebSockets
- **Models:** YOLOv8 Nano (`best.pt` for signs, `fire.pt` for hazard detection)

---

## 🛡️ Safety & Failsafe
The system is equipped with an automated failsafe mechanism. The drone will automatically land if:
- Battery level drops below **10%**.
- A critical hazard (fire) is detected within close proximity.

---

> [!TIP]
> For optimal AI performance, ensure the **FPV camera** in the simulator has a clear line of sight. Align directional signs vertically along the drone's intended path for better detection accuracy.

---