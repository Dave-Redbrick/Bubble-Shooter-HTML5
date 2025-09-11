const API_BASE_URL = "https://auds.poki.io/v0/";
const GAME_ID = "use-your-poki-game-id"; // This should be replaced with the actual game ID from Poki.
const ENDPOINT = "userdata/tests";

export class ApiClient {
  constructor() {
    this.gameId = GAME_ID;
    this.apiUrl = `${API_BASE_URL}${this.gameId}/${ENDPOINT}`;
  }

  async getUserDataList() {
    if (!this.gameId) {
      return { success: false, message: "Game ID not set" };
    }
    try {
      const response = await fetch(`${this.apiUrl}?sort=-score`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Failed to get user data list:", error);
      return { success: false, message: error.message };
    }
  }

  async getUserData(id) {
    if (!this.gameId) {
      return { success: false, message: "Game ID not set" };
    }
    try {
      const response = await fetch(`${this.apiUrl}/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Failed to get user data:", error);
      return { success: false, message: error.message };
    }
  }

  async createUserData(playerData) {
    if (!this.gameId) {
      return { success: false, message: "Game ID not set" };
    }
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(playerData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Failed to create user data:", error);
      return { success: false, message: error.message };
    }
  }

  async updateUserData(id, secret, playerData) {
    if (!this.gameId) {
      return { success: false, message: "Game ID not set" };
    }
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "POST", // The user's curl example uses POST for updates
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...playerData, secret }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Failed to update user data:", error);
      return { success: false, message: error.message };
    }
  }
}
