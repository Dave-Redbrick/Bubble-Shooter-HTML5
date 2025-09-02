import { CONFIG, BUBBLE_COLORS } from "./config.js";

export class ClusterManager {
  constructor(game) {
    this.game = game;
  }

  stateRemoveCluster(dt) {
    if (this.game.animationState === 0) {
      this.resetRemoved();

      // 발사한 버블 위치에서 거리 계산하여 정렬
      const hitPos = this.game.hitPosition;
      this.game.cluster.sort((a, b) => {
        const coordA = this.game.physics.getTileCoordinate(a.x, a.y);
        const coordB = this.game.physics.getTileCoordinate(b.x, b.y);

        const distA = Math.sqrt(
          Math.pow(
            coordA.tileX + this.game.levelData.tileWidth / 2 - hitPos.x,
            2
          ) +
            Math.pow(
              coordA.tileY + this.game.levelData.tileHeight / 2 - hitPos.y,
              2
            )
        );
        const distB = Math.sqrt(
          Math.pow(
            coordB.tileX + this.game.levelData.tileWidth / 2 - hitPos.x,
            2
          ) +
            Math.pow(
              coordB.tileY + this.game.levelData.tileHeight / 2 - hitPos.y,
              2
            )
        );

        return distA - distB;
      });

      // 연쇄적으로 터지는 시간 설정
      this.game.cluster.forEach((tile, index) => {
        tile.removed = true;
        tile.popTime = index * 0.1; // 0.1초 간격으로 연쇄 터짐
        tile.popTriggered = false;
        tile.popAnimationTime = 0;
        tile.isPopping = false;
        tile.popScale = 1;
      });

      // 클러스터 제거 이벤트 호출
      this.game.onClusterRemoved(this.game.cluster.length);

      // Find floating clusters
      this.game.floatingClusters = this.findFloatingClusters();

      if (this.game.floatingClusters.length > 0) {
        // Setup drop animation
        for (const cluster of this.game.floatingClusters) {
          for (const tile of cluster) {
            const dropScore = 10 + this.game.currentLevel; // 기본 10점 + 레벨당 1점 + 낙하 보너스 1점
            tile.shift = 1;
            tile.velocity = this.game.player.bubble.dropSpeed;
            // 떨어지는 버블 점수 추가
            this.game.updateScore(dropScore);
          }
        }
      }

      this.game.animationState = 1;
      this.game.animationTime = 0;
    }

    if (this.game.animationState === 1) {
      this.game.animationTime += dt;
      let poppingTilesLeft = false;
      let droppingTilesLeft = false;

      // Pop bubbles animation - 터지는 애니메이션 완료 후 제거
      for (const tile of this.game.cluster) {
        if (tile.type >= 0) {
          // 터지는 시간이 되었고 아직 파티클이 생성되지 않았다면
          if (this.game.animationTime >= tile.popTime && !tile.popTriggered) {
            // 파티클 효과 생성
            const coord = this.game.physics.getTileCoordinate(tile.x, tile.y);
            const centerX = coord.tileX + this.game.levelData.tileWidth / 2;
            const centerY = coord.tileY + this.game.levelData.tileHeight / 2;
            const color = BUBBLE_COLORS[tile.type];

            // 강화된 파티클 효과
            this.game.particles.createChainPopEffect(
              centerX,
              centerY,
              color,
              0
            );

            // 터지는 애니메이션 시작
            tile.isPopping = true;
            tile.popTriggered = true;

            // 사운드 재생
            if (this.game.sound) {
              this.game.sound.play("pop");
            }
          }

          // 터지는 애니메이션 진행
          if (tile.isPopping) {
            tile.popAnimationTime += dt;
            poppingTilesLeft = true;

            // 스케일과 알파 효과
            const animProgress = tile.popAnimationTime / 0.5; // 0.5초 동안 애니메이션
            if (animProgress < 0.3) {
              // 첫 0.15초 동안 커짐
              tile.popScale = 1 + (animProgress / 0.3) * 0.4;
              tile.alpha = 1;
            } else if (animProgress < 0.7) {
              // 다음 0.2초 동안 유지
              tile.popScale = 1.4;
              tile.alpha = 1;
            } else {
              // 마지막 0.15초 동안 작아지면서 사라짐
              const fadeProgress = (animProgress - 0.7) / 0.3;
              tile.popScale = 1.4 - fadeProgress * 1.4;
              tile.alpha = 1 - fadeProgress;
            }

            // 애니메이션 완료 후 제거
            if (tile.popAnimationTime >= 0.5) {
              tile.type = -1;
              tile.alpha = 1;
              tile.popScale = 1;
              tile.isPopping = false;
              poppingTilesLeft = false;
            }
          }
        }
      }

      // Drop bubbles animation - 기존 방식 유지
      for (const cluster of this.game.floatingClusters) {
        for (const tile of cluster) {
          if (tile.type >= 0) {
            droppingTilesLeft = true;

            // Accelerate
            tile.velocity += dt * 700;
            tile.shift += dt * tile.velocity;

            // Fade out
            tile.alpha -= dt * 8;
            if (tile.alpha <= 0) {
              tile.alpha = 0;
            }

            // Remove if past bottom or faded
            const levelData = this.game.levelData;
            if (
              tile.alpha === 0 ||
              tile.y * levelData.rowHeight + tile.shift >
                (levelData.rows - 1) * levelData.rowHeight +
                  levelData.tileHeight
            ) {
              tile.type = -1;
              tile.shift = 0;
              tile.alpha = 1;
            }
          }
        }
      }

      // 모든 애니메이션이 완료되면 다음 단계로
      if (!poppingTilesLeft && !droppingTilesLeft) {
        // 레벨 완료 체크
        const remainingTiles = this.checkRemainingTiles();

        if (!remainingTiles) {
          // 모든 버블이 제거됨 - 레벨 완료
          this.game.onLevelComplete();
          this.game.setGameState(CONFIG.GAME_STATES.READY);
          return;
        }

        // 게임오버 체크
        if (this.game.physics.checkGameOver()) {
          return; // checkGameOver에서 이미 게임오버 처리함
        }

        this.game.setGameState(CONFIG.GAME_STATES.READY);
      }
    }
  }

  findFloatingClusters() {
    this.resetProcessed();
    const foundClusters = [];
    const levelData = this.game.levelData;

    for (let i = 0; i < levelData.columns; i++) {
      for (let j = 0; j < levelData.rows; j++) {
        const tile = levelData.tiles[i][j];
        if (!tile.processed) {
          const foundCluster = this.game.physics.findCluster(
            i,
            j,
            false,
            false,
            true
          );

          if (foundCluster.length <= 0) continue;

          // Check if cluster is floating (not attached to top)
          let floating = true;
          for (const clusterTile of foundCluster) {
            if (clusterTile.y === 0) {
              floating = false;
              break;
            }
          }

          if (floating) {
            foundClusters.push(foundCluster);
          }
        }
      }
    }

    return foundClusters;
  }

  checkRemainingTiles() {
    const levelData = this.game.levelData;
    for (let i = 0; i < levelData.columns; i++) {
      for (let j = 0; j < levelData.rows; j++) {
        if (levelData.tiles[i][j].type !== -1) {
          return true;
        }
      }
    }
    return false;
  }

  resetRemoved() {
    const levelData = this.game.levelData;
    for (let i = 0; i < levelData.columns; i++) {
      for (let j = 0; j < levelData.rows; j++) {
        const tile = levelData.tiles[i][j];
        tile.removed = false;
        tile.popTime = 0;
        tile.popTriggered = false;
        tile.popAnimationTime = 0;
        tile.isPopping = false;
        tile.popScale = 1;
      }
    }
  }

  resetProcessed() {
    const levelData = this.game.levelData;
    for (let i = 0; i < levelData.columns; i++) {
      for (let j = 0; j < levelData.rows; j++) {
        levelData.tiles[i][j].processed = false;
      }
    }
  }
}
