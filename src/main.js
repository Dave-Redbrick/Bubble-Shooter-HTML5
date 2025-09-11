import { BubbleShooterGame } from "./game.js";
import { UIManager } from "./ui.js";
import { ApiClient } from "./api.js";

// for localStorage Incognito Support
(function () {
  window.safeStorage = {
    getItem(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn("localStorage unavailable, using fallback:", e);
        return null;
      }
    },
    setItem(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.warn("localStorage unavailable, skipping setItem:", e);
      }
    },
    removeItem(key) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.warn("localStorage unavailable, skipping removeItem:", e);
      }
    },
  };
})();

async function checkApiAvailability() {
  const api = new ApiClient();
  const result = await api.getUserDataList(); // This already handles the base URL and endpoint
  return result.success;
}

async function isIncognito() {
  try {
    const { quota } = await navigator.storage.estimate();
    // A common heuristic: if quota is less than 120MB, it's likely incognito.
    return quota < 120 * 1024 * 1024;
  } catch (e) {
    // If the API is not supported or fails, assume not incognito but log it.
    console.warn("Could not determine incognito mode, assuming not.", e);
    return false;
  }
}

window.onload = async function () {
  // for loading
  const loading = document.getElementById("rb-loading");
  // trigger loading start event
  const user = null;

  // Leaderboard availability check
  const apiAvailable = await checkApiAvailability();
  const incognito = await isIncognito();
  window.isLeaderboardEnabled = apiAvailable && !incognito;

  await PokiSDK.init();
  // loading done
  loading.style.display = "none";
  // trigger loading stop event
  PokiSDK.gameLoadingFinished();

  const canvas = document.getElementById("viewport");
  const context = canvas.getContext("2d");

  const game = new BubbleShooterGame(canvas, context, user);
  const ui = new UIManager(game);

  // set adblock detection
  // try {
  //   const result = await window.CrazyGames.SDK.ad.hasAdblock();
  //   console.log("Adblock usage fetched", result);
  //   if (result) {
  //     ui.setAdblockDetected();
  //   }
  // } catch (e) {
  //   console.error("Error checking for adblock:", e);
  // }

  // UI 매니저를 게임에 연결
  game.ui = ui;

  // 모바일 터치 이벤트 설정
  ui.setupMobileEvents();

  // 반응형 처리
  function handleResize() {
    ui.resizeCanvas();
  }

  window.addEventListener("resize", handleResize);
  window.addEventListener("orientationchange", () => {
    setTimeout(handleResize, 100); // 방향 변경 후 약간의 지연
  });

  handleResize(); // 초기 크기 설정

  game.start();
};
