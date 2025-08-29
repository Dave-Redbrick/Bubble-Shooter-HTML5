import { CONFIG, NEIGHBOR_OFFSETS } from "./config.js";

export class PhysicsEngine {
  constructor(game) {
    this.game = game;
  }

  stateShootBubble(dt) {
    const player = this.game.player;
    const levelData = this.game.levelData;

    // Move the bubble
    player.bubble.x +=
      dt * player.bubble.speed * Math.cos(this.degToRad(player.bubble.angle));
    player.bubble.y +=
      dt *
      player.bubble.speed *
      -1 *
      Math.sin(this.degToRad(player.bubble.angle));

    // Handle wall collisions
    if (player.bubble.x <= levelData.x) {
      player.bubble.angle = 180 - player.bubble.angle;
      player.bubble.x = levelData.x;
      this.game.wallBounceCount++;
    } else if (
      player.bubble.x + levelData.tileWidth >=
      levelData.x + levelData.width
    ) {
      player.bubble.angle = 180 - player.bubble.angle;
      player.bubble.x = levelData.x + levelData.width - levelData.tileWidth;
      this.game.wallBounceCount++;
    }

    // Top collision
    if (player.bubble.y <= levelData.y) {
      player.bubble.y = levelData.y;
      this.snapBubble();
      return;
    }

    // Tile collisions
    for (let i = 0; i < levelData.columns; i++) {
      for (let j = 0; j < levelData.rows; j++) {
        const tile = levelData.tiles[i][j];
        if (tile.type < 0) continue;

        const coord = this.getTileCoordinate(i, j);
        if (
          this.circleIntersection(
            player.bubble.x + levelData.tileWidth / 2,
            player.bubble.y + levelData.tileHeight / 2,
            levelData.radius,
            coord.tileX + levelData.tileWidth / 2,
            coord.tileY + levelData.tileHeight / 2,
            levelData.radius
          )
        ) {
          this.snapBubble();
          return;
        }
      }
    }
  }

  snapBubble() {
    const player = this.game.player;
    const levelData = this.game.levelData;

    const centerX = player.bubble.x + levelData.tileWidth / 2;
    const centerY = player.bubble.y + levelData.tileHeight / 2;
    const gridPos = this.getGridPosition(centerX, centerY);

    // Validate grid position
    gridPos.x = Math.max(0, Math.min(gridPos.x, levelData.columns - 1));
    gridPos.y = Math.max(0, Math.min(gridPos.y, levelData.rows - 1));

    let addTile = false;
    if (levelData.tiles[gridPos.x][gridPos.y].type !== -1) {
      // Find empty spot below
      for (let newRow = gridPos.y + 1; newRow < levelData.rows; newRow++) {
        if (levelData.tiles[gridPos.x][newRow].type === -1) {
          gridPos.y = newRow;
          addTile = true;
          break;
        }
      }
    } else {
      addTile = true;
    }

    if (addTile) {
      player.bubble.visible = false;

      // 충돌 지점 저장 (파티클 효과용)
      const coord = this.getTileCoordinate(gridPos.x, gridPos.y);
      this.game.hitPosition = {
        x: coord.tileX + levelData.tileWidth / 2,
        y: coord.tileY + levelData.tileHeight / 2,
      };

      // 폭탄 버블 처리
      if (player.bubble.isBomb) {
        this.handleBombBubble(gridPos.x, gridPos.y);
        return;
      }

      // 일반 버블 처리
      levelData.tiles[gridPos.x][gridPos.y].type = player.bubble.tileType;

      if (this.checkGameOver()) return;

      // Find and handle clusters
      this.game.cluster = this.findCluster(
        gridPos.x,
        gridPos.y,
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

  handleBombBubble(x, y) {
    const levelData = this.game.levelData;
    const bombTiles = [];

    // 폭탄 버블을 배치하지 않고 바로 폭발 처리
    this.game.items.bombBubble.active = false;
    this.game.player.bubble.isBomb = false;

    // 반경 2칸 내의 모든 버블 찾기
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

    // 폭탄 효과 파티클 생성
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
    // 버블을 터뜨리지 못했으므로 실패 카운트 증가
    this.game.shotsWithoutPop++;

    // 실패 횟수가 주어진 기회에 도달했는지 확인
    if (this.game.shotsWithoutPop >= this.game.chancesUntilNewRow) {
      this.addBubbles();
      this.game.shotsWithoutPop = 0; // 실패 카운트 리셋
      // 다음 라운드의 기회를 1 감소 (최소 1)
      this.game.chancesUntilNewRow = Math.max(1, this.game.chancesUntilNewRow - 1);
      this.game.rowOffset = (this.game.rowOffset + 1) % 2;

      if (this.checkGameOver()) return;
    }

    // 다음 버블 준비
    this.game.nextBubble();
    this.game.setGameState(CONFIG.GAME_STATES.READY);
  }

  checkGameOver() {
    const levelData = this.game.levelData;
    const player = this.game.player;

    // 위험선을 플레이어 위치에서 3칸 위로 설정
    const dangerY = player.y - levelData.tileHeight * 3;

    for (let i = 0; i < levelData.columns; i++) {
      for (let j = 0; j < levelData.rows; j++) {
        const tile = levelData.tiles[i][j];
        if (tile.type !== -1) {
          const coord = this.getTileCoordinate(i, j);
          const tileBottom = coord.tileY + levelData.tileHeight;
          
          if (tileBottom >= dangerY) {
            this.game.onGameOver();
            this.game.setGameState(CONFIG.GAME_STATES.GAME_OVER);
            return true;
          }
        }
      }
    }
    return false;
  }

  addBubbles() {
    const levelData = this.game.levelData;

    // Move rows down
    for (let i = 0; i < levelData.columns; i++) {
      for (let j = 0; j < levelData.rows - 1; j++) {
        levelData.tiles[i][levelData.rows - 1 - j].type =
          levelData.tiles[i][levelData.rows - 1 - j - 1].type;
      }
    }

    // Add new top row with random colors from the full range
    for (let i = 0; i < levelData.columns; i++) {
      // 항상 버블을 생성하여 줄을 꽉 채움
      levelData.tiles[i][0].type = this.game.randRange(0, CONFIG.BUBBLE.COLORS - 1);
    }
  }

  // 정확한 궤적 계산 (조준 가이드용) - 완전히 개선된 버전
  calculateTrajectory(startX, startY, angle, maxBounces = 5) {
    const trajectory = [];
    const levelData = this.game.levelData;

    let x = startX;
    let y = startY;
    let currentAngle = angle;
    let bounces = 0;

    const step = 4; // 더 정밀한 계산
    const maxSteps = 2000; // 무한 루프 방지
    let steps = 0;

    while (bounces <= maxBounces && y > levelData.y && steps < maxSteps) {
      const dx = Math.cos(this.degToRad(currentAngle)) * step;
      const dy = -Math.sin(this.degToRad(currentAngle)) * step;

      const nextX = x + dx;
      const nextY = y + dy;
      steps++;

      // 벽 충돌 체크 (버블의 중심점 기준)
      const bubbleLeft = nextX - levelData.tileWidth / 2;
      const bubbleRight = nextX + levelData.tileWidth / 2;

      if (
        bubbleLeft <= levelData.x ||
        bubbleRight >= levelData.x + levelData.width
      ) {
        // 벽 반사
        currentAngle = 180 - currentAngle;
        bounces++;

        // 정확한 반사 위치 계산
        if (bubbleLeft <= levelData.x) {
          x = levelData.x + levelData.tileWidth / 2;
        } else {
          x = levelData.x + levelData.width - levelData.tileWidth / 2;
        }

        // 반사 지점 표시
        trajectory.push({ x: x, y: y, isBounce: true });
        continue;
      }

      x = nextX;
      y = nextY;

      // 궤적 점 추가 (매 5번째 스텝마다)
      if (steps % 5 === 0) {
        trajectory.push({ x: x, y: y, isBounce: false });
      }

      // 상단 충돌
      if (y - levelData.tileHeight / 2 <= levelData.y) {
        // 상단에 도달한 정확한 위치 계산
        const finalGridPos = this.getGridPosition(
          x,
          levelData.y + levelData.tileHeight / 2
        );
        finalGridPos.x = Math.max(
          0,
          Math.min(finalGridPos.x, levelData.columns - 1)
        );
        finalGridPos.y = 0;

        const finalCoord = this.getTileCoordinate(
          finalGridPos.x,
          finalGridPos.y
        );
        trajectory.push({
          x: finalCoord.tileX + levelData.tileWidth / 2,
          y: finalCoord.tileY + levelData.tileHeight / 2,
          isFinal: true,
        });
        break;
      }

      // 타일 충돌 체크
      let collision = false;
      let collisionTile = null;

      for (let i = 0; i < levelData.columns && !collision; i++) {
        for (let j = 0; j < levelData.rows && !collision; j++) {
          const tile = levelData.tiles[i][j];
          if (tile.type < 0) continue;

          const coord = this.getTileCoordinate(i, j);
          const tileX = coord.tileX + levelData.tileWidth / 2;
          const tileY = coord.tileY + levelData.tileHeight / 2;

          if (
            this.circleIntersection(
              x,
              y,
              levelData.radius,
              tileX,
              tileY,
              levelData.radius
            )
          ) {
            collision = true;
            collisionTile = { x: i, y: j };
          }
        }
      }

      if (collision) {
        // 정확한 스냅 위치 계산
        const gridPos = this.getGridPosition(x, y);
        gridPos.x = Math.max(0, Math.min(gridPos.x, levelData.columns - 1));
        gridPos.y = Math.max(0, Math.min(gridPos.y, levelData.rows - 1));

        // 빈 자리 찾기
        if (levelData.tiles[gridPos.x][gridPos.y].type !== -1) {
          for (let newRow = gridPos.y + 1; newRow < levelData.rows; newRow++) {
            if (levelData.tiles[gridPos.x][newRow].type === -1) {
              gridPos.y = newRow;
              break;
            }
          }
        }

        const finalCoord = this.getTileCoordinate(gridPos.x, gridPos.y);
        trajectory.push({
          x: finalCoord.tileX + levelData.tileWidth / 2,
          y: finalCoord.tileY + levelData.tileHeight / 2,
          isFinal: true,
        });
        break;
      }
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
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
  }

  degToRad(angle) {
    return angle * (Math.PI / 180);
  }

  radToDeg(angle) {
    return angle * (180 / Math.PI);
  }
}
