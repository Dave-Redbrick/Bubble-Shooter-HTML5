import { BubbleShooterGame } from "./game.js";
import { UIManager } from "./ui.js";

window.onload = function () {
  const canvas = document.getElementById("viewport");
  const context = canvas.getContext("2d");

  const game = new BubbleShooterGame(canvas, context);
  const ui = new UIManager(game);

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
