// 메뉴 시스템
export class MenuManager {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.modal = null;
  }

  showMainMenu() {
    this.createMainMenu();
  }

  createMainMenu() {
    this.modal = document.createElement('div');
    this.modal.className = 'menu-modal';
    this.modal.innerHTML = `
      <div class="menu-content">
        <div class="modal-header">
          <h1>버블 슈터</h1>
          <button class="modal-close">&times;</button>
        </div>
        
        <div class="menu-body">
          <div class="menu-buttons">
            <button class="menu-btn" id="newGame">새 게임</button>
            <button class="menu-btn" id="continueGame">계속하기</button>
            <button class="menu-btn" id="statistics">통계</button>
            <button class="menu-btn" id="settings">설정</button>
            <button class="menu-btn" id="tutorial">튜토리얼</button>
            <button class="menu-btn" id="achievements">업적</button>
          </div>
          
          <div class="menu-info">
            <div class="current-stats">
              <div class="stat">
                <span class="stat-label">현재 점수:</span>
                <span class="stat-value">${this.game.score.toLocaleString()}</span>
              </div>
              <div class="stat">
                <span class="stat-label">최고 점수:</span>
                <span class="stat-value">${this.game.highScore.toLocaleString()}</span>
              </div>
              <div class="stat">
                <span class="stat-label">현재 레벨:</span>
                <span class="stat-value">${this.game.currentLevel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
    this.setupMenuEvents();
    this.isOpen = true;
  }

  setupMenuEvents() {
    // 닫기 버튼
    this.modal.querySelector('.modal-close').addEventListener('click', () => {
      this.closeMenu();
    });

    // 새 게임
    this.modal.querySelector('#newGame').addEventListener('click', () => {
      this.game.newGame();
      this.closeMenu();
    });

    // 계속하기
    this.modal.querySelector('#continueGame').addEventListener('click', () => {
      this.closeMenu();
    });

    // 통계
    this.modal.querySelector('#statistics').addEventListener('click', () => {
      if (this.game.statistics) {
        this.game.statistics.showStatsModal();
      }
    });

    // 설정
    this.modal.querySelector('#settings').addEventListener('click', () => {
      if (this.game.settings) {
        this.game.settings.showSettingsModal();
      }
    });

    // 튜토리얼
    this.modal.querySelector('#tutorial').addEventListener('click', () => {
      if (this.game.tutorial) {
        this.game.tutorial.startTutorial();
        this.closeMenu();
      }
    });

    // 업적
    this.modal.querySelector('#achievements').addEventListener('click', () => {
      this.showAchievementsModal();
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeMenu();
      }
    });
  }

  showAchievementsModal() {
    const achievementsModal = document.createElement('div');
    achievementsModal.className = 'achievements-modal';
    
    const achievements = this.game.achievements.achievements;
    let achievementsList = '';
    
    Object.keys(achievements).forEach(key => {
      const achievement = achievements[key];
      const status = achievement.unlocked ? 'unlocked' : 'locked';
      achievementsList += `
        <div class="achievement-item ${status}">
          <div class="achievement-icon">${achievement.unlocked ? '🏆' : '🔒'}</div>
          <div class="achievement-info">
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-desc">${achievement.description}</div>
          </div>
        </div>
      `;
    });

    achievementsModal.innerHTML = `
      <div class="achievements-content">
        <div class="modal-header">
          <h2>업적</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="achievements-list">
          ${achievementsList}
        </div>
      </div>
    `;

    document.body.appendChild(achievementsModal);

    achievementsModal.querySelector('.modal-close').addEventListener('click', () => {
      achievementsModal.remove();
    });
  }

  closeMenu() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
      this.isOpen = false;
    }
  }
}
