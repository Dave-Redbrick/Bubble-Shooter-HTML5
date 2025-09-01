// Game configuration and constants
export const CONFIG = {
  CANVAS: {
    WIDTH: 800, // 대표적인 세로 모드 너비
    HEIGHT: 1200, // 대표적인 세로 모드 높이
  },
  // 디바이스별 레벨 설정
  LEVEL_CONFIGS: {
    MOBILE: {
      COLUMNS: 16,
      TILE_WIDTH: 35,
      TILE_HEIGHT: 35,
      ROW_HEIGHT: 30,
      RADIUS: 17,
    },
    TABLET: {
      COLUMNS: 18,
      TILE_WIDTH: 38,
      TILE_HEIGHT: 38,
      ROW_HEIGHT: 32,
      RADIUS: 19,
    },
    DESKTOP: {
      COLUMNS: 20,
      TILE_WIDTH: 40,
      TILE_HEIGHT: 40,
      ROW_HEIGHT: 34,
      RADIUS: 20,
    },
  },
  BUBBLE: {
    COLORS: 7,
    SPEED: 1000,
    DROP_SPEED: 900,
  },
  GAME_STATES: {
    INIT: 0,
    READY: 1,
    SHOOT_BUBBLE: 2,
    REMOVE_CLUSTER: 3,
    GAME_OVER: 4,
  },
  PARTICLES: {
    COUNT: 12,
    SPEED: 300,
    LIFE: 1.2,
    SIZE: 6,
    GRAVITY: 400,
  },
};

// 현재 디바이스 타입 감지
export function getDeviceType() {
  const width = window.innerWidth;
  if (width < 768) return "MOBILE";
  if (width < 1200) return "TABLET";
  return "DESKTOP";
}

// 디바이스에 맞는 레벨 설정 가져오기
export function getLevelConfig(canvas) {
  const deviceType = getDeviceType();
  const config = CONFIG.LEVEL_CONFIGS[deviceType];

  // 캔버스 높이에 따라 동적으로 행 수 계산
  // 플레이어와 상단 여백을 고려하여 가용 높이 계산
  const availableHeight = canvas.height * 0.8 - 150;
  const rows = Math.floor(availableHeight / config.ROW_HEIGHT);

  const levelWidth = config.COLUMNS * config.TILE_WIDTH + config.TILE_WIDTH / 2;
  const levelHeight = (rows - 1) * config.ROW_HEIGHT + config.TILE_HEIGHT;

  // 캔버스 중앙에 배치
  const x = (canvas.width - levelWidth) / 2;
  const y = 20; // 상단 여백 최소화

  return {
    ...config,
    ROWS: rows, // 계산된 행 수 추가
    X: x,
    Y: y,
    WIDTH: levelWidth,
    HEIGHT: levelHeight,
  };
}

export const BUBBLE_COLORS = [
  "#FF3B30", // 선명한 빨강 (Red)
  "#FF9500", // 강렬한 주황 (Orange)
  "#FFCC00", // 밝은 노랑 (Yellow)
  "#34C759", // 선명한 청록 (Teal)
  "#AF52DE", // 진한 보라 (Purple)
  "#007AFF", // 선명한 파랑 (Blue)
  "#00DDDD", // 아쿠아 (Aqua)
];

// Neighbor offset table for hexagonal grid
export const NEIGHBOR_OFFSETS = [
  [
    [1, 0],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
  ], // Even row tiles
  [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 0],
    [0, -1],
    [1, -1],
  ], // Odd row tiles
];
