// Motorcycle Runner Game - Chrome T-Rex Style

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverlay = document.getElementById('gameOverlay');
const finalScoreEl = document.getElementById('finalScore');
const highScoreEl = document.getElementById('highScore');
const restartBtn = document.getElementById('restartBtn');

// Game configuration constants
const CONFIG = {
    INITIAL_SPEED: 6,
    SPEED_INCREMENT: 0.5,
    SPEED_INCREASE_INTERVAL: 300,
    OBSTACLE_MIN_INTERVAL: 60,
    OBSTACLE_MAX_INTERVAL: 120,
    OBSTACLE_INTERVAL_DECREASE_RATE: 0.5,
    OBSTACLE_MIN_INTERVAL_CAP: 40,
    FLYING_OBSTACLE_MIN_INTERVAL: 100,
    FLYING_OBSTACLE_MAX_INTERVAL: 200,
    FLYING_OBSTACLE_MIN_SCORE: 100,
    GROUND_OBSTACLE_POINTS: 10,
    FLYING_OBSTACLE_POINTS: 15,
    FLYING_OBSTACLE_SPEED_MULTIPLIER: 1.2,
    GROUND_DASH_SPACING: 40,
    GROUND_DASH_LENGTH: 20,
    SPRITE_SCALE: 3,
    PARTICLE_SPAWN_INTERVAL: 5,
    COLLISION_FLASH_DURATION: 10,
    SAFE_DISTANCE_BIRD_CACTUS: 200,
    OBSTACLE_RETRY_DELAY: 10,
    GROUND_INTERVAL_MIN_SPACING: 30,
    FLYING_INTERVAL_MIN_CAP: 60,
    FLYING_INTERVAL_MIN_SPACING: 50,
    DEBUG_MODE: false // Set to true to see hitboxes
};

// Colors
const COLORS = {
    MOTORCYCLE: '#1a1a1a',
    RIDER: '#4a4a4a',
    CACTUS: '#2d5016',
    CACTUS_DETAIL: '#1a3a0a',
    FLYING_OBSTACLE: '#4a4a4a',
    GROUND_LINE: '#2d2d2d',
    GROUND_TEXTURE: '#999',
    TEXT: '#2d2d2d',
    TRANSPARENT: null,
    WHEEL: '#2d2d2d',
    BODY: '#333333',
    CHROME: '#888888',
    HELMET: '#ff0000',
    BIRD_BODY: '#654321',
    BIRD_WING: '#8b6914'
};

// Sprite rendering function
function drawSprite(sprite, x, y, scale = CONFIG.SPRITE_SCALE) {
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    
    for (let row = 0; row < sprite.length; row++) {
        for (let col = 0; col < sprite[row].length; col++) {
            const colorIndex = sprite[row][col];
            if (colorIndex !== 0) { // Skip transparent pixels
                ctx.fillStyle = SPRITE_PALETTE[colorIndex];
                ctx.fillRect(
                    floorX + col * scale,
                    floorY + row * scale,
                    scale,
                    scale
                );
            }
        }
    }
}

// Get sprite dimensions after scaling
function getSpriteDimensions(sprite, scale = CONFIG.SPRITE_SCALE) {
    return {
        width: sprite[0].length * scale,
        height: sprite.length * scale
    };
}

// Game state
let gameState = 'waiting'; // 'waiting', 'playing', 'gameOver'
let score = 0;
let highScore = parseInt(localStorage.getItem('motorcycleHighScore')) || 0;
let frameCount = 0;
let gameSpeed = CONFIG.INITIAL_SPEED;
let collisionFlash = 0;
let nextGroundObstacleFrame = 0;
let nextFlyingObstacleFrame = 0;
let groundObstacleInterval = CONFIG.OBSTACLE_MAX_INTERVAL;
let flyingObstacleInterval = CONFIG.FLYING_OBSTACLE_MAX_INTERVAL;

// Motorcycle object
const motorcycle = {
    x: 50,
    y: canvas.height - 140,
    width: 80,
    height: 60,
    velocityY: 0,
    gravity: 0.8,
    jumpPower: -15,
    isJumping: false,
    isDucking: false,
    groundY: canvas.height - 140,
    duckHeight: 40,
    normalHeight: 60
};

// Obstacles array
let obstacles = [];
const obstacleTypes = [
    { sprite: 'CACTUS_SMALL', width: 27, height: 48, type: 'cactus' },   // 9px * 3 scale = 27, 16px * 3 = 48
    { sprite: 'CACTUS_MEDIUM', width: 33, height: 54, type: 'cactus' },  // 11px * 3 = 33, 18px * 3 = 54
    { sprite: 'CACTUS_TALL', width: 45, height: 66, type: 'cactus' }     // 15px * 3 = 45, 22px * 3 = 66
];

// Flying obstacles
let flyingObstacles = [];
const flyingObstacleConfig = {
    width: 36,
    height: 21,
    heightVariations: [-100, -120, -140] // relative to groundY
};

// Ground line
const groundY = canvas.height - 80;

// Particle system for visual effects
let particles = [];

class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = 2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // gravity
        this.life--;
        return this.life > 0;
    }
    
    draw() {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

function spawnDustParticle() {
    if (frameCount % CONFIG.PARTICLE_SPAWN_INTERVAL === 0 && !motorcycle.isJumping) {
        particles.push(new Particle(
            motorcycle.x + 10,
            groundY + 5,
            -2 - Math.random() * 2,
            -1 - Math.random() * 2,
            'rgb(194, 178, 128)',
            20
        ));
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => p.draw());
}

// Key state
const keys = {};

// Utility functions
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function checkAABBCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function getMotorcycleHitbox() {
    const sprite = motorcycle.isDucking ? SPRITES.MOTORCYCLE_DUCK : SPRITES.MOTORCYCLE_NORMAL;
    const dims = getSpriteDimensions(sprite);
    // Tighter hitbox - about 70% of sprite dimensions, centered
    const hitboxWidth = dims.width * 0.7;
    const hitboxHeight = dims.height * 0.7;
    const offsetX = (dims.width - hitboxWidth) / 2;
    const offsetY = (dims.height - hitboxHeight) / 2;
    
    return {
        x: motorcycle.x + offsetX,
        y: motorcycle.y + offsetY,
        width: hitboxWidth,
        height: hitboxHeight
    };
}

function calculateSpawnInterval(minInterval, maxInterval, minCap, minSpacing) {
    const speedFactor = Math.floor(frameCount / CONFIG.SPEED_INCREASE_INTERVAL);
    const adjustedMinInterval = Math.max(
        minCap,
        minInterval - speedFactor * CONFIG.OBSTACLE_INTERVAL_DECREASE_RATE
    );
    const adjustedMaxInterval = Math.max(
        adjustedMinInterval + minSpacing,
        maxInterval - speedFactor * CONFIG.OBSTACLE_INTERVAL_DECREASE_RATE
    );
    
    return Math.random() * (adjustedMaxInterval - adjustedMinInterval) + adjustedMinInterval;
}

function isObstacleTooClose(obstacleArray) {
    if (obstacleArray.length === 0) return false;
    const lastObstacle = obstacleArray[obstacleArray.length - 1];
    return canvas.width - lastObstacle.x < CONFIG.SAFE_DISTANCE_BIRD_CACTUS;
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    if (gameState === 'waiting' && e.code === 'Space') {
        startGame();
    }
    
    if (gameState === 'playing') {
        if ((e.code === 'Space' || e.code === 'ArrowUp') && !motorcycle.isJumping && !motorcycle.isDucking) {
            motorcycle.velocityY = motorcycle.jumpPower;
            motorcycle.isJumping = true;
        }
    }
    
    // Prevent default behavior for game keys
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Touch/Mobile support
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartY = e.touches[0].clientY;
    
    if (gameState === 'waiting') {
        startGame();
    } else if (gameState === 'playing' && !motorcycle.isJumping && !motorcycle.isDucking) {
        motorcycle.velocityY = motorcycle.jumpPower;
        motorcycle.isJumping = true;
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touchY = e.touches[0].clientY;
    const deltaY = touchY - touchStartY;
    
    // Swipe down to duck
    if (gameState === 'playing' && deltaY > 30 && !motorcycle.isJumping) {
        keys['ArrowDown'] = true;
    } else {
        keys['ArrowDown'] = false;
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys['ArrowDown'] = false;
});

restartBtn.addEventListener('click', () => {
    startGame();
});

function startGame() {
    gameState = 'playing';
    score = 0;
    frameCount = 0;
    gameSpeed = CONFIG.INITIAL_SPEED;
    obstacles = [];
    flyingObstacles = [];
    particles = [];
    collisionFlash = 0;
    motorcycle.y = motorcycle.groundY;
    motorcycle.velocityY = 0;
    motorcycle.isJumping = false;
    motorcycle.isDucking = false;
    motorcycle.height = motorcycle.normalHeight;
    
    // Reset spawn timers
    nextGroundObstacleFrame = CONFIG.OBSTACLE_MAX_INTERVAL;
    nextFlyingObstacleFrame = CONFIG.FLYING_OBSTACLE_MAX_INTERVAL + CONFIG.FLYING_OBSTACLE_MIN_SCORE;
    groundObstacleInterval = CONFIG.OBSTACLE_MAX_INTERVAL;
    flyingObstacleInterval = CONFIG.FLYING_OBSTACLE_MAX_INTERVAL;
    
    gameOverlay.style.display = 'none';
    gameLoop();
}

function spawnObstacle() {
    // Spawn ground obstacle when it's time
    if (frameCount >= nextGroundObstacleFrame) {
        // Check if there's a recent flying obstacle that would create an impossible situation
        if (!isObstacleTooClose(flyingObstacles)) {
            const obstacleType = getRandomElement(obstacleTypes);
            obstacles.push({
                x: canvas.width,
                y: groundY - obstacleType.height,
                width: obstacleType.width,
                height: obstacleType.height,
                sprite: obstacleType.sprite,
                type: obstacleType.type
            });
            
            // Calculate next spawn time with progressive difficulty
            groundObstacleInterval = calculateSpawnInterval(
                CONFIG.OBSTACLE_MIN_INTERVAL,
                CONFIG.OBSTACLE_MAX_INTERVAL,
                CONFIG.OBSTACLE_MIN_INTERVAL_CAP,
                CONFIG.GROUND_INTERVAL_MIN_SPACING
            );
            nextGroundObstacleFrame = frameCount + groundObstacleInterval;
        } else {
            // Retry soon if collision prevention blocked spawn
            nextGroundObstacleFrame = frameCount + CONFIG.OBSTACLE_RETRY_DELAY;
        }
    }
    
    // Spawn flying obstacles after minimum score threshold
    if (score > CONFIG.FLYING_OBSTACLE_MIN_SCORE && frameCount >= nextFlyingObstacleFrame) {
        // Check if there's a recent ground obstacle that would create an impossible situation
        if (!isObstacleTooClose(obstacles)) {
            const yOffset = getRandomElement(flyingObstacleConfig.heightVariations);
            flyingObstacles.push({
                x: canvas.width,
                y: groundY + yOffset,
                width: flyingObstacleConfig.width,
                height: flyingObstacleConfig.height,
                wingFrame: 0
            });
            
            // Calculate next spawn time with progressive difficulty
            flyingObstacleInterval = calculateSpawnInterval(
                CONFIG.FLYING_OBSTACLE_MIN_INTERVAL,
                CONFIG.FLYING_OBSTACLE_MAX_INTERVAL,
                CONFIG.FLYING_INTERVAL_MIN_CAP,
                CONFIG.FLYING_INTERVAL_MIN_SPACING
            );
            nextFlyingObstacleFrame = frameCount + flyingObstacleInterval;
        } else {
            // Retry soon if collision prevention blocked spawn
            nextFlyingObstacleFrame = frameCount + CONFIG.OBSTACLE_RETRY_DELAY;
        }
    }
}

function updateObstacles() {
    // Update ground obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        
        // Remove off-screen obstacles
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score += CONFIG.GROUND_OBSTACLE_POINTS;
        }
    }
    
    // Update flying obstacles
    for (let i = flyingObstacles.length - 1; i >= 0; i--) {
        flyingObstacles[i].x -= gameSpeed * CONFIG.FLYING_OBSTACLE_SPEED_MULTIPLIER;
        // Animate wing flapping (toggle between frames every 10 game frames)
        flyingObstacles[i].wingFrame = Math.floor(frameCount / 10) % 2;
        
        // Remove off-screen obstacles
        if (flyingObstacles[i].x + flyingObstacles[i].width < 0) {
            flyingObstacles.splice(i, 1);
            score += CONFIG.FLYING_OBSTACLE_POINTS;
        }
    }
}

function updateMotorcycle() {
    // Handle ducking
    if (keys['ArrowDown'] && !motorcycle.isJumping) {
        motorcycle.isDucking = true;
        motorcycle.height = motorcycle.duckHeight;
        motorcycle.y = motorcycle.groundY + (motorcycle.normalHeight - motorcycle.duckHeight);
    } else if (!motorcycle.isJumping) {
        motorcycle.isDucking = false;
        motorcycle.height = motorcycle.normalHeight;
        motorcycle.y = motorcycle.groundY;
    }
    
    // Apply gravity
    if (motorcycle.isJumping) {
        motorcycle.velocityY += motorcycle.gravity;
        motorcycle.y += motorcycle.velocityY;
        
        // Land on ground
        if (motorcycle.y >= motorcycle.groundY) {
            motorcycle.y = motorcycle.groundY;
            motorcycle.velocityY = 0;
            motorcycle.isJumping = false;
        }
    }
}

function checkCollisions() {
    const motorHitbox = getMotorcycleHitbox();
    
    // Check ground obstacles
    for (let obstacle of obstacles) {
        if (checkAABBCollision(motorHitbox, obstacle)) {
            gameOver();
            return;
        }
    }
    
    // Check flying obstacles
    for (let obstacle of flyingObstacles) {
        if (checkAABBCollision(motorHitbox, obstacle)) {
            gameOver();
            return;
        }
    }
}

function gameOver() {
    gameState = 'gameOver';
    collisionFlash = CONFIG.COLLISION_FLASH_DURATION;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('motorcycleHighScore', highScore);
    }
    
    finalScoreEl.textContent = `Score: ${score}`;
    highScoreEl.textContent = `High Score: ${highScore}`;
    gameOverlay.style.display = 'block';
}

function drawMotorcycle() {
    const sprite = motorcycle.isDucking ? SPRITES.MOTORCYCLE_DUCK : SPRITES.MOTORCYCLE_NORMAL;
    
    // Flash effect on collision
    if (collisionFlash > 0) {
        if (collisionFlash % 2 === 0) {
            ctx.globalAlpha = 0.3;
        }
        collisionFlash--;
    }
    
    drawSprite(sprite, motorcycle.x, motorcycle.y);
    ctx.globalAlpha = 1.0;
}

function drawObstacles() {
    // Draw ground obstacles (cacti sprites)
    obstacles.forEach(obstacle => {
        const sprite = SPRITES[obstacle.sprite];
        if (sprite) {
            drawSprite(sprite, obstacle.x, obstacle.y);
        }
    });
    
    // Draw flying obstacles (birds with wing animation)
    flyingObstacles.forEach(obstacle => {
        const sprite = obstacle.wingFrame === 0 ? SPRITES.BIRD_UP : SPRITES.BIRD_DOWN;
        drawSprite(sprite, obstacle.x, obstacle.y);
    });
}

function drawGround() {
    // Ground line
    ctx.strokeStyle = COLORS.GROUND_LINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
    
    // Ground texture (dashes moving)
    ctx.strokeStyle = COLORS.GROUND_TEXTURE;
    ctx.lineWidth = 2;
    const offset = (frameCount * gameSpeed) % CONFIG.GROUND_DASH_SPACING;
    for (let i = -offset; i < canvas.width; i += CONFIG.GROUND_DASH_SPACING) {
        ctx.beginPath();
        ctx.moveTo(i, groundY + 10);
        ctx.lineTo(i + CONFIG.GROUND_DASH_LENGTH, groundY + 10);
        ctx.stroke();
    }
}

function drawScore() {
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score}`, canvas.width - 20, 40);
    ctx.fillText(`HI: ${highScore}`, canvas.width - 20, 70);
    
    // Debug mode - show FPS and speed
    if (CONFIG.DEBUG_MODE) {
        ctx.textAlign = 'left';
        ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}`, 20, 40);
    }
}

function drawDebugHitboxes() {
    if (!CONFIG.DEBUG_MODE) return;
    
    // Draw motorcycle hitbox
    const motorHitbox = getMotorcycleHitbox();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(motorHitbox.x, motorHitbox.y, motorHitbox.width, motorHitbox.height);
    
    // Draw obstacle hitboxes
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    obstacles.forEach(obstacle => {
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    
    flyingObstacles.forEach(obstacle => {
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

function drawWaitingScreen() {
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = 'bold 32px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height / 2 - 50);
    
    // Draw motorcycle in waiting position
    drawMotorcycle();
    drawGround();
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'waiting') {
        drawWaitingScreen();
        return;
    }
    
    // Draw game elements (back to front)
    drawGround();
    drawParticles();
    drawObstacles();
    drawMotorcycle();
    drawScore();
    drawDebugHitboxes();
}

function update() {
    if (gameState !== 'playing') return;
    
    frameCount++;
    
    // Increase difficulty over time
    if (frameCount % CONFIG.SPEED_INCREASE_INTERVAL === 0) {
        gameSpeed += CONFIG.SPEED_INCREMENT;
    }
    
    updateMotorcycle();
    updateObstacles();
    spawnObstacle();
    spawnDustParticle();
    updateParticles();
    checkCollisions();
}

function gameLoop() {
    update();
    draw();
    
    if (gameState === 'playing') {
        requestAnimationFrame(gameLoop);
    }
}

// Initial draw
draw();
