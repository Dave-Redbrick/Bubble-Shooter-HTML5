// 콤보 시스템
export class ComboManager {
  constructor(game) {
    this.game = game;
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.comboTimeout = 3; // 3초 내에 다음 콤보를 만들어야 함
    this.comboMultiplier = 1;
    this.comboDisplay = {
      visible: false,
      text: "",
      scale: 1,
      alpha: 1,
      time: 0,
    };
  }

  update(dt) {
    // 콤보 타이머 업데이트
    if (this.currentCombo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }

    // 콤보 표시 애니메이션 업데이트
    if (this.comboDisplay.visible) {
      this.comboDisplay.time += dt;

      if (this.comboDisplay.time < 0.3) {
        // 확대 애니메이션
        const progress = this.comboDisplay.time / 0.3;
        this.comboDisplay.scale = 1 + Math.sin(progress * Math.PI) * 0.5;
      } else if (this.comboDisplay.time < 2) {
        // 유지
        this.comboDisplay.scale = 1;
        this.comboDisplay.alpha = 1;
      } else if (this.comboDisplay.time < 2.5) {
        // 페이드 아웃
        const fadeProgress = (this.comboDisplay.time - 2) / 0.5;
        this.comboDisplay.alpha = 1 - fadeProgress;
      } else {
        // 숨김
        this.comboDisplay.visible = false;
      }
    }
  }

  addCombo(clusterSize) {
    this.currentCombo++;
    this.comboTimer = this.comboTimeout;

    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo;
    }

    // 콤보 배수 계산 (10점 기준으로 조정)
    this.comboMultiplier = 1 + (this.currentCombo - 1) * 0.5;

    // 콤보 표시 업데이트
    this.updateComboDisplay();

    // 레벨에 따른 기본 점수 계산
    const basePointsPerBubble = 10 + this.game.currentLevel - 1;

    // 콤보를 포함한 최종 점수 계산
    const totalScore = Math.floor(
      clusterSize * basePointsPerBubble * this.comboMultiplier
    );
    this.game.updateScore(totalScore);

    // 특수 효과
    if (this.currentCombo >= 3) {
      this.game.effects.startScreenShake(3, 0.15);
      this.game.effects.startColorFlash("#ffff00", 0.1);
    }

    if (this.currentCombo >= 5) {
      this.game.effects.startSlowMotion(0.7, 0.8);
    }

    // 사운드 재생
    if (this.game.sound) {
      if (this.currentCombo >= 3) {
        this.game.sound.play("combo");
      } else {
        this.game.sound.play("pop");
      }
    }

    return totalScore;
  }

  resetCombo() {
    this.currentCombo = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
  }

  updateComboDisplay() {
    if (this.currentCombo >= 2) {
      this.comboDisplay.visible = true;
      this.comboDisplay.text = `${this.currentCombo} COMBO!`;
      this.comboDisplay.scale = 1;
      this.comboDisplay.alpha = 1;
      this.comboDisplay.time = 0;

      if (this.currentCombo >= 10) {
        this.comboDisplay.text = `${this.currentCombo} MEGA COMBO!`;
      } else if (this.currentCombo >= 5) {
        this.comboDisplay.text = `${this.currentCombo} SUPER COMBO!`;
      }
    }
  }

  render(ctx) {
    if (!this.comboDisplay.visible) return;

    // 데드라인 위치 가져오기
    const deadlineY = this.game.levelData.deadlineY;
    const gridRightX = this.game.levelData.x + this.game.levelData.width;

    // 폰트 크기를 타일 크기에 맞게 조정
    const fontSize = Math.min(this.game.levelData.tileWidth, 48);

    // 위치를 데드라인 바로 위로 설정
    const x = gridRightX - 20;
    const y = deadlineY - fontSize / 2; // 데드라인보다 폰트 크기 + 여백만큼 위

    ctx.save();
    ctx.globalAlpha = this.comboDisplay.alpha;
    ctx.translate(x, y);
    ctx.scale(this.comboDisplay.scale, this.comboDisplay.scale);

    // 그림자
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.font = `bold ${fontSize}px 'Varela Round'`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(this.comboDisplay.text, 2, 2);

    // 메인 텍스트
    let color = "#ffff00";
    if (this.currentCombo >= 10) {
      color = "#ff00ff";
    } else if (this.currentCombo >= 5) {
      color = "#ff6600";
    }

    ctx.fillStyle = color;
    ctx.fillText(this.comboDisplay.text, 0, 0);

    // 외곽선
    // ctx.strokeStyle = "#ffffff";
    // ctx.lineWidth = 2;
    // ctx.strokeText(this.comboDisplay.text, 0, 0);

    ctx.restore();
  }
}
