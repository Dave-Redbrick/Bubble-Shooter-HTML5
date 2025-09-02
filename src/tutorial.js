// 튜토리얼 시스템
export class TutorialManager {
  constructor(game) {
    this.game = game;
    this.isActive = false;
    this.currentStep = 0;
    this.steps = [
      {
        title: "게임 시작!",
        description: "마우스로 조준하고 클릭하여 버블을 발사하세요.",
        highlight: "player",
        duration: 3000
      },
      {
        title: "같은 색 연결",
        description: "같은 색 버블 3개 이상을 연결하면 터집니다.",
        highlight: "bubbles",
        duration: 4000
      },
      {
        title: "아이템 사용",
        description: "하단의 아이템을 클릭하여 특수 능력을 사용하세요.",
        highlight: "items",
        duration: 3000
      },
      {
        title: "위험선 주의",
        description: "빨간 점선을 넘으면 게임이 끝납니다!",
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
          <button class="modal-button modal-button-secondary tutorial-skip">건너뛰기</button>
          <button class="modal-button modal-button-primary tutorial-next">다음</button>
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
      nextBtn.textContent = '완료';
      nextBtn.classList.add('tutorial-final-step');
    } else {
      nextBtn.textContent = '다음';
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
