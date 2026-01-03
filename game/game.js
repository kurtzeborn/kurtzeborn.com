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
    GROUND_OBSTACLE_POINTS: 50,
    FLYING_OBSTACLE_POINTS: 75,
    FLYING_OBSTACLE_SPEED_MULTIPLIER: 1.2,
    GROUND_ROAD_WIDTH: 40,
    GROUND_DASH_SPACING: 40,
    GROUND_DASH_LENGTH: 20,
    CENTER_LINE_WIDTH: 3,
    SPRITE_SCALE: 3,
    PARTICLE_SPAWN_INTERVAL: 5,
    COLLISION_FLASH_DURATION: 10,
    BIRD_WING_FLAP_FRAME_INTERVAL: 10,
    HITBOX_SIZE_RATIO: 0.7,
    SAFE_DISTANCE_BIRD_CACTUS: 300,
    OBSTACLE_RETRY_DELAY: 20,
    GROUND_INTERVAL_MIN_SPACING: 30,
    FLYING_INTERVAL_MIN_CAP: 60,
    FLYING_INTERVAL_MIN_SPACING: 50,
    DEBUG_MODE: false // Set to true to see hitboxes
};

// Note: COLORS and SPRITE_PALETTE are defined in sprites.js

// Sprite cache for performance
const spriteCache = new Map();

function getCachedSprite(sprite, scale = CONFIG.SPRITE_SCALE, flipH = false) {
    // Create unique cache key including flip state
    const key = sprite + '_' + scale + '_' + (flipH ? 'f' : 'n');
    
    if (!spriteCache.has(key)) {
        // Create offscreen canvas for this sprite
        const width = sprite[0].length * scale;
        const height = sprite.length * scale;
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        const offscreenCtx = offscreenCanvas.getContext('2d');
        
        // Apply horizontal flip if needed
        if (flipH) {
            offscreenCtx.translate(width, 0);
            offscreenCtx.scale(-1, 1);
        }
        
        // Draw sprite once to offscreen canvas
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                const colorIndex = sprite[row][col];
                if (colorIndex !== 0) {
                    offscreenCtx.fillStyle = SPRITE_PALETTE[colorIndex];
                    offscreenCtx.fillRect(
                        col * scale,
                        row * scale,
                        scale,
                        scale
                    );
                }
            }
        }
        
        spriteCache.set(key, offscreenCanvas);
    }
    
    return spriteCache.get(key);
}

// Sprite rendering function - now uses cached sprites
function drawSprite(sprite, x, y, scale = CONFIG.SPRITE_SCALE, flipH = false) {
    const cachedSprite = getCachedSprite(sprite, scale, flipH);
    ctx.drawImage(cachedSprite, Math.floor(x), Math.floor(y));
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
let landingAnimation = 0;
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
// Define obstacle types - dimensions are calculated from sprites automatically
function getObstacleTypes() {
    return [
        { sprite: 'CACTUS_SMALL', ...getSpriteDimensions(SPRITES.CACTUS_SMALL), type: 'cactus' },
        { sprite: 'CACTUS_MEDIUM', ...getSpriteDimensions(SPRITES.CACTUS_MEDIUM), type: 'cactus' },
        { sprite: 'CACTUS_TALL', ...getSpriteDimensions(SPRITES.CACTUS_TALL), type: 'cactus' },
        { sprite: 'CACTUS_EXTRA_TALL', ...getSpriteDimensions(SPRITES.CACTUS_EXTRA_TALL), type: 'cactus' }
    ];
}
const obstacleTypes = getObstacleTypes();

// Flying obstacles
let flyingObstacles = [];
const flyingObstacleConfig = {
    ...getSpriteDimensions(SPRITES.BIRD_UP),
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
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
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
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function calculateHitbox(spriteDims, sizeRatio = CONFIG.HITBOX_SIZE_RATIO, customOffsetX = null, customOffsetY = null) {
    const hitboxWidth = spriteDims.width * sizeRatio;
    const hitboxHeight = spriteDims.height * sizeRatio;
    return {
        width: hitboxWidth,
        height: hitboxHeight,
        offsetX: customOffsetX !== null ? customOffsetX : (spriteDims.width - hitboxWidth) / 2,
        offsetY: customOffsetY !== null ? customOffsetY : (spriteDims.height - hitboxHeight) / 2
    };
}

function checkAABBCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Cache hitbox dimensions
const normalDims = getSpriteDimensions(SPRITES.MOTORCYCLE_NORMAL);
const duckDims = getSpriteDimensions(SPRITES.MOTORCYCLE_DUCK);
const normalHitbox = calculateHitbox(normalDims, CONFIG.HITBOX_SIZE_RATIO, 1, 4);
const duckHitbox = calculateHitbox(duckDims, CONFIG.HITBOX_SIZE_RATIO, 1, 3);

function getMotorcycleHitbox() {
    const hitbox = motorcycle.isDucking ? duckHitbox : normalHitbox;
    
    return {
        x: motorcycle.x + hitbox.offsetX,
        y: motorcycle.y + hitbox.offsetY,
        width: hitbox.width,
        height: hitbox.height
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
    landingAnimation = 0;
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
                type: obstacleType.type,
                flipH: Math.random() < 0.5 // Randomly flip horizontally
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
        // Animate wing flapping
        flyingObstacles[i].wingFrame = Math.floor(frameCount / CONFIG.BIRD_WING_FLAP_FRAME_INTERVAL) % 2;
        
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
            landingAnimation = 8; // Show landing animation for 8 frames
        }
    }
    
    // Decrement landing animation counter
    if (landingAnimation > 0) {
        landingAnimation--;
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
    // Show landing animation (duck sprite for 5 frames), otherwise show normal state
    const sprite = (motorcycle.isDucking || landingAnimation > 0) 
        ? SPRITES.MOTORCYCLE_DUCK 
        : SPRITES.MOTORCYCLE_NORMAL;
    
    // Adjust y position to align bottom of sprites
    let drawY = motorcycle.y;
    if (landingAnimation > 0 && !motorcycle.isDucking) {
        // MOTORCYCLE_DUCK is shorter, so offset it down to align the bottom
        const normalHeight = getSpriteDimensions(SPRITES.MOTORCYCLE_NORMAL).height;
        const duckHeight = getSpriteDimensions(SPRITES.MOTORCYCLE_DUCK).height;
        drawY += (normalHeight - duckHeight);
    }
    
    // Flash effect on collision
    if (collisionFlash > 0) {
        if (collisionFlash % 2 === 0) {
            ctx.globalAlpha = 0.3;
        }
        collisionFlash--;
    }
    
    drawSprite(sprite, motorcycle.x, drawY);
    ctx.globalAlpha = 1.0;
}

function drawObstacles() {
    // Draw ground obstacles (cacti sprites)
    obstacles.forEach(obstacle => {
        const sprite = SPRITES[obstacle.sprite];
        if (sprite) {
            drawSprite(sprite, obstacle.x, obstacle.y, CONFIG.SPRITE_SCALE, obstacle.flipH);
        }
    });
    
    // Draw flying obstacles (birds with wing animation)
    flyingObstacles.forEach(obstacle => {
        const sprite = obstacle.wingFrame === 0 ? SPRITES.BIRD_UP : SPRITES.BIRD_DOWN;
        drawSprite(sprite, obstacle.x, obstacle.y);
    });
}

function drawGround() {
    // Draw road (wider black line)
    ctx.strokeStyle = COLORS.GROUND_LINE;
    ctx.lineWidth = CONFIG.GROUND_ROAD_WIDTH;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
    
    // Draw center lane divider (white dashed line) - batched
    ctx.strokeStyle = COLORS.CENTER_LINE;
    ctx.lineWidth = CONFIG.CENTER_LINE_WIDTH;
    ctx.beginPath();
    const offset = (frameCount * gameSpeed) % CONFIG.GROUND_DASH_SPACING;
    for (let i = -offset; i < canvas.width; i += CONFIG.GROUND_DASH_SPACING) {
        ctx.moveTo(i, groundY);
        ctx.lineTo(i + CONFIG.GROUND_DASH_LENGTH, groundY);
    }
    ctx.stroke();
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
    
    // Draw in correct order: ground first, then motorcycle on top
    drawGround();
    drawMotorcycle();
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
    drawMotorcycle();
    drawObstacles();
    drawScore();
    drawDebugHitboxes();
}

function update() {
    if (gameState !== 'playing') return;
    
    frameCount++;
    
    // Award 1 point every 5 frames survived
    if (frameCount % 5 === 0) {
        score++;
    }
    
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
