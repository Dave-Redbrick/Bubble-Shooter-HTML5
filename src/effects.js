// 시각 효과 시스템 (광과민성 고려)
export class EffectsManager {
  constructor(game) {
    this.game = game;
    this.screenShake = {
      active: false,
      intensity: 0,
      duration: 0,
      time: 0,
    };
    this.slowMotion = {
      active: false,
      factor: 1,
      duration: 0,
      time: 0,
    };
    this.colorFlash = {
      active: false,
      color: "#ffffff",
      alpha: 0,
      duration: 0,
      time: 0,
    };
    this.levelUpText = {
      active: false,
      text: "",
      x: 0,
      y: 0,
      alpha: 0,
      scale: 1,
      duration: 3,
      time: 0,
    };
  }

  update(dt) {
    this.updateScreenShake(dt);
    this.updateSlowMotion(dt);
    this.updateColorFlash(dt);
    this.updateLevelUpText(dt);
  }

  // 부드러운 화면 흔들림 효과 (VSCode Power Mode 스타일)
  startScreenShake(intensity = 3, duration = 0.2) {
    // 설정에서 화면 흔들림이 비활성화되어 있으면 무시
    if (this.game.settings && !this.game.settings.settings.screenShake) {
      return;
    }

    this.screenShake.active = true;
    this.screenShake.intensity = Math.min(intensity, 5); // 최대 강도 제한
    this.screenShake.duration = duration;
    this.screenShake.time = 0;
  }

  updateScreenShake(dt) {
    if (!this.screenShake.active) return;

    this.screenShake.time += dt;
    if (this.screenShake.time >= this.screenShake.duration) {
      this.screenShake.active = false;
      // 원래 위치로 복원
      const canvas = this.game.canvas;
      canvas.style.transform = "translate(0px, 0px)";
      return;
    }

    const progress = this.screenShake.time / this.screenShake.duration;
    const currentIntensity = this.screenShake.intensity * (1 - progress);

    // 부드러운 사인파 기반 흔들림
    const frequency = 20; // 흔들림 주파수
    const offsetX =
      Math.sin(this.screenShake.time * frequency) * currentIntensity;
    const offsetY =
      Math.cos(this.screenShake.time * frequency * 1.3) *
      currentIntensity *
      0.5;

    const canvas = this.game.canvas;
    canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  }

  // 슬로우 모션 효과
  startSlowMotion(factor = 0.5, duration = 1) {
    this.slowMotion.active = true;
    this.slowMotion.factor = factor;
    this.slowMotion.duration = duration;
    this.slowMotion.time = 0;
  }

  updateSlowMotion(dt) {
    if (!this.slowMotion.active) return;

    this.slowMotion.time += dt;
    if (this.slowMotion.time >= this.slowMotion.duration) {
      this.slowMotion.active = false;
      this.slowMotion.factor = 1;
    }
  }

  getTimeScale() {
    return this.slowMotion.active ? this.slowMotion.factor : 1;
  }

  // 부드러운 색상 플래시 효과
  startColorFlash(color = "#ffffff", duration = 0.15) {
    this.colorFlash.active = true;
    this.colorFlash.color = color;
    this.colorFlash.duration = duration;
    this.colorFlash.time = 0;
    this.colorFlash.alpha = 0.3; // 낮은 알파값으로 시작
  }

  updateColorFlash(dt) {
    if (!this.colorFlash.active) return;

    this.colorFlash.time += dt;
    const progress = this.colorFlash.time / this.colorFlash.duration;

    if (progress >= 1) {
      this.colorFlash.active = false;
      this.colorFlash.alpha = 0;
    } else {
      // 부드러운 페이드 아웃
      this.colorFlash.alpha = 0.3 * (1 - progress);
    }
  }

  renderColorFlash(ctx) {
    if (!this.colorFlash.active || this.colorFlash.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.colorFlash.alpha;
    ctx.fillStyle = this.colorFlash.color;
    ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    ctx.restore();
  }

  showLevelUp(level) {
    this.levelUpText.active = true;
    this.levelUpText.text = `LEVEL ${level} UP!`;

    // 데드라인 위치와 그리드 우측 끝 위치 가져오기
    const deadlineY = this.game.levelData.deadlineY;
    const gridRightX = this.game.levelData.x + this.game.levelData.width;

    // 폰트 크기를 타일 크기에 맞게 조정 (콤보 텍스트보다 약간 더 크게)
    const fontSize = Math.min(this.game.levelData.tileWidth, 48);

    this.levelUpText.x = gridRightX - 20;
    this.levelUpText.y = deadlineY - fontSize * 1.5; // 콤보 텍스트보다 위에 위치

    this.levelUpText.time = 0;
    this.levelUpText.alpha = 1;
    this.levelUpText.scale = 1;
  }

  updateLevelUpText(dt) {
    if (!this.levelUpText.active) return;

    this.levelUpText.time += dt;
    const effect = this.levelUpText;

    if (effect.time >= effect.duration) {
      effect.active = false;
      return;
    }

    const life = effect.time / effect.duration;

    // 처음 0.5초간 커졌다가 작아지는 효과
    if (effect.time < 0.5) {
      effect.scale = 1 + Math.sin((effect.time / 0.5) * Math.PI) * 0.3;
    } else {
      effect.scale = 1;
    }

    // 마지막 1초간 사라지는 효과
    if (effect.time > effect.duration - 1) {
      effect.alpha = effect.duration - effect.time;
    } else {
      effect.alpha = 1;
    }
  }

  renderLevelUpText(ctx) {
    if (!this.levelUpText.active) return;

    const effect = this.levelUpText;
    const fontSize = Math.min(this.game.levelData.tileWidth, 48);

    ctx.save();
    ctx.globalAlpha = effect.alpha;
    ctx.translate(effect.x, effect.y);
    ctx.scale(effect.scale, effect.scale);

    ctx.font = `bold ${fontSize}px 'Varela Round'`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";

    // 그림자
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillText(effect.text, 2, 2);

    // 메인 텍스트
    ctx.fillStyle = "#00ff88";
    ctx.fillText(effect.text, 0, 0);

    // 외곽선
    // ctx.strokeStyle = "#ffffff";
    // ctx.lineWidth = 1.5;
    // ctx.strokeText(effect.text, 0, 0);

    ctx.restore();
  }

  // 파티클 효과용 부드러운 링 생성
  createSoftExplosionRing(x, y, maxRadius = 50, color = "#ff6600") {
    const rings = [];
    for (let i = 0; i < 2; i++) {
      rings.push({
        x: x,
        y: y,
        radius: 0,
        maxRadius: maxRadius - i * 15,
        alpha: 1,
        color: color,
        speed: 200 + i * 50,
        life: 0.6 - i * 0.1,
        maxLife: 0.6 - i * 0.1,
      });
    }
    return rings;
  }

  updateExplosionRings(rings, dt) {
    return rings.filter((ring) => {
      ring.radius += ring.speed * dt;
      ring.life -= dt;
      ring.alpha = Math.max(0, ring.life / ring.maxLife);

      return ring.life > 0 && ring.radius < ring.maxRadius;
    });
  }

  renderExplosionRings(ctx, rings) {
    rings.forEach((ring) => {
      ctx.save();
      ctx.globalAlpha = ring.alpha * 0.6; // 부드러운 투명도
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }
}
