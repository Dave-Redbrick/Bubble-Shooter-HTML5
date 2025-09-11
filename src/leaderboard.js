import { ApiClient } from "./api.js";

export class LeaderboardManager {
  constructor(game) {
    this.game = game;
    this.scores = [];
    this.api = new ApiClient();
    this.userId = this.getUserId();
    this.loadScores();
  }

  getUserId() {
    let userId = window.safeStorage.getItem("beadsShooterUserId");
    if (!userId) {
      userId = "user-" + Date.now() + Math.random();
      window.safeStorage.setItem("beadsShooterUserId", userId);
    }
    return userId;
  }

  async loadScores() {
    const apiResult = await this.api.getScores();
    if (apiResult.success) {
      this.scores = apiResult.data;
    } else {
      const saved = window.safeStorage.getItem("beadsShooterLeaderboard");
      if (saved) {
        this.scores = JSON.parse(saved);
      }
    }
  }

  async saveScores() {
    // Save to local as a fallback
    window.safeStorage.setItem(
      "beadsShooterLeaderboard",
      JSON.stringify(this.scores)
    );

    // Save to API
    const userScore = this.scores.find((s) => s.id === this.userId);
    if (userScore) {
      await this.api.addScore(userScore);
    }
  }

  addScore(playerName, score, level) {
    const existing = this.scores.find((s) => s.id === this.userId);

    if (existing) {
      if (score > existing.score) {
        existing.score = score;
        existing.level = level;
        existing.date = new Date().toLocaleDateString();
        existing.name = playerName; // Update name as well
      } else {
        return false;
      }
    } else {
      this.scores.push({
        name: playerName,
        score: score,
        level: level,
        date: new Date().toLocaleDateString(),
        id: this.userId,
      });
    }

    this.scores.sort((a, b) => b.score - a.score);
    this.scores = this.scores.slice(0, 10);
    this.saveScores();
    return true;
  }

  showLeaderboard() {
    const modal = document.createElement("div");
    modal.className = "leaderboard-modal";

    let scoresHTML = "";
    this.scores.forEach((score, index) => {
      const isCurrentUser = score.id === this.userId;
      scoresHTML += `
        <div class="leaderboard-item ${
          index < 3 ? "top-three" : ""
        } ${isCurrentUser ? "current-player" : ""}">
          <div class="rank">${index + 1}</div>
          <div class="player-name">${score.name}</div>
          <div class="player-score">${score.score.toLocaleString()}</div>
          <div class="player-level">Lv.${score.level}</div>
          <div class="player-date">${score.date}</div>
        </div>
      `;
    });

    if (this.scores.length === 0) {
      scoresHTML = '<div class="no-scores">No scores yet.</div>';
    }

    modal.innerHTML = `
      <div class="leaderboard-content">
        <div class="modal-header">
          <h2>🏆 Leaderboard</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="leaderboard-list">
          <div class="leaderboard-header-row">
            <div>Rank</div>
            <div>Player</div>
            <div>Score</div>
            <div>Level</div>
            <div>Date</div>
          </div>
          ${scoresHTML}
        </div>
        <div class="modal-footer">
          <button class="modal-button" id="updateNameBtn">Update Name</button>
          <button class="modal-button modal-button-secondary clear-leaderboard">Clear Scores</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector(".modal-close").addEventListener("click", () => {
      modal.remove();
    });

    modal.querySelector("#updateNameBtn").addEventListener("click", () => {
      const userScore = this.scores.find(s => s.id === this.userId);
      this.promptForName(userScore.score, userScore.level, true);
      modal.remove();
    });

    modal.querySelector(".clear-leaderboard").addEventListener("click", () => {
      if (confirm("Are you sure you want to delete all scores?")) {
        this.scores = [];
        this.saveScores();
        modal.remove();
      }
    });
  }

  promptForName(score, level, isUpdate = false) {
    const modal = document.createElement("div");
    modal.className = "name-input-modal";
    const title = isUpdate ? "Update Your Name" : "New High Score!";
    const userScore = this.scores.find(s => s.id === this.userId);
    const currentName = userScore ? userScore.name : "";

    modal.innerHTML = `
      <div class="name-input-content">
        <h2>${title}</h2>
        <p>Score: ${score.toLocaleString()}</p>
        <p>Level: ${level}</p>
        <input type="text" id="playerName" placeholder="Enter your name" maxlength="10" value="${currentName}">
        <div class="name-input-buttons">
          <button id="submitScore" class="modal-button modal-button-primary">Submit</button>
          <button id="skipScore" class="modal-button modal-button-secondary">Skip</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const nameInput = modal.querySelector("#playerName");
    nameInput.focus();

    const submitScore = () => {
      const name = nameInput.value.trim() || "Anonymous";
      this.addScore(name, score, level);
      modal.remove();
      this.showLeaderboard();
    };

    modal.querySelector("#submitScore").addEventListener("click", submitScore);
    modal.querySelector("#skipScore").addEventListener("click", () => {
      modal.remove();
      this.showLeaderboard();
    });

    nameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        submitScore();
      }
    });
  }

  checkNewRecord(score, level) {
    const userScore = this.scores.find((s) => s.id === this.userId);
    const isHighScore =
      this.scores.length < 10 || score > this.scores[this.scores.length - 1].score;

    if (isHighScore && (!userScore || score > userScore.score)) {
      this.promptForName(score, level);
      return true;
    }
    return false;
  }
}
