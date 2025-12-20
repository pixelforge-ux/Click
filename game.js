// بازی فضانورد حمله‌ور - 2D Space Shooter
// نسخه کامل با تمام ویژگی‌های درخواستی

class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.isRunning = false;
        this.isPaused = false;
        this.gameState = 'menu'; // menu, playing, paused, gameover
        
        // تنظیمات بازی
        this.soundEnabled = true;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('spaceShooterHighScore') || '0');
        this.wave = 1;
        this.combo = 1;
        this.comboTimer = 0;
        
        // اشیاء بازی
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.particles = [];
        this.stars = [];
        
        // زمان‌بندی
        this.enemySpawnTimer = 0;
        this.enemySpawnDelay = 120;
        this.powerUpSpawnTimer = 0;
        
        // ورودی
        this.keys = {};
        this.touch = null;
        this.isMobile = false;
        
        // منابع
        this.images = {};
        this.sounds = {};
        
        this.init();
    }

    async init() {
        // تنظیم کانواس
        this.setupCanvas();
        this.setupEventListeners();
        this.checkMobile();
        
        // ایجاد ستارگان پس‌زمینه
        this.createStars();
        
        // بارگذاری منابع
        await this.loadAssets();
        
        // مخفی کردن صفحه لودینگ
        document.getElementById('loadingScreen').classList.add('hidden');
        
        // شروع حلقه بازی
        this.gameLoop();
    }

    setupCanvas() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // تنظیم اندازه کانواس
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const maxWidth = window.innerWidth - 40;
        const maxHeight = window.innerHeight - 100;
        const aspectRatio = 4/3;
        
        if (maxWidth / maxHeight > aspectRatio) {
            this.height = maxHeight;
            this.width = this.height * aspectRatio;
        } else {
            this.width = maxWidth;
            this.height = this.width / aspectRatio;
        }
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    setupEventListeners() {
        // رویدادهای کیبورد
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key === 'Escape') {
                this.togglePause();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // دکمه‌های منو
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('mainMenuBtn').addEventListener('click', () => this.showMenu());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.startGame());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.showMenu());
        document.getElementById('highScoresBtn').addEventListener('click', () => this.showHighScores());
        document.getElementById('backFromScoresBtn').addEventListener('click', () => this.showMenu());
        document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
        
        // کنترل‌های لمسی موبایل
        const joystickArea = document.getElementById('joystickArea');
        const fireBtn = document.getElementById('mobileFireBtn');
        
        if (joystickArea && fireBtn) {
            joystickArea.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            joystickArea.addEventListener('touchmove', (e) => this.handleTouchMove(e));
            joystickArea.addEventListener('touchend', (e) => this.handleTouchEnd(e));
            
            fireBtn.addEventListener('touchstart', () => {
                if (this.player && this.gameState === 'playing') {
                    this.player.shoot();
                }
            });
        }
    }

    checkMobile() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (this.isMobile) {
            document.getElementById('mobileControls').style.display = 'block';
        } else {
            document.getElementById('mobileControls').style.display = 'none';
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        this.touch = {
            startX: touch.clientX - rect.left,
            startY: touch.clientY - rect.top,
            currentX: touch.clientX - rect.left,
            currentY: touch.clientY - rect.top
        };
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (this.touch) {
            const touch = e.touches[0];
            const rect = e.target.getBoundingClientRect();
            this.touch.currentX = touch.clientX - rect.left;
            this.touch.currentY = touch.clientY - rect.top;
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.touch = null;
    }

    async loadAssets() {
        // ایجاد گرافیک‌ها با Canvas
        await this.createGameGraphics();
        
        // ساخت صداها با Web Audio API
        this.createSounds();
        
        return Promise.resolve();
    }

    async createGameGraphics() {
        // ایجاد گرافیک سفینه بازیکن
        this.images.player = this.createShipGraphic('#00ffff', '#0088cc');
        
        // ایجاد گرافیک دشمنان
        this.images.enemy1 = this.createEnemyGraphic('#ff3333', '#cc0000');
        this.images.enemy2 = this.createEnemyGraphic('#ff9933', '#cc6600');
        this.images.enemy3 = this.createEnemyGraphic('#ff33ff', '#cc00cc');
        this.images.boss = this.createBossGraphic();
        
        // ایجاد گرافیک PowerUpها
        this.images.powerUpHealth = this.createPowerUpGraphic('#ff3333', '❤️');
        this.images.powerUpRapidFire = this.createPowerUpGraphic('#ffff00', '⚡');
        this.images.powerUpMultiShot = this.createPowerUpGraphic('#00ff00', '🔥');
        this.images.powerUpShield = this.createPowerUpGraphic('#00ffff', '🛡️');
        
        // ایجاد گرافیک گلوله‌ها
        this.images.playerBullet = this.createBulletGraphic('#00ffff');
        this.images.enemyBullet = this.createBulletGraphic('#ff3333');
    }

    createShipGraphic(primaryColor, secondaryColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        
        // بدنه اصلی سفینه
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.moveTo(20, 5);
        ctx.lineTo(30, 30);
        ctx.lineTo(20, 25);
        ctx.lineTo(10, 30);
        ctx.closePath();
        ctx.fill();
        
        // جزئیات سفینه
        ctx.fillStyle = secondaryColor;
        ctx.beginPath();
        ctx.moveTo(20, 10);
        ctx.lineTo(25, 25);
        ctx.lineTo(20, 20);
        ctx.lineTo(15, 25);
        ctx.closePath();
        ctx.fill();
        
        // موتورها
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(12, 30, 5, 8);
        ctx.fillRect(23, 30, 5, 8);
        
        return canvas;
    }

    createEnemyGraphic(primaryColor, secondaryColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 30;
        canvas.height = 30;
        const ctx = canvas.getContext('2d');
        
        // بدنه اصلی دشمن
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.arc(15, 15, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // جزئیات
        ctx.fillStyle = secondaryColor;
        ctx.beginPath();
        ctx.arc(15, 15, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // چشمان دشمن
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, 12, 3, 3);
        ctx.fillRect(17, 12, 3, 3);
        
        return canvas;
    }

    createBossGraphic() {
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        
        // بدنه اصلی Boss
        const gradient = ctx.createLinearGradient(0, 0, 80, 60);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(1, '#cc00cc');
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.moveTo(40, 10);
        ctx.lineTo(60, 25);
        ctx.lineTo(55, 45);
        ctx.lineTo(25, 45);
        ctx.lineTo(20, 25);
        ctx.closePath();
        ctx.fill();
        
        // جزئیات Boss
        ctx.fillStyle = '#660066';
        ctx.fillRect(30, 25, 20, 10);
        
        // اسلحه‌ها
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(15, 35, 8, 15);
        ctx.fillRect(57, 35, 8, 15);
        
        return canvas;
    }

    createPowerUpGraphic(color, symbol) {
        const canvas = document.createElement('canvas');
        canvas.width = 30;
        canvas.height = 30;
        const ctx = canvas.getContext('2d');
        
        // پس‌زمینه PowerUp
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, 0, 30, 30);
        ctx.globalAlpha = 1.0;
        
        // حاشیه
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, 20, 20);
        
        // نماد
        ctx.font = '16px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, 15, 15);
        
        return canvas;
    }

    createBulletGraphic(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // گلوله
        const gradient = ctx.createLinearGradient(0, 0, 0, 16);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, '#ffffff');
        ctx.fillStyle = gradient;
        
        ctx.fillRect(2, 0, 4, 16);
        
        // هاله گلوله
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillRect(3, 2, 2, 12);
        
        return canvas;
    }

    createSounds() {
        // استفاده از Web Audio API برای ساخت افکت‌های صوتی
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.sounds.shoot = () => this.playTone(800, 0.1, 'square');
        this.sounds.explosion = () => this.playNoise(0.3);
        this.sounds.powerUp = () => this.playTone(1200, 0.2, 'sine');
        this.sounds.hit = () => this.playTone(200, 0.1, 'sawtooth');
        this.sounds.gameOver = () => this.playTone(150, 0.5, 'sawtooth');
    }

    playTone(frequency, duration, type = 'sine') {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playNoise(duration) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        whiteNoise.buffer = buffer;
        whiteNoise.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        whiteNoise.start(this.audioContext.currentTime);
    }

    createStars() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2,
                speed: Math.random() * 2 + 0.5,
                brightness: Math.random()
            });
        }
    }

    startGame() {
        // مخفی کردن همه منوها
        document.querySelectorAll('.menu-screen').forEach(menu => {
            menu.classList.add('hidden');
        });
        
        // نمایش HUD
        document.getElementById('gameHUD').classList.remove('hidden');
        
        // ریست کردن بازی
        this.score = 0;
        this.wave = 1;
        this.combo = 1;
        this.comboTimer = 0;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.particles = [];
        
        // ایجاد بازیکن
        this.player = new Player(this.width / 2, this.height - 80, this);
        
        // شروع بازی
        this.gameState = 'playing';
        this.isRunning = true;
        this.isPaused = false;
        
        // به‌روزرسانی HUD
        this.updateHUD();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.isPaused = true;
            document.getElementById('pauseMenu').classList.remove('hidden');
        } else if (this.gameState === 'paused') {
            this.resumeGame();
        }
    }

    resumeGame() {
        this.gameState = 'playing';
        this.isPaused = false;
        document.getElementById('pauseMenu').classList.add('hidden');
    }

    showMenu() {
        this.gameState = 'menu';
        this.isRunning = false;
        
        // مخفی کردن همه منوها به جز منوی اصلی
        document.querySelectorAll('.menu-screen').forEach(menu => {
            menu.classList.add('hidden');
        });
        document.getElementById('mainMenu').classList.remove('hidden');
        document.getElementById('gameHUD').classList.add('hidden');
    }

    showHighScores() {
        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('highScoresMenu').classList.remove('hidden');
        
        const scoresList = document.getElementById('scoresList');
        const highScores = JSON.parse(localStorage.getItem('spaceShooterScores') || '[]');
        
        if (highScores.length === 0) {
            scoresList.innerHTML = '<p class="no-scores">هنوز امتیازی ثبت نشده است!</p>';
        } else {
            scoresList.innerHTML = highScores.map((score, index) => `
                <div class="score-item">
                    <span class="score-rank">#${index + 1}</span>
                    <span class="score-value">${score.score}</span>
                    <span class="score-date">${new Date(score.date).toLocaleDateString('fa-IR')}</span>
                </div>
            `).join('');
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById('soundToggle');
        soundBtn.textContent = `صدا: ${this.soundEnabled ? 'روشن' : 'خاموش'}`;
        localStorage.setItem('spaceShooterSound', this.soundEnabled ? 'true' : 'false');
    }

    gameOver() {
        this.gameState = 'gameover';
        this.isRunning = false;
        
        // پخش صدای پایان بازی
        if (this.sounds.gameOver) {
            this.sounds.gameOver();
        }
        
        // ذخیره امتیاز
        this.saveScore();
        
        // نمایش صفحه Game Over
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('gameOverMenu').classList.remove('hidden');
    }

    saveScore() {
        // به‌روزرسانی بالاترین امتیاز
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('spaceShooterHighScore', this.highScore.toString());
        }
        
        // ذخیره در لیست امتیازات
        const scores = JSON.parse(localStorage.getItem('spaceShooterScores') || '[]');
        scores.push({
            score: this.score,
            date: new Date().toISOString(),
            wave: this.wave
        });
        
        // مرتب‌سازی و نگه داشتن 10 امتیاز برتر
        scores.sort((a, b) => b.score - a.score);
        scores.splice(10);
        
        localStorage.setItem('spaceShooterScores', JSON.stringify(scores));
    }

    updateHUD() {
        document.getElementById('healthText').textContent = `${this.player ? this.player.health : 0}/3`;
        document.getElementById('scoreText').textContent = this.score;
        document.getElementById('waveText').textContent = this.wave;
        document.getElementById('comboText').textContent = `x${this.combo}`;
        
        if (this.player) {
            const healthBar = document.getElementById('healthBar');
            healthBar.style.width = `${(this.player.health / 3) * 100}%`;
        }
    }

    gameLoop() {
        // پاک کردن کانواس
        this.ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // رسم ستارگان پس‌زمینه
        this.updateAndDrawStars();
        
        if (this.gameState === 'playing' && !this.isPaused) {
            this.update();
            this.checkCollisions();
            this.spawnEnemies();
            this.updateCombo();
        }
        
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // به‌روزرسانی بازیکن
        if (this.player) {
            this.player.update();
            
            // بررسی ورودی‌ها
            this.handleInput();
            
            if (this.player.health <= 0) {
                this.gameOver();
            }
        }
        
        // به‌روزرسانی دشمنان
        this.enemies = this.enemies.filter(enemy => {
            enemy.update();
            return enemy.health > 0 && enemy.y < this.height + 50;
        });
        
        // به‌روزرسانی گلوله‌ها
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            return bullet.y > -10 && !bullet.hit;
        });
        
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.update();
            return bullet.y < this.height + 10 && !bullet.hit;
        });
        
        // به‌روزرسانی PowerUpها
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.update();
            return !powerUp.collected && powerUp.y < this.height + 30;
        });
        
        // به‌روزرسانی ذرات
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });
        
        // بررسی Wave بعدی
        if (this.enemies.length === 0) {
            this.nextWave();
        }
    }

    handleInput() {
        if (!this.player) return;
        
        if (this.isMobile && this.touch) {
            // کنترل لمسی
            const deltaX = this.touch.currentX - this.touch.startX;
            const deltaY = this.touch.currentY - this.touch.startY;
            
            const sensitivity = 0.1;
            this.player.velocityX = deltaX * sensitivity;
            this.player.velocityY = deltaY * sensitivity;
        } else {
            // کنترل کیبورد
            if (this.keys['a'] || this.keys['arrowleft']) {
                this.player.velocityX = -5;
            } else if (this.keys['d'] || this.keys['arrowright']) {
                this.player.velocityX = 5;
            } else {
                this.player.velocityX = 0;
            }
            
            if (this.keys['w'] || this.keys['arrowup']) {
                this.player.velocityY = -5;
            } else if (this.keys['s'] || this.keys['arrowdown']) {
                this.player.velocityY = 5;
            } else {
                this.player.velocityY = 0;
            }
            
            if (this.keys[' ']) {
                this.player.shoot();
            }
        }
    }

    spawnEnemies() {
        this.enemySpawnTimer++;
        
        if (this.enemySpawnTimer >= this.enemySpawnDelay) {
            this.enemySpawnTimer = 0;
            
            // انتخاب نوع دشمن بر اساس Wave
            let enemyType;
            const rand = Math.random();
            
            if (this.wave < 3) {
                enemyType = 'basic';
            } else if (this.wave < 5) {
                enemyType = rand < 0.7 ? 'basic' : 'fast';
            } else {
                if (rand < 0.5) enemyType = 'basic';
                else if (rand < 0.8) enemyType = 'fast';
                else enemyType = 'shooter';
            }
            
            const x = Math.random() * (this.width - 40) + 20;
            this.enemies.push(new Enemy(x, -30, enemyType, this));
        }
    }

    nextWave() {
        this.wave++;
        
        // افزایش سختی
        this.enemySpawnDelay = Math.max(30, 120 - this.wave * 5);
        
        // اضافه کردن Boss هر 3 Wave
        if (this.wave % 3 === 0) {
            this.enemies.push(new Boss(this.width / 2, -60, this));
        }
        
        // به‌روزرسانی HUD
        this.updateHUD();
    }

    updateCombo() {
        if (this.comboTimer > 0) {
            this.comboTimer--;
        } else {
            this.combo = 1;
        }
        this.updateHUD();
    }

    checkCollisions() {
        // برخورد گلوله‌های بازیکن با دشمنان
        this.bullets.forEach(bullet => {
            this.enemies.forEach(enemy => {
                if (!bullet.hit && this.checkCollision(bullet, enemy)) {
                    bullet.hit = true;
                    enemy.takeDamage(bullet.damage);
                    
                    // افزایش امتیاز و کامبو
                    this.score += 10 * this.combo;
                    this.combo = Math.min(this.combo + 1, 10);
                    this.comboTimer = 60;
                    
                    // ایجاد انفجار کوچک
                    this.createExplosion(bullet.x, bullet.y, 'small');
                    
                    // پخش صدای برخورد
                    if (this.sounds.hit) {
                        this.sounds.hit();
                    }
                    
                    this.updateHUD();
                }
            });
        });
        
        // برخورد گلوله‌های دشمن با بازیکن
        if (this.player && !this.player.invulnerable) {
            this.enemyBullets.forEach(bullet => {
                if (!bullet.hit && this.checkCollision(bullet, this.player)) {
                    bullet.hit = true;
                    this.player.takeDamage(1);
                    
                    // ایجاد انفجار
                    this.createExplosion(bullet.x, bullet.y, 'small');
                    
                    this.updateHUD();
                }
            });
            
            // برخورد مستقیم دشمن با بازیکن
            this.enemies.forEach(enemy => {
                if (this.checkCollision(enemy, this.player)) {
                    this.player.takeDamage(2);
                    enemy.takeDamage(5);
                    
                    // ایجاد انفجار بزرگ
                    this.createExplosion(enemy.x, enemy.y, 'large');
                    
                    this.updateHUD();
                }
            });
            
            // برخورد PowerUp با بازیکن
            this.powerUps.forEach(powerUp => {
                if (!powerUp.collected && this.checkCollision(powerUp, this.player)) {
                    powerUp.collected = true;
                    this.player.applyPowerUp(powerUp.type);
                    
                    // ایجاد افکت جمع‌آوری
                    this.createPowerUpEffect(powerUp.x, powerUp.y, powerUp.type);
                    
                    // پخش صدای PowerUp
                    if (this.sounds.powerUp) {
                        this.sounds.powerUp();
                    }
                }
            });
        }
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    createExplosion(x, y, size = 'medium') {
        const particleCount = size === 'large' ? 20 : size === 'medium' ? 10 : 5;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 5 + 2;
            
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                size === 'large' ? '#ff6666' : '#ffaa00',
                size === 'large' ? 30 : 20
            ));
        }
        
        // پخش صدای انفجار
        if (size === 'large' && this.sounds.explosion) {
            this.sounds.explosion();
        }
    }

    createPowerUpEffect(x, y, type) {
        const colors = {
            health: '#ff3333',
            rapidFire: '#ffff00',
            multiShot: '#00ff00',
            shield: '#00ffff'
        };
        
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const speed = Math.random() * 3 + 1;
            
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                colors[type] || '#ffffff',
                15
            ));
        }
    }

    updateAndDrawStars() {
        this.stars.forEach(star => {
            star.y += star.speed;
            
            if (star.y > this.height) {
                star.y = -10;
                star.x = Math.random() * this.width;
            }
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }

    draw() {
        // رسم ذرات (پشت همه اشیاء)
        this.particles.forEach(particle => particle.draw(this.ctx));
        
        // رسم PowerUpها
        this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
        
        // رسم گلوله‌ها
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        this.enemyBullets.forEach(bullet => bullet.draw(this.ctx));
        
        // رسم دشمنان
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        // رسم بازیکن
        if (this.player) {
            this.player.draw(this.ctx);
        }
    }
}

// کلاس بازیکن
class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.game = game;
        
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        
        this.health = 3;
        this.maxHealth = 3;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        
        this.shootCooldown = 0;
        this.shootDelay = 10;
        this.rapidFireTimer = 0;
        this.multiShotTimer = 0;
        this.shieldTimer = 0;
        
        this.animation = 0;
    }

    update() {
        // حرکت
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // محدودیت در کانواس
        this.x = Math.max(20, Math.min(this.game.width - this.width - 20, this.x));
        this.y = Math.max(20, Math.min(this.game.height - this.height - 20, this.y));
        
        // به‌روزرسانی تایمرها
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer === 0) {
                this.invulnerable = false;
            }
        }
        
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        
        if (this.rapidFireTimer > 0) {
            this.rapidFireTimer--;
            this.shootDelay = 5;
        } else {
            this.shootDelay = 10;
        }
        
        if (this.multiShotTimer > 0) {
            this.multiShotTimer--;
        }
        
        if (this.shieldTimer > 0) {
            this.shieldTimer--;
        }
        
        this.animation += 0.1;
    }

    shoot() {
        if (this.shootCooldown > 0) return;
        
        this.shootCooldown = this.shootDelay;
        
        if (this.multiShotTimer > 0) {
            // شلیک چندتایی
            for (let i = -1; i <= 1; i++) {
                this.game.bullets.push(new Bullet(
                    this.x + this.width / 2,
                    this.y,
                    i * 2,
                    -10,
                    this.game
                ));
            }
        } else {
            // شلیک معمولی
            this.game.bullets.push(new Bullet(
                this.x + this.width / 2,
                this.y,
                0,
                -10,
                this.game
            ));
        }
        
        // پخش صدای شلیک
        if (this.game.sounds.shoot) {
            this.game.sounds.shoot();
        }
    }

    takeDamage(amount) {
        if (this.shieldTimer > 0) {
            this.shieldTimer = 0;
            return;
        }
        
        this.health -= amount;
        this.invulnerable = true;
        this.invulnerableTimer = 60;
        
        // ایجاد انفجار
        this.game.createExplosion(this.x + this.width / 2, this.y + this.height / 2, 'small');
    }

    applyPowerUp(type) {
        switch (type) {
            case 'health':
                this.health = Math.min(this.health + 1, this.maxHealth);
                break;
            case 'rapidFire':
                this.rapidFireTimer = 300;
                break;
            case 'multiShot':
                this.multiShotTimer = 300;
                break;
            case 'shield':
                this.shieldTimer = 200;
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        
        // افکت آسیب‌ناپذیری
        if (this.invulnerable && Math.floor(this.invulnerableTimer / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // رسم سفینه
        ctx.drawImage(this.game.images.player, this.x, this.y, this.width, this.height);
        
        // رسم سپر
        if (this.shieldTimer > 0) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 30, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// کلاس دشمن
class Enemy {
    constructor(x, y, type, game) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.game = game;
        
        // تنظیمات بر اساس نوع دشمن
        switch (type) {
            case 'basic':
                this.width = 30;
                this.height = 30;
                this.health = 2;
                this.maxHealth = 2;
                this.speed = 2;
                this.score = 10;
                this.image = game.images.enemy1;
                break;
            case 'fast':
                this.width = 25;
                this.height = 25;
                this.health = 1;
                this.maxHealth = 1;
                this.speed = 4;
                this.score = 20;
                this.image = game.images.enemy2;
                break;
            case 'shooter':
                this.width = 30;
                this.height = 30;
                this.health = 3;
                this.maxHealth = 3;
                this.speed = 1.5;
                this.score = 30;
                this.image = game.images.enemy3;
                this.shootCooldown = 0;
                this.shootDelay = 120;
                break;
        }
        
        this.animation = 0;
        this.pattern = Math.random() > 0.5 ? 'straight' : 'zigzag';
        this.zigzagTimer = 0;
    }

    update() {
        this.animation += 0.05;
        
        // حرکت
        if (this.pattern === 'zigzag') {
            this.zigzagTimer += 0.1;
            this.x += Math.sin(this.zigzagTimer) * 2;
        }
        
        this.y += this.speed;
        
        // شلیک دشمن تیرانداز
        if (this.type === 'shooter') {
            this.shootCooldown++;
            if (this.shootCooldown >= this.shootDelay) {
                this.shoot();
                this.shootCooldown = 0;
            }
        }
    }

    shoot() {
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const vx = (dx / distance) * 5;
        const vy = (dy / distance) * 5;
        
        this.game.enemyBullets.push(new EnemyBullet(
            this.x + this.width / 2,
            this.y + this.height,
            vx,
            vy,
            this.game
        ));
    }

    takeDamage(amount) {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.game.score += this.score * this.game.combo;
            this.game.createExplosion(this.x + this.width / 2, this.y + this.height / 2, 'medium');
            
            // احتمال Drop کردن PowerUp
            if (Math.random() < 0.1) {
                this.dropPowerUp();
            }
        }
    }

    dropPowerUp() {
        const types = ['health', 'rapidFire', 'multiShot', 'shield'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.game.powerUps.push(new PowerUp(
            this.x + this.width / 2,
            this.y + this.height / 2,
            type,
            this.game
        ));
    }

    draw(ctx) {
        ctx.save();
        
        // انیمیشن نوسان
        const wobble = Math.sin(this.animation) * 2;
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(wobble * 0.05);
        ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
        
        // رسم دشمن
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        
        ctx.restore();
        
        // نوار سلامتی برای دشمنان با سلامتی بیشتر از 1
        if (this.maxHealth > 1 && this.health < this.maxHealth) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.fillRect(this.x, this.y - 10, this.width, 3);
            
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.fillRect(this.x, this.y - 10, this.width * (this.health / this.maxHealth), 3);
        }
    }
}

// کلاس Boss
class Boss extends Enemy {
    constructor(x, y, game) {
        super(x, y, 'boss', game);
        
        this.width = 80;
        this.height = 60;
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 1;
        this.score = 500;
        this.image = game.images.boss;
        
        this.phase = 1;
        this.attackTimer = 0;
        this.attackPattern = 0;
        this.moveTimer = 0;
        this.moveDirection = 1;
    }

    update() {
        super.update();
        
        this.moveTimer++;
        this.attackTimer++;
        
        // حرکت Boss
        if (this.moveTimer > 3) {
            this.x += this.moveDirection * 2;
            
            if (this.x <= 50 || this.x >= this.game.width - this.width - 50) {
                this.moveDirection *= -1;
            }
            
            this.moveTimer = 0;
        }
        
        // تغییر فاز بر اساس سلامتی
        if (this.health < this.maxHealth * 0.6 && this.phase === 1) {
            this.phase = 2;
            this.speed = 1.5;
        }
        
        if (this.health < this.maxHealth * 0.3 && this.phase === 2) {
            this.phase = 3;
            this.speed = 2;
        }
        
        // الگوهای حمله بر اساس فاز
        if (this.attackTimer >= this.getAttackDelay()) {
            this.performAttack();
            this.attackTimer = 0;
            this.attackPattern = (this.attackPattern + 1) % 3;
        }
    }

    getAttackDelay() {
        switch (this.phase) {
            case 1: return 80;
            case 2: return 60;
            case 3: return 40;
            default: return 80;
        }
    }

    performAttack() {
        switch (this.attackPattern) {
            case 0:
                this.circleShot();
                break;
            case 1:
                this.directShot();
                break;
            case 2:
                this.burstShot();
                break;
        }
    }

    circleShot() {
        const bulletCount = this.phase === 3 ? 12 : 8;
        for (let i = 0; i < bulletCount; i++) {
            const angle = (Math.PI * 2 * i) / bulletCount;
            const speed = 3;
            
            this.game.enemyBullets.push(new EnemyBullet(
                this.x + this.width / 2,
                this.y + this.height,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                this.game
            ));
        }
    }

    directShot() {
        if (this.game.player) {
            const dx = this.game.player.x - this.x;
            const dy = this.game.player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const vx = (dx / distance) * 6;
            const vy = (dy / distance) * 6;
            
            for (let i = 0; i < this.phase; i++) {
                setTimeout(() => {
                    this.game.enemyBullets.push(new EnemyBullet(
                        this.x + this.width / 2,
                        this.y + this.height,
                        vx,
                        vy,
                        this.game
                    ));
                }, i * 100);
            }
        }
    }

    burstShot() {
        for (let i = -2; i <= 2; i++) {
            this.game.enemyBullets.push(new EnemyBullet(
                this.x + this.width / 2,
                this.y + this.height,
                i * 2,
                4,
                this.game
            ));
        }
    }

    draw(ctx) {
        super.draw(ctx);
        
        // نوار سلامتی بزرگ برای Boss
        const barWidth = this.game.width * 0.6;
        const barHeight = 10;
        const barX = (this.game.width - barWidth) / 2;
        const barY = 30;
        
        // پس‌زمینه نوار
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        
        // نوار سلامتی
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fillRect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
        
        // متن Boss
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Vazirmatn';
        ctx.textAlign = 'center';
        ctx.fillText(`BOSS - فاز ${this.phase}`, this.game.width / 2, barY - 10);
    }
}

// کلاس گلوله
class Bullet {
    constructor(x, y, vx, vy, game) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.game = game;
        this.width = 8;
        this.height = 16;
        this.damage = 1;
        this.hit = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.drawImage(this.game.images.playerBullet, this.x - 4, this.y - 8, this.width, this.height);
    }
}

// کلاس گلوله دشمن
class EnemyBullet extends Bullet {
    constructor(x, y, vx, vy, game) {
        super(x, y, vx, vy, game);
        this.width = 6;
        this.height = 12;
    }

    draw(ctx) {
        ctx.drawImage(this.game.images.enemyBullet, this.x - 3, this.y - 6, this.width, this.height);
    }
}

// کلاس PowerUp
class PowerUp {
    constructor(x, y, type, game) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.game = game;
        this.width = 30;
        this.height = 30;
        this.collected = false;
        this.animation = 0;
        this.speed = 2;
        
        // تنظیم تصویر بر اساس نوع
        switch (type) {
            case 'health':
                this.image = game.images.powerUpHealth;
                break;
            case 'rapidFire':
                this.image = game.images.powerUpRapidFire;
                break;
            case 'multiShot':
                this.image = game.images.powerUpMultiShot;
                break;
            case 'shield':
                this.image = game.images.powerUpShield;
                break;
        }
    }

    update() {
        this.animation += 0.1;
        this.y += this.speed;
        
        // حرکت نوسانی
        this.x += Math.sin(this.animation) * 0.5;
    }

    draw(ctx) {
        ctx.save();
        
        // انیمیشن چرخش و پالس
        const scale = 1 + Math.sin(this.animation) * 0.1;
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(scale, scale);
        ctx.rotate(this.animation * 0.05);
        ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
        
        // رسم PowerUp
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        
        ctx.restore();
    }
}

// کلاس ذره (برای انفجار و افکت‌ها)
class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 3 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life--;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

// شروع بازی
let game;
window.addEventListener('load', () => {
    // بارگذاری تنظیمات ذخیره شده
    const soundSetting = localStorage.getItem('spaceShooterSound');
    if (soundSetting !== null) {
        const soundEnabled = soundSetting === 'true';
        document.getElementById('soundToggle').textContent = `صدا: ${soundEnabled ? 'روشن' : 'خاموش'}`;
    }
    
    // ایجاد بازی
    game = new Game();
});