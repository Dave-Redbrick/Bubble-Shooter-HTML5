import { CONFIG, NEIGHBOR_OFFSETS } from "./config.js";

export class PhysicsEngine {
  constructor(game) {
    this.game = game;
  }

  stateShootBubble(dt) {
    const player = this.game.player;
    const levelData = this.game.levelData;

    const speed = (this.game.canvas.height / 1080) * player.bubble.speed;
    const angleRad = this.degToRad(player.bubble.angle);

    // 버블 위치 업데이트
    player.bubble.x += dt * speed * Math.cos(angleRad);
    player.bubble.y += dt * speed * -1 * Math.sin(angleRad);

    const leftBound = levelData.x;
    const rightBound = levelData.x + levelData.width - levelData.tileWidth;

    if (player.bubble.x <= leftBound) {
      player.bubble.x = leftBound;
      player.bubble.angle = 180 - player.bubble.angle;
      this.game.wallBounceCount++;
    } else if (player.bubble.x >= rightBound) {
      player.bubble.x = rightBound;
      player.bubble.angle = 180 - player.bubble.angle;
      this.game.wallBounceCount++;
    }

    if (player.bubble.y <= levelData.y) {
      player.bubble.y = levelData.y;
      this.snapBubbleWithPrecision();
      return;
    }

    const bubbleCenterX = player.bubble.x + levelData.tileWidth / 2;
    const bubbleCenterY = player.bubble.y + levelData.tileHeight / 2;

    for (let i = 0; i < levelData.columns; i++) {
      for (let j = 0; j < levelData.rows; j++) {
        const tile = levelData.tiles[i][j];
        if (tile.type < 0) continue;

        const coord = this.getTileCoordinate(i, j);
        const tileCenterX = coord.tileX + levelData.tileWidth / 2;
        const tileCenterY = coord.tileY + levelData.tileHeight / 2;
        const collisionDistance = levelData.radius * 2 - 2;

        if (
          this.getDistance(
            bubbleCenterX,
            bubbleCenterY,
            tileCenterX,
            tileCenterY
          ) < collisionDistance
        ) {
          this.adjustBubblePositionBeforeSnap(tile, i, j);
          this.snapBubbleWithPrecision();
          return;
        }
      }
    }
  }

  adjustBubblePositionBeforeSnap(collidedTile, tileX, tileY) {
    const player = this.game.player;
    const levelData = this.game.levelData;
    const coord = this.getTileCoordinate(tileX, tileY);
    const tileCenterX = coord.tileX + levelData.tileWidth / 2;
    const tileCenterY = coord.tileY + levelData.tileHeight / 2;
    const bubbleCenterX = player.bubble.x + levelData.tileWidth / 2;
    const bubbleCenterY = player.bubble.y + levelData.tileHeight / 2;
    const dx = bubbleCenterX - tileCenterX;
    const dy = bubbleCenterY - tileCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const targetDistance = levelData.radius * 2;
      const ratio = targetDistance / distance;
      player.bubble.x = tileCenterX + dx * ratio - levelData.tileWidth / 2;
      player.bubble.y = tileCenterY + dy * ratio - levelData.tileHeight / 2;
    }
  }

  snapBubbleWithPrecision() {
    const player = this.game.player;
    const levelData = this.game.levelData;
    const centerX = player.bubble.x + levelData.tileWidth / 2;
    const centerY = player.bubble.y + levelData.tileHeight / 2;
    const gridPos = this.findBestGridPosition(centerX, centerY);

    gridPos.x = Math.max(0, Math.min(gridPos.x, levelData.columns - 1));
    gridPos.y = Math.max(0, Math.min(gridPos.y, levelData.rows - 1));

    let addTile = false;
    let finalGridPos = { ...gridPos };

    if (levelData.tiles[gridPos.x][gridPos.y].type !== -1) {
      finalGridPos = this.findEmptyPosition(
        gridPos.x,
        gridPos.y,
        centerX,
        centerY
      );
      if (finalGridPos) {
        addTile = true;
      }
    } else {
      addTile = true;
    }

    if (addTile && finalGridPos) {
      player.bubble.visible = false;
      const coord = this.getTileCoordinate(finalGridPos.x, finalGridPos.y);
      this.game.hitPosition = {
        x: coord.tileX + levelData.tileWidth / 2,
        y: coord.tileY + levelData.tileHeight / 2,
      };

      if (player.bubble.isBomb) {
        this.handleBombBubble(finalGridPos.x, finalGridPos.y);
        return;
      }

      levelData.tiles[finalGridPos.x][finalGridPos.y].type =
        player.bubble.tileType;

      if (this.checkGameOver()) return;

      this.game.cluster = this.findCluster(
        finalGridPos.x,
        finalGridPos.y,
        true,
        true,
        false
      );

      if (this.game.cluster.length >= 3) {
        this.game.setGameState(CONFIG.GAME_STATES.REMOVE_CLUSTER);
        return;
      }
    }

    this.handleTurnEnd();
  }

  findBestGridPosition(x, y) {
    const levelData = this.game.levelData;
    const baseGridPos = this.getGridPosition(x, y);
    const candidates = [
      baseGridPos,
      { x: baseGridPos.x - 1, y: baseGridPos.y },
      { x: baseGridPos.x + 1, y: baseGridPos.y },
      { x: baseGridPos.x, y: baseGridPos.y - 1 },
      { x: baseGridPos.x, y: baseGridPos.y + 1 },
    ];
    let bestPos = baseGridPos;
    let minDistance = Infinity;

    for (const pos of candidates) {
      if (
        pos.x < 0 ||
        pos.x >= levelData.columns ||
        pos.y < 0 ||
        pos.y >= levelData.rows
      )
        continue;

      const coord = this.getTileCoordinate(pos.x, pos.y);
      const distance = this.getDistance(
        x,
        y,
        coord.tileX + levelData.tileWidth / 2,
        coord.tileY + levelData.tileHeight / 2
      );

      if (distance < minDistance) {
        minDistance = distance;
        bestPos = pos;
      }
    }
    return bestPos;
  }

  findEmptyPosition(x, y, bubbleX, bubbleY) {
    const levelData = this.game.levelData;
    const positions = [];
    const offsets = [
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 1 },
      { x: 1, y: 1 },
    ];

    for (const offset of offsets) {
      const newX = x + offset.x;
      const newY = y + offset.y;
      if (
        newX >= 0 &&
        newX < levelData.columns &&
        newY >= 0 &&
        newY < levelData.rows &&
        levelData.tiles[newX][newY].type === -1
      ) {
        const coord = this.getTileCoordinate(newX, newY);
        const distance = this.getDistance(
          bubbleX,
          bubbleY,
          coord.tileX + levelData.tileWidth / 2,
          coord.tileY + levelData.tileHeight / 2
        );
        positions.push({ x: newX, y: newY, distance });
      }
    }

    if (positions.length > 0) {
      positions.sort((a, b) => a.distance - b.distance);
      return positions[0];
    }

    for (let newRow = y + 1; newRow < levelData.rows; newRow++) {
      if (levelData.tiles[x][newRow].type === -1) {
        return { x, y: newRow };
      }
    }
    return null;
  }

  getDistance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  handleBombBubble(x, y) {
    const levelData = this.game.levelData;
    const bombTiles = [];
    this.game.player.bubble.isBomb = false;

    for (let i = 0; i < levelData.columns; i++) {
      for (let j = 0; j < levelData.rows; j++) {
        const tile = levelData.tiles[i][j];
        if (tile.type >= 0) {
          const distance = Math.sqrt(Math.pow(i - x, 2) + Math.pow(j - y, 2));
          if (distance <= 2) {
            bombTiles.push(tile);
          }
        }
      }
    }

    this.game.particles.createBombEffect(
      this.game.hitPosition.x,
      this.game.hitPosition.y
    );

    if (bombTiles.length > 0) {
      this.game.cluster = bombTiles;
      this.game.setGameState(CONFIG.GAME_STATES.REMOVE_CLUSTER);
      return;
    }
    this.handleTurnEnd();
  }

  handleTurnEnd() {
    this.game.handleMiss();
  }

  checkGameOver() {
    const levelData = this.game.levelData;
    const player = this.game.player;
    const dangerY = player.y - levelData.tileHeight * 3;

    for (let i = 0; i < levelData.columns; i++) {
      for (let j = 0; j < levelData.rows; j++) {
        const tile = levelData.tiles[i][j];
        if (tile.type !== -1) {
          const coord = this.getTileCoordinate(i, j);
          if (coord.tileY + levelData.tileHeight >= dangerY) {
            this.game.onGameOver();
            this.game.setGameState(CONFIG.GAME_STATES.GAME_OVER);
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * 발사될 버블의 궤적을 계산하여 반환합니다.
   * @param {number} startX - 시작 X 좌표
   * @param {number} startY - 시작 Y 좌표
   * @param {number} angle - 발사 각도
   * @param {number} maxBounces - 최대 반사 횟수
   * @returns {Array<object>} 궤적 점들의 배열
   */
  calculateTrajectory(startX, startY, angle, maxBounces = 5) {
    const trajectory = [];
    const levelData = this.game.levelData;
    let x = startX;
    let y = startY;
    let currentAngle = angle;
    let bounces = 0;
    const step = 2;
    const maxSteps = 3000;
    let steps = 0;

    while (bounces <= maxBounces && y > levelData.y && steps < maxSteps) {
      const angleRad = this.degToRad(currentAngle);
      const dx = Math.cos(angleRad) * step;
      const dy = -Math.sin(angleRad) * step;
      steps++;

      let nextX = x + dx;
      let nextY = y + dy;

      const leftBound = levelData.x;
      const rightBound = levelData.x + levelData.width - levelData.tileWidth;

      if (nextX <= leftBound || nextX >= rightBound) {
        if (nextX <= leftBound) {
          x = leftBound;
        } else {
          x = rightBound;
        }
        currentAngle = 180 - currentAngle;
        bounces++;
        trajectory.push({
          x: x + levelData.tileWidth / 2,
          y: y + levelData.tileHeight / 2,
          isBounce: true,
        });
        continue;
      }

      x = nextX;
      y = nextY;

      if (steps % 8 === 0) {
        trajectory.push({
          x: x + levelData.tileWidth / 2,
          y: y + levelData.tileHeight / 2,
          isBounce: false,
        });
      }

      if (y <= levelData.y) {
        const gridPos = this.findBestGridPosition(
          x + levelData.tileWidth / 2,
          levelData.y + levelData.tileHeight / 2
        );
        const finalCoord = this.getTileCoordinate(gridPos.x, 0);
        trajectory.push({
          x: finalCoord.tileX + levelData.tileWidth / 2,
          y: finalCoord.tileY + levelData.tileHeight / 2,
          isFinal: true,
        });
        break;
      }

      let collision = false;
      const bubbleCenterX = x + levelData.tileWidth / 2;
      const bubbleCenterY = y + levelData.tileHeight / 2;

      for (let i = 0; i < levelData.columns && !collision; i++) {
        for (let j = 0; j < levelData.rows && !collision; j++) {
          const tile = levelData.tiles[i][j];
          if (tile.type < 0) continue;

          const coord = this.getTileCoordinate(i, j);
          const tileCenterX = coord.tileX + levelData.tileWidth / 2;
          const tileCenterY = coord.tileY + levelData.tileHeight / 2;

          if (
            this.getDistance(
              bubbleCenterX,
              bubbleCenterY,
              tileCenterX,
              tileCenterY
            ) <
            levelData.radius * 2 - 2
          ) {
            collision = true;

            // --- 수정된 예측 로직 ---
            // 1. 실제 충돌처럼 표면 위치로 보정
            const dxAdjust = bubbleCenterX - tileCenterX;
            const dyAdjust = bubbleCenterY - tileCenterY;
            const dist = Math.sqrt(dxAdjust * dxAdjust + dyAdjust * dyAdjust);
            let adjustedX = bubbleCenterX;
            let adjustedY = bubbleCenterY;

            if (dist > 0) {
              const adjustRatio = (levelData.radius * 2) / dist;
              adjustedX = tileCenterX + dxAdjust * adjustRatio;
              adjustedY = tileCenterY + dyAdjust * adjustRatio;
            }

            // 2. 보정된 위치를 기준으로 최종 안착 지점 계산
            const gridPos = this.findBestGridPosition(adjustedX, adjustedY);
            const finalPos =
              this.findEmptyPosition(
                gridPos.x,
                gridPos.y,
                adjustedX,
                adjustedY
              ) || gridPos;
            // --- 수정 종료 ---

            if (finalPos) {
              const finalCoord = this.getTileCoordinate(finalPos.x, finalPos.y);
              trajectory.push({
                x: finalCoord.tileX + levelData.tileWidth / 2,
                y: finalCoord.tileY + levelData.tileHeight / 2,
                isFinal: true,
              });
            }
          }
        }
      }

      if (collision) break;
    }
    return trajectory;
  }

  findCluster(tx, ty, matchType, reset, skipRemoved) {
    if (reset) this.resetProcessed();

    const targetTile = this.game.levelData.tiles[tx][ty];
    const toProcess = [targetTile];
    targetTile.processed = true;
    const foundCluster = [];

    while (toProcess.length > 0) {
      const currentTile = toProcess.pop();

      if (currentTile.type === -1) continue;
      if (skipRemoved && currentTile.removed) continue;

      if (!matchType || currentTile.type === targetTile.type) {
        foundCluster.push(currentTile);

        const neighbors = this.getNeighbors(currentTile);
        for (const neighbor of neighbors) {
          if (!neighbor.processed) {
            toProcess.push(neighbor);
            neighbor.processed = true;
          }
        }
      }
    }

    return foundCluster;
  }

  getNeighbors(tile) {
    const tileRow = (tile.y + this.game.rowOffset) % 2;
    const neighbors = [];
    const offsets = NEIGHBOR_OFFSETS[tileRow];

    for (const offset of offsets) {
      const nx = tile.x + offset[0];
      const ny = tile.y + offset[1];

      if (
        nx >= 0 &&
        nx < this.game.levelData.columns &&
        ny >= 0 &&
        ny < this.game.levelData.rows
      ) {
        neighbors.push(this.game.levelData.tiles[nx][ny]);
      }
    }

    return neighbors;
  }

  resetProcessed() {
    const levelData = this.game.levelData;
    for (let i = 0; i < levelData.columns; i++) {
      for (let j = 0; j < levelData.rows; j++) {
        levelData.tiles[i][j].processed = false;
      }
    }
  }

  getTileCoordinate(column, row) {
    const levelData = this.game.levelData;
    let tileX = levelData.x + column * levelData.tileWidth;

    if ((row + this.game.rowOffset) % 2) {
      tileX += levelData.tileWidth / 2;
    }

    const tileY = levelData.y + row * levelData.rowHeight;
    return { tileX, tileY };
  }

  getGridPosition(x, y) {
    const levelData = this.game.levelData;
    const gridY = Math.floor((y - levelData.y) / levelData.rowHeight);

    let xOffset = 0;
    if ((gridY + this.game.rowOffset) % 2) {
      xOffset = levelData.tileWidth / 2;
    }

    const gridX = Math.floor((x - xOffset - levelData.x) / levelData.tileWidth);
    return { x: gridX, y: gridY };
  }

  circleIntersection(x1, y1, r1, x2, y2, r2) {
    const distance = this.getDistance(x1, y1, x2, y2);
    return distance < r1 + r2;
  }

  degToRad(angle) {
    return angle * (Math.PI / 180);
  }

  radToDeg(angle) {
    return angle * (180 / Math.PI);
  }
}
