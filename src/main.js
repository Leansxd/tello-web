import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';

class TelloLandscape {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // Görüntü Yırtılmasını (Flickering) Önleyen Gizli Dron Render Motoru
        this.droneRenderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, preserveDrawingBuffer: true });
        this.droneRenderer.setSize(640, 480);


        // Hızlı Resim Gönderimi (Kasmayı Önler)
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = 640;
        this.offscreenCanvas.height = 480;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.camera.position.set(0, 15, 35);
        this.controls.enableKeys = false; // Disable default Orbit keys
        this.controls.update();

        // Noclip WASD State
        this.keys = { w: false, a: false, s: false, d: false, space: false, shift: false };
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === ' ') this.keys.space = true;
            else if (this.keys.hasOwnProperty(key)) this.keys[key] = true;
        });
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key === ' ') this.keys.space = false;
            else if (this.keys.hasOwnProperty(key)) this.keys[key] = false;
        });

        this.envGroup = new THREE.Group();
        this.scene.add(this.envGroup);

        this.targets = [];
        this.draggedObj = null;
        this.draggedIcon = null;
        this.selectedObjId = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Object Designer State
        this.designer = {
            active: false,
            scene: null,
            camera: null,
            renderer: null,
            box: null,
            icon: null,
            currentType: 'UP'
        };

        this.isCrashed = false;
        this.crashRotation = new THREE.Vector3();
        this.droneRC = [0, 0, 0, 0]; // [lr, fb, ud, yv] - Sürekli hız için hafıza
        this.droneTargetPos = new THREE.Vector3(0, 1, 0); // Yumuşak hareket için hedef konum
        this.propellers = []; // Pervaneleri döndürmek için hafıza
        this.trailPoints = []; // Uçuş izi için koordinatlar
        this.lastPos = new THREE.Vector3(); // Hız hesabı için
        this.waypointPoints = []; // Parkur rotası için koordinatlar
        
        this.currentTipPage = 0;
        this.tips = [
            `<b>1. UÇUŞ KONTROLLERİ</b><ul>
                <li><b>T Tuşu:</b> Dronu havalandırır.</li>
                <li><b>L Tuşu:</b> Dronu yere indirir.</li>
                <li><b>Kamera:</b> Yukardaki küçük ekran dronun ön kamerasını gösterir.</li>
            </ul>`,
            `<b>2. NESNE EKLEME (ADD)</b><ul>
                <li><b>ADD:</b> Sağ alttaki butona basarak yeni bir duvar ekleyebilirsin.</li>
                <li><b>Ayarlar:</b> Genişlik, yükseklik ve ikon tipini seçebilirsin.</li>
                <li><b>ELEVATION:</b> Duvarın yerden ne kadar yüksekte doğacağını ayarlar.</li>
            </ul>`,
            `<b>3. NESNE HAREKETİ (MOUSE)</b><ul>
                <li><b>Sürükleme:</b> Haritadaki bir kutuya tıkla ve basılı tutarak yerde gezdir.</li>
                <li><b>HAVAYA KALDIRMA:</b> Bir kutuyu sürüklerken klavyeden <b>ALT</b> tuşuna basılı tutarsan nesne havaya kalkar.</li>
            </ul>`,
            `<b>4. HARİTA VE LİSTE</b><ul>
                <li><b>Silme (DEL):</b> Sağdaki listeden çarpı (X) butonuna basarak nesneyi silebilirsin.</li>
                <li><b>KAYDET (SAVE):</b> Tasarladığın parkuru PC'ne dosya olarak indirir.</li>
                <li><b>YÜKLE (LOAD):</b> Kayıtlı haritayı geri açar.</li>
            </ul>`,
            `<b>5. KAMERA VE SIFIRLAMA</b><ul>
                <li><b>Sol Tık:</b> Sahnenin etrafında döner.</li>
                <li><b>Sağ Tık:</b> Kamerayı sağa sola kaydırır.</li>
                <li><b>Scroll:</b> Yaklaşır / Uzaklaşır.</li>
                <li><b>F5:</b> Her şeyi siler ve baştan başlatır.</li>
            </ul>`
        ];

        this.init();
        this.updateTip();
    }

    async init() {
        this.addLights();
        this.loadTextures(); // AWAIT KALDIRILDI - Resimler gelse de gelmese de devam et
        this.setEnvironment('hangar');
        this.addDrone();
        this.setupInteractions();
        this.setupBridge();
        this.setupDesigner();
        this.animate();
        
        // Global functions for HTML
        window.changeEnv = (t) => this.setEnvironment(t);
        window.openDesigner = (t) => this.openDesigner(t);
        window.closeDesigner = () => this.closeDesigner();
        window.confirmDesign = () => this.confirmDesign();
        window.updateDesignerPreview = () => this.updateDesignerPreview();
        window.removeObj = (id) => this.removeTarget(id);
        window.saveMap = () => this.saveMap();
        window.droneAction = (a) => this.droneAction(a);
        
        // Handle Map Loading
        window.loadMapFile = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    this.loadMapData(data);
                } catch(err) {
                    this.addLog("Invalid Map File!", "system");
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        };
        
        // Handle PC File Uploads
        window.uploadedImageData = null;
        window.handleFileUpload = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    window.uploadedImageData = event.target.result;
                    const urlInput = document.getElementById('custom-icon-url');
                    if(urlInput) urlInput.value = ''; // clear url if file uploaded
                    this.updateDesignerPreview();
                };
                reader.readAsDataURL(file);
            }
        };
    }

    addLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        ambient.name = "ambient";
        this.scene.add(ambient);

        const dir = new THREE.DirectionalLight(0xffffff, 1.0);
        dir.position.set(10, 20, 10);
        dir.name = "sun";
        this.scene.add(dir);
    }

    async loadTextures() {
        const tl = new THREE.TextureLoader();
        this.texUp = tl.load('/up.png');
        this.texDown = tl.load('/down.png');
        
        // Fire resmi kayıpsa boş çıkmasın diye kodla emoji üretiyoruz
        const fireCanvas = document.createElement('canvas');
        fireCanvas.width = 512; fireCanvas.height = 512;
        const ctx = fireCanvas.getContext('2d');
        ctx.fillStyle = '#111'; ctx.fillRect(0,0,512,512);
        ctx.font = '300px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🔥', 256, 280);
        this.texFire = new THREE.CanvasTexture(fireCanvas);
        const loadPBR = (name) => {
            const t = tl.load(`/textureassets/desert/Ground097_4K-PNG_${name}.png`);
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.repeat.set(30, 30);
            t.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
            return t;
        };

        this.textures = {
            ground: {
                color: loadPBR('Color'),
                normal: loadPBR('NormalGL'),
                roughness: loadPBR('Roughness'),
                ao: loadPBR('AmbientOcclusion'),
                displacement: loadPBR('Displacement')
            }
        };

        return new Promise((resolve) => {
            try {
                new EXRLoader().load('/textureassets/desert/goegap_4k.exr', (texture) => {
                    texture.mapping = THREE.EquirectangularReflectionMapping;
                    texture.offset.x = 0.5;
                    this.sunsetTexture = texture;
                    this.addLog("HDRI 4K Scenery loaded.", "system");
                    resolve();
                }, undefined, (err) => {
                    console.warn("EXR Missing, using default background.");
                    resolve();
                });
            } catch(e) { resolve(); }
        });
    }

    setEnvironment(type) {
        try {
            this.currentEnv = type;
            while(this.envGroup.children.length > 0) {
                const child = this.envGroup.children[0];
                if(child.geometry) child.geometry.dispose();
                if(child.material) child.material.dispose();
                this.envGroup.remove(child);
            }

            const floorGeo = new THREE.PlaneGeometry(2000, 2000);
            let floorMat, padColor;
            this.scene.fog = null;

            // Güvenli Işık Bulma Fonksiyonu
            const setLight = (isAmbient, intensity) => {
                const l = this.scene.children.find(c => isAmbient ? c.isAmbientLight : c.isDirectionalLight);
                if (l) l.intensity = intensity;
            };

            if (type === 'hangar') {
                floorMat = new THREE.MeshStandardMaterial({ color: 0x22222a, roughness: 0.6, metalness: 0.3 });
                padColor = 0x00ff88;
                setLight(true, 1.2); setLight(false, 1.8);
                this.scene.background = new THREE.Color(0x1a1a24);
            } else if (type === 'desert') {
                const hasTex = this.textures && this.textures.ground;
                floorMat = new THREE.MeshStandardMaterial({ 
                    color: 0x776655, 
                    map: hasTex ? this.textures.ground.color : null, 
                    normalMap: hasTex ? this.textures.ground.normal : null, 
                    roughness: 1.0 
                });
                padColor = 0xff0000;
                setLight(true, 1.0); setLight(false, 1.5);
                this.scene.background = this.sunsetTexture || new THREE.Color(0x776655);
                this.scene.environment = this.sunsetTexture || null;
            } else {
                floorMat = new THREE.MeshStandardMaterial({ color: 0x2d4c1e, roughness: 0.9 });
                padColor = 0xffffff;
                setLight(true, 1.0); setLight(false, 2.0);
                this.scene.background = new THREE.Color(0xaaccff);
            }

            const floorMesh = new THREE.Mesh(floorGeo, floorMat);
            floorMesh.rotation.x = -Math.PI / 2;
            floorMesh.position.y = -0.15;
            this.floor = floorMesh;
            this.envGroup.add(floorMesh);

            const padMesh = new THREE.Mesh(new THREE.RingGeometry(3.5, 4, 32), new THREE.MeshBasicMaterial({ color: padColor, transparent: true, opacity: 0.7 }));
            padMesh.rotation.x = -Math.PI / 2;
            padMesh.position.y = -0.14;
            this.envGroup.add(padMesh);
            
            this.addLog(`Environment: ${type}`, "system");
        } catch (e) {
            console.error("setEnvironment failed:", e);
        }
    }


    addDrone() {
        const droneGroup = new THREE.Group();
        droneGroup.position.set(0, 1, 0); 
        this.drone = droneGroup;

        // Fallback Placeholder
        const placeholder = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.4, 1.5), 
            new THREE.MeshStandardMaterial({ color: 0x333333, transparent: true, opacity: 0.5 })
        );
        droneGroup.add(placeholder);

        // GLTF Loader
        const loader = new GLTFLoader();
        loader.load('/src/assets/dron.glb', (gltf) => {
            placeholder.visible = false;
            const model = gltf.scene;
            model.scale.set(0.4, 0.4, 0.4);
            model.rotation.y = Math.PI / 2; // 90 derece sola döndürüldü
            droneGroup.add(model);

            this.propellers = []; 
            console.log("[ASSET] Drone sub-objects:", model.children.length);
            
            // Pervane taraması (Daha agresif)
            model.traverse((child) => {
                const name = child.name.toLowerCase();
                if (child.isMesh && (
                    name.includes('prop') || name.includes('rotor') ||
                    name.includes('blade') || name.includes('fan') ||
                    name.includes('wing') || name.includes('motor')
                )) {
                    console.log("[ASSET] ✅ Propeller found:", child.name);
                    this.propellers.push(child);
                }
            });

            // Modelin kendi animasyonları varsa başlat (Bazı modellerde pervane döngüsü hazır gelir)
            if (gltf.animations && gltf.animations.length > 0) {
                console.log("[ASSET] Animations found, playing...");
                this.mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach((clip) => {
                    this.mixer.clipAction(clip).play();
                });
            }

            if (this.propellers.length === 0) {
                console.warn("[ASSET] ⚠️ No propeller meshes found in model, adding custom ones.");
                for (let i = 0; i < 4; i++) {
                    const prop = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.08), new THREE.MeshStandardMaterial({ color: 0x111111 }));
                    const x = i < 2 ? 0.35 : -0.35; const z = i % 2 === 0 ? 0.35 : -0.35;
                    prop.position.set(x, 0.1, z);
                    droneGroup.add(prop);
                    this.propellers.push(prop);
                }
            }
        });
        
        // Dronun Gözü (FPV Kamera - AI için 4:3 oranında sabitlendi)
        this.droneCamera = new THREE.PerspectiveCamera(70, 4/3, 0.01, 1000);
        // Kamera her zaman grubun ileri yönüne (-Z) bakmalı
        this.droneCamera.position.set(0, 0.25, -1.5); 
        this.drone.add(this.droneCamera);
        
        this.droneTargetPos.copy(this.drone.position);

        this.droneTargetPos.copy(this.drone.position);
        this.lastPos.copy(this.drone.position);

        // Uçuş İzi (Trail) Nesnesi
        const trailGeo = new THREE.BufferGeometry();
        const trailMat = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.6 });
        this.trailLine = new THREE.Line(trailGeo, trailMat);
        this.scene.add(this.trailLine);

        // Parkur Rotası (Waypoints Path - Kesikli ve Şık)
        const pathGeo = new THREE.BufferGeometry();
        const pathMat = new THREE.LineDashedMaterial({ 
            color: 0x00ffff, 
            dashSize: 1.5, 
            gapSize: 1, 
            transparent: true, 
            opacity: 0.5,
            depthTest: false
        });
        this.waypointLine = new THREE.Line(pathGeo, pathMat);
        this.waypointLine.renderOrder = 999;
        this.scene.add(this.waypointLine);

        this.scene.add(this.drone);
    }

    setupDesigner() {
        const container = document.getElementById('designer-preview-canvas');
        this.designer.scene = new THREE.Scene();
        this.designer.camera = new THREE.PerspectiveCamera(50, 400 / 300, 0.1, 1000);
        this.designer.camera.position.set(0, 5, 15);
        this.designer.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.designer.renderer.setSize(400, 300);
        container.appendChild(this.designer.renderer.domElement);

        const light = new THREE.AmbientLight(0xffffff, 1.5);
        this.designer.scene.add(light);
        const dir = new THREE.DirectionalLight(0xffffff, 2.0);
        dir.position.set(5, 10, 15);
        this.designer.scene.add(dir);

        // Preview Objects
        const boxGeo = new THREE.BoxGeometry(10, 4, 2);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.1, roughness: 0.5 });
        this.designer.box = new THREE.Mesh(boxGeo, boxMat);
        this.designer.scene.add(this.designer.box);

        const iconGeo = new THREE.PlaneGeometry(3, 3);
        const iconMat = new THREE.MeshBasicMaterial({ map: this.texUp, transparent: true, side: THREE.DoubleSide });
        this.designer.icon = new THREE.Mesh(iconGeo, iconMat);
        this.designer.icon.position.z = 1.01;
        this.designer.scene.add(this.designer.icon);

        // Interaction in preview
        let isDragging = false;
        container.addEventListener('mousedown', () => isDragging = true);
        window.addEventListener('mouseup', () => isDragging = false);
        container.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const rect = container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            this.designer.icon.position.x = x * 4;
            this.designer.icon.position.y = y * 2;
        });

        // Sliders
        const wSlider = document.getElementById('wall-width');
        const hSlider = document.getElementById('wall-height');
        const sizeSlider = document.getElementById('icon-size');
        
        if (wSlider) wSlider.oninput = (e) => { this.designer.box.scale.x = e.target.value / 10; e.target.nextElementSibling.innerText = e.target.value + 'm'; this.updateDesignerPreview(); };
        if (hSlider) hSlider.oninput = (e) => { this.designer.box.scale.y = e.target.value / 4; e.target.nextElementSibling.innerText = e.target.value + 'm'; this.updateDesignerPreview(); };
        const eSlider = document.getElementById('wall-elevation');
        if (eSlider) eSlider.oninput = (e) => { e.target.nextElementSibling.innerText = e.target.value + 'm'; this.updateDesignerPreview(); };
        if (sizeSlider) sizeSlider.oninput = (e) => { 
            const s = e.target.value;
            this.designer.icon.scale.set(s / 3, s / 3, 1);
            e.target.nextElementSibling.innerText = s + 'm';
            this.updateDesignerPreview();
        };
    }

    openDesigner(type) {
        this.designer.currentType = type;
        document.getElementById('icon-type').value = type;
        document.getElementById('designer-popup').classList.remove('hidden');
        this.updateDesignerPreview();
    }

    closeDesigner() {
        document.getElementById('designer-popup').classList.add('hidden');
    }

    updateDesignerPreview() {
        const type = document.getElementById('icon-type')?.value;
        const customUrlInput = document.getElementById('custom-icon-url')?.value;
        const customUrl = window.uploadedImageData || customUrlInput; // Use uploaded file if exists
        const wallColor = document.getElementById('wall-color')?.value || '#444444';
        
        const customContainer = document.getElementById('custom-input-container');
        const sizeGroup = document.getElementById('icon-size-group');
        
        if (customContainer) customContainer.className = (type === 'CUSTOM_ICON' || type === 'CUSTOM_WALL') ? '' : 'hidden';
        if (sizeGroup) sizeGroup.style.display = (type === 'CUSTOM_WALL') ? 'none' : 'flex';
        
        // URL kutusuna manuel yazı yazılırsa, yüklenen dosyayı iptal et
        const urlEl = document.getElementById('custom-icon-url');
        if (urlEl && urlEl.value !== '') { window.uploadedImageData = null; }
        
        // Update Box Color & Elevation anında etki etsin
        if (this.designer.box) {
            const h = document.getElementById('wall-height')?.value || 4;
            const elev = document.getElementById('wall-elevation')?.value || 0;
            this.designer.box.material.color.set(wallColor);
            this.designer.box.position.y = parseFloat(elev) + parseFloat(h) / 2;
            this.designer.box.material.needsUpdate = true;
            if (this.designer.icon) this.designer.icon.position.y = this.designer.box.position.y;
        }

        if (type === 'CUSTOM_WALL') {
            this.designer.icon.visible = false;
            if (customUrl) {
                new THREE.TextureLoader().load(customUrl, (tex) => {
                    this.designer.box.material.map = tex;
                    this.designer.box.material.needsUpdate = true;
                });
            } else {
                this.designer.box.material.map = null;
                this.designer.box.material.needsUpdate = true;
            }
        } else {
            this.designer.icon.visible = true;
            this.designer.box.material.map = null;
            this.designer.box.material.needsUpdate = true;
            
            let tex = (type === 'DOWN') ? this.texDown : (type === 'FIRE' ? this.texFire : this.texUp);
            if (type === 'LEFT' || type === 'RIGHT') tex = this.texUp;
            
            // Yönüne göre rotasyon (Aynalama kaldırıldı, yönler düzeldi)
            this.designer.icon.rotation.z = 0;
            this.designer.icon.scale.set(1, 1, 1);
            if (type === 'LEFT') this.designer.icon.rotation.z = Math.PI / 2;
            if (type === 'RIGHT') this.designer.icon.rotation.z = -Math.PI / 2;
            
            if (type === 'CUSTOM_ICON' && customUrl) {
                new THREE.TextureLoader().load(customUrl, (loadedTex) => {
                    this.designer.icon.material.map = loadedTex;
                    this.designer.icon.material.needsUpdate = true;
                });
            } else {
                if (this.designer.icon) {
                    this.designer.icon.material.map = tex || null;
                    this.designer.icon.material.needsUpdate = true;
                }
            }
        }
    }

    confirmDesign() {
        const w = document.getElementById('wall-width').value;
        const h = document.getElementById('wall-height').value;
        const elev = document.getElementById('wall-elevation').value;
        const type = document.getElementById('icon-type').value;
        const wallColor = document.getElementById('wall-color').value;
        const customUrlInput = document.getElementById('custom-icon-url').value;
        const customUrl = window.uploadedImageData || customUrlInput;
        const iconSize = document.getElementById('icon-size').value;
        
        const group = new THREE.Group();
        const boxMat = new THREE.MeshStandardMaterial({ color: wallColor });
        
        if (type === 'CUSTOM_WALL' && customUrl) {
            boxMat.map = new THREE.TextureLoader().load(customUrl);
        }
        
        const box = new THREE.Mesh(new THREE.BoxGeometry(parseFloat(w), parseFloat(h), 2), boxMat);
        group.add(box);
        
        if (type !== 'CUSTOM_WALL') {
            const iconMat = new THREE.MeshBasicMaterial({ map: this.designer.icon.material.map, transparent: true, side: THREE.DoubleSide });
            const icon = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), iconMat);
            icon.scale.set(iconSize / 3, iconSize / 3, 1);
            icon.position.copy(this.designer.icon.position);
            
            if (type === 'LEFT') icon.rotation.z = Math.PI / 2;
            if (type === 'RIGHT') icon.rotation.z = -Math.PI / 2;
            
            group.add(icon);
        }
        
        group.position.set(0, parseFloat(elev) + parseFloat(h)/2, -20 * (this.targets.length + 1));
        group.userData = {
            id: Date.now().toString(),
            type: type,
            w: parseFloat(w),
            h: parseFloat(h),
            elevation: parseFloat(elev),
            wallColor: wallColor,
            customUrl: customUrl,
            iconSize: parseFloat(iconSize)
        };
        
        this.scene.add(group);
        this.targets.push(group);
        this.closeDesigner();
        this.renderObjectList();
        this.updateWaypointPath(); // Yolu güncelle
        this.addLog(`Custom ${type} object added.`, "system");
    }

    setupInteractions() {
        const onDown = (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.targets, true);
            if (intersects.length > 0) {
                let root = intersects[0].object;
                while(root.parent && !root.userData.id) root = root.parent;
                if (root.userData.id) {
                    this.draggedObj = root;
                    this.selectedObjId = root.userData.id;
                    this.controls.enabled = false;
                    this.renderObjectList();
                }
            }
        };
        const onMove = (e) => {
            if (!this.draggedObj) return;
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.floor);
            if (intersects.length > 0) {
                // ALT veya CTRL tuşu basılıysa YÜKSEKLİK ayarla, değilse YERDE hareket et
                if (e.altKey || e.ctrlKey) {
                    const deltaY = -e.movementY * 0.05;
                    this.draggedObj.position.y = Math.max(0.5, this.draggedObj.position.y + deltaY);
                } else {
                    this.draggedObj.position.x = intersects[0].point.x;
                    this.draggedObj.position.z = intersects[0].point.z;
                }
                this.updateWaypointPath(); // Sürüklerken yolu güncelle
            }
        };
        const onUp = () => { this.draggedObj = null; this.controls.enabled = true; };
        window.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }

    removeTarget(id) {
        const idx = this.targets.findIndex(t => t.userData.id === id);
        if (idx !== -1) {
            this.scene.remove(this.targets[idx]);
            this.targets.splice(idx, 1);
            this.renderObjectList();
            this.updateWaypointPath(); // Silince yolu güncelle
        }
    }

    saveMap() {
        const data = this.targets.map(t => ({
            position: { x: t.position.x, y: t.position.y, z: t.position.z },
            rotation: { x: t.rotation.x, y: t.rotation.y, z: t.rotation.z },
            userData: t.userData
        }));
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tello_map_${Date.now()}.json`;
        a.click();
        this.addLog("Map saved successfully.", "system");
    }

    loadMapData(data) {
        // Clear current
        [...this.targets].forEach(t => this.removeTarget(t.userData.id));
        
        data.forEach(item => {
            const ud = item.userData;
            const group = new THREE.Group();
            const boxMat = new THREE.MeshStandardMaterial({ color: ud.wallColor });
            
            if (ud.type === 'CUSTOM_WALL' && ud.customUrl) {
                boxMat.map = new THREE.TextureLoader().load(ud.customUrl);
            }
            
            const box = new THREE.Mesh(new THREE.BoxGeometry(ud.w, ud.h, 2), boxMat);
            group.add(box);
            
            if (ud.type !== 'CUSTOM_WALL') {
                let iconTex;
                if (ud.type === 'UP') iconTex = this.texUp;
                else if (ud.type === 'DOWN') iconTex = this.texDown;
                else if (ud.type === 'FIRE') iconTex = this.texFire;
                else if (ud.type === 'LEFT' || ud.type === 'RIGHT') iconTex = this.texUp;
                else if (ud.type === 'CUSTOM_ICON' && ud.customUrl) iconTex = new THREE.TextureLoader().load(ud.customUrl);

                const iconMat = new THREE.MeshBasicMaterial({ map: iconTex, transparent: true, side: THREE.DoubleSide });
                const icon = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), iconMat);
                icon.scale.set(ud.iconSize / 3, ud.iconSize / 3, 1);
                icon.position.set(0, ud.h / 2, 1.1);
                
                if (ud.type === 'LEFT') icon.rotation.z = Math.PI / 2;
                if (ud.type === 'RIGHT') icon.rotation.z = -Math.PI / 2;
                
                group.add(icon);
            }
            
            group.position.set(item.position.x, item.position.y, item.position.z);
            group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            group.userData = ud;
            
            this.scene.add(group);
            this.targets.push(group);
        });
        
        this.renderObjectList();
        this.updateWaypointPath(); // Harita yüklenince yolu güncelle
        this.addLog("Map loaded successfully.", "system");
    }

    renderObjectList() {
        const list = document.getElementById('object-list');
        list.innerHTML = '';
        this.targets.forEach(t => {
            const item = document.createElement('div');
            item.className = `waypoint-item ${this.selectedObjId === t.userData.id ? 'selected' : ''}`;
            item.innerHTML = `
                <div class="waypoint-info">
                    <h4>${t.userData.type} OBJECT</h4>
                    <p>X: ${t.position.x.toFixed(1)} | Z: ${t.position.z.toFixed(1)}</p>
                </div>
                <button class="btn-icon" onclick="window.removeObj('${t.userData.id}')">DEL</button>
            `;
            list.appendChild(item);
        });
    }

    setupBridge() {
        this.addLog("Connecting to Drone Bridge...", "system");
        this.ws = new WebSocket('ws://127.0.0.1:9999');
        
        this.ws.onopen = () => {
            this.addLog("Bridge Connected. Link Active.", "ai");
            if (this.streamInterval) clearInterval(this.streamInterval);
            this.streamInterval = setInterval(() => { this.needsFrameSend = true; }, 33); // 30 FPS pürüzsüz akış
        };
        
        this.ws.onclose = () => {
            this.addLog("Bridge Disconnected. Reconnecting...", "system");
            if (this.streamInterval) clearInterval(this.streamInterval);
            setTimeout(() => this.setupBridge(), 3000);
        };
        
        this.ws.onerror = (e) => {};
        
        this.ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                this.handleBridgeMessage(msg);
            } catch (err) {}
        };
    }

    handleBridgeMessage(msg) {
        if (!this.drone) return;
        
        if (msg.type === 'takeoff') {
            this.isCrashed = false; // Reset crash state
            this.drone.rotation.set(0, 0, 0); // Fix tilt
            this.addLog("Command: TAKEOFF", "system");
            this.droneTargetPos.set(this.drone.position.x, 5, this.drone.position.z);
            return;
        }

        if (this.isCrashed) return; // Ignore other commands if crashed
        
        if (msg.type === 'land') {
            this.addLog("Command: LAND", "system");
            this.droneTargetPos.y = 0.5;
        } else if (msg.type === 'move') {
            this.addLog(`Move: ${msg.dir} ${msg.dist}cm`, "ai");
            const d = msg.dist / 100;
            if (msg.dir === 'up') this.droneTargetPos.y += d;
            if (msg.dir === 'down') this.droneTargetPos.y -= d;
            if (msg.dir === 'forward') {
                const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.drone.quaternion);
                this.droneTargetPos.addScaledVector(fwd, d);
            }
            if (msg.dir === 'back') {
                const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.drone.quaternion);
                this.droneTargetPos.addScaledVector(fwd, -d);
            }
            if (msg.dir === 'right') {
                const side = new THREE.Vector3(1, 0, 0).applyQuaternion(this.drone.quaternion);
                this.droneTargetPos.addScaledVector(side, d);
            }
            if (msg.dir === 'left') {
                const side = new THREE.Vector3(1, 0, 0).applyQuaternion(this.drone.quaternion);
                this.droneTargetPos.addScaledVector(side, -d);
            }
        } else if (msg.type === 'rotate') {
            this.addLog(`Rotate: ${msg.dir} ${msg.val}deg`, "ai");
            const rad = (msg.val * Math.PI) / 180;
            if (msg.dir === 'cw') this.drone.rotation.y -= rad;
            if (msg.dir === 'ccw') this.drone.rotation.y += rad;
        } else if (msg.type === 'rc') {
            // Komutu anlık uygulamak yerine hız hafızasına alıyoruz (Gerçekçi uçuş)
            this.droneRC = msg.val;
        }
    }

    droneAction(action) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        
        if (action === 'takeoff') {
            this.isCrashed = false; // Reset crash state
            if (this.drone) {
                this.drone.rotation.set(0, 0, 0); // Düzelt
                this.drone.position.y = 5;
            }
        }
        
        this.ws.send(JSON.stringify({ type: 'command', val: action }));
    }

    checkCollisions() {
        if (!this.drone || this.targets.length === 0) return;
        
        const directions = [
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, -1, 0)
        ];
        
        const raycaster = new THREE.Raycaster();
        for (let dir of directions) {
            const worldDir = dir.clone().applyQuaternion(this.drone.quaternion);
            raycaster.set(this.drone.position, worldDir);
            
            const intersects = raycaster.intersectObjects(this.targets, true);
            
            if (intersects.length > 0 && intersects[0].distance < 1.2) {
                this.isCrashed = true;
                this.crashRotation.set(Math.random() * 0.2, 0, Math.random() * 0.2);
                this.addLog("CRASH DETECTED! Drone is falling...", "system");
                break;
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Dron Fiziği ve Çarpışma
        if (this.drone) {
            if (!this.isCrashed) {
                // Sadece havadaysa (y > 1.5) çarpışma kontrolü yap, yerdeyken sensörleri kapat
                if (this.drone.position.y > 1.5) {
                    this.checkCollisions();
                }
                
                // RC Hızlarını Uygula (Süzülme efekti)
                const [lr, fb, ud, yv] = this.droneRC;
                const vScale = 0.005; // Hız hassasiyeti
                
                // RC Hızlarını TargetPos'a ekle
                this.droneTargetPos.y += ud * vScale;
                const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.drone.quaternion);
                const side = new THREE.Vector3(1, 0, 0).applyQuaternion(this.drone.quaternion);
                this.droneTargetPos.addScaledVector(fwd, fb * vScale);
                this.droneTargetPos.addScaledVector(side, lr * vScale);
                
                this.drone.rotation.y += -yv * vScale;

                // Pozisyonu yumuşakça süzülerek hedefe götür (Hızlandırıldı)
                this.drone.position.lerp(this.droneTargetPos, 0.15);

                // OTOMATİK FREN (Damping): Komut gelmediğinde hız yavaşça sıfırlanır
                this.droneRC = this.droneRC.map(v => v * 0.85); 

                // Pervaneleri Döndür
                if (this.drone.position.y > 0.6) {
                    this.propellers.forEach(p => p.rotation.y += 0.8);
                }
            } else {
                // Düşüş fiziği
                if (this.drone.position.y > 0.5) {
                    this.drone.position.y -= 0.3; // Yerçekimi
                    this.drone.rotation.x += this.crashRotation.x;
                    this.drone.rotation.z += this.crashRotation.z;
                } else {
                    this.drone.position.y = 0.5; // Yere çakıldı (Gömülme engellendi)
                }
            }

            // --- HUD ve Telemetri Güncelleme ---
            const now = performance.now();
            const dt = (now - (this.lastTime || now)) / 1000;
            this.lastTime = now;

            // Animasyon Mixer'ı güncelle (Eğer GLB animasyonu varsa)
            if (this.mixer) this.mixer.update(dt);

            // Hız Hesabı (SPD)
            const dist = this.drone.position.distanceTo(this.lastPos);
            const speed = dt > 0 ? (dist / dt).toFixed(1) : "0.0";
            this.lastPos.copy(this.drone.position);

            // Verileri DOM'a bas
            const alt = Math.max(0, this.drone.position.y - 0.5).toFixed(1);
            const yaw = Math.round((THREE.MathUtils.radToDeg(this.drone.rotation.y) % 360 + 360) % 360);
            
            document.getElementById('stat-alt').innerText = `${alt}m`;
            document.getElementById('stat-spd').innerText = `${speed} m/s`;
            document.getElementById('stat-yaw').innerText = `${yaw}°`;
            
            let status = "IDLE";
            if (this.isCrashed) status = "CRASHED";
            else if (alt > 0.1) status = "FLYING";
            document.getElementById('drone-status').innerText = status;

            // Uçuş İzi Güncelleme (Trail)
            if (alt > 0.1 && !this.isCrashed) {
                this.trailPoints.push(this.drone.position.clone());
                if (this.trailPoints.length > 300) this.trailPoints.shift();
                this.trailLine.geometry.setFromPoints(this.trailPoints);
            } else if (alt < 0.1) {
                this.trailPoints = [];
                this.trailLine.geometry.setFromPoints([]);
            }
        }

        // Noclip Movement Logic
        const speed = this.keys.shift ? 1.5 : 0.5; // Shift for sprint
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        
        this.camera.getWorldDirection(forward);
        right.crossVectors(forward, this.camera.up).normalize();

        if (this.keys.w) {
            this.camera.position.addScaledVector(forward, speed);
            this.controls.target.addScaledVector(forward, speed);
        }
        if (this.keys.s) {
            this.camera.position.addScaledVector(forward, -speed);
            this.controls.target.addScaledVector(forward, -speed);
        }
        if (this.keys.a) {
            this.camera.position.addScaledVector(right, -speed);
            this.controls.target.addScaledVector(right, -speed);
        }
        if (this.keys.d) {
            this.camera.position.addScaledVector(right, speed);
            this.controls.target.addScaledVector(right, speed);
        }
        if (this.keys.space) {
            this.camera.position.y += speed;
            this.controls.target.y += speed;
        }
        
        this.controls.update();
        
        // Görüntü Gönderme Zamanı Geldiyse (Saniyede 30 kere)
        if (this.needsFrameSend && this.droneCamera && this.ws && this.ws.readyState === WebSocket.OPEN) {
            // Gizli render motorunu kullanarak çizeriz, böylece ana ekran asla titremez!
            this.droneRenderer.render(this.scene, this.droneCamera);
            const dataUrl = this.droneRenderer.domElement.toDataURL('image/jpeg', 0.6);
            
            this.ws.send(JSON.stringify({ type: 'frame', data: dataUrl }));
            
            this.ws.send(JSON.stringify({
                type: 'telemetry',
                alt: this.drone ? this.drone.position.y : 0,
                vx: 0, vy: 0
            }));
            
            this.needsFrameSend = false;
        }

        // 3. Kullanıcının kamerasından asıl ekranı çiz
        this.renderer.render(this.scene, this.camera);
        
        if (this.designer.renderer) {
            this.designer.renderer.render(this.designer.scene, this.designer.camera);
        }
    }

    nextTip() {
        this.currentTipPage = (this.currentTipPage + 1) % this.tips.length;
        this.updateTip();
    }

    prevTip() {
        this.currentTipPage = (this.currentTipPage - 1 + this.tips.length) % this.tips.length;
        this.updateTip();
    }

    toggleTips() {
        const panel = document.getElementById('tips-panel');
        if (panel) panel.classList.toggle('hidden');
    }

    updateTip() {
        const content = document.getElementById('tip-content');
        const pageNum = document.getElementById('tip-page-num');
        if (content) content.innerHTML = this.tips[this.currentTipPage];
        if (pageNum) pageNum.innerText = `${this.currentTipPage + 1} / ${this.tips.length}`;
    }

    addLog(msg, type = 'ai') {
        const container = document.getElementById('ai-logs');
        if(!container) return;
        const d = new Date();
        const time = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
        container.innerHTML += `<div class="log-entry ${type}">[${time}] ${msg}</div>`;
        container.scrollTop = container.scrollHeight;
    }

    updateWaypointPath() {
        if (!this.waypointLine) return;
        
        // Başlangıç noktası + tüm hedeflerin pozisyonları
        const points = [
            new THREE.Vector3(0, 0.5, 0), 
            ...this.targets.map(t => t.position.clone())
        ];
        
        if (points.length > 1) {
            // Eski geometriyi temizle (Hafıza dostu)
            this.waypointLine.geometry.dispose();
            
            // Yeni geometri oluştur
            const newGeo = new THREE.BufferGeometry().setFromPoints(points);
            this.waypointLine.geometry = newGeo;
            this.waypointLine.computeLineDistances(); // Kesikli çizgi için şart
            this.waypointLine.visible = true;
        } else {
            this.waypointLine.visible = false;
        }
    }
}

window.telloSim = new TelloLandscape();
