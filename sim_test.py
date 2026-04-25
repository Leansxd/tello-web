import cv2
import time
import threading
import numpy as np
import os
import sys
import logging
from collections import deque

# ==========================================
# 🛑 SIMULASYON VE TELLO DESTEĞİ
# ==========================================
SIMULASYON_MODU_ZORLA = True 

if SIMULASYON_MODU_ZORLA:
    try:
        from bridge import Tello
        SIMULATION = True
    except ImportError:
        from djitellopy import Tello
        SIMULATION = False
else:
    try:
        from djitellopy import Tello
        SIMULATION = False
    except ImportError:
        from bridge import Tello
        SIMULATION = True

from ultralytics import YOLO
logging.getLogger('djitellopy').setLevel(logging.ERROR)

# ==========================================
# ⚙️ KONFİGÜRASYON SİSTEMİ
# ==========================================
class DroneConfig:
    SAGA_SOLA_MESAFE    = 40
    ILERI_GITME_MESAFE  = 30
    GERI_GITME_MESAFE   = 50
    HEDEF_IDEAL_MESAFE_CM = 80 
    YUKARI_GITME_MESAFE = 700 
    ASAGI_GITME_MESAFE  = 40
    DONUS_ACISI         = 90
    
    BATTERY_FAILSAFE    = 10      
    EKRAN_GENISLIK  = 960 
    EKRAN_YUKSEKLIK = 720
    
    AI_GUVEN_ESIGI    = 0.50    
    FIRE_CONF         = 0.40    # Alevleri daha iyi algılaması için düşürüldü
    SMOKE_CONF        = 0.50    
    AI_IMG_SIZE       = 640     
    ARAMA_HIZI        = 10 if SIMULATION else 20  
    TARAMA_BEKLEME    = 2.0     
    TETIKLEME_GENISLIK = 240 if SIMULATION else 320 
    MAX_YAKLASMA_HIZI = 14 if SIMULATION else 18      
    MIN_YAKLASMA_HIZI = 8      
    
    YATAY_HASSASIYET = 120 
    DIKEY_HASSASIYET = 120 

# ==========================================
# 🧠 ASENKRON AI İŞÇİSİ
# ==========================================
class AIWorker(threading.Thread):
    def __init__(self, main_path="best.pt", fire_path="fire.pt"):
        super().__init__()
        self.daemon = True
        self.running = True
        self.is_loaded = False
        self.main_path = main_path
        self.fire_path = fire_path
        self.frame = None
        self.result = None
        self.fire_objs = []
        self.lock = threading.Lock()
        self.new_frame_event = threading.Event()
        self.fps = 0

    def set_frame(self, frame):
        if not self.is_loaded: return
        with self.lock:
            self.frame = frame.copy()
            self.new_frame_event.set()

    def get_results(self):
        with self.lock:
            return self.result, self.fire_objs, self.fps, self.is_loaded

    def run(self):
        try:
            self.model = YOLO(self.main_path, task='detect')
            self.fire_model = None
            if os.path.exists(self.fire_path):
                self.fire_model = YOLO(self.fire_path, task='detect')
            self.is_loaded = True
            print(f"[AI] SİSTEM AKTİF.")
        except Exception as e: print(f"[AI] Hata: {e}")

        last_time = time.time(); frame_count = 0
        while self.running:
            self.new_frame_event.wait(timeout=0.1)
            if not self.new_frame_event.is_set(): continue
            with self.lock:
                img = self.frame; self.new_frame_event.clear()
            if img is None: continue
            
            res = self.model.predict(img, verbose=False, conf=DroneConfig.AI_GUVEN_ESIGI, imgsz=DroneConfig.AI_IMG_SIZE)
            
            fires = []
            if self.fire_model:
                f_res = self.fire_model.predict(img, verbose=False, conf=DroneConfig.FIRE_CONF)
                for fr in f_res:
                    for b in fr.boxes: fires.append((int(b.cls[0]), list(map(int, b.xyxy[0].cpu().numpy()))))

            with self.lock:
                self.result = res
                self.fire_objs = fires
            
            frame_count += 1
            if time.time() - last_time >= 1.0:
                self.fps = frame_count; frame_count = 0; last_time = time.time()

class HUDSystem:
    @staticmethod
    def draw_fighter_hud(frame, ds, ai_fps):
        h, w = frame.shape[:2]
        font = cv2.FONT_HERSHEY_SIMPLEX
        
        # Aviation Standard Colors
        white = (240, 240, 240)
        green = (0, 200, 0)
        red = (0, 0, 220)
        panel_bg = (15, 15, 15)
        
        # Top Telemetry Bar
        cv2.rectangle(frame, (0, 0), (w, 35), panel_bg, -1)
        cv2.line(frame, (0, 35), (w, 35), white, 1)
        
        # Telemetry Text
        cv2.putText(frame, f"MODE: {ds['msg']}", (15, 23), font, 0.5, white, 1)
        
        target_color = red if ds['target'] in ['fire', 'smoke'] else green
        cv2.putText(frame, f"TARGET: {str(ds['target']).upper()}", (w//2 - 60, 23), font, 0.5, target_color, 2)
        
        cv2.putText(frame, f"ALT: {ds['h']}cm  FPS: {ai_fps}", (w - 200, 23), font, 0.5, white, 1)
        
        # Aviation Corner Brackets (Premium Military Style)
        cx, cy = w//2, h//2
        s = 50  # Box size
        ll = 15 # Line length
        th = 2  # Thickness
        
        # Top-Left
        cv2.line(frame, (cx - s, cy - s), (cx - s + ll, cy - s), green, th)
        cv2.line(frame, (cx - s, cy - s), (cx - s, cy - s + ll), green, th)
        # Top-Right
        cv2.line(frame, (cx + s, cy - s), (cx + s - ll, cy - s), green, th)
        cv2.line(frame, (cx + s, cy - s), (cx + s, cy - s + ll), green, th)
        # Bottom-Left
        cv2.line(frame, (cx - s, cy + s), (cx - s + ll, cy + s), green, th)
        cv2.line(frame, (cx - s, cy + s), (cx - s, cy + s - ll), green, th)
        # Bottom-Right
        cv2.line(frame, (cx + s, cy + s), (cx + s - ll, cy + s), green, th)
        cv2.line(frame, (cx + s, cy + s), (cx + s, cy + s - ll), green, th)
        
        # Center Dot
        cv2.circle(frame, (cx, cy), 2, green, -1)
        
        # Velocity Vector
        vx, vy = ds.get('vx', 0), ds.get('vy', 0)
        if abs(vx) > 0 or abs(vy) > 0:
            cv2.arrowedLine(frame, (cx, cy), (cx + int(vx*2), cy - int(vy*2)), white, 2, tipLength=0.2)

class TelloAutonomousApp:
    def __init__(self):
        self.cfg = DroneConfig()
        self.ai_worker = AIWorker()
        self.tello = Tello()
        self.running = True
        self.is_flying = False
        self.is_busy = False
        self.is_connected = False
        self.frame_read = None
        self.bbox_history = deque(maxlen=3) 
        self.last_seen_time = time.time()
        self.last_cmd_time = 0 
        self.cmd_lock = threading.Lock()
        self.telemetry = {'bat': 0, 'h': 0, 'vx': 0, 'vy': 0, 'target': 'NONE', 'msg': 'INIT...'}

    def start(self):
        self.ai_worker.start()
        threading.Thread(target=self.connection_worker, daemon=True).start()
        threading.Thread(target=self.logic_loop, daemon=True).start()
        self.ui_loop()

    def connection_worker(self):
        while self.running:
            if not self.is_connected:
                try:
                    self.tello.connect()
                    self.is_connected = True
                    self.tello.streamon()
                    self.frame_read = self.tello.get_frame_read()
                except: time.sleep(1.0)
            time.sleep(1.0)

    def logic_loop(self):
        while self.running:
            ai_res, fire_objs, ai_fps, ai_loaded = self.ai_worker.get_results()
            if not self.is_connected or not ai_loaded or self.frame_read is None:
                time.sleep(0.1); continue
                
            frame = self.frame_read.frame
            if frame is None: continue
            self.ai_worker.set_frame(frame)
            
            # Cooldown kontrolü
            if time.time() - self.last_cmd_time < 2.5:
                self.telemetry['target'] = "NONE"
                if self.is_flying and not self.is_busy:
                    with self.cmd_lock: self.tello.send_rc_control(0, self.cfg.ARAMA_HIZI, 0, 0)
                time.sleep(0.04); continue

            best_det = None
            # [KRİTIK] ÖNCE LEVHALARI ARA, Kırmızı top varsa bekle
            if ai_res and len(ai_res[0].boxes) > 0:
                box = ai_res[0].boxes[0]
                best_det = (self.ai_worker.model.names[int(box.cls[0])], box.xyxy[0].cpu().numpy(), float(box.conf[0]))
            elif fire_objs: # Levha yoksa ve ateş varsa
                best_det = ("fire", fire_objs[0][1], 0.99)

            if best_det:
                self.last_seen_time = time.time()
                self.telemetry['target'] = best_det[0]
                self.bbox_history.append(best_det[1])
            else:
                self.telemetry['target'] = "NONE"
                if self.bbox_history: self.bbox_history.popleft()

            if not self.is_flying or self.is_busy:
                time.sleep(0.05); continue

            # Kontrol Mantığı
            if len(self.bbox_history) > 0:
                box = np.mean(self.bbox_history, axis=0)
                f_h, f_w = frame.shape[:2]
                cx, cy = (box[0]+box[2])/2, (box[1]+box[3])/2
                m_x, m_y = f_w/2, f_h/2
                
                err_x, err_y = cx - m_x, m_y - cy
                bw = box[2] - box[0] 
                
                lr = max(-35, min(35, int(err_x * 0.15)))
                ud = max(-35, min(35, int(err_y * 0.18)))
                
                fb = 0
                if bw < self.cfg.TETIKLEME_GENISLIK:
                    fb = max(self.cfg.MIN_YAKLASMA_HIZI, int(self.cfg.MAX_YAKLASMA_HIZI * (1 - bw/self.cfg.TETIKLEME_GENISLIK)))
                
                if bw >= self.cfg.TETIKLEME_GENISLIK and abs(err_x) < self.cfg.YATAY_HASSASIYET and abs(err_y) < self.cfg.DIKEY_HASSASIYET:
                    self.execute_command(self.telemetry['target'])
                else:
                    self.telemetry['msg'] = "TARGET LOCK"
                    with self.cmd_lock: self.tello.send_rc_control(lr, fb, ud, 0)
            else:
                # 360 Dönüş kaldırıldı, sadece yavaşça ileri arama yapar
                self.telemetry['msg'] = "FORWARD SEARCH"
                with self.cmd_lock: self.tello.send_rc_control(0, self.cfg.ARAMA_HIZI, 0, 0)
            time.sleep(0.04)

    def ui_loop(self):
        cv2.namedWindow("Tello Otonom")
        while self.running:
            raw = self.frame_read.frame if self.frame_read else None
            if raw is not None and raw.size > 0:
                h_raw, w_raw = raw.shape[:2]
                frame = cv2.resize(raw, (960, 720))
                ratio_x, ratio_y = 960 / w_raw, 720 / h_raw
                if len(self.bbox_history) > 0:
                    box = np.mean(self.bbox_history, axis=0)
                    x1, y1, x2, y2 = int(box[0]*ratio_x), int(box[1]*ratio_y), int(box[2]*ratio_x), int(box[3]*ratio_y)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 3)
                    cv2.putText(frame, "LOCK", (x1, y1-10), 1, 1.2, (0, 255, 0), 2)
            else:
                frame = np.full((720, 960, 3), 30, dtype=np.uint8)

            if self.is_connected:
                try:
                    s = self.tello.get_current_state()
                    if s: self.telemetry.update({'h': s['h'], 'vx': s['vgx'], 'vy': s['vgy'], 'bat': s.get('bat', 0)})
                except: pass

            _, _, ai_fps, _ = self.ai_worker.get_results()
            HUDSystem.draw_fighter_hud(frame, self.telemetry, ai_fps)
            cv2.imshow("Tello Otonom", frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'): self.running = False; break
            if key == ord('t') and self.is_connected: self.tello.takeoff(); self.is_flying = True
            if key == ord('l'): self.tello.land(); self.is_flying = False

        self.terminate()

    def execute_command(self, cmd):
        self.is_busy = True
        print(f"[ACTION] {cmd.upper()}!")
        with self.cmd_lock:
            self.tello.send_rc_control(0,0,0,0); time.sleep(0.8)
            if cmd in ['yukari', 'up', 'yukarı']: 
                self.tello.move_up(self.cfg.YUKARI_GITME_MESAFE)
                self.tello.move_forward(60) 
            elif cmd in ['asagi', 'assagi', 'down', 'aşağı']: 
                self.tello.move_down(self.cfg.ASAGI_GITME_MESAFE)
                self.tello.move_forward(60)
            elif cmd in ['sol', 'left']: 
                self.tello.rotate_counter_clockwise(90); self.tello.move_forward(40)
            elif cmd in ['sag', 'right']: 
                self.tello.rotate_clockwise(90); self.tello.move_forward(40)
            elif cmd in ['fire', 'smoke']:
                # Aksiyonlu kaçış: Geri çekil, takla at (flip) ve in.
                self.tello.move_back(50)
                try:
                    self.tello.flip_back() # Gerçek tello'da geriye takla
                except:
                    pass
                time.sleep(1.0)
                self.tello.land()
                self.running = False
            time.sleep(0.5); self.tello.send_rc_control(0,0,0,0)
        
        self.last_cmd_time = time.time()
        self.bbox_history.clear()
        self.is_busy = False

    def terminate(self):
        try:
            if self.is_flying: self.tello.land()
            self.tello.streamoff()
        except: pass
        cv2.destroyAllWindows(); sys.exit(0)

if __name__ == "__main__":
    TelloAutonomousApp().start()
