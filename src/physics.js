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

    if (distance > 0 && distance < levelData.radius * 2) {
      const targetDistance = levelData.radius * 2;
      const ratio = targetDistance / distance;
      player.bubble.x = tileCenterX + dx * ratio - levelData.tileWidth / 2;
      player.bubble.y = tileCenterY + dy * ratio - levelData.tileHeight / 2;
    }
  }

  snapBubbleWithPrecision() {
    const player = this.game.player;
    const levelData = this.game.levelData;
    const angleRad = this.degToRad(player.bubble.angle);
    const velocity = { x: Math.cos(angleRad), y: -Math.sin(angleRad) };

    const finalGridPos = this.determineFinalGridPosition(
      player.bubble.x,
      player.bubble.y,
      velocity
    );

    if (finalGridPos) {
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

  /**
   * [수정됨] 버블의 좌표와 속도를 기반으로 최종 안착할 그리드 위치를 결정합니다.
   * 이 함수는 이제 예측과 실제 스냅의 유일한 기준점(Single Source of Truth)입니다.
   */
  determineFinalGridPosition(bubbleX, bubbleY, velocity) {
    const levelData = this.game.levelData;
    const centerX = bubbleX + levelData.tileWidth / 2;
    const centerY = bubbleY + levelData.tileHeight / 2;

    const gridPos = this.findBestGridPosition(centerX, centerY, velocity);

    if (!gridPos || levelData.tiles[gridPos.x][gridPos.y].type === -1) {
      return gridPos;
    }

    return this.findEmptyPosition(gridPos.x, gridPos.y, centerX, centerY);
  }

  /**
   * [수정됨] 가장 가까운 그리드 위치를 찾되, 이동 방향을 고려하여 더 안정적으로 결정합니다.
   */
  findBestGridPosition(x, y, velocity) {
    const levelData = this.game.levelData;
    const baseGridPos = this.getGridPosition(x, y);
    const tilerow = (baseGridPos.y + this.game.rowOffset) % 2;
    const offsets = [[0, 0], ...NEIGHBOR_OFFSETS[tilerow]];

    let bestPos = null;
    let minScore = Infinity;

    for (const offset of offsets) {
      const newX = baseGridPos.x + offset[0];
      const newY = baseGridPos.y + offset[1];

      if (
        newX < 0 ||
        newX >= levelData.columns ||
        newY < 0 ||
        newY >= levelData.rows
      )
        continue;

      const coord = this.getTileCoordinate(newX, newY);
      const tileCenterX = coord.tileX + levelData.tileWidth / 2;
      const tileCenterY = coord.tileY + levelData.tileHeight / 2;

      const distance = this.getDistance(x, y, tileCenterX, tileCenterY);

      // 방향성 가중치: 날아온 방향과 가까운 쪽을 선호
      const dx = tileCenterX - x;
      const dy = tileCenterY - y;
      const dotProduct = dx * velocity.x + dy * velocity.y;
      const directionPenalty =
        1 -
        dotProduct /
          (Math.sqrt(dx * dx + dy * dy) *
            Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y) || 1);

      const score = distance * (1 + directionPenalty * 0.25); // 방향에 25% 가중치

      if (score < minScore) {
        minScore = score;
        bestPos = { x: newX, y: newY };
      }
    }
    return bestPos;
  }

  findEmptyPosition(x, y, bubbleX, bubbleY) {
    const levelData = this.game.levelData;
    const positions = [];
    const tilerow = (y + this.game.rowOffset) % 2;
    const offsets = NEIGHBOR_OFFSETS[tilerow];

    for (const offset of offsets) {
      const newX = x + offset[0];
      const newY = y + offset[1];
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

  calculateTrajectory(startX, startY, angle, maxBounces = 5) {
    const trajectory = [];
    const levelData = this.game.levelData;

    let x = startX - levelData.tileWidth / 2;
    let y = startY - levelData.tileHeight / 2;
    let currentAngle = angle;
    let bounces = 0;

    const step = 2;
    const maxSteps = 3000;
    const collisionDistance = levelData.radius * 2 - 2;
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
        if (nextX <= leftBound) x = leftBound;
        else x = rightBound;
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
        const velocity = { x: Math.cos(angleRad), y: -Math.sin(angleRad) };
        const gridPos = this.determineFinalGridPosition(x, y, velocity);
        if (gridPos) {
          const finalCoord = this.getTileCoordinate(gridPos.x, gridPos.y);
          trajectory.push({
            x: finalCoord.tileX + levelData.tileWidth / 2,
            y: finalCoord.tileY + levelData.tileHeight / 2,
            isFinal: true,
          });
        }
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
            ) < collisionDistance
          ) {
            collision = true;

            let adjustedX = x;
            let adjustedY = y;
            const dxAdjust = bubbleCenterX - tileCenterX;
            const dyAdjust = bubbleCenterY - tileCenterY;
            const dist = Math.sqrt(dxAdjust * dxAdjust + dyAdjust * dyAdjust);
            if (dist > 0) {
              const ratio = (levelData.radius * 2) / dist;
              adjustedX =
                tileCenterX + dxAdjust * ratio - levelData.tileWidth / 2;
              adjustedY =
                tileCenterY + dyAdjust * ratio - levelData.tileHeight / 2;
            }

            const velocity = { x: Math.cos(angleRad), y: -Math.sin(angleRad) };
            const finalPos = this.determineFinalGridPosition(
              adjustedX,
              adjustedY,
              velocity
            );

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

  degToRad(angle) {
    return angle * (Math.PI / 180);
  }
}
