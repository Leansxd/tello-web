# 🛸 Tello-Web: Otonom Drone Simülasyonu ve Görev Kontrolü

Tello-Web, DJI Tello dronları için geliştirilmiş, **Three.js** tabanlı yüksek kaliteli bir 3D simülasyon ortamı ve **YOLOv8** entegrasyonlu otonom uçuş kontrol sistemidir. Bu proje, hem sanal hem de gerçek dünyada otonom görevlerin test edilmesini sağlar.

---

## 🌟 Öne Çıkan Özellikler

*   **🕹️ Pro Parkur Simülatörü:** Three.js ile geliştirilmiş, akıcı 3D grafiklere sahip fizik tabanlı simülasyon.
*   **🧠 YOLOv8 Otonom Navigasyon:** Yapay zeka ile yön levhalarını (yukarı, aşağı, sol, sağ) ve yangın/duman tehlikelerini gerçek zamanlı algılama.
*   **🛠️ Görev Düzenleyici (Mission Editor):** Sürükle-bırak yöntemiyle parkur oluşturma ve haritaları yerel depolama (LocalStorage) üzerinden kaydetme/yükleme.
*   **🎥 FPV Görüntü Aktarımı:** Simülasyondaki drona takılı kameradan Python tarafına WebSocket üzerinden 30 FPS görüntü akışı.
*   **🌉 Tello Bridge:** Python ve Web dünyasını birbirine bağlayan, `djitellopy` API'si ile uyumlu haberleşme katmanı.

---

## 🛠️ Teknoloji Yığını

*   **Frontend:** [Vite](https://vitejs.dev/), [Three.js](https://threejs.org/), Vanilla CSS (Modern UI)
*   **Backend / AI:** Python 3.10+, [Ultralytics YOLOv8](https://ultralytics.com/), OpenCV, WebSockets
*   **Modeller:** YOLOv8 Nano (`best.pt` - işaretler, `fire.pt` - yangın tespiti)

---

## 🚀 Kurulum ve Çalıştırma

### 1. Web Simülatörünü Başlatın
```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu çalıştırın
npm run dev
```
Tarayıcınızda `http://localhost:5173` adresini açın.

### 2. Python AI Sistemini Hazırlayın
Gerekli Python paketlerini yükleyin:
```bash
pip install ultralytics opencv-python websockets numpy
```

### 3. Otonom Modu Başlatın
Web arayüzü açıkken (Bridge bağlantısı kurulduğunda) şu komutu çalıştırın:
```bash
python sim_test.py
```

---

## 🎮 Kontroller

### Simülatör Kamera Kontrolleri
*   **Sol Tık + Sürükle:** Kamerayı döndür
*   **W / A / S / D:** Kamera hareketi (Noclip modu)
*   **Q / E:** Yükseklik (Yukarı / Aşağı)

### Parkur Düzenleme
*   **Nesne Üzerine Tıkla:** Seçer ve sürükleme moduna geçer.
*   **Nesne Listesi (Sol Panel):** Yeni nesneler ekler (Yukarı/Aşağı duvar, Yangın).
*   **SİL:** Seçili nesneyi kaldırır.
*   **KAYDET:** Parkur düzenini kalıcı olarak saklar.

### Otonom Kontrol (sim_test.py)
*   **T:** Kalkış (Takeoff)
*   **L:** İniş (Land)
*   **Q:** Programı Kapat

---

## 📂 Dosya Yapısı

*   `src/main.js`: Simülasyon motoru ve 3D mantığı.
*   `bridge.py`: WebSocket sunucusu ve Tello API emülatörü.
*   `sim_test.py`: YOLOv8 tabanlı otonom karar verme mantığı.
*   `public/`: 3D modeller (`.glb`) ve dokular.
*   `best.pt` & `fire.pt`: Eğitilmiş YOLOv8 ağırlıkları.

---

## 🛡️ Güvenlik ve Failsafe
Sistem, batarya seviyesi %10'un altına düştüğünde veya tehlike (yangın) tespit edildiğinde otonom olarak iniş yapacak şekilde yapılandırılmıştır.

---

> [!TIP]
> Daha iyi AI performansı için simülatördeki "FPV" kamerasının temiz bir görüşe sahip olduğundan emin olun. Parkuru düzenlerken işaretlerin dronun rotası üzerinde dik durmasına dikkat edin.
