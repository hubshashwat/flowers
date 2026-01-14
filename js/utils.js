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
        renderer.toneMappingExposure = 1;
        
        container.appendChild(renderer.domElement);

        // Handle resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        
        window.addEventListener('resize', handleResize);

        // Clock for animations
        const clock = new THREE.Clock();

        return { scene, camera, renderer, clock, handleResize };
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
        texture.colorSpace = THREE.SRGBColorSpace;
        
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
    }
};

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlowerUtils;
}
