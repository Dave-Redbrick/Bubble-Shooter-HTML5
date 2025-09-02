// 튜토리얼 시스템
export class TutorialManager {
  constructor(game) {
    this.game = game;
    this.isActive = false;
    this.currentStep = 0;
    this.steps = [
      {
        title: "Let's Start!",
        description: "Aim with your mouse and click to shoot a bubble.",
        highlight: "player",
        duration: 3000
      },
      {
        title: "Match Colors",
        description: "Connect 3 or more bubbles of the same color to pop them.",
        highlight: "bubbles",
        duration: 4000
      },
      {
        title: "Use Items",
        description: "Click the items at the bottom to use special abilities.",
        highlight: "items",
        duration: 3000
      },
      {
        title: "Watch the Danger Line",
        description: "If the bubbles cross the red dotted line, the game is over!",
        highlight: "dangerline",
        duration: 3000
      }
    ];
    this.overlay = null;
    this.checkFirstTime();
  }

  checkFirstTime() {
    const hasPlayed = localStorage.getItem('bubbleShooterPlayed');
    if (!hasPlayed) {
      this.startTutorial();
    }
  }

  startTutorial() {
    this.isActive = true;
    this.currentStep = 0;
    this.createOverlay();
    this.showStep();
    localStorage.setItem('bubbleShooterPlayed', 'true');
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';
    this.overlay.innerHTML = `
      <div class="tutorial-content">
        <div class="tutorial-title"></div>
        <div class="tutorial-description"></div>
        <div class="tutorial-controls">
          <button class="modal-button modal-button-secondary tutorial-skip">Skip</button>
          <button class="modal-button modal-button-primary tutorial-next">Next</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.overlay);
    
    // 이벤트 리스너
    this.overlay.querySelector('.tutorial-skip').addEventListener('click', () => {
      this.endTutorial();
    });
    
    this.overlay.querySelector('.tutorial-next').addEventListener('click', () => {
      this.nextStep();
    });
  }

  showStep() {
    if (this.currentStep >= this.steps.length) {
      this.endTutorial();
      return;
    }

    const step = this.steps[this.currentStep];
    const titleEl = this.overlay.querySelector('.tutorial-title');
    const descEl = this.overlay.querySelector('.tutorial-description');
    const nextBtn = this.overlay.querySelector('.tutorial-next');

    titleEl.textContent = step.title;
    descEl.textContent = step.description;

    // 마지막 단계에서는 '다음' 버튼을 '완료'로 변경하고 스타일을 바꿈
    if (this.currentStep === this.steps.length - 1) {
      nextBtn.textContent = 'Finish';
      nextBtn.classList.add('tutorial-final-step');
    } else {
      nextBtn.textContent = 'Next';
      nextBtn.classList.remove('tutorial-final-step');
    }
    
    // 하이라이트 효과
    this.highlightElement(step.highlight);
    
    // 자동 진행
    if (step.duration) {
      setTimeout(() => {
        if (this.isActive && this.currentStep < this.steps.length - 1) {
          this.nextStep();
        }
      }, step.duration);
    }
  }

  highlightElement(target) {
    // 기존 하이라이트 제거
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });

    // 새 하이라이트 추가
    switch (target) {
      case 'player':
        // 플레이어 영역 하이라이트는 캔버스 위에 표시
        break;
      case 'items':
        document.querySelector('.game-items')?.classList.add('tutorial-highlight');
        break;
      case 'dangerline':
        // 위험선은 게임 내에서 처리
        break;
    }
  }

  nextStep() {
    this.currentStep++;
    this.showStep();
  }

  endTutorial() {
    this.isActive = false;
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    
    // 하이라이트 제거
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
  }
}
