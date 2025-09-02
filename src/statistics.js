// 통계 시스템
export class StatisticsManager {
  constructor(game) {
    this.game = game;
    this.stats = {
      totalGamesPlayed: 0,
      totalScore: 0,
      highestScore: 0,
      totalBubblesPopped: 0,
      totalTimePlayed: 0,
      averageScore: 0,
      bestCombo: 0,
      levelsCompleted: 0,
      itemsUsed: {
        aimGuide: 0,
        bombBubble: 0
      },
      achievements: 0
    };
    this.sessionStartTime = Date.now();
    this.loadStats();
  }

  loadStats() {
    const saved = localStorage.getItem('bubbleShooterStats');
    if (saved) {
      this.stats = { ...this.stats, ...JSON.parse(saved) };
    }
  }

  saveStats() {
    localStorage.setItem('bubbleShooterStats', JSON.stringify(this.stats));
  }

  recordGameStart() {
    this.stats.totalGamesPlayed++;
    this.sessionStartTime = Date.now();
  }

  recordGameEnd(finalScore) {
    const sessionTime = (Date.now() - this.sessionStartTime) / 1000;
    this.stats.totalTimePlayed += sessionTime;
    this.stats.totalScore += finalScore;
    
    if (finalScore > this.stats.highestScore) {
      this.stats.highestScore = finalScore;
    }
    
    this.stats.averageScore = Math.round(this.stats.totalScore / this.stats.totalGamesPlayed);
    this.saveStats();
  }

  recordBubblesPop(count) {
    this.stats.totalBubblesPopped += count;
  }

  recordCombo(comboCount) {
    if (comboCount > this.stats.bestCombo) {
      this.stats.bestCombo = comboCount;
    }
  }

  recordLevelComplete() {
    this.stats.levelsCompleted++;
  }

  recordItemUse(itemType) {
    if (this.stats.itemsUsed[itemType] !== undefined) {
      this.stats.itemsUsed[itemType]++;
    }
  }

  recordAchievement() {
    this.stats.achievements++;
  }

  showStatsModal() {
    const modal = document.createElement('div');
    modal.className = 'stats-modal';
    modal.innerHTML = `
      <div class="stats-content">
        <div class="stats-header">
          <h2>게임 통계</h2>
          <button class="stats-close">&times;</button>
        </div>
        
        <div class="stats-body">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">${this.stats.totalGamesPlayed}</div>
              <div class="stat-label">총 게임 수</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.stats.highestScore.toLocaleString()}</div>
              <div class="stat-label">최고 점수</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.stats.averageScore.toLocaleString()}</div>
              <div class="stat-label">평균 점수</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.stats.totalBubblesPopped.toLocaleString()}</div>
              <div class="stat-label">터뜨린 버블</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${Math.round(this.stats.totalTimePlayed / 60)}분</div>
              <div class="stat-label">총 플레이 시간</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.stats.bestCombo}</div>
              <div class="stat-label">최고 콤보</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.stats.levelsCompleted}</div>
              <div class="stat-label">완료한 레벨</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.stats.achievements}</div>
              <div class="stat-label">달성한 업적</div>
            </div>
          </div>
          
          <div class="item-usage">
            <h3>아이템 사용 통계</h3>
            <div class="usage-item">
              <span>조준 가이드: ${this.stats.itemsUsed.aimGuide}회</span>
            </div>
            <div class="usage-item">
              <span>폭탄 버블: ${this.stats.itemsUsed.bombBubble}회</span>
            </div>
          </div>
        </div>
        
        <div class="stats-footer">
          <button class="stats-reset">통계 초기화</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 이벤트 리스너
    modal.querySelector('.stats-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('.stats-reset').addEventListener('click', () => {
      if (confirm('정말로 모든 통계를 초기화하시겠습니까?')) {
        this.resetStats();
        modal.remove();
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  resetStats() {
    this.stats = {
      totalGamesPlayed: 0,
      totalScore: 0,
      highestScore: 0,
      totalBubblesPopped: 0,
      totalTimePlayed: 0,
      averageScore: 0,
      bestCombo: 0,
      levelsCompleted: 0,
      itemsUsed: {
        aimGuide: 0,
        bombBubble: 0
      },
      achievements: 0
    };
    this.saveStats();
  }
}
