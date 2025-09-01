import { getDeviceType } from "./config.js";

// UI 관리 클래스
export class UIManager {
  constructor(game) {
    this.game = game;
    this.currentDeviceType = getDeviceType();
    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    this.elements = {
      currentScore: document.getElementById("current-score"),
      highScore: document.getElementById("high-score"),
      currentLevel: document.getElementById("current-level"),
      item1: document.getElementById("item1"),
      item2: document.getElementById("item2"),
      canvas: document.getElementById("viewport"),
      canvasContainer: null,
    };

    // 캔버스 컨테이너 생성
    this.createCanvasContainer();
  }

  createCanvasContainer() {
    const gameArea = document.querySelector(".game-area");
    const canvasContainer = document.createElement("div");
    canvasContainer.className = "canvas-container";

    const canvasWrapper = document.createElement("div");
    canvasWrapper.className = "canvas-wrapper";

    const canvas = this.elements.canvas;
    canvas.parentNode.removeChild(canvas);

    canvasWrapper.appendChild(canvas);
    canvasContainer.appendChild(canvasWrapper);
    gameArea.appendChild(canvasContainer);

    this.elements.canvasContainer = canvasContainer;
    this.elements.canvasWrapper = canvasWrapper; // Store for later use
  }

  setupEventListeners() {
    // 메뉴 버튼 클릭
    const menuButton = document.querySelector(".menu-button");
    if (menuButton) {
      menuButton.addEventListener("click", () => {
        this.showMenu();
      });
    }

    // 아이템 슬롯 클릭
    if (this.elements.item1) {
      this.elements.item1.addEventListener("click", () => {
        this.useItem(1);
      });
    }

    if (this.elements.item2) {
      this.elements.item2.addEventListener("click", () => {
        this.useItem(2);
      });
    }

  }

  updateScore(score) {
    if (this.elements.currentScore) {
      this.elements.currentScore.textContent = score.toLocaleString();
    }
  }

  updateHighScore(highScore) {
    if (this.elements.highScore) {
      this.elements.highScore.textContent = highScore.toLocaleString();
    }
  }

  updateLevel(level) {
    if (this.elements.currentLevel) {
      this.elements.currentLevel.textContent = level;
    }
  }

  updateLevelProgress(progress, scoreToNext) {
    // 레벨 진행률 표시
    const levelIndicator = document.querySelector('.level-circle');
    if (levelIndicator) {
      const progressPercent = Math.floor(progress * 100);
      levelIndicator.title = `다음 레벨까지 ${scoreToNext.toLocaleString()}점`;
      
      // 진행률에 따른 색상 변화
      const hue = progress * 120; // 0 (빨강) ~ 120 (초록)
      levelIndicator.style.background = `conic-gradient(hsl(${hue}, 70%, 50%) ${progressPercent}%, #666 ${progressPercent}%)`;
    }
  }

  updateItems(items) {
    // 조준 가이드 아이템 업데이트
    const item1 = this.elements.item1;
    if (item1) {
      if (items.aimGuide.active) {
        item1.style.backgroundColor = "rgba(0, 255, 136, 0.8)";
        item1.innerHTML = "<span>AIM<br>ACTIVE</span>";
      } else if (items.aimGuide.available > 0) {
        item1.style.backgroundColor = "rgba(255, 20, 147, 0.8)";
        item1.innerHTML = `<span>AIM<br>${items.aimGuide.available}</span>`;
      } else {
        item1.style.backgroundColor = "rgba(100, 100, 100, 0.5)";
        item1.innerHTML = "<span>AIM<br>0</span>";
      }
    }

    // 폭탄 버블 아이템 업데이트
    const item2 = this.elements.item2;
    if (item2) {
      if (items.bombBubble.active) {
        item2.style.backgroundColor = "rgba(255, 102, 0, 0.8)";
        item2.innerHTML = "<span>BOMB<br>READY</span>";
      } else if (items.bombBubble.available > 0) {
        item2.style.backgroundColor = "rgba(255, 20, 147, 0.8)";
        item2.innerHTML = `<span>BOMB<br>${items.bombBubble.available}</span>`;
      } else {
        item2.style.backgroundColor = "rgba(100, 100, 100, 0.5)";
        item2.innerHTML = "<span>BOMB<br>0</span>";
      }
    }
  }

  useItem(itemNumber) {
    if (this.game && typeof this.game.useItem === "function") {
      this.game.useItem(itemNumber);
    }
  }

  showMenu() {
    if (this.game && this.game.menu) {
      this.game.menu.showMainMenu();
    }
  }


  // 모바일 터치 이벤트 처리
  setupMobileEvents() {
    const canvas = this.elements.canvas;

    if (!canvas) return;

    // 터치 이벤트를 마우스 이벤트로 변환
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        const mouseEvent = new MouseEvent("mousedown", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        canvas.dispatchEvent(mouseEvent);
      }
    });

    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        const mouseEvent = new MouseEvent("mousemove", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        canvas.dispatchEvent(mouseEvent);
      }
    });

    canvas.addEventListener("touchend", (e) => {
      e.preventDefault();
    });
  }

  // 일일 도전 알림 표시
  showDailyChallengeNotification() {
    if (this.game.dailyChallenge && this.game.dailyChallenge.challenges.length > 0) {
      const notification = document.createElement('div');
      notification.className = 'daily-challenge-notification';
      notification.innerHTML = `
        <div class="notification-content">
          <div class="notification-icon">🎯</div>
          <div class="notification-text">
            <div class="notification-title">새로운 일일 도전!</div>
            <div class="notification-desc">오늘의 도전 과제를 확인해보세요</div>
          </div>
          <button class="notification-close">&times;</button>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // 클릭 시 일일 도전 모달 열기
      notification.addEventListener('click', () => {
        this.game.dailyChallenge.showChallengesModal();
        notification.remove();
      });
      
      // 닫기 버튼
      notification.querySelector('.notification-close').addEventListener('click', (e) => {
        e.stopPropagation();
        notification.remove();
      });
      
      // 10초 후 자동 제거
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 10000);
    }
  }
}
