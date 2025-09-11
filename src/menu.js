import { getLocalizedString } from "./localization.js";

// 메뉴 시스템
export class MenuManager {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.modal = null;
  }

  showMainMenu() {
    // onGamePause
    // window.CrazyGames.SDK.game.gameplayStop();
    PokiSDK.gameplayStop();
    this.createMainMenu();
  }

  createMainMenu() {
    this.modal = document.createElement("div");
    this.modal.className = "menu-modal";
    this.modal.innerHTML = `
      <div class="menu-content">
        <div class="modal-header">
          <h1>${getLocalizedString("gameTitle")}</h1>
          <button class="modal-close">&times;</button>
        </div>
        
        <div class="menu-body">
          <div class="menu-buttons">
            <button class="menu-btn" id="newGame">${getLocalizedString(
              "newGame"
            )}</button>
            <button class="menu-btn" id="settings">${getLocalizedString(
              "settings"
            )}</button>
            <button class="menu-btn" id="leaderboard">${getLocalizedString(
              "leaderboard"
            )}</button>
            <button class="menu-btn" id="tutorial">${getLocalizedString(
              "help"
            )}</button>
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
    this.modal.querySelector(".modal-close").addEventListener("click", () => {
      this.closeMenu();
    });

    // 새 게임
    this.modal.querySelector("#newGame").addEventListener("click", () => {
      this.game.newGame();
      this.closeMenu();
    });

    // 설정
    this.modal.querySelector("#settings").addEventListener("click", () => {
      if (this.game.settings) {
        this.game.settings.showSettingsModal();
      }
    });

    // 튜토리얼
    this.modal.querySelector("#tutorial").addEventListener("click", () => {
      if (this.game.tutorial) {
        this.game.tutorial.startTutorial();
        this.closeMenu();
      }
    });

    // 리더보드
    const leaderboardButton = this.modal.querySelector("#leaderboard");
    if (leaderboardButton) {
      leaderboardButton.addEventListener("click", () => {
        if (this.game.leaderboard) {
          this.game.leaderboard.showLeaderboard();
        }
      });
    }

    // ESC 키로 닫기
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.closeMenu();
      }
    });
  }

  closeMenu() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
      this.isOpen = false;

      // onGameUnpause
      // window.CrazyGames.SDK.game.gameplayStart();
      PokiSDK.gameplayStart();
    }
  }

  updateButtonLabels() {
    if (!this.isOpen) return;

    this.modal.querySelector("h1").textContent =
      getLocalizedString("gameTitle");
    this.modal.querySelector("#newGame").textContent =
      getLocalizedString("newGame");
    this.modal.querySelector("#settings").textContent =
      getLocalizedString("settings");
    const leaderboardButton = this.modal.querySelector("#leaderboard");
    if (leaderboardButton) {
      leaderboardButton.textContent = getLocalizedString("leaderboard");
    }
    this.modal.querySelector("#tutorial").textContent =
      getLocalizedString("help");
  }
}
