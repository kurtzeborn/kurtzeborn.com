# Motorcycle Runner Game

A Chrome T-Rex inspired endless runner game featuring a motorcycle instead of a dinosaur.

## Features

- **Responsive Controls**: Jump, duck, and avoid obstacles
- **Progressive Difficulty**: Game speed increases over time
- **Multiple Obstacle Types**: Ground obstacles (cacti) and flying obstacles (birds)
- **Score Tracking**: Local high score persistence
- **Mobile Support**: Touch controls for mobile devices
- **Retro Aesthetic**: Styled to match the site's retro theme

## Controls

### Desktop
- `SPACE` or `↑` - Jump
- `↓` - Duck (to avoid flying obstacles)

### Mobile/Touch
- Tap screen - Jump
- Swipe down - Duck

## Game Mechanics

- **Scoring**: 
  - Ground obstacles: +10 points each
  - Flying obstacles: +15 points each
- **Difficulty**: Speed increases every 300 frames (~5 seconds)
- **Flying Obstacles**: Appear after reaching 100 points

## Technical Details

### Pixel Art Sprites
- **Canvas-based rendering**: Sprites defined as 2D arrays with indexed colors
- **20x16 pixel motorcycle** with normal and ducking poses
- **Cactus variations**: 3 different sizes and shapes
- **Animated birds**: Wing flapping with alternating frames
- **3x scaling**: Crisp retro look at 60x48 effective size

### Configuration
All game constants are centralized in the `CONFIG` object for easy tuning:
- Initial speed and difficulty progression
- Obstacle spawn distances and frequencies
- Point values and scoring
- Sprite scaling
- Particle system parameters
- Debug mode toggle

### Code Organization
- **Collision detection**: Optimized AABB algorithm with proper hitboxes
- **Particle system**: Physics-based dust clouds with gravity and fade
- **Sprite management**: Helper functions for dimensions and rendering
- **Visual feedback**: Collision flash effect
- **Mobile support**: Touch controls with swipe detection
- **Separated concerns**: Clean separation of update logic, rendering, and input handling
- **Color constants**: Easy theming with indexed color palette

### Performance Optimizations
- Efficient sprite rendering with pixel-perfect scaling
- Smart hitbox calculations (70% of sprite size)
- Particle cleanup on game restart
- Optimized collision checks with early returns

### Debug Mode
Set `CONFIG.DEBUG_MODE = true` to enable:
- Hitbox visualization (red for motorcycle, green for obstacles)
- Current game speed display
- Helpful for tuning collision detection

## Files

- `index.html` - Game page with embedded styles
- `game.js` - Complete game engine
- `README.md` - This file

## Future Enhancements

- Sound effects
- Additional obstacle types
- Power-ups
- Day/night theme transitions
- Particle effects for collisions
