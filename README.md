# 🛸 Tello OS: Next-Gen Drone Simulation & AI Ecosystem

<div align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.dot-js&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/YOLOv8-00FFFF?style=for-the-badge&logo=ultralytics&logoColor=black" />
  <img src="https://img.shields.io/badge/GLTF_3D-FFB13B?style=for-the-badge&logo=three.js&logoColor=white" />
</div>

<p align="center">
  <b>A professional-grade, high-fidelity 3D drone simulator integrated with YOLOv8 Intelligence.</b><br />
  Test autonomous flight logic, computer vision detection, and custom parkour designs in a zero-risk virtual hangar.
</p>

---

## 📽️ Visual Journey

<div align="center">
  <h3>Simulator Environment</h3>
  <p><i>High-fidelity 3D parkour with real-time physics and collision detection.</i></p>
  <img src="public/tello3d.png" width="92%" style="border-radius: 12px; border: 1px solid #30363d;" />
</div>

<br />

<div align="center">
  <h3>AI Computer Vision</h3>
  <p><i>Real-time YOLOv8 sign detection and autonomous hazard avoidance.</i></p>
  <img src="public/tellopy.png" width="75%" style="border-radius: 12px; border: 1px solid #30363d;" />
</div>

---

## ✨ Key Features (v2.0)

- **🚀 Remote Autonomous Launch:** Press **'T'** in the browser to trigger both simulator takeoff and Python AI logic.
- **🚁 Pro-Grade 3D Model:** Integrated a high-detail `.glb` drone model with synchronized propeller animations.
- **🎨 Advanced Object Designer:** Create custom walls with **Elevation (Y-axis)** control for aerial obstacles.
- **🧠 Integrated AI View:** See the processed YOLO frames directly in the web UI sidebar.
- **💡 Interactive Tips System:** Neon-themed guide panel explaining all simulator interactions.
- **📍 Dynamic Waypoint Path:** Neon-dashed route that updates automatically during map editing.

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[Web Simulator] ---|WS Bridge| B[Python Tello Bridge]
    B --- C[YOLOv8 Vision Processing]
    C --- D[Flight Logic]
    D --- B
```

---

## 🎮 Control Center

| Action | Control |
| :--- | :--- |
| **Move Object** | Click + Drag (Ground) |
| **Elevate Object** | **ALT + Click + Drag** (Vertical) |
| **T Key** | Remote Start (Takeoff & AI) |
| **L Key** | Land Drone |
| **F5** | Reset Simulation |

---

## 🚀 Getting Started

1. **Launch Web:** `npm install && npm run dev`
2. **Launch AI:** `python sim_test.py`

---

<div align="center">
  <small>Built for Drone Innovation, CV Research & Professional Simulations</small>
</div>
