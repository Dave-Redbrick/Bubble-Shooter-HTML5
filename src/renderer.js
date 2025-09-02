import { CONFIG, BUBBLE_COLORS } from "./config.js";
import { getLocalizedString } from "./localization.js";

export class Renderer {
  constructor(game) {
    this.game = game;
    this.context = game.context;
    this.canvas = game.canvas;
  }

  render() {
    this.drawBackground();
    this.renderLevel();
    this.renderGameOverLine();
    this.renderTiles();
    this.renderAimGuide();
    this.renderPlayer();
    this.game.particles.render(this.context);
    this.renderCombo();
    this.game.effects.renderLevelUpText(this.context);
    this.renderEffects();
    this.renderGameOver();
    this.renderFPS();
  }

  drawBackground() {
    const ctx = this.context;
    const canvas = this.canvas;

    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height)
    );

    gradient.addColorStop(0, "#002244"); // 중심부: 딥 블루
    gradient.addColorStop(1, "#000011"); // 가장자리: 거의 검정

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  renderLevel() {
    const ctx = this.context;
    const levelData = this.game.levelData;

    // 좌우 테두리만 그리기
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 3;

    // 왼쪽 테두리 (전체 높이)
    ctx.beginPath();
    ctx.moveTo(levelData.x - ctx.lineWidth / 2, 0);
    ctx.lineTo(levelData.x - ctx.lineWidth / 2, this.canvas.height);
    ctx.stroke();

    // 오른쪽 테두리 (전체 높이)
    ctx.beginPath();
    ctx.moveTo(levelData.x + levelData.width + ctx.lineWidth / 2, 0);
    ctx.lineTo(levelData.x + levelData.width + ctx.lineWidth / 2, this.canvas.height);
    ctx.stroke();
  }

  renderGameOverLine() {
    const ctx = this.context;
    const levelData = this.game.levelData;
    const player = this.game.player;

    // DANGER LINE을 실제 게임오버 지점과 동일하게 설정
    const lineY = player.y - levelData.tileHeight * 3;

    // 점선으로 게임 오버 선 그리기
    ctx.save();
    ctx.setLineDash([10, 5]);
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;

    ctx.beginPath();
    ctx.moveTo(levelData.x, lineY);
    ctx.lineTo(levelData.x + levelData.width, lineY);
    ctx.stroke();

    ctx.restore();
  }

  renderAimGuide() {
    const isAiming = this.game.gameState === CONFIG.GAME_STATES.READY;
    const aimGuideActive = this.game.items.aimGuide.active;

    if (!isAiming || !aimGuideActive) {
      return;
    }

    const ctx = this.context;
    const player = this.game.player;
    const levelData = this.game.levelData;

    // 궤적 계산
    const startX = player.x + levelData.tileWidth / 2;
    const startY = player.y + levelData.tileHeight / 2;
    const trajectory = this.game.physics.calculateTrajectory(
      startX,
      startY,
      player.angle
    );

    if (trajectory.length === 0) return;

    ctx.save();

    // 궤적 점선 그리기
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;

    ctx.beginPath();
    ctx.moveTo(startX, startY);

    for (let i = 0; i < trajectory.length; i++) {
      const point = trajectory[i];
      ctx.lineTo(point.x, point.y);

      // 벽 반사 지점 표시
      if (point.isBounce) {
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);

        // 반사 지점에 작은 원 표시
        ctx.save();
        ctx.setLineDash([]);
        ctx.fillStyle = "#ffff00";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.stroke();

    // 최종 위치 표시
    const finalPoint = trajectory[trajectory.length - 1];
    if (finalPoint) {
      ctx.setLineDash([]);

      // 최종 위치에 큰 원 표시
      ctx.fillStyle = "rgba(0, 255, 136, 0.3)";
      ctx.beginPath();
      ctx.arc(finalPoint.x, finalPoint.y, levelData.radius + 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 중심점
      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.arc(finalPoint.x, finalPoint.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderTiles() {
    const levelData = this.game.levelData;

    for (let j = 0; j < levelData.rows; j++) {
      for (let i = 0; i < levelData.columns; i++) {
        const tile = levelData.tiles[i][j];

        if (tile.type >= 0) {
          const coord = this.getTileCoordinate(i, j);

          this.context.save();
          this.context.globalAlpha = tile.alpha;

          // 터지는 애니메이션 효과
          if (tile.isPopping) {
            this.context.translate(
              coord.tileX + levelData.tileWidth / 2,
              coord.tileY + levelData.tileHeight / 2 + tile.shift
            );
            this.context.scale(tile.popScale, tile.popScale);
            this.context.translate(
              -levelData.tileWidth / 2,
              -levelData.tileHeight / 2
            );
            this.drawBubble(0, 0, tile.type);
          } else {
            this.drawBubble(coord.tileX, coord.tileY + tile.shift, tile.type);
          }

          this.context.restore();
        }
      }
    }
  }

  renderPlayer() {
    const player = this.game.player;
    const levelData = this.game.levelData;
    const centerX = player.x + levelData.tileWidth / 2;
    const centerY = player.y + levelData.tileHeight / 2;
    const ctx = this.context;

    // 플레이어 배경 원
    ctx.fillStyle = "#444444";
    ctx.beginPath();
    ctx.arc(centerX, centerY, levelData.radius + 15, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#666666";
    ctx.stroke();

    // Aiming line (basic)
    if (this.game.settings.settings.showTrajectory && !this.game.items.aimGuide.active) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.setLineDash([5, 10]);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX +
          2 * levelData.tileWidth * Math.cos(this.degToRad(player.angle)),
        centerY -
          2 * levelData.tileHeight * Math.sin(this.degToRad(player.angle))
      );
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
    }

    // 다음 버블
    if (player.nextBubble.isBomb) {
      this.drawBombBubble(player.nextBubble.x, player.nextBubble.y);
    } else {
      this.drawBubble(
        player.nextBubble.x,
        player.nextBubble.y,
        player.nextBubble.tileType
      );
    }

    // Launcher Bubble (the one ready to be shot)
    if (player.isBomb) {
      this.drawBombBubble(player.x, player.y);
    } else {
      this.drawBubble(player.x, player.y, player.tileType);
    }

    // Projectile Bubble (the one in flight)
    if (player.bubble.visible) {
      if (player.bubble.isBomb) {
        this.drawBombBubble(player.bubble.x, player.bubble.y);
      } else {
        this.drawBubble(
          player.bubble.x,
          player.bubble.y,
          player.bubble.tileType
        );
      }
    }
  }

  drawBombBubble(x, y) {
    const ctx = this.context;
    const levelData = this.game.levelData;
    const centerX = x + levelData.tileWidth / 2;
    const centerY = y + levelData.tileHeight / 2;
    const radius = levelData.radius;

    // 그림자 효과
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.arc(centerX + 3, centerY + 5, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // 메인 버블 - 어두운 메탈릭 효과
    const mainGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius
    );

    mainGradient.addColorStop(0, "rgba(60, 60, 60, 0.9)");
    mainGradient.addColorStop(0.4, "rgba(40, 40, 40, 0.95)");
    mainGradient.addColorStop(0.8, "rgba(20, 20, 20, 1)");
    mainGradient.addColorStop(1, "rgba(10, 10, 10, 1)");

    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    // 어두운 외곽선
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 상단 메탈릭 하이라이트
    const highlightGradient = ctx.createRadialGradient(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      0,
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      radius * 0.5
    );
    highlightGradient.addColorStop(0, "rgba(120, 120, 120, 0.7)");
    highlightGradient.addColorStop(0.5, "rgba(80, 80, 80, 0.4)");
    highlightGradient.addColorStop(1, "rgba(80, 80, 80, 0)");

    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      radius * 0.5,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // 작은 반사광
    ctx.fillStyle = "rgba(150, 150, 150, 0.8)";
    ctx.beginPath();
    ctx.arc(
      centerX - radius * 0.4,
      centerY - radius * 0.4,
      radius * 0.12,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // 폭탄 심지 (상단)
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(centerX - 2, centerY - radius - 8, 4, 8);

    // 심지 끝부분
    ctx.fillStyle = "#654321";
    ctx.beginPath();
    ctx.arc(centerX, centerY - radius - 8, 2, 0, Math.PI * 2);
    ctx.fill();

    // 불타는 파티클 효과 (심지 끝에서)
    this.renderFuseParticles(centerX, centerY - radius - 10);
  }

  renderFuseParticles(x, y) {
    const ctx = this.context;
    const time = Date.now() / 100;
    
    // 메인 불꽃
    if (Math.sin(time) > -0.5) {
      const flameSize = 3 + Math.sin(time * 2) * 1;
      
      // 불꽃 그라디언트
      const flameGradient = ctx.createRadialGradient(x, y, 0, x, y, flameSize);
      flameGradient.addColorStop(0, "#ffff00");
      flameGradient.addColorStop(0.5, "#ff6600");
      flameGradient.addColorStop(1, "#ff0000");
      
      ctx.fillStyle = flameGradient;
      ctx.beginPath();
      ctx.arc(x, y, flameSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // 작은 불꽃 파티클들
    for (let i = 0; i < 3; i++) {
      const angle = (time + i * 2) % (Math.PI * 2);
      const distance = 2 + Math.sin(time + i) * 1;
      const particleX = x + Math.cos(angle) * distance;
      const particleY = y + Math.sin(angle) * distance - Math.abs(Math.sin(time + i)) * 2;
      
      const alpha = 0.5 + Math.sin(time * 3 + i) * 0.3;
      ctx.save();
      ctx.globalAlpha = alpha;
      
      const colors = ["#ffff00", "#ff8800", "#ff4400"];
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(particleX, particleY, 1 + Math.sin(time + i) * 0.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }

    // 연기 효과
    const smokeAlpha = 0.2 + Math.sin(time * 0.5) * 0.1;
    ctx.save();
    ctx.globalAlpha = smokeAlpha;
    ctx.fillStyle = "#666666";
    ctx.beginPath();
    ctx.arc(x, y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderCombo() {
    if (this.game.combo) {
      this.game.combo.render(this.context);
    }
  }

  renderEffects() {
    if (this.game.effects) {
      this.game.effects.renderColorFlash(this.context);
    }
  }

  renderFPS() {
    if (this.game.settings && this.game.settings.settings.showFPS) {
      const ctx = this.context;
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`FPS: ${this.game.fps}`, 10, 30);
      ctx.restore();
    }
  }

  renderGameOver() {
    if (this.game.gameState !== CONFIG.GAME_STATES.GAME_OVER) return;

    const ctx = this.context;

    // Overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Game Over Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      getLocalizedString("gameOver"),
      this.canvas.width / 2,
      this.canvas.height / 2 - 50
    );

    ctx.font = "24px Arial";
    ctx.fillText(
      getLocalizedString("clickToRestart"),
      this.canvas.width / 2,
      this.canvas.height / 2 + 20
    );

    // Final Score
    ctx.font = "32px Arial";
    ctx.fillStyle = "#00ff88";
    ctx.fillText(
        getLocalizedString("finalScore", { score: this.game.score.toLocaleString() }),
      this.canvas.width / 2,
      this.canvas.height / 2 + 80
    );

    // New High Score
    if (this.game.score === this.game.highScore) {
      ctx.font = "24px Arial";
      ctx.fillStyle = "#ffd700";
      ctx.fillText(
        getLocalizedString("newHighScore"),
        this.canvas.width / 2,
        this.canvas.height / 2 + 120
      );
    }

    ctx.textAlign = "left"; // Restore default
  }

  drawBubble(x, y, index) {
    if (index < 0 || index >= CONFIG.BUBBLE.COLORS) return;

    const ctx = this.context;
    const levelData = this.game.levelData;
    const centerX = x + levelData.tileWidth / 2;
    const centerY = y + levelData.tileHeight / 2;
    const radius = levelData.radius;

    const color = BUBBLE_COLORS[index];

    // Shadow effect
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.arc(centerX + 3, centerY + 5, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Main bubble - transparent glass effect
    const mainGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius
    );

    // Create gradient with transparent colors
    const transparentColor = this.hexToRgba(color, 0.7);
    const edgeColor = this.hexToRgba(this.darkenColor(color, 30), 0.9);

    mainGradient.addColorStop(0, transparentColor);
    mainGradient.addColorStop(0.7, transparentColor);
    mainGradient.addColorStop(1, edgeColor);

    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Outline
    ctx.strokeStyle = this.hexToRgba(this.darkenColor(color, 40), 0.8);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Top highlight (large reflection)
    const highlightGradient = ctx.createRadialGradient(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      0,
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      radius * 0.6
    );
    highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    highlightGradient.addColorStop(0.3, "rgba(255, 255, 255, 0.4)");
    highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      radius * 0.6,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Small reflection
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(
      centerX - radius * 0.4,
      centerY - radius * 0.4,
      radius * 0.15,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Bottom highlight (floor reflection)
    const bottomGradient = ctx.createRadialGradient(
      centerX + radius * 0.2,
      centerY + radius * 0.4,
      0,
      centerX + radius * 0.2,
      centerY + radius * 0.4,
      radius * 0.3
    );
    bottomGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
    bottomGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(
      centerX + radius * 0.2,
      centerY + radius * 0.4,
      radius * 0.3,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Inner color reflection
    const innerGradient = ctx.createRadialGradient(
      centerX,
      centerY + radius * 0.3,
      0,
      centerX,
      centerY + radius * 0.3,
      radius * 0.4
    );
    innerGradient.addColorStop(
      0,
      this.hexToRgba(this.lightenColor(color, 20), 0.4)
    );
    innerGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY + radius * 0.3, radius * 0.4, 0, 2 * Math.PI);
    ctx.fill();

    // Colorblind pattern
    if (this.game.settings.settings.colorBlindMode) {
      this.drawColorblindPattern(ctx, centerX, centerY, radius, index);
    }
  }

  drawColorblindPattern(ctx, x, y, radius, index) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;

    switch (index % 6) { // Using 6 patterns for variety
        case 0: // Horizontal lines
            for (let i = -radius; i < radius; i += 4) {
                ctx.beginPath();
                ctx.moveTo(x - radius, y + i);
                ctx.lineTo(x + radius, y + i);
                ctx.stroke();
            }
            break;
        case 1: // Vertical lines
            for (let i = -radius; i < radius; i += 4) {
                ctx.beginPath();
                ctx.moveTo(x + i, y - radius);
                ctx.lineTo(x + i, y + radius);
                ctx.stroke();
            }
            break;
        case 2: // Polka dots
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            for (let i = -radius; i < radius; i += 8) {
                for (let j = -radius; j < radius; j += 8) {
                    if (i*i + j*j < radius*radius) {
                        ctx.beginPath();
                        ctx.arc(x + i, y + j, 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
            break;
        case 3: // Diagonal lines (top-left to bottom-right)
            for (let i = -radius * 2; i < radius * 2; i += 6) {
                ctx.beginPath();
                ctx.moveTo(x - radius, y + i - radius);
                ctx.lineTo(x + radius, y + i + radius);
                ctx.stroke();
            }
            break;
        case 4: // Grid
            for (let i = -radius; i < radius; i += 6) {
                ctx.beginPath();
                ctx.moveTo(x - radius, y + i);
                ctx.lineTo(x + radius, y + i);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + i, y - radius);
                ctx.lineTo(x + i, y + radius);
                ctx.stroke();
            }
            break;
        case 5: // Chevron
            ctx.lineWidth = 3;
            for (let i = -radius; i < radius; i += 8) {
                ctx.beginPath();
                ctx.moveTo(x - radius, y + i);
                ctx.lineTo(x, y + i + 4);
                ctx.lineTo(x + radius, y + i);
                ctx.stroke();
            }
            break;
    }
    ctx.restore();
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

  drawCenterText(text, x, y, width) {
    const textDim = this.context.measureText(text);
    this.context.fillText(text, x + (width - textDim.width) / 2, y);
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let G = ((num >> 8) & 0x00ff) + amt;
    let B = (num & 0x0000ff) + amt;
    R = R > 255 ? 255 : R < 0 ? 0 : R;
    G = G > 255 ? 255 : G < 0 ? 0 : G;
    B = B > 255 ? 255 : B < 0 ? 0 : B;
    return "#" + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
  }

  darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    let R = (num >> 16) - amt;
    let G = ((num >> 8) & 0x00ff) - amt;
    let B = (num & 0x0000ff) - amt;
    R = R > 255 ? 255 : R < 0 ? 0 : R;
    G = G > 255 ? 255 : G < 0 ? 0 : G;
    B = B > 255 ? 255 : B < 0 ? 0 : B;
    return "#" + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
  }

  degToRad(angle) {
    return angle * (Math.PI / 180);
  }
}
