# Contributing to Motorcycle Runner

## Quick Start

This document helps you contribute quality code to the Motorcycle Runner game. Start here for immediate guidance, then review examples and history as needed.

---

## Project Structure

```
game/
├── index.html          # Game page with embedded styles
├── sprites.js          # Sprite definitions and palettes
├── game.js             # Complete game engine
├── README.md           # User-facing documentation
└── CONTRIBUTING.md     # This file
```

**Key Principles:**
- Game logic in `game.js`
- Sprite data in `sprites.js`
- UI styling in `index.html`
- Avoid mixing concerns

---

## Code Review Checklist

Before submitting changes:

- [ ] All magic numbers moved to `CONFIG`
- [ ] No duplicated logic (extracted to functions)
- [ ] Complex calculations extracted to parameterized functions
- [ ] Utility functions created for repeated patterns
- [ ] Game state properly cleared in `startGame()`
- [ ] Colors use `COLORS` constants
- [ ] New sprites use indexed color palette
- [ ] All control flow has proper return statements
- [ ] preventDefault() added for game input keys
- [ ] Touch and keyboard use same game logic functions
- [ ] Tested with `DEBUG_MODE` enabled
- [ ] Tested on mobile/touch devices
- [ ] No hard-coded scales or dimensions
- [ ] localStorage values properly parsed as integers
- [ ] Visual feedback for new game events
- [ ] Helper functions for random selection and calculations

---

## Best Practices

### Utility Functions Pattern

When you find yourself writing the same logic multiple times, extract it to a utility function:

```javascript
// Common patterns that deserve utility functions:
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getSpriteDimensions(sprite, scale = CONFIG.SPRITE_SCALE) {
    return {
        width: sprite[0].length * scale,
        height: sprite.length * scale
    };
}
```

**When to create a utility function:**
- Logic is repeated more than twice
- Logic has a clear, single purpose
- Logic can be unit tested independently
- Logic makes code more readable when named

### Adding New Features

1. **Configuration First**: Add any new constants to `CONFIG` object
2. **Create Utility Functions**: Extract reusable logic before duplicating code
3. **Test State Cleanup**: Ensure `startGame()` resets all new state variables
4. **Debug Mode**: Test with `CONFIG.DEBUG_MODE = true` to visualize hitboxes
5. **Mobile Support**: Test touch controls if adding new input mechanics
6. **Add preventDefault()**: Prevent default browser behavior for new game keys

### Input Handling Pattern

Always follow this pattern for game controls:

```javascript
// 1. Define game action as a function
function performAction() {
    if (gameState === 'playing' && canPerformAction()) {
        // Do the action
    }
}

// 2. Wire up both keyboard and touch
document.addEventListener('keydown', (e) => {
    if (e.code === 'SomeKey') {
        performAction();
    }
    if (['GameKeys'].includes(e.code)) {
        e.preventDefault();  // Always prevent defaults
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();  // Always prevent touch defaults
    performAction();
});
```

This ensures:
- Logic is centralized and testable
- Both input methods behave identically
- Browser defaults don't interfere

### Modifying Sprites

1. **Use Indexed Colors**: Add colors to `SPRITE_PALETTE`, reference by index in sprite arrays
2. **Update Dimensions**: If sprite size changes, hitboxes will auto-adjust via `getSpriteDimensions()`
3. **Maintain Consistency**: Keep sprite scale consistent (use `CONFIG.SPRITE_SCALE`)
4. **Keep Sprites in Separate File**: All sprite definitions (pixel art arrays, palettes) belong in `sprites.js`, not in game logic files

### File Organization Pattern

**✅ Good:**
```
game/
├── index.html          # UI and layout
├── sprites.js          # Sprite definitions (SPRITES, SPRITE_PALETTE)
├── game.js             # Game logic and rendering
├── README.md           # User documentation
└── CONTRIBUTING.md     # Developer guidelines
```

**❌ Bad:**
```javascript
// game.js
const SPRITES = { /* hundreds of lines of sprite data */ };
const SPRITE_PALETTE = [ /* ... */ ];
// ... game logic mixed with data ...
```

**Why:** Separating data from logic:
- Makes game code easier to read and navigate
- Allows sprite artists to modify sprites without touching game logic
- Reduces risk of accidentally breaking game mechanics when updating graphics
- Keeps files focused on a single responsibility
- Makes it easier to swap sprite sets or add themes

**Rule of Thumb:** If it's not executable code logic (sprites, configs, level data, etc.), consider moving it to a separate file.

### Adding Obstacles

```javascript
// 1. Add sprite definition to SPRITES object (in sprites.js)
SPRITES.NEW_OBSTACLE = [ /* pixel array */ ]

// 2. Add to obstacleTypes array (in game.js)
const obstacleTypes = [
    { sprite: 'NEW_OBSTACLE', width: 21, height: 24, type: 'ground' }
];

// 3. No other changes needed! Rendering is automatic.
```

### Performance Considerations

1. **Minimize Canvas State Changes**: Batch similar drawing operations together
2. **Clean Up Arrays**: Remove off-screen objects from arrays (we already do this)
3. **Avoid Creating Objects in Loops**: Reuse objects where possible
4. **Floor Coordinates Once**: Calculate `Math.floor()` before loops, not per-pixel

---

## Debug Mode Features

Enable with `CONFIG.DEBUG_MODE = true`:

- **Red boxes**: Motorcycle hitbox
- **Green boxes**: Obstacle hitboxes  
- **Speed display**: Current game speed in top-left

Use this to:
- Tune collision detection fairness
- Test new obstacle sizes
- Verify hitbox calculations
- Balance difficulty curves

---

## Questions?

When in doubt:
1. Check if a similar pattern exists elsewhere in the code
2. Look for constants in `CONFIG` before hard-coding
3. Test with debug mode before committing
4. Keep it simple and consistent with existing code style

---

## Common Mistakes & How to Avoid Them

These examples illustrate patterns found during development. Use them as learning references.

### 1. **Magic Numbers**

**❌ Bad:**
```javascript
gameSpeed = 6;
if (frameCount % 300 === 0) {
    gameSpeed += 0.5;
}
obstacles.push({ x: canvas.width, y: groundY - 50 });
```

**✅ Good:**
```javascript
gameSpeed = CONFIG.INITIAL_SPEED;
if (frameCount % CONFIG.SPEED_INCREASE_INTERVAL === 0) {
    gameSpeed += CONFIG.SPEED_INCREMENT;
}
obstacles.push({ x: canvas.width, y: groundY - obstacleType.height });
```

**Why:** Hard-coded values make the game difficult to balance and tune. All configuration values should be in the `CONFIG` object.

---

### 2. **Duplicated Logic**

**❌ Bad:**
```javascript
// Checking ground obstacles
if (motorHitbox.x < obstacle.x + obstacle.width &&
    motorHitbox.x + motorHitbox.width > obstacle.x &&
    motorHitbox.y < obstacle.y + obstacle.height &&
    motorHitbox.y + motorHitbox.height > obstacle.y) {
    gameOver();
}

// Checking flying obstacles (exact same collision logic!)
if (motorHitbox.x < flyingObstacle.x + flyingObstacle.width &&
    motorHitbox.x + motorHitbox.width > flyingObstacle.x &&
    motorHitbox.y < flyingObstacle.y + flyingObstacle.height &&
    motorHitbox.y + motorHitbox.height > flyingObstacle.y) {
    gameOver();
}
```

**✅ Good:**
```javascript
function checkAABBCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Use it everywhere
if (checkAABBCollision(motorHitbox, obstacle)) {
    gameOver();
}
```

**Why:** DRY (Don't Repeat Yourself). Extract common patterns into reusable functions.

---

### 3. **Hardcoded Scales and Dimensions**

**❌ Bad:**
```javascript
drawSprite(sprite, x, y, 3);  // What does 3 mean?
drawSprite(sprite2, x2, y2, 3); // Repeated everywhere
```

**✅ Good:**
```javascript
drawSprite(sprite, x, y, CONFIG.SPRITE_SCALE);
// Or better yet, default parameter:
function drawSprite(sprite, x, y, scale = CONFIG.SPRITE_SCALE) { }
```

**Why:** Makes it easy to change the scale globally. If you want to test different sizes, change it in one place.

---

### 4. **Missing Game State Cleanup**

**❌ Bad:**
```javascript
function startGame() {
    obstacles = [];
    flyingObstacles = [];
    // Forgot to clear particles!
}
```

**✅ Good:**
```javascript
function startGame() {
    obstacles = [];
    flyingObstacles = [];
    particles = [];
    collisionFlash = 0;
    // Clear ALL game state
}
```

**Why:** Prevents bugs where old game state leaks into new games. Particles from previous games would persist.

---

### 5. **Type Inconsistencies with localStorage**

**❌ Bad:**
```javascript
let highScore = localStorage.getItem('highScore') || 0;
// Returns string "123" or null, not a number!
```

**✅ Good:**
```javascript
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
```

**Why:** localStorage always returns strings. Parse them as integers to avoid string concatenation bugs (e.g., "100" + 10 = "10010").

---

### 6. **Inconsistent Hitboxes**

**❌ Bad:**
```javascript
// Motorcycle dimensions: 80x60
// Hitbox: hardcoded offsets
return {
    x: motorcycle.x + 10,
    y: motorcycle.y + 5,
    width: motorcycle.width - 20,
    height: motorcycle.height - 10
};
```

**✅ Good:**
```javascript
const sprite = motorcycle.isDucking ? SPRITES.MOTORCYCLE_DUCK : SPRITES.MOTORCYCLE_NORMAL;
const dims = getSpriteDimensions(sprite);
const hitboxWidth = dims.width * 0.7;  // 70% of actual sprite
// Calculate centered hitbox based on actual sprite dimensions
```

**Why:** Hitboxes should reflect actual visual size. When sprites change, hitboxes should update automatically.

---

### 7. **Missing Visual Feedback**

**❌ Bad:**
```javascript
function gameOver() {
    gameState = 'gameOver';
    gameOverlay.style.display = 'block';
    // Game just suddenly ends, no indication of what happened
}
```

**✅ Good:**
```javascript
function gameOver() {
    gameState = 'gameOver';
    collisionFlash = CONFIG.COLLISION_FLASH_DURATION;
    // Motorcycle flashes to show collision
    gameOverlay.style.display = 'block';
}
```

**Why:** Players need visual feedback about what happened. A flash effect makes collisions feel more satisfying.

---

### 8. **Scattered Color Definitions**

**❌ Bad:**
```javascript
ctx.fillStyle = '#2d5016';  // What color is this?
ctx.strokeStyle = '#1a3a0a';  // Used somewhere else as '#2d5016'
```

**✅ Good:**
```javascript
const COLORS = {
    CACTUS: '#2d5016',
    CACTUS_DETAIL: '#1a3a0a'
};
ctx.fillStyle = COLORS.CACTUS;
ctx.strokeStyle = COLORS.CACTUS_DETAIL;
```

**Why:** Named colors are self-documenting and easy to change globally for themes.

---

### 9. **Missing Helper/Utility Functions**

**❌ Bad:**
```javascript
// Repeated random selection logic
const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
const heightVariation = heightVariations[Math.floor(Math.random() * heightVariations.length)];

// Repeated hitbox calculation
const motorHitbox = {
    x: motorcycle.x + 10,
    y: motorcycle.y + 5,
    width: motorcycle.width - 20,
    height: motorcycle.height - 10
};
```

**✅ Good:**
```javascript
// Create reusable utility functions
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getMotorcycleHitbox() {
    const sprite = motorcycle.isDucking ? SPRITES.MOTORCYCLE_DUCK : SPRITES.MOTORCYCLE_NORMAL;
    const dims = getSpriteDimensions(sprite);
    // Calculate hitbox once, reuse everywhere
    return { /* ... */ };
}

// Use them
const obstacleType = getRandomElement(obstacleTypes);
const heightVariation = getRandomElement(heightVariations);
const motorHitbox = getMotorcycleHitbox();
```

**Why:** Reduces code duplication and makes common operations self-documenting. Easier to maintain and test.

---

### 10. **Missing Return Statements in Control Flow**

**❌ Bad:**
```javascript
function checkCollisions() {
    for (let obstacle of obstacles) {
        if (checkAABBCollision(motorHitbox, obstacle)) {
            gameOver();
            return;  // ✓ Good - early return
        }
    }
    
    for (let obstacle of flyingObstacles) {
        if (checkAABBCollision(motorHitbox, obstacle)) {
            gameOver();
            // ❌ Missing return - keeps checking unnecessarily
        }
    }
}
```

**✅ Good:**
```javascript
function checkCollisions() {
    for (let obstacle of obstacles) {
        if (checkAABBCollision(motorHitbox, obstacle)) {
            gameOver();
            return;  // Stop checking after first collision
        }
    }
    
    for (let obstacle of flyingObstacles) {
        if (checkAABBCollision(motorHitbox, obstacle)) {
            gameOver();
            return;  // Consistent early return
        }
    }
}
```

**Why:** Early returns improve performance and make control flow clearer. Once game is over, no need to continue processing.

---

### 11. **Missing preventDefault() on Game Controls**

**❌ Bad:**
```javascript
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        motorcycle.jump();
        // ❌ Page scrolls when pressing Space!
    }
    if (e.code === 'ArrowDown') {
        motorcycle.duck();
        // ❌ Page scrolls when pressing arrow keys!
    }
});
```

**✅ Good:**
```javascript
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        motorcycle.jump();
    }
    if (e.code === 'ArrowDown') {
        motorcycle.duck();
    }
    
    // Prevent default browser behavior for game keys
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        e.preventDefault();
    }
});
```

**Why:** Game controls shouldn't trigger browser default actions (scrolling, etc.). Always preventDefault() for game input keys.

---

### 12. **Inline Touch Event Logic Without Reusability**

**❌ Bad:**
```javascript
// Touch logic scattered and not reusable
canvas.addEventListener('touchstart', (e) => {
    if (gameState === 'waiting') {
        gameState = 'playing';
        score = 0;
        // ... lots of inline game start logic
    }
});
```

**✅ Good:**
```javascript
// Extract to reusable function
function startGame() {
    gameState = 'playing';
    score = 0;
    frameCount = 0;
    // All initialization in one place
}

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'waiting') {
        startGame();  // Reuse same function as keyboard
    }
});

document.addEventListener('keydown', (e) => {
    if (gameState === 'waiting' && e.code === 'Space') {
        startGame();  // Same function for both input methods
    }
});
```

**Why:** Touch and keyboard should trigger the same game logic. Don't duplicate initialization code.

---

### 13. **Duplicated Calculations**

**❌ Bad:**
```javascript
// Ground obstacle spawn
const speedFactor = Math.floor(frameCount / CONFIG.SPEED_INCREASE_INTERVAL);
const adjustedMinInterval = Math.max(
    CONFIG.OBSTACLE_MIN_INTERVAL_CAP,
    CONFIG.OBSTACLE_MIN_INTERVAL - speedFactor * CONFIG.OBSTACLE_INTERVAL_DECREASE_RATE
);
const adjustedMaxInterval = Math.max(
    adjustedMinInterval + 30,  // Magic number!
    CONFIG.OBSTACLE_MAX_INTERVAL - speedFactor * CONFIG.OBSTACLE_INTERVAL_DECREASE_RATE
);
groundInterval = Math.random() * (adjustedMaxInterval - adjustedMinInterval) + adjustedMinInterval;

// Flying obstacle spawn (exact same calculation with different values!)
const speedFactor2 = Math.floor(frameCount / CONFIG.SPEED_INCREASE_INTERVAL);
const adjustedMinInterval2 = Math.max(
    60,  // Magic number!
    CONFIG.FLYING_OBSTACLE_MIN_INTERVAL - speedFactor2 * CONFIG.OBSTACLE_INTERVAL_DECREASE_RATE
);
const adjustedMaxInterval2 = Math.max(
    adjustedMinInterval2 + 50,  // Magic number!
    CONFIG.FLYING_OBSTACLE_MAX_INTERVAL - speedFactor2 * CONFIG.OBSTACLE_INTERVAL_DECREASE_RATE
);
flyingInterval = Math.random() * (adjustedMaxInterval2 - adjustedMinInterval2) + adjustedMinInterval2;
```

**✅ Good:**
```javascript
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

// Use it everywhere with proper constants
groundInterval = calculateSpawnInterval(
    CONFIG.OBSTACLE_MIN_INTERVAL,
    CONFIG.OBSTACLE_MAX_INTERVAL,
    CONFIG.OBSTACLE_MIN_INTERVAL_CAP,
    CONFIG.GROUND_INTERVAL_MIN_SPACING
);

flyingInterval = calculateSpawnInterval(
    CONFIG.FLYING_OBSTACLE_MIN_INTERVAL,
    CONFIG.FLYING_OBSTACLE_MAX_INTERVAL,
    CONFIG.FLYING_INTERVAL_MIN_CAP,
    CONFIG.FLYING_INTERVAL_MIN_SPACING
);
```

**Why:** Complex calculations repeated with slight variations should be extracted to parameterized functions. Eliminates bugs from copy-paste errors and makes the algorithm easier to understand and modify.

---

## History of Refactorings

This section documents the evolution of the codebase through major refactoring efforts.

### First Refactoring (Code Organization)
- ✅ Centralized all configuration into `CONFIG` object
- ✅ Extracted all colors into `COLORS` constant
- ✅ Created utility functions: `getRandomInt()`, `getRandomElement()`, `checkAABBCollision()`, `getMotorcycleHitbox()`
- ✅ Fixed `highScore` type inconsistency (parse as integer)
- ✅ Added missing return statements in collision detection
- ✅ Added preventDefault() for game keys to prevent page scrolling
- ✅ Implemented mobile/touch support with proper event handling
- ✅ Eliminated duplicated collision detection code

### Second Refactoring (Pixel Art & Polish)
- ✅ Implemented pixel art sprite system with indexed colors
- ✅ Added `SPRITE_SCALE` to CONFIG, removed all hardcoded scale values
- ✅ Created `getSpriteDimensions()` helper function
- ✅ Improved hitbox calculation based on actual sprite dimensions (70% of sprite size)
- ✅ Fixed particle cleanup bug (particles now cleared on game restart)
- ✅ Added collision flash visual feedback
- ✅ Implemented particle system for dust trail effects
- ✅ Added debug mode with hitbox visualization
- ✅ Optimized sprite rendering with coordinate caching

### Third Refactoring (File Organization)
- ✅ Separated sprite definitions into `sprites.js`
- ✅ Moved `SPRITES` object and `SPRITE_PALETTE` array out of game logic
- ✅ Updated `index.html` to load sprites before game code
- ✅ Improved separation of concerns (data vs logic)
- ✅ Made game code more focused and maintainable

### Fourth Refactoring (Spawn System & DRY)
- ✅ Replaced distance-based spawning with frame-based interval system
- ✅ Added progressive difficulty scaling (intervals decrease as game progresses)
- ✅ Implemented random spawn timing for more dynamic gameplay
- ✅ Added collision prevention logic to avoid impossible bird+cactus combinations
- ✅ Extracted `calculateSpawnInterval()` helper to eliminate duplicated difficulty calculation
- ✅ Extracted `isObstacleTooClose()` helper for collision prevention checks
- ✅ Moved all spawn magic numbers to CONFIG (OBSTACLE_RETRY_DELAY, interval spacings, etc.)
- ✅ Simplified spawn logic from ~90 lines to ~55 lines through helper functions

