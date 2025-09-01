// 게임 모드 시스템
export class GameModeManager {
  constructor(game) {
    this.game = game;
    this.currentMode = 'classic';
    this.modes = {
      classic: {
        name: '클래식',
        description: '기본 게임 모드',
        timeLimit: null,
        specialRules: null
      },
      timeAttack: {
        name: '타임 어택',
        description: '제한 시간 내에 최대한 많은 점수를 획득하세요',
        timeLimit: 180, // 3분
        specialRules: 'timeLimit'
      },
      endless: {
        name: '무한 모드',
        description: '끝없이 계속되는 도전',
        timeLimit: null,
        specialRules: 'endless'
      },
      puzzle: {
        name: '퍼즐 모드',
        description: '정해진 수의 버블로 모든 버블을 제거하세요',
        timeLimit: null,
        specialRules: 'limitedBubbles'
      }
    };
    this.timeRemaining = 0;
    this.bubblesRemaining = 0;
  }

  setMode(modeName) {
    if (this.modes[modeName]) {
      this.currentMode = modeName;
      this.initializeMode();
    }
  }

  initializeMode() {
    const mode = this.modes[this.currentMode];

    switch (mode.specialRules) {
      case 'timeLimit':
        this.timeRemaining = mode.timeLimit;
        break;
      case 'limitedBubbles':
        this.bubblesRemaining = 50; // 50개 버블 제한
        break;
      case 'endless':
        // 무한 모드는 특별한 초기화 없음
        break;
    }
  }

  update(dt) {
    const mode = this.modes[this.currentMode];

    if (mode.specialRules === 'timeLimit' && this.timeRemaining > 0) {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.game.setGameState(this.game.CONFIG.GAME_STATES.GAME_OVER);
      }
    }
  }

  onBubbleShot() {
    const mode = this.modes[this.currentMode];

    if (mode.specialRules === 'limitedBubbles') {
      this.bubblesRemaining--;
      if (this.bubblesRemaining <= 0) {
        this.game.setGameState(this.game.CONFIG.GAME_STATES.GAME_OVER);
      }
    }
  }

  showModeSelector() {
    const modal = document.createElement('div');
    modal.className = 'mode-selector-modal';

    let modesHTML = '';
    Object.keys(this.modes).forEach(key => {
      const mode = this.modes[key];
      const isSelected = key === this.currentMode;
      modesHTML += `
        <div class="mode-option ${isSelected ? 'selected' : ''}" data-mode="${key}">
          <div class="mode-name">${mode.name}</div>
          <div class="mode-description">${mode.description}</div>
          ${mode.timeLimit ? `<div class="mode-time">제한시간: ${Math.floor(mode.timeLimit / 60)}분</div>` : ''}
        </div>
      `;
    });

    modal.innerHTML = `
      <div class="mode-selector-content">
        <div class="mode-selector-header">
          <h2>게임 모드 선택</h2>
          <button class="mode-selector-close">&times;</button>
        </div>
        <div class="mode-options">
          ${modesHTML}
        </div>
        <div class="mode-selector-footer">
          <button class="start-game">게임 시작</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 모드 선택 이벤트
    modal.querySelectorAll('.mode-option').forEach(option => {
      option.addEventListener('click', () => {
        modal.querySelectorAll('.mode-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        this.currentMode = option.dataset.mode;
      });
    });

    // 게임 시작
    modal.querySelector('.start-game').addEventListener('click', () => {
      this.initializeMode();
      this.game.newGame();
      modal.remove();
    });

    // 닫기
    modal.querySelector('.mode-selector-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  renderModeInfo(ctx) {
    const mode = this.modes[this.currentMode];

    if (mode.specialRules === 'timeLimit' && this.timeRemaining > 0) {
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = Math.floor(this.timeRemaining % 60);

      ctx.save();
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${minutes}:${seconds.toString().padStart(2, '0')}`,
        this.game.canvas.width / 2,
        50
      );
      ctx.restore();
    }

    if (mode.specialRules === 'limitedBubbles') {
      ctx.save();
      ctx.fillStyle = '#4444ff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `남은 버블: ${this.bubblesRemaining}`,
        this.game.canvas.width / 2,
        80
      );
      ctx.restore();
    }
  }
}
