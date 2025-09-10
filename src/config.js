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
    },
    TABLET: {
      COLUMNS: 18,
      ROWS: 13,
    },
    DESKTOP: {
      COLUMNS: 20,
      ROWS: 14,
    },
  },
  BUBBLE: {
    COLORS: 7,
    SPEED: 2000,
    DROP_SPEED: 1800,
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
  const baseConfig = CONFIG.LEVEL_CONFIGS[deviceType];

  // Force the level width to match the canvas width
  const levelWidth = canvas.width;
  const x = 0;

  // Derive tile and row dimensions from the fixed width
  const tileWidth = levelWidth / (baseConfig.COLUMNS + 0.5);
  const tileHeight = tileWidth; // Keep bubbles circular
  const rowHeight = tileHeight * 0.866;
  const radius = tileWidth / 2;

  // Set the top margin and calculate available height for rows
  const topMargin = 0;
  const deadlineY = canvas.height * 0.72;
  const availableHeight = deadlineY - topMargin;

  const dynamicConfig = {
    ...baseConfig,
    TILE_WIDTH: tileWidth,
    TILE_HEIGHT: tileHeight,
    ROW_HEIGHT: rowHeight,
    RADIUS: radius,
  };

  // Dynamically calculate the number of rows based on the available height
  const calculatedRows = Math.floor(availableHeight / dynamicConfig.ROW_HEIGHT);
  const rows = Math.max(baseConfig.ROWS, calculatedRows);

  const levelHeight = (rows - 1) * dynamicConfig.ROW_HEIGHT + dynamicConfig.TILE_HEIGHT;
  const y = topMargin;

  return {
    ...dynamicConfig,
    ROWS: rows,
    X: x,
    Y: y,
    WIDTH: levelWidth,
    HEIGHT: levelHeight,
    deadlineY: deadlineY,
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
