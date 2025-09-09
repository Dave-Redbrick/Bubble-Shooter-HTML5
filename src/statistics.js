// statistics system(removed)
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
        <div class="modal-header">
          <h2>Game Statistics</h2>
          <button class="modal-close">&times;</button>
        </div>
        
        <div class="stats-body">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">${this.stats.totalGamesPlayed}</div>
              <div class="stat-label">Total Games</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.stats.highestScore.toLocaleString()}</div>
              <div class="stat-label">High Score</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.stats.averageScore.toLocaleString()}</div>
              <div class="stat-label">Average Score</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.stats.totalBubblesPopped.toLocaleString()}</div>
              <div class="stat-label">Bubbles Popped</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${Math.round(this.stats.totalTimePlayed / 60)} min</div>
              <div class="stat-label">Total Playtime</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.stats.bestCombo}</div>
              <div class="stat-label">Best Combo</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.stats.levelsCompleted}</div>
              <div class="stat-label">Levels Cleared</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.stats.achievements}</div>
              <div class="stat-label">Achievements Unlocked</div>
            </div>
          </div>
          
          <div class="item-usage">
            <h3>Item Usage Statistics</h3>
            <div class="usage-item">
              <span>Aim Guide: ${this.stats.itemsUsed.aimGuide}</span>
            </div>
            <div class="usage-item">
              <span>Bomb Bubble: ${this.stats.itemsUsed.bombBubble}</span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="modal-button modal-button-secondary stats-reset">Reset Statistics</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 이벤트 리스너
    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('.stats-reset').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all statistics?')) {
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