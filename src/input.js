import { CONFIG } from "./config.js";

export class InputHandler {
  constructor(game, sound) {
    this.game = game;
    this.sound = sound;
    this.isDragging = false;
  }

  onTouchStart(e) {
    e.preventDefault();
    this.isDragging = false;
  }

  onTouchMove(e) {
    e.preventDefault();
    const pos = this.getTouchPos(e);
    if (pos) {
      this.updateAngle(pos);
      this.isDragging = true;
    }
  }

  onTouchEnd(e) {
    e.preventDefault();
    const gameState = this.game.gameState;

    if (this.isDragging) {
      if (gameState === CONFIG.GAME_STATES.READY) {
        this.shootBubble();
        if (this.sound) {
          this.sound.play("shoot");
        }
      }
    } else {
      // Handle tap for game over restart
      if (gameState === CONFIG.GAME_STATES.GAME_OVER) {
        this.game.newGame();
      }
    }

    this.isDragging = false;
  }

  updateAngle(pos) {
    const player = this.game.player;
    const levelData = this.game.levelData;

    let mouseAngle = this.radToDeg(
      Math.atan2(
        player.y + levelData.tileHeight / 2 - pos.y,
        pos.x - (player.x + levelData.tileWidth / 2)
      )
    );

    if (mouseAngle < 0) {
      mouseAngle = 180 + (180 + mouseAngle);
    }

    const lBound = 8;
    const uBound = 172;

    if (mouseAngle > 90 && mouseAngle < 270) {
      if (mouseAngle > uBound) {
        mouseAngle = uBound;
      }
    } else {
      if (mouseAngle < lBound || mouseAngle >= 270) {
        mouseAngle = lBound;
      }
    }

    player.angle = mouseAngle;
  }

  onMouseMove(e) {
    const pos = this.getMousePos(e);
    this.updateAngle(pos);
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

    // this.game.onBubbleShot();
    this.game.setGameState(CONFIG.GAME_STATES.SHOOT_BUBBLE);

    // Load the next bubble into the launcher
    this.game.nextBubble();
  }

  getTouchPos(e) {
    const rect = this.game.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (touch) {
      return {
        x: Math.round(
          ((touch.clientX - rect.left) / (rect.right - rect.left)) *
            this.game.canvas.width
        ),
        y: Math.round(
          ((touch.clientY - rect.top) / (rect.bottom - rect.top)) *
            this.game.canvas.height
        ),
      };
    }
    return null;
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
