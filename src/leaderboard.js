// leaderboard system(removed)
export class LeaderboardManager {
  constructor(game) {
    this.game = game;
    this.scores = [];
    this.loadScores();
  }

  loadScores() {
    const saved = window.safeStorage.getItem("beadsShooterLeaderboard");
    if (saved) {
      this.scores = JSON.parse(saved);
    }
  }

  saveScores() {
    window.safeStorage.setItem(
      "beadsShooterLeaderboard",
      JSON.stringify(this.scores)
    );
  }

  addScore(playerName, score, level) {
    const existing = this.scores.find((s) => s.name === playerName);

    if (existing) {
      // 기존 플레이어: 더 높은 점수일 때만 갱신
      if (score > existing.score) {
        existing.score = score;
        existing.level = level;
        existing.date = new Date().toLocaleDateString();
      } else {
        return false; // 낮은 점수는 무시
      }
    } else {
      // 새 플레이어: 점수 추가
      this.scores.push({
        name: playerName,
        score: score,
        level: level,
        date: new Date().toLocaleDateString(),
        id: Date.now(),
      });
    }

    // 정렬 및 상위 10개 유지 후 저장
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
      scoresHTML += `
        <div class="leaderboard-item ${index < 3 ? "top-three" : ""}">
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
          <button class="modal-button modal-button-secondary clear-leaderboard">Clear Scores</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 이벤트 리스너
    modal.querySelector(".modal-close").addEventListener("click", () => {
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

  promptForName(score, level) {
    const modal = document.createElement("div");
    modal.className = "name-input-modal";
    modal.innerHTML = `
      <div class="name-input-content">
        <h2>New High Score!</h2>
        <p>Score: ${score.toLocaleString()}</p>
        <p>Level: ${level}</p>
        <input type="text" id="playerName" placeholder="Enter your name" maxlength="10">
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
    });

    nameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        submitScore();
      }
    });
  }

  checkNewRecord(score, level) {
    if (
      this.scores.length < 10 ||
      score > this.scores[this.scores.length - 1].score
    ) {
      // this.promptForName(score, level);
      // const name = this.game.user ? this.game.user.username : "Anonymous";
      // this.addScore(name, score, level) && this.showLeaderboard();
      return true;
    }
    return false;
  }
}
