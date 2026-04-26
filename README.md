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

## ✨ New Features (v2.0)

- **🚀 Remote Autonomous Launch:** Press **'T'** in the browser to trigger both simulator takeoff and Python AI logic simultaneously.
- **🚁 Pro-Grade 3D Model:** Integrated a high-detail `.glb` drone model with synchronized propeller animations and FPV camera alignment.
- **🎨 Advanced Object Designer:** Create custom walls/signs with real-time preview. Includes **Elevation (Y-axis)** control to create aerial obstacles.
- **🧠 Integrated AI View:** See what the Python AI sees directly in the web UI. Real-time processed frames with YOLO bounding boxes.
- **💡 Interactive Tips System:** A paginated, neon-themed guide panel explaining every feature from controls to map editing.
- **📍 Dynamic Waypoint Path:** Neon-dashed flight route that automatically updates as you move or elevate targets.

---

## 🏗️ System Architecture

The ecosystem consists of a **Three.js Web Terminal** and a **Python Intelligence Layer** communicating via a low-latency WebSocket bridge.

```mermaid
graph TD
    A[Web Simulator (Three.js)] <-->|WS Bridge| B[Python Tello Bridge]
    B --> C[YOLOv8 Vision Processing]
    C --> D[Autonomous Flight Logic]
    D --> B
    
    subgraph Browser UI
    A
    end
    
    subgraph AI Intelligence
    C
    D
    end
```

---

## 🎮 Control Center

### 🖱️ Mouse & Designer
| Action | Control |
| :--- | :--- |
| **Rotate View** | Left Click + Drag |
| **Pan View** | Right Click + Drag |
| **Zoom** | Scroll Wheel |
| **Move Object** | Click + Drag (Ground) |
| **Elevate Object** | **ALT + Click + Drag** (Vertical) |

### ⌨️ Keyboard Commands
| Key | Action |
| :--- | :--- |
| **T** | Remote Start (Takeoff & AI Launch) |
| **L** | Land Drone |
| **W/A/S/D** | Fly Free (Manual Noclip Camera) |
| **F5** | Reset Simulation |

---

## 🚀 Getting Started

### 1. Launch Web Environment
```bash
npm install && npm run dev
```

### 2. Launch Python AI Intelligence
```bash
pip install ultralytics opencv-python websockets numpy
python sim_test.py
```

---

## 📊 Performance Specs

| Metric | Target | Status |
| :--- | :--- | :--- |
| AI Stream | 30-45 FPS | ✅ Optimized |
| 3D Rendering | 60 FPS | ✅ Stable |
| Sync Latency | < 15ms | ✅ Real-time |

---

> [!IMPORTANT]
> **Map Editing:** Always use the **SAVE** button to download your custom layouts. You can restore them anytime using the **LOAD** feature.

<div align="center">
  <small>Built for Drone Innovation, CV Research & Professional Simulations</small>
</div>
