/**
 * 🌸 Flowers For Her - Shared Three.js Utilities
 * Reusable functions for all flower scenes
 */

const FlowerUtils = {
    /**
     * Initialize a basic Three.js scene with responsive canvas
     */
    initScene(container = document.body, options = {}) {
        const {
            background = 0x1a1a1a,
            antialias = true,
            alpha = false,
            fog = null
        } = options;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(background);
        
        if (fog) {
            scene.fog = new THREE.Fog(fog.color, fog.near, fog.far);
        }

        // Camera
        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(0, 2, 5);

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias,
            alpha,
            powerPreference: 'high-performance'
        });
        
        // Cap pixel ratio for mobile performance
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = options.exposure !== undefined ? options.exposure : 1.15;
        
        container.appendChild(renderer.domElement);

        // Store current flower page in sessionStorage so returning to the garden preserves position
        try {
            const pageName = window.location.pathname.split('/').pop();
            if (pageName && pageName.endsWith('.html') && pageName !== 'index.html') {
                sessionStorage.setItem('lastFlowerPage', pageName);
            }
        } catch (e) {}

        // Auto-generate luxury studio environment reflections
        let envMap = null;
        if (options.environment !== false) {
            try {
                envMap = this.createStudioEnvironment(renderer, options.environmentTheme || 'dark_luxury');
                scene.environment = envMap;
            } catch (e) {
                console.warn('Environment generation skipped:', e);
            }
        }

        // Setup smooth orbit controls if enabled
        let controls = null;
        if (options.controls) {
            controls = this.setupOrbitControls(camera, renderer.domElement, options.controls === true ? {} : options.controls);
        }

        // Handle resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        
        window.addEventListener('resize', handleResize);

        // Clock for animations
        const clock = new THREE.Clock();

        return { scene, camera, renderer, clock, handleResize, controls, envMap };
    },

    /**
     * Create ambient + directional lighting setup
     */
    createLighting(scene, options = {}) {
        const {
            ambientColor = 0xffffff,
            ambientIntensity = 0.4,
            directionalColor = 0xffffff,
            directionalIntensity = 1,
            directionalPosition = [5, 10, 5],
            enableShadows = true
        } = options;

        const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
        scene.add(ambient);

        const directional = new THREE.DirectionalLight(directionalColor, directionalIntensity);
        directional.position.set(...directionalPosition);
        
        if (enableShadows) {
            directional.castShadow = true;
            directional.shadow.mapSize.width = 2048;
            directional.shadow.mapSize.height = 2048;
            directional.shadow.camera.near = 0.5;
            directional.shadow.camera.far = 50;
            directional.shadow.camera.left = -10;
            directional.shadow.camera.right = 10;
            directional.shadow.camera.top = 10;
            directional.shadow.camera.bottom = -10;
        }
        
        scene.add(directional);

        return { ambient, directional };
    },

    /**
     * Create a petal shape using bezier curves
     */
    createPetalShape(width = 0.3, length = 1, curve = 0.2) {
        const shape = new THREE.Shape();
        
        shape.moveTo(0, 0);
        shape.bezierCurveTo(
            width * 0.5, length * 0.2,      // cp1
            width, length * 0.5,             // cp2
            width * 0.7, length * 0.8        // end
        );
        shape.bezierCurveTo(
            width * 0.5, length * 0.95,      // cp1
            0.05, length,                     // cp2
            0, length                         // tip
        );
        shape.bezierCurveTo(
            -0.05, length,                    // cp1
            -width * 0.5, length * 0.95,     // cp2
            -width * 0.7, length * 0.8       // end
        );
        shape.bezierCurveTo(
            -width, length * 0.5,            // cp1
            -width * 0.5, length * 0.2,      // cp2
            0, 0                              // back to start
        );

        return shape;
    },

    /**
     * Create petal geometry with detail
     */
    createPetalGeometry(options = {}) {
        const {
            width = 0.3,
            length = 1,
            segments = 32,
            curveAmount = 0.3
        } = options;

        const shape = this.createPetalShape(width, length);
        
        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 0.02,
            bevelEnabled: true,
            bevelThickness: 0.01,
            bevelSize: 0.01,
            bevelSegments: 2,
            curveSegments: segments
        });

        // Add curve to petal
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const y = positions.getY(i);
            const normalizedY = y / length;
            const curveOffset = Math.sin(normalizedY * Math.PI) * curveAmount;
            positions.setZ(i, positions.getZ(i) - curveOffset);
        }
        positions.needsUpdate = true;
        geometry.computeVertexNormals();

        return geometry;
    },

    /**
     * Create flower center / pistil
     */
    createFlowerCenter(radius = 0.2, color = 0xFFD700) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.8,
            metalness: 0.1
        });
        return new THREE.Mesh(geometry, material);
    },

    /**
     * Create a stem with optional leaves
     */
    createStem(options = {}) {
        const {
            height = 2,
            radius = 0.03,
            color = 0x4a7c4e,
            curve = 0.2,
            segments = 16
        } = options;

        // Create curved path for stem
        const curve3D = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(curve * 0.3, height * 0.3, curve * 0.2),
            new THREE.Vector3(-curve * 0.2, height * 0.6, -curve * 0.1),
            new THREE.Vector3(curve * 0.1, height, 0)
        ]);

        const geometry = new THREE.TubeGeometry(curve3D, segments, radius, 8, false);
        const material = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.9,
            metalness: 0
        });

        return new THREE.Mesh(geometry, material);
    },

    /**
     * Golden angle for Fibonacci spiral (in radians)
     */
    GOLDEN_ANGLE: Math.PI * (3 - Math.sqrt(5)),

    /**
     * Calculate position on Fibonacci spiral
     */
    fibonacciPosition(index, scale = 0.1) {
        const angle = index * this.GOLDEN_ANGLE;
        const radius = scale * Math.sqrt(index);
        return {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle),
            angle
        };
    },

    /**
     * Easing functions
     */
    easing: {
        easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
        easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
        easeInQuart: (t) => t * t * t * t,
        easeOutElastic: (t) => {
            const c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        },
        easeOutBack: (t) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        }
    },

    /**
     * Simplex noise approximation for procedural effects
     */
    noise2D(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    },

    /**
     * Smooth noise for natural-looking randomness
     */
    smoothNoise(x, y, octaves = 4) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            value += this.noise2D(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }

        return value / maxValue;
    },

    /**
     * Create particle system for pollen/sparkles
     */
    createParticleSystem(count = 100, options = {}) {
        const {
            size = 0.05,
            color = 0xFFD700,
            spread = 2,
            transparent = true,
            opacity = 0.8
        } = options;

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * spread;
            positions[i * 3 + 1] = Math.random() * spread;
            positions[i * 3 + 2] = (Math.random() - 0.5) * spread;

            velocities[i * 3] = (Math.random() - 0.5) * 0.01;
            velocities[i * 3 + 1] = Math.random() * 0.02 + 0.01;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.userData.velocities = velocities;

        const material = new THREE.PointsMaterial({
            size,
            color,
            transparent,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        return new THREE.Points(geometry, material);
    },

    /**
     * Update particle positions
     */
    updateParticles(particles, deltaTime, bounds = 3) {
        const positions = particles.geometry.attributes.position;
        const velocities = particles.geometry.userData.velocities;

        for (let i = 0; i < positions.count; i++) {
            positions.array[i * 3] += velocities[i * 3];
            positions.array[i * 3 + 1] += velocities[i * 3 + 1];
            positions.array[i * 3 + 2] += velocities[i * 3 + 2];

            // Reset particle if out of bounds
            if (positions.array[i * 3 + 1] > bounds) {
                positions.array[i * 3] = (Math.random() - 0.5) * bounds;
                positions.array[i * 3 + 1] = 0;
                positions.array[i * 3 + 2] = (Math.random() - 0.5) * bounds;
            }
        }

        positions.needsUpdate = true;
    },

    /**
     * Create gradient background
     */
    createGradientBackground(topColor, bottomColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 512;
        
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, topColor);
        gradient.addColorStop(1, bottomColor);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 2, 512);
        
        const texture = new THREE.CanvasTexture(canvas);
        if (typeof THREE.SRGBColorSpace !== 'undefined') {
            texture.colorSpace = THREE.SRGBColorSpace;
        } else if (typeof THREE.sRGBEncoding !== 'undefined') {
            texture.encoding = THREE.sRGBEncoding;
        }
        
        return texture;
    },

    /**
     * Detect if device is mobile
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth < 768;
    },

    /**
     * Get optimized settings for current device
     */
    getDeviceSettings() {
        const mobile = this.isMobile();
        return {
            particleCount: mobile ? 50 : 200,
            shadowMapSize: mobile ? 1024 : 2048,
            antialias: !mobile,
            segments: mobile ? 16 : 32
        };
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            setTimeout(() => {
                overlay.classList.add('hidden');
            }, 500);
        }
    },

    /**
     * Standard animation loop wrapper
     */
    animate(renderer, scene, camera, updateFn) {
        const clock = new THREE.Clock();
        
        function loop() {
            requestAnimationFrame(loop);
            const delta = clock.getDelta();
            const elapsed = clock.getElapsedTime();
            
            if (updateFn) {
                updateFn(delta, elapsed);
            }
            
            renderer.render(scene, camera);
        }
        
        loop();
    },

    /**
     * Environment texture cache
     */
    _envCache: {},

    /**
     * Generate procedural luxury studio environment reflections
     */
    createStudioEnvironment(renderer, theme = 'dark_luxury') {
        if (this._envCache[theme]) return this._envCache[theme];

        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        if (theme === 'cyberpunk') {
            const bg = ctx.createLinearGradient(0, 0, 0, 512);
            bg.addColorStop(0, '#060012');
            bg.addColorStop(0.5, '#0a021a');
            bg.addColorStop(1, '#020005');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, 1024, 512);

            const g1 = ctx.createRadialGradient(250, 180, 5, 250, 180, 220);
            g1.addColorStop(0, '#ff00aa');
            g1.addColorStop(0.4, 'rgba(255, 0, 128, 0.6)');
            g1.addColorStop(1, 'transparent');
            ctx.fillStyle = g1;
            ctx.fillRect(0, 0, 600, 400);

            const g2 = ctx.createRadialGradient(780, 200, 5, 780, 200, 250);
            g2.addColorStop(0, '#00f6ff');
            g2.addColorStop(0.4, 'rgba(0, 200, 255, 0.6)');
            g2.addColorStop(1, 'transparent');
            ctx.fillStyle = g2;
            ctx.fillRect(500, 0, 524, 450);
        } else if (theme === 'crystal_ice') {
            const bg = ctx.createLinearGradient(0, 0, 0, 512);
            bg.addColorStop(0, '#0a1018');
            bg.addColorStop(0.5, '#050a12');
            bg.addColorStop(1, '#020408');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, 1024, 512);

            const g1 = ctx.createRadialGradient(300, 140, 5, 300, 140, 200);
            g1.addColorStop(0, '#ffffff');
            g1.addColorStop(0.3, '#d8f0ff');
            g1.addColorStop(1, 'transparent');
            ctx.fillStyle = g1;
            ctx.fillRect(0, 0, 600, 350);

            const g2 = ctx.createRadialGradient(750, 220, 5, 750, 220, 240);
            g2.addColorStop(0, '#88d0ff');
            g2.addColorStop(0.5, 'rgba(100, 180, 255, 0.4)');
            g2.addColorStop(1, 'transparent');
            ctx.fillStyle = g2;
            ctx.fillRect(500, 0, 524, 450);
        } else if (theme === 'warm_sunset' || theme === 'fire') {
            const bg = ctx.createLinearGradient(0, 0, 0, 512);
            bg.addColorStop(0, '#1a0805');
            bg.addColorStop(0.5, '#0c0402');
            bg.addColorStop(1, '#050201');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, 1024, 512);

            const g1 = ctx.createRadialGradient(250, 160, 5, 250, 160, 240);
            g1.addColorStop(0, '#fff4d0');
            g1.addColorStop(0.3, '#ff9933');
            g1.addColorStop(1, 'transparent');
            ctx.fillStyle = g1;
            ctx.fillRect(0, 0, 600, 400);

            const g2 = ctx.createRadialGradient(800, 180, 5, 800, 180, 220);
            g2.addColorStop(0, '#ff3300');
            g2.addColorStop(0.4, '#aa1133');
            g2.addColorStop(1, 'transparent');
            ctx.fillStyle = g2;
            ctx.fillRect(550, 0, 474, 400);
        } else {
            // 'dark_luxury'
            const bg = ctx.createLinearGradient(0, 0, 0, 512);
            bg.addColorStop(0, '#16161e');
            bg.addColorStop(0.5, '#0b0b10');
            bg.addColorStop(1, '#050508');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, 1024, 512);

            const g1 = ctx.createRadialGradient(280, 130, 10, 280, 130, 240);
            g1.addColorStop(0, '#ffffff');
            g1.addColorStop(0.35, '#ffeedd');
            g1.addColorStop(0.7, 'rgba(255, 210, 190, 0.4)');
            g1.addColorStop(1, 'transparent');
            ctx.fillStyle = g1;
            ctx.fillRect(0, 0, 600, 360);

            const g2 = ctx.createRadialGradient(780, 200, 10, 780, 200, 240);
            g2.addColorStop(0, '#f0f4ff');
            g2.addColorStop(0.4, 'rgba(180, 195, 235, 0.5)');
            g2.addColorStop(1, 'transparent');
            ctx.fillStyle = g2;
            ctx.fillRect(500, 0, 524, 420);

            const horiz = ctx.createLinearGradient(0, 230, 0, 270);
            horiz.addColorStop(0, 'transparent');
            horiz.addColorStop(0.5, 'rgba(255, 240, 245, 0.35)');
            horiz.addColorStop(1, 'transparent');
            ctx.fillStyle = horiz;
            ctx.fillRect(0, 230, 1024, 40);
        }

        const texture = new THREE.CanvasTexture(canvas);
        const pmrem = new THREE.PMREMGenerator(renderer);
        const renderTarget = pmrem.fromEquirectangular(texture);
        texture.dispose();
        pmrem.dispose();

        this._envCache[theme] = renderTarget.texture;
        return renderTarget.texture;
    },

    /**
     * Smooth, inertial orbit camera controls without external library dependencies
     */
    setupOrbitControls(camera, domElement, options = {}) {
        const {
            target = new THREE.Vector3(0, 0.5, 0),
            minDistance = 1.8,
            maxDistance = 10,
            minPolarAngle = 0.25,
            maxPolarAngle = Math.PI - 0.25,
            enableDamping = true,
            dampingFactor = 0.06,
            autoRotate = true,
            autoRotateSpeed = 0.4,
            enableZoom = true
        } = options;

        let isPointerDown = false;
        let prevPointerX = 0;
        let prevPointerY = 0;
        let spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
        let targetSpherical = spherical.clone();
        let lastInteractionTime = performance.now();

        const onPointerDown = (e) => {
            isPointerDown = true;
            prevPointerX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
            prevPointerY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
            lastInteractionTime = performance.now();
        };

        const onPointerMove = (e) => {
            if (!isPointerDown) return;
            const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
            const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
            if (clientX === undefined || clientY === undefined) return;

            const deltaX = clientX - prevPointerX;
            const deltaY = clientY - prevPointerY;
            prevPointerX = clientX;
            prevPointerY = clientY;

            targetSpherical.theta -= deltaX * 0.006;
            targetSpherical.phi -= deltaY * 0.006;
            targetSpherical.phi = Math.max(minPolarAngle, Math.min(maxPolarAngle, targetSpherical.phi));
            lastInteractionTime = performance.now();
        };

        const onPointerUp = () => {
            isPointerDown = false;
        };

        const onWheel = (e) => {
            if (!enableZoom) return;
            e.preventDefault();
            const factor = e.deltaY > 0 ? 1.08 : 0.92;
            targetSpherical.radius = Math.max(minDistance, Math.min(maxDistance, targetSpherical.radius * factor));
            lastInteractionTime = performance.now();
        };

        domElement.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        domElement.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerUp, { passive: true });

        domElement.addEventListener('wheel', onWheel, { passive: false });

        const update = (delta = 0.016) => {
            if (autoRotate && !isPointerDown && (performance.now() - lastInteractionTime > 2500)) {
                targetSpherical.theta += autoRotateSpeed * delta * 0.5;
            }

            if (enableDamping) {
                spherical.theta += (targetSpherical.theta - spherical.theta) * (dampingFactor * 60 * delta);
                spherical.phi += (targetSpherical.phi - spherical.phi) * (dampingFactor * 60 * delta);
                spherical.radius += (targetSpherical.radius - spherical.radius) * (dampingFactor * 60 * delta);
            } else {
                spherical.copy(targetSpherical);
            }

            spherical.phi = Math.max(minPolarAngle, Math.min(maxPolarAngle, spherical.phi));
            spherical.radius = Math.max(minDistance, Math.min(maxDistance, spherical.radius));

            camera.position.setFromSpherical(spherical).add(target);
            camera.lookAt(target);
        };

        return {
            target,
            update,
            dispose() {
                domElement.removeEventListener('mousedown', onPointerDown);
                window.removeEventListener('mousemove', onPointerMove);
                window.removeEventListener('mouseup', onPointerUp);
                domElement.removeEventListener('touchstart', onPointerDown);
                window.removeEventListener('touchmove', onPointerMove);
                window.removeEventListener('touchend', onPointerUp);
                domElement.removeEventListener('wheel', onWheel);
            }
        };
    },

    /**
     * Create floating glowing atmospheric pollen / dust motes
     */
    createAtmosphere(scene, options = {}) {
        const {
            count = 140,
            color = 0xffeedd,
            spread = 5,
            size = 0.035,
            speed = 0.2
        } = options;

        const geom = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const vel = new Float32Array(count * 3);
        const phase = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * spread;
            pos[i * 3 + 1] = Math.random() * spread * 0.9 - 0.5;
            pos[i * 3 + 2] = (Math.random() - 0.5) * spread;

            vel[i * 3] = (Math.random() - 0.5) * 0.015 * speed;
            vel[i * 3 + 1] = (Math.random() * 0.02 + 0.008) * speed;
            vel[i * 3 + 2] = (Math.random() - 0.5) * 0.015 * speed;

            phase[i] = Math.random() * Math.PI * 2;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));

        const mat = new THREE.PointsMaterial({
            size,
            color,
            transparent: true,
            opacity: 0.65,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const points = new THREE.Points(geom, mat);
        scene.add(points);

        return {
            points,
            update(elapsed = 0, delta = 0.016) {
                const p = geom.attributes.position.array;
                for (let i = 0; i < count; i++) {
                    p[i * 3] += vel[i * 3] + Math.sin(elapsed * 0.6 + phase[i]) * 0.0015;
                    p[i * 3 + 1] += vel[i * 3 + 1];
                    p[i * 3 + 2] += vel[i * 3 + 2] + Math.cos(elapsed * 0.6 + phase[i]) * 0.0015;

                    if (p[i * 3 + 1] > spread * 0.6) {
                        p[i * 3 + 1] = -0.6;
                        p[i * 3] = (Math.random() - 0.5) * spread;
                        p[i * 3 + 2] = (Math.random() - 0.5) * spread;
                    }
                }
                geom.attributes.position.needsUpdate = true;
            }
        };
    },

    /**
     * Create luxury reflective pedestal
     */
    createPedestal(arg1, arg2 = {}) {
        let scene = null;
        let options = {};
        if (arg1 && typeof arg1.add === 'function') {
            scene = arg1;
            options = arg2 || {};
        } else {
            options = arg1 || {};
        }

        const {
            radius = 2.0,
            height = 0.08,
            color = 0x0e0e14,
            roughness = 0.2,
            metalness = 0.6,
            y = -1.2,
            rimColor = null
        } = options;

        const group = new THREE.Group();
        group.position.y = y;

        const geom = new THREE.CylinderGeometry(radius, radius * 1.05, height, 64);
        const mat = new THREE.MeshStandardMaterial({
            color,
            roughness,
            metalness,
            side: THREE.FrontSide
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.receiveShadow = true;
        group.add(mesh);

        // Ambient contact shadow ring
        const ringGeom = new THREE.RingGeometry(radius * 0.7, radius * 1.5, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -height * 0.5 - 0.01;
        group.add(ring);

        // Optional emissive rim accent
        if (rimColor !== null) {
            const rimGeom = new THREE.TorusGeometry(radius * 1.01, 0.008, 16, 64);
            const rimMat = new THREE.MeshBasicMaterial({
                color: rimColor,
                transparent: true,
                opacity: 0.8
            });
            const rimMesh = new THREE.Mesh(rimGeom, rimMat);
            rimMesh.rotation.x = Math.PI / 2;
            rimMesh.position.y = height * 0.5;
            group.add(rimMesh);
        }

        if (scene) {
            scene.add(group);
        }
        return group;
    },

    /**
     * Create organic dual-axis curved petal geometry
     */
    createCurvedPetalGeometry(arg1 = 0.45, arg2 = 1.3, arg3 = {}) {
        let width = 0.45;
        let length = 1.3;
        let options = {};
        if (typeof arg1 === 'object' && arg1 !== null) {
            options = arg1;
            width = options.width !== undefined ? options.width : 0.45;
            length = options.length !== undefined ? options.length : 1.3;
        } else {
            width = typeof arg1 === 'number' ? arg1 : 0.45;
            length = typeof arg2 === 'number' ? arg2 : 1.3;
            options = arg3 || {};
        }

        const {
            uSegments = options.segmentsW || 24,
            vSegments = options.segmentsL || 36,
            curl = 0.32,
            cup = options.wave !== undefined ? options.wave : 0.22,
            flare = 0.12,
            ruffle = 0.025
        } = options;

        const geom = new THREE.PlaneGeometry(width, length, uSegments, vSegments);
        const pos = geom.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            let y = pos.getY(i) + length * 0.5;
            pos.setY(i, y);

            const v = Math.max(0, Math.min(1, y / length));
            const u = x / (width * 0.5);

            const widthScale = Math.sin(Math.pow(v, 0.72) * Math.PI);
            pos.setX(i, x * Math.max(0.06, widthScale));

            const cupOffset = (1 - u * u) * Math.sin(v * Math.PI * 0.85) * cup;
            const curlOffset = Math.pow(v, 1.6) * curl - Math.sin(v * Math.PI) * flare;
            const edgeDist = Math.abs(u);
            const edgeRuffle = edgeDist > 0.5 ? Math.sin(v * 24.0 + edgeDist * 6.0) * ruffle * (edgeDist - 0.5) : 0;

            pos.setZ(i, cupOffset - curlOffset + edgeRuffle);
        }

        pos.needsUpdate = true;
        geom.computeVertexNormals();
        return geom;
    },

    /**
     * Helper for creating physical petal materials with realistic sheen & transmission
     */
    createPhysicalPetalMaterial(options = {}) {
        const {
            color = 0xd43d59,
            roughness = 0.35,
            metalness = 0.02,
            transmission = 0.18,
            thickness = 0.4,
            sheen = null,
            sheenColor = 0xffaacc,
            clearcoat = 0.15,
            clearcoatRoughness = 0.3
        } = options;

        const matOptions = {
            color: new THREE.Color(color),
            roughness,
            metalness,
            transmission,
            thickness,
            clearcoat,
            clearcoatRoughness,
            side: THREE.DoubleSide
        };

        if (sheen) {
            matOptions.sheen = (sheen instanceof THREE.Color) ? sheen : new THREE.Color(sheenColor || color);
        }

        return new THREE.MeshPhysicalMaterial(matOptions);
    },

    /**
     * Create realistic optical dewdrop
     */
    createDewdrop(arg = 0.04) {
        let radius = 0.04;
        if (typeof arg === 'object' && arg !== null) {
            radius = typeof arg.radius === 'number' ? arg.radius : 0.04;
        } else if (typeof arg === 'number') {
            radius = arg;
        }

        const geom = new THREE.SphereGeometry(radius, 16, 16);
        const mat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.05,
            metalness: 0,
            transmission: 0.96,
            ior: 1.333,
            thickness: 0.2,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.scale.set(1, 0.6, 1); // Flatten slightly against surface
        return mesh;
    },

    /**
     * Create faceted crystal shard geometry
     */
    createFacetedCrystalGeometry(radius = 0.1, height = 0.6, sides = 6) {
        const geom = new THREE.ConeGeometry(radius, height, sides, 1, false);
        geom.computeVertexNormals();
        return geom;
    },

    /**
     * Create botanical stamen cluster with pollen anthers
     */
    createStamenCluster(options = {}) {
        const {
            count = 24,
            radius = 0.12,
            height = 0.35,
            filamentColor = 0xffeedd,
            pollenColor = 0xffb703,
            pollenEmissive = 0x884400
        } = options;

        const group = new THREE.Group();
        const antherGeom = new THREE.SphereGeometry(0.022, 12, 12);
        antherGeom.scale(1, 1.8, 1);
        const antherMat = new THREE.MeshStandardMaterial({
            color: pollenColor,
            emissive: pollenEmissive,
            emissiveIntensity: 0.4,
            roughness: 0.6
        });

        const lineMat = new THREE.LineBasicMaterial({
            color: filamentColor,
            transparent: true,
            opacity: 0.75
        });

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.2;
            const r = (0.3 + 0.7 * Math.sqrt((i + 1) / count)) * radius;
            const tipX = Math.cos(angle) * (r + 0.08);
            const tipZ = Math.sin(angle) * (r + 0.08);
            const tipY = height * (0.8 + 0.25 * Math.sin(i * 1.5));

            // Curved filament line
            const points = [
                new THREE.Vector3(Math.cos(angle) * r * 0.3, 0, Math.sin(angle) * r * 0.3),
                new THREE.Vector3(Math.cos(angle) * (r + 0.03), tipY * 0.55, Math.sin(angle) * (r + 0.03)),
                new THREE.Vector3(tipX, tipY, tipZ)
            ];
            const curve = new THREE.CatmullRomCurve3(points);
            const lineGeom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(12));
            const line = new THREE.Line(lineGeom, lineMat);
            group.add(line);

            // Pollen anther head
            const anther = new THREE.Mesh(antherGeom, antherMat);
            anther.position.set(tipX, tipY, tipZ);
            anther.rotation.x = 0.4 * Math.sin(angle);
            anther.rotation.z = -0.4 * Math.cos(angle);
            group.add(anther);
        }

        return group;
    },

    /**
     * Create layered luminous energy core with corona glow
     */
    createGlowingCore(arg1, arg2 = {}) {
        let parent = null;
        let options = {};
        if (arg1 && typeof arg1.add === 'function') {
            parent = arg1;
            options = arg2 || {};
        } else {
            options = arg1 || {};
        }

        const {
            radius = 0.16,
            innerColor = 0xffffff,
            glowColor = options.color || 0x00ffff,
            emissiveIntensity = 2.0,
            y = 0
        } = options;

        const group = new THREE.Group();
        group.position.y = y;

        // Inner solid core
        const coreGeom = new THREE.SphereGeometry(radius * 0.65, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({
            color: innerColor
        });
        const core = new THREE.Mesh(coreGeom, coreMat);
        group.add(core);

        // Soft outer corona
        const coronaGeom = new THREE.SphereGeometry(radius, 32, 32);
        const coronaMat = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const corona = new THREE.Mesh(coronaGeom, coronaMat);
        group.add(corona);

        // Point light for real illumination
        const light = new THREE.PointLight(glowColor, emissiveIntensity, 6);
        group.add(light);

        if (parent) {
            parent.add(group);
        }

        const pulseFn = (elapsed = 0, speed = 3) => {
            const pulse = 1 + Math.sin(elapsed * speed) * 0.14;
            corona.scale.setScalar(pulse);
            light.intensity = emissiveIntensity * (0.85 + Math.sin(elapsed * (speed * 1.3)) * 0.18);
        };

        group.group = group;
        group.mesh = group;
        group.light = light;
        group.corona = corona;
        group.core = core;
        group.pulse = pulseFn;
        group.update = pulseFn;

        return group;
    }
};

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlowerUtils;
}
