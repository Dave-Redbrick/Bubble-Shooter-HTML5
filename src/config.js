// Game configuration and constants
export const CONFIG = {
  CANVAS: {
    WIDTH: 1920,
    HEIGHT: 1080,
  },
  // 디바이스별 레벨 설정 - 캔버스 중앙 배치
  LEVEL_CONFIGS: {
    MOBILE: {
      COLUMNS: 16,
      ROWS: 12,
      TILE_WIDTH: 35,
      TILE_HEIGHT: 35,
      ROW_HEIGHT: 30,
      RADIUS: 17,
    },
    TABLET: {
      COLUMNS: 18,
      ROWS: 13,
      TILE_WIDTH: 38,
      TILE_HEIGHT: 38,
      ROW_HEIGHT: 32,
      RADIUS: 19,
    },
    DESKTOP: {
      COLUMNS: 20,
      ROWS: 14,
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

// 디바이스에 맞는 레벨 설정 가져오기 - 중앙 배치 계산 포함
export function getLevelConfig() {
  const deviceType = getDeviceType();
  const config = CONFIG.LEVEL_CONFIGS[deviceType];

  // 레벨 영역 크기 계산
  const levelWidth = config.COLUMNS * config.TILE_WIDTH + config.TILE_WIDTH / 2;
  const levelHeight =
    (config.ROWS - 1) * config.ROW_HEIGHT + config.TILE_HEIGHT;

  // 캔버스 중앙에 배치
  const x = (CONFIG.CANVAS.WIDTH - levelWidth) / 2;
  const y = 80; // 상단 여백

  return {
    ...config,
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
