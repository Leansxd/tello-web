# 🛸 Tello-Web: Autonomous Drone Simulation & Mission Control

<div align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.dot-js&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/YOLOv8-00FFFF?style=for-the-badge&logo=ultralytics&logoColor=black" />
  <img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" />
  <br />
  <img src="https://img.shields.io/github/license/Leansxd/tello-web?style=flat-square&color=blue" />
  <img src="https://img.shields.io/github/stars/Leansxd/tello-web?style=flat-square&color=yellow" />
  <img src="https://img.shields.io/github/v/release/Leansxd/tello-web?style=flat-square&color=green" />
</div>

<p align="center">
  <b>A high-fidelity 3D drone simulator and otonomous control system.</b><br />
  Tested on real-world AI logic, built for the next generation of drone researchers.
</p>

---

## 📍 Quick Navigation
[Overview](#-overview) • [Visual Journey](#-visual-journey) • [System Architecture](#-system-architecture) • [Features](#-key-features) • [Installation](#-getting-started) • [Performance](#-performance-specs)

---

## 🌐 Overview
**Tello-Web** is an advanced simulation ecosystem. It combines the visual power of **Three.js** with the intelligence of **YOLOv8** to create a zero-risk testing ground for DJI Tello autonomous missions.

---

## 📽️ Visual Journey

<div align="center">
  <h3>🕹️ The Simulator Environment</h3>
  <p><i>High-fidelity 3D parkour with real-time physics and collision detection.</i></p>
  <img src="public/tello3d.png" width="92%" style="border-radius: 15px; border: 1px solid #30363d; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
</div>

<br />

<div align="center">
  <h3>🧠 The AI Intelligence</h3>
  <p><i>Real-time YOLOv8 sign detection and hazard avoidance logic.</i></p>
  <img src="public/tellopy.png" width="75%" style="border-radius: 15px; border: 1px solid #30363d; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
</div>

---

## 🏗️ System Architecture

```mermaid
graph LR
    A[Web Simulator] -- "FPV Video (Base64/Binary)" --> B((WebSockets))
    B -- "Processing" --> C[Python Backend / YOLOv8]
    C -- "Autonomous Commands" --> D{Mission Control}
    D -- "Movement Signals" --> B
    B -- "Drone Action" --> A
    
    subgraph Frontend
    A
    end
    
    subgraph Intelligence
    C
    D
    end
```

---

## ✨ Key Features

- **🕹️ Pro Simulator:** Real-time physics and drone dynamics.
- **🛠️ Mission Editor:** Drag-and-drop course creation.
- **🧠 YOLOv8 Nav:** Autonomous sign & hazard detection.
- **🎥 Low Latency:** 30 FPS FPV streaming via WebSockets.
- **🛡️ Failsafe:** Auto-land on low battery or fire hazard.

---

## 📊 Performance Specs

| Component | Target | Status |
| :--- | :--- | :--- |
| **Video Streaming** | 30 FPS | ✅ Stable |
| **AI Inference** | < 25ms | ✅ Real-time |
| **WS Latency** | < 10ms | ✅ Ultra-low |
| **Physics Frequency** | 60Hz | ✅ Fluid |

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

<div align="center">
  <h3>🤝 Contributing</h3>
  <p>Found a bug? Have a feature request? Open an issue or submit a PR!</p>
  <a href="https://github.com/Leansxd/tello-web/issues"><img src="https://img.shields.io/badge/Issues-Open-red?style=for-the-badge" /></a>
  <a href="https://github.com/Leansxd/tello-web/pulls"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" /></a>
</div>

<br />

<div align="center">
  <sub>Developed by <b>Leansxd</b> • Built for Drone Innovation</sub>
</div>