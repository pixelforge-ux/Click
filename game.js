import confetti from 'canvas-confetti';
import gsap from 'gsap';
import { playSound } from './audio.js';
import { state as settingsState } from './settings.js';
import { showScreen } from './navigation.js';

const gameState = {
    difficulty: 'easy',
    score: 0,
    time: 0,
    timerInterval: null,
    flippedCards: [],
    isProcessing: false,
    matchesFound: 0,
    totalPairs: 0,
    imageCount: 15
};

export function setupGame(difficulty) {
    gameState.difficulty = difficulty;
    const config = {
        easy: { rows: 3, cols: 4, previewTime: 3000 },
        medium: { rows: 4, cols: 4, previewTime: 4000 },
        hard: { rows: 6, cols: 5, previewTime: 6000 }
    }[difficulty];

    gameState.totalPairs = (config.rows * config.cols) / 2;
    gameState.matchesFound = 0;
    gameState.score = 0;
    gameState.time = 0;
    gameState.isProcessing = true;
    
    document.getElementById('score').textContent = '0';
    document.getElementById('timer').textContent = '00:00';
    
    generateGrid(config);

    const hint = document.getElementById('game-hint');
    hint.textContent = 'کارت‌ها رو به خاطر بسپار...';
    hint.classList.remove('hidden');

    setTimeout(() => {
        flipAllCards(true);
        setTimeout(() => {
            flipAllCards(false);
            gameState.isProcessing = false;
            hint.textContent = 'حالا جفت‌ها رو پیدا کن!';
            startTimer();
            setTimeout(() => hint.classList.add('hidden'), 2000);
        }, config.previewTime);
    }, 500);
}

function generateGrid(config) {
    const grid = document.getElementById('card-grid');
    grid.innerHTML = '';
    grid.className = `grid gap-2 sm:gap-4 max-w-4xl w-full h-full max-h-[70vh] items-center justify-center content-center grid-cols-${config.cols}`;

    const allIndices = Array.from({length: gameState.imageCount}, (_, i) => i + 1);
    const selectedIndices = allIndices.sort(() => Math.random() - 0.5).slice(0, gameState.totalPairs);
    const deck = [...selectedIndices, ...selectedIndices].sort(() => Math.random() - 0.5);

    deck.forEach((imgIdx, idx) => {
        const card = document.createElement('div');
        card.className = 'card-container opacity-0 scale-50';
        card.dataset.id = imgIdx;
        card.innerHTML = `
            <div class="card-inner shadow-2xl">
                <div class="card-back overflow-hidden border-2 border-white/5" style="background-image: url(card_back_${settingsState.cardBack}.png)">
                    <div class="card-shine opacity-30"></div>
                </div>
                <div class="card-front bg-slate-900 border-2 border-blue-500/30">
                    <div class="card-shine opacity-20"></div>
                    <img src="card_${imgIdx}.png" alt="card" loading="lazy" class="w-[85%] h-[85%] object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                </div>
            </div>
        `;
        card.onclick = () => handleCardClick(card);
        grid.appendChild(card);
        
        // GSAP Entrance
        gsap.to(card, {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            delay: idx * 0.03,
            ease: "back.out(1.7)"
        });
    });
}

function handleCardClick(card) {
    if (gameState.isProcessing || card.classList.contains('flipped') || card.classList.contains('matched')) return;

    playSound('click');
    card.classList.add('flipped');
    gameState.flippedCards.push(card);

    if (gameState.flippedCards.length === 2) {
        checkMatch();
    }
}

function checkMatch() {
    gameState.isProcessing = true;
    const [card1, card2] = gameState.flippedCards;
    
    if (card1.dataset.id === card2.dataset.id) {
        setTimeout(() => {
            playSound('match');
            
            // Visual Feedback
            gsap.to([card1, card2], {
                scale: 1.1,
                duration: 0.2,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    card1.classList.add('matched');
                    card2.classList.add('matched');
                }
            });

            gameState.matchesFound++;
            gameState.score += 10;
            document.getElementById('score').textContent = gameState.score;
            gameState.flippedCards = [];
            gameState.isProcessing = false;

            if (gameState.matchesFound === gameState.totalPairs) {
                winGame();
            }
        }, 500);
    } else {
        setTimeout(() => {
            playSound('error');
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            gameState.flippedCards = [];
            gameState.isProcessing = false;
        }, 1000);
    }
}

function flipAllCards(show) {
    document.querySelectorAll('.card-container').forEach(card => {
        if (show) card.classList.add('flipped');
        else card.classList.remove('flipped');
    });
}

function startTimer() {
    stopTimer();
    gameState.timerInterval = setInterval(() => {
        gameState.time++;
        const mins = Math.floor(gameState.time / 60).toString().padStart(2, '0');
        const secs = (gameState.time % 60).toString().padStart(2, '0');
        document.getElementById('timer').textContent = `${mins}:${secs}`;
    }, 1000);
}

export function stopTimer() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
}

function winGame() {
    stopTimer();
    playSound('win');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    
    setTimeout(() => {
        const finalTimeStr = document.getElementById('timer').textContent;
        document.getElementById('final-time').textContent = finalTimeStr;
        document.getElementById('final-score').textContent = gameState.score;
        
        // Use the navigation system for the win screen
        showScreen('win', true);
    }, 500);
}

export function clearGameState() {
    stopTimer();
    gameState.flippedCards = [];
    gameState.isProcessing = false;
}