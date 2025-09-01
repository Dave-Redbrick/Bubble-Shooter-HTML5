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
      canvasWrapper: null,
    };
    this.createCanvasContainer();
  }

  createCanvasContainer() {
    const gameArea = document.querySelector(".game-area");
    const canvasContainer = document.createElement("div");
    canvasContainer.className = "canvas-container";

    const canvasWrapper = document.createElement("div");
    canvasWrapper.className = "canvas-wrapper";

    const canvas = this.elements.canvas;
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }

    canvasWrapper.appendChild(canvas);
    canvasContainer.appendChild(canvasWrapper);
    gameArea.appendChild(canvasContainer);

    this.elements.canvasContainer = canvasContainer;
    this.elements.canvasWrapper = canvasWrapper;
  }

  setupEventListeners() {
    const menuButton = document.querySelector(".menu-button");
    if (menuButton) {
      menuButton.addEventListener("click", () => this.showMenu());
    }

    if (this.elements.item1) {
      this.elements.item1.addEventListener("click", () => this.useItem(1));
    }

    if (this.elements.item2) {
      this.elements.item2.addEventListener("click", () => this.useItem(2));
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
    const levelIndicator = document.querySelector('.level-circle');
    if (levelIndicator) {
      const progressPercent = Math.floor(progress * 100);
      levelIndicator.title = `다음 레벨까지 ${scoreToNext.toLocaleString()}점`;
      const hue = progress * 120;
      levelIndicator.style.background = `conic-gradient(hsl(${hue}, 70%, 50%) ${progressPercent}%, #666 ${progressPercent}%)`;
    }
  }

  updateItems(items) {
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

  setupMobileEvents() {
    const canvas = this.elements.canvas;
    if (!canvas) return;

    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        const mouseEvent = new MouseEvent("mousedown", { clientX: touch.clientX, clientY: touch.clientY });
        canvas.dispatchEvent(mouseEvent);
      }
    });

    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        const mouseEvent = new MouseEvent("mousemove", { clientX: touch.clientX, clientY: touch.clientY });
        canvas.dispatchEvent(mouseEvent);
      }
    });

    canvas.addEventListener("touchend", (e) => {
      e.preventDefault();
    });
  }
}
