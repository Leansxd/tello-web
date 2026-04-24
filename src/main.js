import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './style.css';

class ProParkur {
    constructor() {
        this.targets = [];
        this.selectedObjId = null;
        this.draggedObj = null; 
        this.keys = {}; 
        this.droneModel = null;
        this.props = []; // Pervaneler
        this.init();
        this.loadTextures();
        this.setupBridge();
        this.loadOrCreateMap();
        this.createDrone();
        this.setupInteractions();
        this.setupKeyboard();
        this.animate();
        this.initGlobalFunctions();
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    }

    updateNoclipCamera() {
        if (this.draggedObj) return; // Sürüklerken kamera hareket etmesin

        const moveSpeed = 0.6;
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        const sideVector = new THREE.Vector3();
        sideVector.crossVectors(this.camera.up, direction).normalize();
        const upVector = new THREE.Vector3(0, 1, 0);

        if (this.keys['w']) this.camera.position.addScaledVector(direction, moveSpeed);
        if (this.keys['s']) this.camera.position.addScaledVector(direction, -moveSpeed);
        if (this.keys['a']) this.camera.position.addScaledVector(sideVector, moveSpeed);
        if (this.keys['d']) this.camera.position.addScaledVector(sideVector, -moveSpeed);
        if (this.keys['q']) this.camera.position.addScaledVector(upVector, moveSpeed);
        if (this.keys['e']) this.camera.position.addScaledVector(upVector, -moveSpeed);

        this.controls.target.copy(this.camera.position).add(direction);
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(40, 30, 40);
        this.fpvCamera = new THREE.PerspectiveCamera(60, 640 / 480, 0.1, 150);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
        const light = new THREE.DirectionalLight(0xffffff, 1.2);
        light.position.set(10, 50, 10);
        this.scene.add(light);
        
        this.fpvTarget = new THREE.WebGLRenderTarget(640, 480);
        
        // ZEMİN PLANI (Sürükleme için referans)
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.scene.add(new THREE.GridHelper(300, 100, 0x444444, 0x111111));
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupInteractions() {
        const onDown = (event) => {
            if (event.button !== 0) return;
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.targets, true);
            
            if (intersects.length > 0) {
                let root = intersects[0].object;
                
                // Dronu da bir hedef olarak yakala
                if (root === this.drone || root.parent === this.drone || (this.droneModel && root.parent === this.droneModel)) {
                    this.draggedObj = this.drone;
                    this.selectedObjId = 'drone';
                    this.controls.enabled = false;
                    this.addLog("Drone position adjusting...", "system");
                    this.renderObjectList();
                    return;
                }

                while (root.parent && (!root.userData || !root.userData.id)) { root = root.parent; }
                
                if (root.userData && root.userData.id) {
                    this.draggedObj = root;
                    this.selectedObjId = root.userData.id;
                    this.controls.enabled = false; 
                    this.renderObjectList();
                }
            }
        };

        const onMove = (event) => {
            if (!this.draggedObj) return;

            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersectionPoint = new THREE.Vector3();
            if (this.raycaster.ray.intersectPlane(this.groundPlane, intersectionPoint)) {
                // Nesneyi farenin olduğu yere taşı
                this.draggedObj.position.x = intersectionPoint.x;
                this.draggedObj.position.z = intersectionPoint.z;
                
                // MapData'yı güncelle
                const obj = this.mapData.find(o => o.id === this.selectedObjId);
                if (obj) {
                    obj.x = intersectionPoint.x;
                    obj.z = intersectionPoint.z;
                }
            }
        };

        const onUp = () => {
            this.draggedObj = null;
            this.controls.enabled = true;
        };

        window.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }

    loadTextures() {
        const tl = new THREE.TextureLoader();
        this.texUp = tl.load('/up.png');
        this.texDown = tl.load('/down.png');
    }

    loadOrCreateMap() {
        const saved = localStorage.getItem('tello_mission_map');
        if (saved) {
            this.mapData = JSON.parse(saved);
        } else {
            this.mapData = [
                { id: 'm1', type: 'yukari', x: 0, z: -35, h: 4.5 },
                { id: 'm2', type: 'asagi', x: 0, z: -75, h: 5.5 },
                { id: 'm3', type: 'yukari', x: 0, z: -115, h: 4.5 },
                { id: 'm4', type: 'fire', x: 0, z: -155 }
            ];
        }
        this.rebuildWorld();
    }

    rebuildWorld() {
        this.targets.forEach(t => this.scene.remove(t));
        this.targets = [];
        this.scene.children.forEach(c => { if(ca.name === 'fire_obj') this.scene.remove(c); });

        this.mapData.forEach(obj => {
            if(obj.type === 'yukari') this.addWall(obj);
            else if(obj.type === 'asagi') this.addRoof(obj);
            else if(obj.type === 'fire') this.addFire(obj);
        });
        this.renderObjectList();
    }

    addWall(obj) {
        const g = new THREE.Group();
        const wm = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const wall = new THREE.Mesh(new THREE.BoxGeometry(15, obj.h, 2), wm);
        wall.position.y = obj.h / 2;
        g.add(wall);
        const p = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 3.5), new THREE.MeshStandardMaterial({ map: this.texUp, transparent: true, emissive: 0xffffff, emissiveIntensity: 0.5 }));
        p.position.set(0, obj.h + 1.2, 1.05); 
        g.add(p);
        g.position.set(obj.x, 0, obj.z);
        g.userData = { id: obj.id };
        this.scene.add(g);
        this.targets.push(g);
    }

    addRoof(obj) {
        const g = new THREE.Group();
        const rm = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const roof = new THREE.Mesh(new THREE.BoxGeometry(15, 6, 2), rm);
        roof.position.y = obj.h + 3;
        g.add(roof);
        const p = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 3.5), new THREE.MeshStandardMaterial({ map: this.texDown, transparent: true, emissive: 0xffffff, emissiveIntensity: 0.5 }));
        p.position.set(0, obj.h - 1.5, 1.05); 
        g.add(p);
        g.position.set(obj.x, 0, obj.z);
        g.userData = { id: obj.id };
        this.scene.add(g);
        this.targets.push(g);
    }

    addFire(obj) {
        const g = new THREE.Group(); g.name = "fire_obj";
        const light = new THREE.PointLight(0xff0000, 2, 15); light.position.y = 2; g.add(light);
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(2), new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 }));
        mesh.position.y = 2; g.add(mesh);
        g.position.set(obj.x, 0, obj.z);
        g.userData = { id: obj.id };
        this.scene.add(g);
        this.targets.push(g);
    }

    createDrone() {
        this.drone = new THREE.Group();
        
        // FPV Kamerayı dronun tam "burnuna" taşıyoruz (Gövdenin dışına çıksın)
        this.drone.add(this.fpvCamera);
        this.fpvCamera.position.set(0, 0.4, -1.2); 
        this.scene.add(this.drone);

        const loader = new GLTFLoader();
        loader.load('/dji_tello.glb', (gltf) => {
            this.droneModel = gltf.scene;
            this.droneModel.scale.set(0.4, 0.4, 0.4); 
            this.droneModel.rotation.y = Math.PI / 2; // Sola 90 derece kıvırdık
            this.droneModel.position.y = 0.1; 
            this.drone.add(this.droneModel);
            
            // Pervaneleri daha detaylı ara
            this.droneModel.traverse(child => {
                const n = child.name.toLowerCase();
                if (n.includes('prop') || n.includes('pervane') || n.includes('blade') || n.includes('rotor')) {
                    this.props.push(child);
                }
            });
            this.addLog("3D Drone optimized.", "system");
        }, undefined, (error) => {
            console.error("Model yüklenemedi, basit kutu ile devam ediliyor:", error);
            // Model gelmezse kutu koy ki dron kaybolmasın
            const dBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 1.2), new THREE.MeshStandardMaterial({ color: 0x444444 }));
            this.drone.add(dBody);
        });

        this.ds = { isFlying: false, vel: new THREE.Vector3(), targetVel: new THREE.Vector3(), yaw: 0, targetYawVel: 0, alt: 0, targetAltVel: 0 };
    }

    setupBridge() {
        const connect = () => {
            this.ws = new WebSocket("ws://127.0.0.1:9999");
            this.ws.onopen = () => { 
                document.getElementById('drone-status').innerText = "ONLINE"; 
                document.getElementById('drone-status').classList.add("status-online"); 
                this.addLog("Bridge connected.", "system");
            };
            this.ws.onclose = () => {
                document.getElementById('drone-status').innerText = "OFFLINE";
                document.getElementById('drone-status').classList.remove("status-online");
                setTimeout(connect, 2000);
            };
            this.ws.onmessage = (e) => {
                const cmd = JSON.parse(e.data);
                if(cmd.type==='takeoff') { this.ds.isFlying = true; this.ds.alt = 2.0; this.addLog("TAKEOFF initiated.", "cmd"); }
                if(cmd.type==='land') { this.ds.isFlying = false; this.ds.alt = 0; this.addLog("LAND initiated.", "cmd"); }
                if(cmd.type==='rotate') { this.ds.yaw += (cmd.val * Math.PI / 180); }
                if(cmd.type==='rc') {
                    const [lr, fb, ud, yaw] = cmd.val;
                    const fwd = new THREE.Vector3(0, 0, -fb/150).applyAxisAngle(new THREE.Vector3(0,1,0), this.ds.yaw);
                    const sde = new THREE.Vector3(lr/150, 0, 0).applyAxisAngle(new THREE.Vector3(0,1,0), this.ds.yaw);
                    this.ds.targetVel.copy(fwd).add(sde);
                    this.ds.targetAltVel = ud / 1500;
                    this.ds.targetYawVel = -yaw / 1500;
                }
            };
        };
        connect();
    }

    addLog(msg, type = 'ai') {
        const container = document.getElementById('ai-logs');
        if(!container) return;
        const d = new Date();
        const time = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
        container.innerHTML += `<div class="log-entry ${type}">[${time}] ${msg}</div>`;
        container.scrollTop = container.scrollHeight;
    }

    renderObjectList() {
        const list = document.getElementById('object-list');
        list.innerHTML = '';
        this.mapData.forEach(obj => {
            const isSelected = this.selectedObjId === obj.id;
            const card = document.createElement('div');
            card.className = `obj-card ${isSelected ? 'selected' : ''}`;
            card.style.borderColor = isSelected ? 'var(--accent)' : '#444';
            card.innerHTML = `
                <div class="name">${obj.type.toUpperCase()}</div>
                <div style="font-size:0.7rem; color:#666; margin-bottom:5px;">Sürüklemek için üzerine tıkla</div>
                <button class="remove-btn" onclick="window.removeObj('${obj.id}')">SİL</button>
            `;
            list.appendChild(card);
        });
    }

    initGlobalFunctions() {
        window.addLevelObj = (type) => {
            const id = Math.random().toString(36).substr(2, 5);
            const z = this.mapData.length > 0 ? this.mapData[this.mapData.length-1].z - 40 : -40;
            const newObj = { id, type, x: 0, z: z, h: (type==='fire' ? undefined : 4.5) };
            this.mapData.push(newObj);
            this.rebuildWorld();
        };
        window.removeObj = (id) => {
            if(this.transformControls.object?.userData?.id === id) this.transformControls.detach();
            this.mapData = this.mapData.filter(o => o.id !== id);
            this.rebuildWorld();
        };
        window.saveMap = () => {
            localStorage.setItem('tello_mission_map', JSON.stringify(this.mapData));
            alert("Harita Kaydedildi!");
        };
        window.droneAction = (type) => this.ws?.send(JSON.stringify({ type }));
    }

    animate() {
        const loop = () => {
            requestAnimationFrame(loop);
            this.updateNoclipCamera(); 

            // Pervane Animasyonları
            if (this.props.length > 0) {
                const speed = this.ds.isFlying ? 1.2 : 0;
                this.props.forEach(p => p.rotation.y += speed);
            }

            if(this.ds.isFlying) {
                this.ds.alt += this.ds.targetAltVel;
                this.drone.position.y += (this.ds.alt - this.drone.position.y) * 0.1;
                this.ds.yaw += this.ds.targetYawVel;
                this.drone.rotation.y = this.ds.yaw;
                this.ds.vel.lerp(this.ds.targetVel, 0.15);
                this.drone.position.add(this.ds.vel);
                this.ds.targetVel.set(0,0,0);
                this.ds.targetAltVel *= 0.8;
                this.ds.targetYawVel *= 0.8;
            } else {
                this.drone.position.y *= 0.9;
                this.ds.alt = 0;
                this.ds.vel.set(0,0,0);
            }

            const altEl = document.getElementById('stat-alt');
            if(altEl) altEl.innerText = this.drone.position.y.toFixed(1) + 'm';
            const spdEl = document.getElementById('stat-spd');
            if(spdEl) spdEl.innerText = (this.ds.vel.length() * 60).toFixed(1) + ' m/s';

            this.controls.update();
            const now = Date.now();
            if(this.ws?.readyState === 1 && (!this.lastFrameTime || now - this.lastFrameTime > 33)) {
                this.lastFrameTime = now;
                this.renderer.setRenderTarget(this.fpvTarget);
                this.renderer.render(this.scene, this.fpvCamera);
                const pixels = new Uint8Array(640 * 480 * 4);
                this.renderer.readRenderTargetPixels(this.fpvTarget, 0, 0, 640, 480, pixels);
                const canv = document.createElement('canvas'); canv.width = 640; canv.height = 480;
                const ctx = canv.getContext('2d');
                const imgData = ctx.createImageData(640, 480); imgData.data.set(pixels);
                ctx.putImageData(imgData, 0, 0);
                const finalCanv = document.createElement('canvas'); finalCanv.width = 640; finalCanv.height = 480;
                const fctx = finalCanv.getContext('2d'); fctx.scale(1, -1); 
                fctx.drawImage(canv, 0, -480);
                this.ws.send(JSON.stringify({ type: 'frame', data: finalCanv.toDataURL('image/jpeg', 0.7) }));
                this.renderer.setRenderTarget(null);
            }
            this.renderer.render(this.scene, this.camera);
        };
        loop();
    }
}
new ProParkur();
