# 🛸 Tello-Web: Autonomous Drone Simulation & Mission Control

<div align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.dot-js&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/YOLOv8-00FFFF?style=for-the-badge&logo=ultralytics&logoColor=black" />
  <br />
  <img src="https://img.shields.io/github/license/Leansxd/tello-web?style=flat-square" />
  <img src="https://img.shields.io/github/stars/Leansxd/tello-web?style=flat-square" />
</div>

---

### 🌐 Overview
**Tello-Web** is a high-performance, **Three.js**-based 3D simulation environment and autonomous flight control system integrated with **YOLOv8**. Designed for DJI Tello drones, it bridges the gap between virtual testing and real-world autonomous missions.

---

## 📽️ Visual Journey

### 🕹️ The Simulator
*High-fidelity 3D parkour environment with real-time physics and drone dynamics.*
<p align="center">
  <img src="public/tello3d.png" width="90%" style="border-radius: 15px; border: 1px solid #333;" />
</p>

---

### 🧠 The Intelligence
*Real-time AI vision processing. YOLOv8 detects directional signs and hazards to guide the drone otonomously.*
<p align="center">
  <img src="public/tellopy.png" width="70%" style="border-radius: 15px; border: 1px solid #333;" />
</p>

---

## ✨ Key Features

### 🎮 Simulation & Control
- **🕹️ Professional Parkour Simulator:** Physics-based fluid 3D graphics powered by Three.js.
- **🛠️ Integrated Mission Editor:** Create custom parkour courses via drag-and-drop, save/load maps using **LocalStorage**.
- **🌉 Tello Bridge:** Robust communication layer compatible with the `djitellopy` API.

### 🧠 Autonomous Intelligence
- **🧠 YOLOv8 Navigation:** Real-time detection of directional signs (Up, Down, Left, Right) and hazards (Fire, Smoke).
- **🎥 FPV Live Streaming:** Seamless **30 FPS** video transmission from simulator to Python via WebSockets.
- **🛰️ Mission Logic:** Fully autonomous decision-making and maneuvering based on AI-detected environmental data.

---

## 🚀 Getting Started

### 1. Launch the Web Simulator
```bash
npm install
npm run dev
```

### 2. Prepare AI Backend
```bash
pip install ultralytics opencv-python websockets numpy
```

### 3. Initiate Autonomous Flight
```bash
python sim_test.py
```

---

## 🎮 Control Guide

| Key | Action |
| :--- | :--- |
| **W / A / S / D** | Movement (Free Look) |
| **Q / E** | Altitude (Up / Down) |
| **T / L** | Takeoff / Land (Python) |

---

## 🏗️ Technology Stack

- **Frontend:** Vite, Three.js, Vanilla CSS
- **Backend / AI:** Python 3.10+, YOLOv8, OpenCV, WebSockets

---

<div align="center">
  <sub>Built with ❤️ for Drone Enthusiasts & AI Researchers</sub>
</div>