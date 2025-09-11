const API_BASE_URL = "/api/leaderboard"; // This will be the base path for the API.
const GAME_ID = "bead-shooter"; // This should be replaced with the actual game ID from Poki.

export class ApiClient {
  constructor() {
    this.gameId = GAME_ID;
  }

  async getScores() {
    if (!this.gameId) {
      return { success: false, message: "Game ID not set" };
    }
    try {
      const response = await fetch(`${API_BASE_URL}?gameId=${this.gameId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Failed to get scores:", error);
      return { success: false, message: error.message };
    }
  }

  async addScore(scoreData) {
    if (!this.gameId) {
      return { success: false, message: "Game ID not set" };
    }
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...scoreData, gameId: this.gameId }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Failed to add score:", error);
      return { success: false, message: error.message };
    }
  }

  async updateScore(userId, scoreData) {
    if (!this.gameId) {
      return { success: false, message: "Game ID not set" };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...scoreData, gameId: this.gameId }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Failed to update score:", error);
      return { success: false, message: error.message };
    }
  }
}
