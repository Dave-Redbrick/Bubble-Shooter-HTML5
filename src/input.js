import { CONFIG } from "./config.js";

export class InputHandler {
  constructor(game, sound) {
    this.game = game;
    this.sound = sound;
  }

  onMouseMove(e) {
    const pos = this.getMousePos(e);
    const player = this.game.player;
    const levelData = this.game.levelData;

    // Calculate mouse angle
    let mouseAngle = this.radToDeg(
      Math.atan2(
        player.y + levelData.tileHeight / 2 - pos.y,
        pos.x - (player.x + levelData.tileWidth / 2)
      )
    );

    // Convert to 0-360 range
    if (mouseAngle < 0) {
      mouseAngle = 180 + (180 + mouseAngle);
    }

    // Restrict angle to playable range
    const lBound = 8;
    const uBound = 172;

    if (mouseAngle > 90 && mouseAngle < 270) {
      // Left side
      if (mouseAngle > uBound) {
        mouseAngle = uBound;
      }
    } else {
      // Right side
      if (mouseAngle < lBound || mouseAngle >= 270) {
        mouseAngle = lBound;
      }
    }

    player.angle = mouseAngle;
  }

  onMouseDown(e) {
    const gameState = this.game.gameState;

    if (gameState === CONFIG.GAME_STATES.READY) {
      this.shootBubble();
      if (this.sound) {
        this.sound.play("shoot");
      }
    } else if (gameState === CONFIG.GAME_STATES.GAME_OVER) {
      this.game.newGame();
    }
  }

  shootBubble() {
    const player = this.game.player;
    const projectile = this.game.player.bubble;

    // Copy launcher properties to the projectile
    projectile.x = player.x;
    projectile.y = player.y;
    projectile.angle = player.angle;
    projectile.tileType = player.tileType;
    projectile.isBomb = player.isBomb;
    projectile.visible = true;

    this.game.onBubbleShot();
    this.game.setGameState(CONFIG.GAME_STATES.SHOOT_BUBBLE);

    // Load the next bubble into the launcher
    this.game.nextBubble();
  }

  getMousePos(e) {
    const rect = this.game.canvas.getBoundingClientRect();
    return {
      x: Math.round(
        ((e.clientX - rect.left) / (rect.right - rect.left)) *
          this.game.canvas.width
      ),
      y: Math.round(
        ((e.clientY - rect.top) / (rect.bottom - rect.top)) *
          this.game.canvas.height
      ),
    };
  }

  radToDeg(angle) {
    return angle * (180 / Math.PI);
  }
}
