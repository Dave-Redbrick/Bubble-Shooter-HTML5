// 점수 기반 레벨 시스템 관리
export class LevelManager {
  constructor(game) {
    this.game = game;
  }

  // 현재 점수로 레벨 계산
  calculateLevelFromScore(score) {
    if (score < 100) return 1;
    if (score < 500) return 2;
    // For levels 3 and up, the required score threshold is 500 * 2^(level - 3)
    // score >= 500 * 2^(level - 3)
    // score / 500 >= 2^(level - 3)
    // log2(score / 500) >= level - 3
    // So, level = floor(log2(score / 500)) + 3
    return Math.floor(Math.log2(score / 500)) + 3;
  }

  // 특정 레벨에 필요한 점수 계산
  getScoreForLevel(level) {
    if (level <= 1) return 0;
    if (level === 2) return 100;
    // For level 3 and up, the score is the threshold 500 * 2^(level - 3)
    return 500 * Math.pow(2, level - 3);
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

    // 항상 7가지 색상을 사용
    const maxColors = 7;
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
        // 항상 버블을 생성하여 꽉 채움
        levelData.tiles[i][j].type = this.game.randRange(0, maxColors - 1);
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
