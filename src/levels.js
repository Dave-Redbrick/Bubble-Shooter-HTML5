// 점수 기반 레벨 시스템 관리
export class LevelManager {
  constructor(game) {
    this.game = game;
  }

  // 현재 점수로 레벨 계산
  calculateLevelFromScore(score) {
    if (score < 100) return 1;

    let level = 1;
    let requiredScore = 0;

    while (requiredScore <= score) {
      level++;
      requiredScore = this.getScoreForLevel(level);
    }

    return level - 1;
  }

  // 특정 레벨에 필요한 점수 계산
  getScoreForLevel(level) {
    if (level <= 1) return 0;
    if (level === 2) return 100;

    // 레벨 3까지 필요한 누적 점수 (레벨 2 달성 점수)
    let totalScore = 100;

    // 레벨 3부터는 500 * 2^(i - 3) 점씩 추가
    for (let i = 3; i <= level; i++) {
      totalScore += 500 * Math.pow(2, i - 3);
    }
    return totalScore;
  }

  // 다음 레벨까지 필요한 점수 계산
  getScoreToNextLevel(currentScore) {
    const currentLevel = this.calculateLevelFromScore(currentScore);
    const nextLevelScore = this.getScoreForLevel(currentLevel + 1);
    return Math.max(0, nextLevelScore - currentScore);
  }

  // 현재 레벨의 진행률 (0-1)
  getLevelProgress(currentScore) {
    const currentLevel = this.calculateLevelFromScore(currentScore);
    const currentLevelScore = this.getScoreForLevel(currentLevel);
    const nextLevelScore = this.getScoreForLevel(currentLevel + 1);

    if (currentScore < currentLevelScore) return 0;
    if (nextLevelScore === currentLevelScore) return 1;

    return (
      (currentScore - currentLevelScore) / (nextLevelScore - currentLevelScore)
    );
  }

  // 랜덤 버블 패턴 생성
  createRandomLevel() {
    const levelData = this.game.levelData;
    const currentLevel = this.calculateLevelFromScore(this.game.score);

    // 레벨에 따른 색상 수 결정 (최소 3개, 최대 7개)
    const maxColors = Math.min(3 + Math.floor(currentLevel / 3), 7);

    // 모든 타일을 먼저 빈 상태로 초기화
    for (let i = 0; i < levelData.columns; i++) {
      for (let j = 0; j < levelData.rows; j++) {
        levelData.tiles[i][j].type = -1;
        levelData.tiles[i][j].shift = 0;
        levelData.tiles[i][j].alpha = 1;
        levelData.tiles[i][j].velocity = 0;
      }
    }

    // 상위 절반에 랜덤 버블 생성
    const fillRows = Math.min(
      5 + Math.floor(currentLevel / 5),
      Math.floor(levelData.rows * 0.6)
    );

    for (let j = 0; j < fillRows; j++) {
      for (let i = 0; i < levelData.columns; i++) {
        // 80% 확률로 버블 생성
        if (Math.random() < 0.8) {
          levelData.tiles[i][j].type = this.game.randRange(0, maxColors - 1);
        }
      }
    }

    // 클러스터가 너무 많이 생성되지 않도록 조정
    this.balanceLevel();
  }

  // 레벨 밸런스 조정 (너무 쉽거나 어렵지 않게)
  balanceLevel() {
    const levelData = this.game.levelData;

    // 큰 클러스터들을 찾아서 일부 분리
    for (let i = 0; i < levelData.columns; i++) {
      for (let j = 0; j < levelData.rows; j++) {
        const tile = levelData.tiles[i][j];
        if (tile.type >= 0) {
          const cluster = this.game.physics.findCluster(
            i,
            j,
            true,
            true,
            false
          );

          // 6개 이상의 클러스터가 있으면 일부를 다른 색으로 변경
          if (cluster.length >= 6) {
            const changeCount = Math.floor(cluster.length * 0.3);
            for (let k = 0; k < changeCount; k++) {
              const randomTile =
                cluster[Math.floor(Math.random() * cluster.length)];
              const currentLevel = this.calculateLevelFromScore(
                this.game.score
              );
              const maxColors = Math.min(3 + Math.floor(currentLevel / 3), 7);

              // 현재 색과 다른 색으로 변경
              let newColor;
              do {
                newColor = this.game.randRange(0, maxColors - 1);
              } while (newColor === randomTile.type);

              randomTile.type = newColor;
            }
          }
        }
      }
    }
  }

  // 레벨업 체크 및 처리
  checkLevelUp(newScore) {
    const oldLevel = this.game.currentLevel;
    const newLevel = this.calculateLevelFromScore(newScore);

    if (newLevel > oldLevel) {
      this.game.currentLevel = newLevel;
      this.onLevelUp(newLevel);
      return true;
    }
    return false;
  }

  onLevelUp(newLevel) {
    // 레벨업 보상
    if (newLevel % 3 === 0) {
      this.game.items.aimGuide.available++;
    }
    if (newLevel % 5 === 0) {
      this.game.items.bombBubble.available++;
    }

    // 부드러운 레벨업 효과
    this.game.effects.startColorFlash("#00ff88", 0.3);
    this.game.effects.startScreenShake(2, 0.15);

    if (this.game.sound) {
      this.game.sound.play("levelComplete");
    }

    // 새로운 캔버스 기반 레벨업 효과 호출
    if (this.game.effects) {
      this.game.effects.showLevelUp(newLevel);
    }

    this.game.updateUI();
  }

  // 게임 시작시 초기 레벨 생성
  initializeGame() {
    this.createRandomLevel();
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
      levelData.tiles[i][0].type = this.game.randRange(
        0,
        this.game.findColors().length - 1
      );
    }
  }
}
