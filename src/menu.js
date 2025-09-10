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
    this.game.sound.setMuted(true);
    this.createMainMenu();
  }

  createMainMenu() {
    this.modal = document.createElement("div");
    this.modal.className = "menu-modal";
    this.modal.innerHTML = `
      <div class="menu-content">
        <div class="modal-header">
          <h1>Beads Shooter</h1>
          <button class="modal-close">&times;</button>
        </div>
        
        <div class="menu-body">
          <div class="menu-buttons">
            <button class="menu-btn" id="newGame">New Game</button>
            <button class="menu-btn" id="settings">Settings</button>
            <!-- <button class="menu-btn" id="leaderboard">Leaderboard</button> -->
            <button class="menu-btn" id="tutorial">Tutorial</button>
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
    this.modal.querySelector("#leaderboard").addEventListener("click", () => {
      if (this.game.leaderboard) {
        this.game.leaderboard.showLeaderboard();
      }
    });

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
      this.game.sound.setMuted(false);
    }
  }
}
