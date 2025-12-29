import gsap from 'gsap';
let screens = {};
let onBackCallback = null;

export function initNavigation(callback) {
    screens = {
        mainMenu: document.getElementById('main-menu'),
        difficulty: document.getElementById('difficulty-menu'),
        settings: document.getElementById('settings-menu'),
        game: document.getElementById('game-view'),
        win: document.getElementById('win-modal')
    };

    onBackCallback = callback;
    
    // Hashchange listener for the browser back button
    window.addEventListener('hashchange', (e) => {
        const hash = location.hash.replace('#', '') || 'mainMenu';
        applyScreenVisibility(hash);
        if (onBackCallback) onBackCallback(hash);
    });

    const currentHash = location.hash.replace('#', '') || 'mainMenu';
    applyScreenVisibility(currentHash);
    
    // Ensure we start on a clean state
    if (!location.hash) {
        history.replaceState(null, '', '#mainMenu');
    }
}

export function showScreen(screenKey, push = true) {
    const current = location.hash.replace('#', '') || 'mainMenu';
    if (current === screenKey) return;

    const screenEl = screens[screenKey];
    if (screenEl) {
        gsap.fromTo(screenEl, 
            { opacity: 0, scale: 0.95, y: 10 },
            { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power2.out" }
        );
    }

    if (push) {
        location.hash = screenKey;
    } else {
        history.replaceState(null, '', `#${screenKey}`);
        applyScreenVisibility(screenKey);
    }
}

export function goBack() {
    const current = getCurrentScreen();
    if (current !== 'mainMenu') {
        history.back();
    }
}

function applyScreenVisibility(screenKey) {
    Object.keys(screens).forEach(key => {
        const element = screens[key];
        if (!element) return;
        
        if (key === screenKey) {
            element.classList.remove('hidden');
            if (key === 'win' || key === 'mainMenu' || key === 'difficulty' || key === 'settings') {
                element.classList.add('flex');
            }
        } else {
            element.classList.add('hidden');
            element.classList.remove('flex');
        }
    });

    try {
        if (window.Eitaa && Eitaa.WebApp && Eitaa.WebApp.BackButton) {
            if (screenKey === 'mainMenu' || screenKey === 'splash') {
                Eitaa.WebApp.BackButton.hide();
            } else {
                Eitaa.WebApp.BackButton.show();
            }
        }
    } catch (e) {
        // Silently fail Eitaa-specific UI calls if environment is restricted
    }
}

export function getCurrentScreen() {
    const hash = location.hash.replace('#', '');
    return screens[hash] ? hash : 'mainMenu';
}