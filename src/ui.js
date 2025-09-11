import { getLocalizedString } from "./localization.js";

// UI Manager Class
export class UIManager {
  constructor(game) {
    this.game = game;
    this.adblockEnabled = false;
    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    this.elements = {
      currentScore: document.getElementById("current-score"),
      highScore: document.getElementById("high-score"),
      currentLevel: document.getElementById("current-level"),
      itemSlotAim: document.getElementById("item-slot-aim"),
      itemSlotBomb: document.getElementById("item-slot-bomb"),
      aimItemTimer: document.querySelector("#item-slot-aim .item-timer"),
      aimItemTimerText: document.querySelector(
        "#item-slot-aim .item-timer-text"
      ),
      canvas: document.getElementById("viewport"),
      canvasContainer: null,
      chancesContainer: document.querySelector(".chances-container"),
      modal: document.getElementById("modal"),
      modalTitle: document.getElementById("modal-title"),
      modalText: document.getElementById("modal-text"),
      modalConfirmButton: document.getElementById("modal-confirm-button"),
      modalCloseButton: document.getElementById("modal-close-button"),
      rightSidebar: document.querySelector(".right-sidebar"),
    };

    this.createCanvasContainer();
    this.localizeStaticUI();
  }

  localizeStaticUI() {
    document.title = getLocalizedString("gameTitle");
    document.querySelectorAll("[data-localize]").forEach((el) => {
      el.textContent = getLocalizedString(el.dataset.localize);
    });
    this.elements.modalCloseButton.textContent = getLocalizedString("cancel");

    const adIconHTML = `<div class="ad-chip">${getLocalizedString("ad")}</div>`;
    this.elements.itemSlotAim
      .querySelectorAll(".ad-chip")
      .forEach((el) => el.remove());
    this.elements.itemSlotBomb
      .querySelectorAll(".ad-chip")
      .forEach((el) => el.remove());
    if (this.elements.itemSlotAim) {
      this.elements.itemSlotAim.insertAdjacentHTML("beforeend", adIconHTML);
    }
    if (this.elements.itemSlotBomb) {
      this.elements.itemSlotBomb.insertAdjacentHTML("beforeend", adIconHTML);
    }
  }

  createCanvasContainer() {
    const gameArea = document.querySelector(".game-area");
    const canvasContainer = document.createElement("div");
    canvasContainer.className = "canvas-container";

    // 기존 캔버스를 컨테이너로 이동
    const canvas = this.elements.canvas;
    canvas.parentNode.removeChild(canvas);
    canvasContainer.appendChild(canvas);
    gameArea.appendChild(canvasContainer);

    this.elements.canvasContainer = canvasContainer;
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
    if (this.elements.itemSlotAim) {
      this.elements.itemSlotAim.addEventListener("click", () => {
        this.game.onItemButtonClick("aim");
      });
    }

    if (this.elements.itemSlotBomb) {
      this.elements.itemSlotBomb.addEventListener("click", () => {
        this.game.onItemButtonClick("bomb");
      });
    }

    // Modal close button
    this.elements.modalCloseButton.addEventListener("click", () => {
      this.hideModal();
    });
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
    // Display level progress
    const levelIndicator = document.querySelector(".level-circle");
    if (levelIndicator) {
      const progressPercent = Math.floor(progress * 100);
      levelIndicator.title = getLocalizedString("scoreToNextLevel", {
        score: scoreToNext.toLocaleString(),
      });

      // Color change based on progress
      const hue = progress * 120; // 0 (red) ~ 120 (green)
      levelIndicator.style.background = `conic-gradient(hsl(${hue}, 70%, 50%) ${progressPercent}%, #666 ${progressPercent}%)`;
    }
  }

  updateItems(items) {
    if (!items) return;

    // Aim Item
    const aimSlot = this.elements.itemSlotAim;
    if (aimSlot && items.aimGuide) {
      const { active, remaining, duration, available } = items.aimGuide;
      const aimText = aimSlot.querySelector("span");
      const adChip = aimSlot.querySelector(".ad-chip");

      if (active) {
        aimSlot.classList.add("active");
        aimText.innerHTML = getLocalizedString("itemAimActive");
        const remainingSeconds = remaining / 1000;
        this.elements.aimItemTimerText.textContent =
          remainingSeconds.toFixed(1) + "s";
        this.elements.aimItemTimerText.style.display = "block";

        const remainingPercent = (remaining / duration) * 100;
        this.elements.aimItemTimer.style.height = `${remainingPercent}%`;
        if (adChip) adChip.style.display = "none";
      } else {
        aimSlot.classList.remove("active");
        this.elements.aimItemTimer.style.height = "0%";
        this.elements.aimItemTimerText.style.display = "none";
        aimText.innerHTML = getLocalizedString("itemAim"); // Keep this to restore the text
        if (adChip) adChip.style.display = "block";
      }

      if (available === 0 && !active) {
        aimSlot.classList.add("disabled");
      } else {
        aimSlot.classList.remove("disabled");
      }
    }

    // Bomb Item
    const bombSlot = this.elements.itemSlotBomb;
    if (bombSlot && items.bombBubble) {
      const { available } = items.bombBubble;
      if (available === 0) {
        bombSlot.classList.add("disabled");
      } else {
        bombSlot.classList.remove("disabled");
      }
    }
  }

  useItem(itemName) {
    if (this.game && typeof this.game.useItem === "function") {
      this.game.useItem(itemName);
    }
  }

  showMenu() {
    if (this.game && this.game.menu) {
      this.game.menu.showMainMenu();
    }
  }

  showModal(title, text, onConfirm) {
    this.elements.modalTitle.textContent = title;
    this.elements.modalText.textContent = text;
    this.elements.modalConfirmButton.textContent =
      getLocalizedString("confirm");

    // Clone and replace the button to remove old event listeners
    const newConfirmButton = this.elements.modalConfirmButton.cloneNode(true);
    this.elements.modalConfirmButton.parentNode.replaceChild(
      newConfirmButton,
      this.elements.modalConfirmButton
    );
    this.elements.modalConfirmButton = newConfirmButton;

    const confirmAndHide = () => {
      onConfirm();
      this.hideModal();
    };

    newConfirmButton.addEventListener("click", confirmAndHide, { once: true });

    this.elements.modal.style.display = "flex";
  }

  hideModal() {
    this.elements.modal.style.display = "none";
    this.game.resumeGame();
  }

  showAdblockerModal() {
    this.elements.modalTitle.textContent = getLocalizedString("adblockTitle");
    this.elements.modalText.textContent = getLocalizedString("adblockMessage");
    this.elements.modalConfirmButton.textContent =
      getLocalizedString("refresh");
    this.elements.modalCloseButton.textContent = getLocalizedString("close");

    const newConfirmButton = this.elements.modalConfirmButton.cloneNode(true);
    this.elements.modalConfirmButton.parentNode.replaceChild(
      newConfirmButton,
      this.elements.modalConfirmButton
    );
    this.elements.modalConfirmButton = newConfirmButton;

    const refresh = () => {
      location.reload();
    };
    newConfirmButton.addEventListener("click", refresh, { once: true });

    const newCloseButton = this.elements.modalCloseButton.cloneNode(true);
    this.elements.modalCloseButton.parentNode.replaceChild(
      newCloseButton,
      this.elements.modalCloseButton
    );
    this.elements.modalCloseButton = newCloseButton;

    const justHide = () => {
      this.elements.modal.style.display = "none";
    };
    newCloseButton.addEventListener("click", justHide, { once: true });

    this.elements.modal.style.display = "flex";
  }

  // 반응형 캔버스 크기 조정 - 기기별로 최적화된 비율로 컨테이너에 맞춤
  resizeCanvas() {
    const canvas = this.elements.canvas;
    const container = document.querySelector(".game-area");
    const canvasContainer = this.elements.canvasContainer;
    const rightSidebar = this.elements.rightSidebar;

    if (!container || !canvas || !canvasContainer) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    let newWidth;
    let newHeight;

    // 모바일 기기 회전 감지 (가로/세로)
    const isHorizontal = window.innerWidth > window.innerHeight;

    if (isHorizontal) {
      // 가로 모드
      if (window.innerWidth >= 800) {
        // 데스크톱/태블릿 가로: 4:3 비율
        const aspectRatio = 4 / 3;
        if (containerWidth / containerHeight > aspectRatio) {
          newHeight = containerHeight;
          newWidth = newHeight * aspectRatio;
        } else {
          newWidth = containerWidth;
          newHeight = newWidth / aspectRatio;
        }
      } else {
        // 모바일 가로: 16:9 비율
        const aspectRatio = 16 / 9;
        if (containerWidth / containerHeight > aspectRatio) {
          newHeight = containerHeight;
          newWidth = newHeight * aspectRatio;
        } else {
          newWidth = containerWidth;
          newHeight = newWidth / aspectRatio;
        }
      }
    } else {
      // 세로 모드
      if (window.innerWidth >= 800) {
        // 데스크톱/태블릿 세로: 3:4 비율
        const aspectRatio = 3 / 4;
        if (containerWidth / containerHeight > aspectRatio) {
          newHeight = containerHeight;
          newWidth = newHeight * aspectRatio;
        } else {
          newWidth = containerWidth;
          newHeight = newWidth / aspectRatio;
        }
      } else {
        // 모바일 세로: 9:16 비율
        const aspectRatio = 9 / 16;
        if (containerWidth / containerHeight > aspectRatio) {
          newHeight = containerHeight;
          newWidth = newHeight * aspectRatio;
        } else {
          newWidth = containerWidth;
          newHeight = newWidth / aspectRatio;
        }
      }
    }

    // 레이아웃을 위해 캔버스 컨테이너에 크기 적용
    canvasContainer.style.width = `${newWidth}px`;
    canvasContainer.style.height = `${newHeight}px`;

    // 캔버스 해상도 업데이트 (정수 값으로 반올림)
    const roundedWidth = Math.round(newWidth);
    const roundedHeight = Math.round(newHeight);

    if (canvas.width !== roundedWidth || canvas.height !== roundedHeight) {
      canvas.width = roundedWidth;
      canvas.height = roundedHeight;

      if (this.game && typeof this.game.handleResize === "function") {
        this.game.handleResize();
      }
    }
  }

  // 모바일 터치 이벤트 처리
  setupMobileEvents() {
    const canvas = this.elements.canvas;
    if (!canvas) return;

    // Check for touch support
    if ("ontouchstart" in window) {
      // Use new touch handlers
      canvas.addEventListener("touchstart", (e) =>
        this.game.input.onTouchStart(e)
      );
      canvas.addEventListener("touchmove", (e) =>
        this.game.input.onTouchMove(e)
      );
      canvas.addEventListener("touchend", (e) => this.game.input.onTouchEnd(e));
    }
  }

  updateChances(shotsWithoutPop, chancesUntilNewRow) {
    const container = this.elements.chancesContainer;
    if (!container) return;

    container.innerHTML = ""; // 이전 아이콘들 삭제
    const chancesLeft = chancesUntilNewRow - shotsWithoutPop;

    for (let i = 0; i < chancesUntilNewRow; i++) {
      const pip = document.createElement("div");
      pip.className = "chance-pip";
      if (i < chancesLeft) {
        pip.classList.add("full");
      }
      container.appendChild(pip);
    }
  }

  setAdblockDetected() {
    this.adblockEnabled = true;
  }

  disableItemButtons() {
    this.elements.itemSlotAim.classList.add("disabled");
    this.elements.itemSlotBomb.classList.add("disabled");
  }

  enableItemButtons() {
    this.elements.itemSlotAim.classList.remove("disabled");
    this.elements.itemSlotBomb.classList.remove("disabled");
  }

  // Show daily challenge notification
  showDailyChallengeNotification() {
    if (
      this.game.dailyChallenge &&
      this.game.dailyChallenge.challenges.length > 0
    ) {
      const notification = document.createElement("div");
      notification.className = "daily-challenge-notification";
      notification.innerHTML = `
        <div class="notification-content">
          <div class="notification-icon">🎯</div>
          <div class="notification-text">
            <div class="notification-title">${getLocalizedString(
              "newDailyChallenge"
            )}</div>
            <div class="notification-desc">${getLocalizedString(
              "checkTodaysChallenge"
            )}</div>
          </div>
          <button class="notification-close">&times;</button>
        </div>
      `;

      document.body.appendChild(notification);

      // Open daily challenge modal on click
      notification.addEventListener("click", () => {
        this.game.dailyChallenge.showChallengesModal();
        notification.remove();
      });

      // Close button
      notification
        .querySelector(".notification-close")
        .addEventListener("click", (e) => {
          e.stopPropagation();
          notification.remove();
        });

      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 10000);
    }
  }
}
