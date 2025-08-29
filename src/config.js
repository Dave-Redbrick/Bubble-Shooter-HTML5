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
export function getLevelConfig(canvas) {
  const deviceType = getDeviceType();
  const config = CONFIG.LEVEL_CONFIGS[deviceType];

  // 사용 가능한 세로 공간을 기반으로 행(row) 수를 동적으로 계산
  const topMargin = 0; // 버블 그리드 상단 여백
  const bottomMargin = 250; // 발사대 및 하단 UI를 위한 공간
  const availableHeight = canvas.height - topMargin - bottomMargin;
  const calculatedRows = Math.floor(availableHeight / config.ROW_HEIGHT);
  // 최소 행 수를 보장하면서, 계산된 행 수가 더 크면 그 값을 사용
  const rows = Math.max(config.ROWS, calculatedRows);

  // 새로운 행 수에 따라 레벨 영역 크기 다시 계산
  const levelWidth = config.COLUMNS * config.TILE_WIDTH + config.TILE_WIDTH / 2;
  const levelHeight = (rows - 1) * config.ROW_HEIGHT + config.TILE_HEIGHT;

  // 실제 캔버스 너비를 사용하여 중앙에 배치
  const x = (canvas.width - levelWidth) / 2;
  const y = topMargin;

  return {
    ...config,
    ROWS: rows, // 동적으로 계산된 행 수로 덮어쓰기
    X: x,
    Y: y,
    WIDTH: levelWidth,
    HEIGHT: levelHeight,
  };
}

export const BUBBLE_COLORS = [
  "#FF1744", // Vivid Red
  "#FF9100", // Vivid Orange
  "#FFD600", // Vivid Yellow
  "#00E676", // Vivid Green
  "#D500F9", // Vivid Purple
  "#2979FF", // Vivid Blue
  "#00E5FF", // Vivid Cyan
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
