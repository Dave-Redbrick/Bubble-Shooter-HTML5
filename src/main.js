import { BubbleShooterGame } from "./game.js";
import { UIManager } from "./ui.js";

// for CrazyGames local testing
(function ensureUseLocalSdk() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("useLocalSdk")) {
    url.searchParams.set("useLocalSdk", "true");
    window.location.replace(url.toString());
  }
})();

async function init() {
  try {
    const user = await window.CrazyGames.SDK.user.getUser();
    return user;
  } catch (e) {
    console.log("Get user error: ", e);
  }
}

window.onload = async function () {
  const loading = document.getElementById("rb-loading");

  await window.CrazyGames.SDK.init();
  window.CrazyGames.SDK.game.loadingStart();
  const user = await init();
  loading.style.display = "none";
  window.CrazyGames.SDK.game.loadingStop();

  const canvas = document.getElementById("viewport");
  const context = canvas.getContext("2d");

  const game = new BubbleShooterGame(canvas, context, user);
  const ui = new UIManager(game);

  try {
    const result = await window.CrazyGames.SDK.ad.hasAdblock();
    console.log("Adblock usage fetched", result);
    if (result) {
      ui.setAdblockDetected();
    }
  } catch (e) {
    console.error("Error checking for adblock:", e);
  }

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
