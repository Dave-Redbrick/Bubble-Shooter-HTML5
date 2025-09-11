// Game configuration and constants
export const CONFIG = {
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

// 화면 비율에 따라 레벨 설정을 동적으로 가져옵니다.
export function getLevelConfig(canvas) {
  const aspectRatio = canvas.width / canvas.height;

  // 화면 비율에 따라 열(Column) 수를 결정합니다.
  // 세로가 길면(portrait) 11열로 줄여 버블 크기를 키움, 가로가 길면(landscape) 22열
  const columns = aspectRatio < 1 ? 11 : 22;
  const baseRows = 12; // 초기 최소 행 수

  // 모든 계산은 캔버스 너비를 기준으로 합니다. 이렇게 하면 항상 수평으로 맞습니다.
  const levelWidth = canvas.width;
  const x = 0;
  const tileWidth = levelWidth / (columns + 0.5);
  const tileHeight = tileWidth;
  const rowHeight = tileHeight * 0.866; // 6각형 그리드의 행 높이
  const radius = tileWidth / 2;

  const topMargin = 0;
  // 화면 비율에 따라 데드라인 위치를 조정합니다. (데스크톱 데드라인 수정)
  const deadlineY = canvas.height * 0.8;
  const availableHeight = deadlineY - topMargin;

  // 사용 가능한 높이에 따라 실제 행 수를 계산합니다.
  const calculatedRows = Math.floor(availableHeight / rowHeight);
  const rows = Math.max(baseRows, calculatedRows) + 1;
  const levelHeight = (rows - 1) * rowHeight + tileHeight;
  const y = topMargin;

  return {
    COLUMNS: columns,
    ROWS: rows,
    TILE_WIDTH: tileWidth,
    TILE_HEIGHT: tileHeight,
    ROW_HEIGHT: rowHeight,
    RADIUS: radius,
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
