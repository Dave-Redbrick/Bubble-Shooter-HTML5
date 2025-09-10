// 파워업 시스템
export class PowerUpManager {
  constructor(game) {
    this.game = game;
    this.powerUps = {
      multiShot: {
        name: "멀티샷",
        description: "3개의 버블을 동시에 발사",
        available: 0,
        active: false,
        duration: 30000, // 30초
        startTime: 0
      },
      precisionAim: {
        name: "정밀조준",
        description: "완벽한 조준선 표시",
        available: 0,
        active: false,
        duration: 45000, // 45초
        startTime: 0
      },
      colorBomb: {
        name: "컬러폭탄",
        description: "같은 색 모든 버블 제거",
        available: 0,
        active: false
      },
      slowMotion: {
        name: "슬로우모션",
        description: "버블 속도 50% 감소",
        available: 0,
        active: false,
        duration: 20000, // 20초
        startTime: 0
      }
    };
  }

  update(currentTime) {
    // 시간 기반 파워업 체크
    Object.keys(this.powerUps).forEach(key => {
      const powerUp = this.powerUps[key];
      if (powerUp.active && powerUp.duration) {
        const elapsed = currentTime - powerUp.startTime;
        if (elapsed >= powerUp.duration) {
          this.deactivatePowerUp(key);
        }
      }
    });
  }

  activatePowerUp(type) {
    const powerUp = this.powerUps[type];
    if (!powerUp || powerUp.available <= 0) return false;

    powerUp.available--;
    powerUp.active = true;
    
    if (powerUp.duration) {
      powerUp.startTime = performance.now();
    }

    // 파워업별 특수 효과
    switch (type) {
      case 'multiShot':
        this.game.player.multiShotActive = true;
        break;
      case 'precisionAim':
        this.game.precisionAimActive = true;
        break;
      case 'colorBomb':
        this.activateColorBomb();
        break;
      case 'slowMotion':
        this.game.slowMotionActive = true;
        break;
    }

    this.game.updateUI();
    return true;
  }

  deactivatePowerUp(type) {
    const powerUp = this.powerUps[type];
    powerUp.active = false;

    switch (type) {
      case 'multiShot':
        this.game.player.multiShotActive = false;
        break;
      case 'precisionAim':
        this.game.precisionAimActive = false;
        break;
      case 'slowMotion':
        this.game.slowMotionActive = false;
        break;
    }

    this.game.updateUI();
  }

  activateColorBomb() {
    const currentBubbleColor = this.game.player.bubble.tileType;
    const levelData = this.game.levelData;
    const tilesToRemove = [];

    // 같은 색 모든 버블 찾기
    for (let i = 0; i < levelData.columns; i++) {
      for (let j = 0; j < levelData.rows; j++) {
        const tile = levelData.tiles[i][j];
        if (tile.type === currentBubbleColor) {
          tilesToRemove.push(tile);
        }
      }
    }

    if (tilesToRemove.length > 0) {
      // 파티클 효과와 함께 제거
      tilesToRemove.forEach((tile, index) => {
        const coord = this.game.physics.getTileCoordinate(tile.x, tile.y);
        const centerX = coord.tileX + levelData.tileWidth / 2;
        const centerY = coord.tileY + levelData.tileHeight / 2;
        
        setTimeout(() => {
          this.game.particles.createChainPopEffect(
            centerX, 
            centerY, 
            this.game.renderer.BUBBLE_COLORS[tile.type], 
            index * 0.05
          );
          tile.type = -1;
        }, index * 50);
      });

      // 점수 추가
      this.game.updateScore(tilesToRemove.length * 200);
    }

    this.powerUps.colorBomb.active = false;
  }

  addPowerUp(type, amount = 1) {
    if (this.powerUps[type]) {
      this.powerUps[type].available += amount;
      this.game.updateUI();
    }
  }
}