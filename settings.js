const getStorageItem = (key, fallback) => {
    try {
        const val = localStorage.getItem(key);
        return val !== null ? val : fallback;
    } catch (e) {
        return fallback;
    }
};

export const state = {
    bg: getStorageItem('game_bg', 'waves'),
    cardBack: getStorageItem('game_cardBack', 'classic'),
    animatedBg: getStorageItem('game_animatedBg', 'true') !== 'false' // Default to true
};

export function updateVisuals() {
    const bgUrl = state.bg === 'dots' ? 'bg_pattern_dots.png' : 'bg_pattern_waves.png';
    document.body.style.backgroundImage = `url(${bgUrl})`;
    document.body.style.backgroundSize = 'cover';

    // Animated Background Visibility
    const canvas = document.getElementById('bg-canvas-container');
    if (canvas) {
        canvas.style.display = state.animatedBg ? 'block' : 'none';
    }

    // Toggle UI state
    const toggleBtn = document.getElementById('toggle-animated-bg');
    if (toggleBtn) {
        toggleBtn.classList.toggle('bg-blue-600', state.animatedBg);
        toggleBtn.classList.toggle('bg-slate-700', !state.animatedBg);
        const dot = toggleBtn.querySelector('.dot');
        if (dot) {
            dot.style.transform = state.animatedBg ? 'translateX(28px)' : 'translateX(0)';
        }
    }

    document.querySelectorAll('.setting-opt-bg').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.bg === state.bg);
    });
    document.querySelectorAll('.setting-opt-card').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.card === state.cardBack);
    });
}

export function saveSettings(newSettings) {
    Object.assign(state, newSettings);
    try {
        localStorage.setItem('game_bg', state.bg);
        localStorage.setItem('game_cardBack', state.cardBack);
        localStorage.setItem('game_animatedBg', state.animatedBg);
    } catch (e) {
        console.warn("Settings could not be saved to local storage");
    }
    updateVisuals();
}