import { ApiClient } from "./api.js";
import { getLocalizedString } from "./localization.js";

export class LeaderboardManager {
  constructor(game) {
    this.game = game;
    this.scores = [];
    this.api = new ApiClient();
    this.userIdentity = this.getUserIdentity(); // { id, secret }
  }

  async initialize() {
    if (!window.isLeaderboardEnabled) return;

    if (this.userIdentity) {
      // Fetch user's latest score
      const result = await this.api.getUserData(this.userIdentity.id);
      if (result.success) {
        const userScore = result.data.values.score || 0;
        this.game.highScore = Math.max(this.game.highScore, userScore);
      }
    } else {
      // Create a new user
      const result = await this.api.createUserData({ values: { name: "Anonymous", score: 0, level: 0 }, data: {} });
      if (result.success && result.data.id && result.data.secret) {
        this.setUserIdentity(result.data);
      }
    }
    await this.loadScores();
  }

  getUserIdentity() {
    const identity = window.safeStorage.getItem("beadsShooterUserIdentity");
    if (identity) {
      return JSON.parse(identity);
    }
    return null;
  }

  setUserIdentity(identity) {
    this.userIdentity = identity;
    window.safeStorage.setItem(
      "beadsShooterUserIdentity",
      JSON.stringify(identity)
    );
  }

  async loadScores() {
    const apiResult = await this.api.getUserDataList();
    if (apiResult.success && Array.isArray(apiResult.data)) {
      this.scores = apiResult.data.map(item => ({
        id: item.id,
        name: item.values.name || 'Anonymous',
        score: item.values.score || 0,
        level: item.values.level || 1,
        date: new Date(item.updatedAt).toLocaleDateString(),
      }));
      this.scores.sort((a, b) => b.score - a.score);
    } else {
      const saved = window.safeStorage.getItem("beadsShooterLeaderboard");
      if (saved) {
        this.scores = JSON.parse(saved);
      }
    }
  }

  async submitScore(playerName, score, level) {
    const playerData = {
      values: {
        name: playerName,
        score: score,
        level: level,
      },
      data: {}, // Not used for now
    };

    if (this.userIdentity) {
      // Update existing score
      const result = await this.api.updateUserData(
        this.userIdentity.id,
        this.userIdentity.secret,
        playerData
      );
      if (!result.success) {
        // Handle API error if needed
        console.error("Failed to update score");
      }
    } else {
      // Create new score
      const result = await this.api.createUserData(playerData);
      if (result.success && result.data.id && result.data.secret) {
        this.setUserIdentity(result.data);
      } else {
        console.error("Failed to create score");
      }
    }

    // Refresh scores from server
    await this.loadScores();
  }


  showLeaderboard() {
    const modal = document.createElement("div");
    modal.className = "leaderboard-modal";

    let scoresHTML = "";
    this.scores.forEach((score, index) => {
      const isCurrentUser = this.userIdentity && score.id === this.userIdentity.id;
      scoresHTML += `
        <div class="leaderboard-item ${
          index < 3 ? "top-three" : ""
        } ${isCurrentUser ? "current-player" : ""}">
          <div class="rank">${index + 1}</div>
          <div class="player-name">${score.name} ${
            isCurrentUser
              ? `<span class="edit-name-icon" data-score="${score.score}" data-level="${score.level}">✏️</span>`
              : ""
          }</div>
          <div class="player-score">${score.score.toLocaleString()}</div>
          <div class="player-level">Lv.${score.level}</div>
          <div class="player-date">${score.date}</div>
        </div>
      `;
    });

    if (this.scores.length === 0) {
      scoresHTML = `<div class="no-scores">${getLocalizedString("leaderboardNoScores")}</div>`;
    }

    modal.innerHTML = `
      <div class="leaderboard-content">
        <div class="modal-header">
          <h2>🏆 ${getLocalizedString("leaderboard")}</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="leaderboard-list">
          <div class="leaderboard-header-row">
            <div>${getLocalizedString("leaderboardRank")}</div>
            <div>${getLocalizedString("leaderboardPlayer")}</div>
            <div>${getLocalizedString("leaderboardScore")}</div>
            <div>${getLocalizedString("leaderboardLevel")}</div>
            <div>${getLocalizedString("leaderboardDate")}</div>
          </div>
          ${scoresHTML}
        </div>
        <div class="modal-footer">
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".modal-close").addEventListener("click", () => {
      modal.remove();
    });

    const editIcon = modal.querySelector(".edit-name-icon");
    if (editIcon) {
      editIcon.addEventListener("click", (e) => {
        const score = parseInt(e.currentTarget.dataset.score, 10);
        const level = parseInt(e.currentTarget.dataset.level, 10);
        this.promptForName(score, level, true);
        modal.remove();
      });
    }
  }

  promptForName(score, level, isUpdate = false) {
    const modal = document.createElement("div");
    modal.className = "name-input-modal";
    const title = isUpdate ? getLocalizedString("leaderboardUpdateNamePrompt") : getLocalizedString("leaderboardNewHighPrompt");
    const userScore = this.userIdentity ? this.scores.find(s => s.id === this.userIdentity.id) : null;
    const currentName = userScore ? userScore.name : "";

    modal.innerHTML = `
      <div class="name-input-content">
        <h2>${title}</h2>
        <p>${getLocalizedString("leaderboardScore")}: ${score.toLocaleString()}</p>
        <p>${getLocalizedString("leaderboardLevel")}: ${level}</p>
        <input type="text" id="playerName" placeholder="${getLocalizedString("leaderboardPlayer")}" maxlength="10" value="${currentName}">
        <div class="name-input-buttons">
          <button id="submitScoreBtn" class="modal-button modal-button-primary">${getLocalizedString("leaderboardSubmit")}</button>
          <button id="skipScoreBtn" class="modal-button modal-button-secondary">${getLocalizedString("leaderboardSkip")}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const nameInput = modal.querySelector("#playerName");
    nameInput.focus();

    const handleScoreSubmit = async () => {
      const name = nameInput.value.trim() || "Anonymous";
      modal.remove();
      await this.submitScore(name, score, level);
      this.showLeaderboard();
    };

    modal.querySelector("#submitScoreBtn").addEventListener("click", handleScoreSubmit);
    modal.querySelector("#skipScoreBtn").addEventListener("click", () => {
      modal.remove();
      this.showLeaderboard();
    });

    nameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleScoreSubmit();
      }
    });
  }

  handleGameOver(score, level) {
    const userScoreEntry = this.userIdentity ? this.scores.find(s => s.id === this.userIdentity.id) : null;
    const userHighScore = userScoreEntry ? userScoreEntry.score : 0;

    if (score > userHighScore) {
      this.promptForName(score, level);
    } else {
      this.showLeaderboard();
    }
  }
}
