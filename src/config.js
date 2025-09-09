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

  // 캔버스 높이에 따라 타일 크기 동적 계산
  const PREFERRED_ROWS = 18; // 이 값을 기준으로 버블 크기 결정
  const topMargin = 0; // 버블 그리드 상단 여백
  const deadlineY = canvas.height * 0.70;
  const availableHeight = deadlineY - topMargin;

  const rowHeight = availableHeight / PREFERRED_ROWS;
  const tileHeight = rowHeight / 0.866;
  const tileWidth = tileHeight;
  const radius = tileWidth / 2;

  const dynamicConfig = {
    ...baseConfig,
    TILE_WIDTH: tileWidth,
    TILE_HEIGHT: tileHeight,
    ROW_HEIGHT: rowHeight,
    RADIUS: radius,
  };

  // 사용 가능한 세로 공간을 기반으로 행(row) 수를 동적으로 계산
  const calculatedRows = Math.floor(availableHeight / dynamicConfig.ROW_HEIGHT);
  // 최소 행 수를 보장하면서, 계산된 행 수가 더 크면 그 값을 사용
  const rows = Math.max(dynamicConfig.ROWS, calculatedRows);

  // 새로운 행 수에 따라 레벨 영역 크기 다시 계산
  const levelWidth =
    dynamicConfig.COLUMNS * dynamicConfig.TILE_WIDTH +
    dynamicConfig.TILE_WIDTH / 2;
  const levelHeight =
    (rows - 1) * dynamicConfig.ROW_HEIGHT + dynamicConfig.TILE_HEIGHT;

  // 실제 캔버스 너비를 사용하여 중앙에 배치
  const x = (canvas.width - levelWidth) / 2;
  const y = topMargin;

  return {
    ...dynamicConfig,
    ROWS: rows, // 동적으로 계산된 행 수로 덮어쓰기
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