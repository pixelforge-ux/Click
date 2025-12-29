let audioCtx = null;
const cache = {};

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

export async function preloadSound(key) {
    const ctx = getAudioContext();
    if (cache[key]) return cache[key];
    try {
        const response = await fetch(`${key}.mp3`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await new Promise((resolve, reject) => {
            ctx.decodeAudioData(arrayBuffer, resolve, reject);
        });
        cache[key] = audioBuffer;
        return audioBuffer;
    } catch (e) {
        console.warn("Preload failed for " + key, e);
        return null;
    }
}

export async function playSound(key) {
    const ctx = getAudioContext();
    
    if (ctx.state === 'suspended') {
        await ctx.resume();
    }

    if (cache[key]) {
        const source = ctx.createBufferSource();
        source.buffer = cache[key];
        source.connect(ctx.destination);
        source.start(0);
        return;
    }

    const audioBuffer = await preloadSound(key);
    if (audioBuffer) {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start(0);
    }
}