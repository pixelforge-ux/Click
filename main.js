import * as THREE from 'three';
import { playSound } from './audio.js';
import { initNavigation, showScreen, getCurrentScreen, goBack } from './navigation.js';
import { setupGame, clearGameState } from './game.js';
import { updateVisuals, saveSettings, state as settingsState } from './settings.js';

// Robust Initialization
async function startApp() {
    try {
        // Unlock audio on first user interaction for mobile compatibility
        const unlockAudio = () => {
            playSound('click'); 
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('mousedown', unlockAudio);
        };
        document.addEventListener('touchstart', unlockAudio);
        document.addEventListener('mousedown', unlockAudio);

        updateVisuals();
        initBackground();
        initNavigation((screenKey) => {
            if (screenKey !== 'game') {
                clearGameState();
            }
        });
        setupEventListeners();
        initEitaa();
        
        // Start actual asset loading
        await performActualLoading();
    } catch (err) {
        console.error("App boot failure:", err);
        const splash = document.getElementById('splash-screen');
        if (splash) splash.style.display = 'none';
        const menu = document.getElementById('main-menu');
        if (menu) {
            menu.classList.remove('hidden');
            menu.classList.add('flex');
        }
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

function initEitaa() {
    try {
        if (window.Eitaa && Eitaa.WebApp) {
            if (typeof Eitaa.WebApp.ready === 'function') Eitaa.WebApp.ready();
            if (typeof Eitaa.WebApp.expand === 'function') Eitaa.WebApp.expand();
            if (typeof Eitaa.WebApp.setHeaderColor === 'function') Eitaa.WebApp.setHeaderColor('#e3f2fd');
            if (typeof Eitaa.WebApp.enableClosingConfirmation === 'function') Eitaa.WebApp.enableClosingConfirmation();
            if (typeof Eitaa.WebApp.disableVerticalSwipes === 'function') Eitaa.WebApp.disableVerticalSwipes();

            Eitaa.WebApp.onEvent('backButtonClicked', () => {
                const current = getCurrentScreen();
                if (current === 'mainMenu' || current === 'splash') {
                    Eitaa.WebApp.close();
                } else {
                    playSound('click');
                    history.back(); // Let the navigation module handle popstate
                }
            });
        }
    } catch (e) {
        console.warn("Eitaa SDK Init Error:", e);
    }
}

import { preloadSound } from './audio.js';

async function performActualLoading() {
    const bar = document.getElementById('loading-bar');
    const splash = document.getElementById('splash-screen');
    if (!bar || !splash) return;

    const images = [
        'card_back_classic.png', 'card_back_modern.png', 'card_back_abstract.png',
        'bg_pattern_dots.png', 'bg_pattern_waves.png', 'splash_logo.png'
    ];
    for (let i = 1; i <= 15; i++) images.push(`card_${i}.png`);
    
    const sounds = ['click', 'match', 'error', 'win'];
    
    const totalAssets = images.length + sounds.length;
    let loadedCount = 0;

    const updateProgress = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / totalAssets) * 100);
        bar.style.width = `${percent}%`;
    };

    const imagePromises = images.map(src => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = () => { updateProgress(); resolve(); };
            img.onerror = () => { updateProgress(); resolve(); }; // Continue even if one fails
        });
    });

    const soundPromises = sounds.map(key => {
        return preloadSound(key).then(() => {
            updateProgress();
        });
    });

    await Promise.all([...imagePromises, ...soundPromises]);

    // Small delay for smooth transition
    setTimeout(() => {
        splash.classList.add('opacity-0');
        splash.style.pointerEvents = 'none';
        setTimeout(() => {
            splash.classList.add('hidden');
        }, 800);
    }, 300);
}

function initBackground() {
    const container = document.getElementById('bg-canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Use lower pixel ratio for performance on low-end devices
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(1); // cap to 1 for consistent performance
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Lightweight particle creator with configurable cap
    const createParticleLayer = (count, size, color, spread, speedMult) => {
        const cappedCount = Math.min(count, 1200); // safety cap
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(cappedCount * 3);
        const velocities = new Float32Array(cappedCount);
        const colors = new Float32Array(cappedCount * 3);
        const baseColor = new THREE.Color(color);

        for (let i = 0; i < cappedCount; i++) {
            const i3 = i * 3;
            pos[i3] = (Math.random() - 0.5) * spread;
            pos[i3 + 1] = (Math.random() - 0.5) * spread;
            pos[i3 + 2] = (Math.random() - 0.5) * spread;

            velocities[i] = (Math.random() + 0.5) * speedMult;

            colors[i3] = baseColor.r + (Math.random() - 0.5) * 0.2;
            colors[i3 + 1] = baseColor.g + (Math.random() - 0.5) * 0.2;
            colors[i3 + 2] = baseColor.b + (Math.random() - 0.5) * 0.2;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: size,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const points = new THREE.Points(geo, mat);
        points.userData = { velocities, spread, count: cappedCount };
        return points;
    };

    // Reduced counts for smoother performance
    const layer1 = createParticleLayer(1200, 0.012, 0x3b82f6, 15, 0.0025);
    const layer2 = createParticleLayer(800, 0.02, 0x10b981, 20, 0.0045);
    const layer3 = createParticleLayer(60, 0.1, 0xffffff, 12, 0.01);

    scene.add(layer1, layer2, layer3);
    camera.position.z = 8;

    let targetX = 0, targetY = 0;
    let pointerListener = (e) => {
        targetX = (e.clientX - window.innerWidth / 2) / 450;
        targetY = (e.clientY - window.innerHeight / 2) / 450;
    };
    window.addEventListener('pointermove', pointerListener);

    let running = true;
    let lastTime = 0;
    // adaptive frame: skip heavy updates when not visible or canvas hidden
    function animate(time) {
        if (!running) return;
        requestAnimationFrame(animate);

        // throttle updates when tab hidden or canvas turned off
        if (document.hidden || !settingsState.animatedBg || container.style.display === 'none') {
            // light tick at 4fps to keep minimal motion without heavy work
            if (time - lastTime < 250) return;
        }
        lastTime = time;

        const t = time * 0.00025;

        [layer1, layer2, layer3].forEach((layer, idx) => {
            // smaller rotation deltas for stability
            layer.rotation.y += 0.0006 * (idx + 1);
            layer.rotation.z += 0.0003 * (idx + 1);

            const attr = layer.geometry.attributes.position;
            const pos = attr.array;
            const count = layer.userData.count;
            // only update a subset per frame for big layers
            const step = count > 800 ? 4 : 1;
            for (let i = 0; i < count * 3; i += 3 * step) {
                pos[i + 1] += Math.sin(t + i) * 0.0008;
            }
            attr.needsUpdate = true;
        });

        // smooth camera follow
        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (-targetY - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }

    // Pause/resume controls
    const updateRunningState = () => {
        const shouldRun = settingsState.animatedBg && container.style.display !== 'none' && !document.hidden;
        if (shouldRun && !running) {
            running = true;
            requestAnimationFrame(animate);
        } else if (!shouldRun && running) {
            running = false;
        }
    };

    document.addEventListener('visibilitychange', updateRunningState);
    // observe settings changes via small interval (settings.updateVisuals will toggle display)
    const settingsObserver = setInterval(updateRunningState, 500);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // clean up if container removed
    const observer = new MutationObserver(() => {
        if (!document.body.contains(container)) {
            running = false;
            window.removeEventListener('pointermove', pointerListener);
            document.removeEventListener('visibilitychange', updateRunningState);
            clearInterval(settingsObserver);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // start animation only if allowed by settings
    if (settingsState.animatedBg) {
        running = true;
        requestAnimationFrame(animate);
    } else {
        running = false;
    }
}

function setupEventListeners() {
    document.getElementById('btn-start').onclick = () => {
        playSound('click');
        showScreen('difficulty');
    };

    document.getElementById('btn-settings').onclick = () => {
        playSound('click');
        showScreen('settings');
    };

    document.getElementById('btn-back-menu').onclick = () => {
        playSound('click');
        showScreen('mainMenu');
    };

    document.getElementById('btn-save-settings').onclick = () => {
        playSound('click');
        showScreen('mainMenu');
    };

    document.getElementById('btn-quit').onclick = () => {
        playSound('click');
        showScreen('mainMenu');
    };

    document.querySelectorAll('.btn-diff').forEach(btn => {
        btn.onclick = () => {
            playSound('click');
            showScreen('game', true); 
            setupGame(btn.dataset.difficulty);
        };
    });

    document.getElementById('btn-win-close').onclick = () => {
        playSound('click');
        showScreen('mainMenu');
    };

    document.querySelectorAll('.setting-opt-bg').forEach(opt => {
        opt.onclick = () => {
            saveSettings({ bg: opt.dataset.bg });
            playSound('click');
        };
    });

    document.querySelectorAll('.setting-opt-card').forEach(opt => {
        opt.onclick = () => {
            saveSettings({ cardBack: opt.dataset.card });
            playSound('click');
        };
    });

    document.getElementById('toggle-animated-bg').onclick = () => {
        playSound('click');
        saveSettings({ animatedBg: !settingsState.animatedBg });
    };
}