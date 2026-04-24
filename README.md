# 🛸 Tello-Web: Autonomous Drone Simulation

<div align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.dot-js&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/YOLOv8-00FFFF?style=for-the-badge&logo=ultralytics&logoColor=black" />
</div>

<p align="center">
  <b>A professional-grade 3D drone simulator and autonomous control ecosystem.</b><br />
  Designed for zero-risk testing of AI-driven drone missions and computer vision research.
</p>

---

## 🌐 Overview
**Tello-Web** is a comprehensive simulation platform designed to bridge the gap between virtual development and real-world DJI Tello drone missions. By utilizing **Three.js** for a physics-accurate 3D environment and **YOLOv8** for real-time computer vision, it provides a robust testing ground for autonomous flight algorithms without the risk of physical damage.

---

## 🏗️ Core Components

### 1. 🕹️ 3D Simulator (The Environment)
Built with **Vite** and **Three.js**, the simulator provides a realistic physics environment. It handles:
- **Drone Dynamics:** Accurate flight physics including inertia, drag, and gravity.
- **FPV Camera:** A virtual 720p camera mounted on the drone that streams live frames to the AI module.
- **Collision System:** Real-time detection of walls, obstacles, and hazards.

### 2. 🧠 Intelligence Layer (The Brain)
The Python-based backend serves as the drone's brain:
- **Object Detection:** Powered by **YOLOv8 Nano**, trained specifically to detect directional signs (Up, Down, Left, Right, Forward) and hazards (Fire, Smoke).
- **Control Loop:** Processes FPV frames, analyzes detection results, and calculates the next movement vector.
- **Failsafe System:** Monitors flight telemetry to prevent crashes or respond to hazardous environments.

### 3. 🌉 Tello Bridge (The Communication)
A low-latency **WebSocket** layer that synchronizes the Web UI and Python backend. It is designed to be API-compatible with `djitellopy`, making it easy to transition from simulation to real hardware.

---

## 📽️ Visual Journey

<div align="center">
  <h3>Simulator Environment</h3>
  <p><i>High-fidelity 3D parkour with real-time physics and collision detection.</i></p>
  <img src="public/tello3d.png" width="92%" style="border-radius: 12px; border: 1px solid #30363d; box-shadow: 0 8px 24px rgba(0,0,0,0.3);" />
</div>

<br />

<div align="center">
  <h3>AI Computer Vision</h3>
  <p><i>Real-time YOLOv8 sign detection and autonomous hazard avoidance.</i></p>
  <img src="public/tellopy.png" width="75%" style="border-radius: 12px; border: 1px solid #30363d; box-shadow: 0 8px 24px rgba(0,0,0,0.3);" />
</div>

---

## 🛠️ Mission Editor
The built-in editor allows users to create complex parkour courses without touching a single line of code:
- **Drag-and-Drop:** Intuitive interface for placing walls, signs, and hazards.
- **Map Persistence:** Save your custom maps to **LocalStorage** and share them as JSON files.
- **Infinite Variety:** Test your AI logic against an endless combination of mission scenarios.

---

## 🛰️ Autonomous Flight Logic
The drone follows a sophisticated decision-making process:
1. **Frame Capture:** The simulator captures a frame from the drone's FPV camera.
2. **Detection:** YOLOv8 analyzes the frame to find directional signs.
3. **Target Locking:** Once a sign is detected and confirmed (confidence > 0.6), the system locks onto it.
4. **Maneuvering:** The drone adjusts its pitch, yaw, and throttle to follow the direction indicated by the sign.
5. **Hazard Avoidance:** If fire or smoke is detected, the drone triggers an immediate emergency landing or reroutes.

---

## 📊 Performance Specs

| Metric | Target | Status |
| :--- | :--- | :--- |
| Video Stream | 30 FPS | ✅ Stable |
| AI Inference | < 25ms | ✅ Real-time |
| Latency | < 10ms | ✅ Ultra-low |
| Physics Loop | 60 Hz | ✅ Fluid |

---

## 🚀 Getting Started

### 1. Web Environment
```bash
npm install && npm run dev
```

### 2. Python Environment
```bash
pip install ultralytics opencv-python websockets numpy
python sim_test.py
```

---

## 🎮 Control Guide

| Key | Web Action | Python Action |
| :--- | :--- | :--- |
| **W/A/S/D** | Move Camera | Manual Override |
| **Q/E** | Altitude | Hover Logic |
| **T / L** | - | Takeoff / Land |
| **Delete** | Remove Object | - |

---

> [!TIP]
> **Technical Note:** For optimal detection, the AI model performs best when directional signs occupy at least 15% of the frame area. Ensure your parkour paths allow for a clear approach vector.

---

<div align="center">
  <sub>Developed with ❤️ by <b>Leansxd</b></sub><br />
  <small>Built for Drone Innovation & AI Research</small>
</div>