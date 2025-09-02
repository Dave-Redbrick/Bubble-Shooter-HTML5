import {
  CONFIG,
  BUBBLE_COLORS,
  NEIGHBOR_OFFSETS,
  getLevelConfig,
} from "./config.js";
import { getLocalizedString } from "./localization.js";
import { PhysicsEngine } from "./physics.js";
import { Renderer } from "./renderer.js";
import { InputHandler } from "./input.js";
import { ClusterManager } from "./cluster.js";
import { ParticleSystem } from "./particles.js";
import { LevelManager } from "./levels.js";
import { PowerUpManager } from "./powerups.js";
import { AchievementManager } from "./achievements.js";
import { EffectsManager } from "./effects.js";
import { SoundManager } from "./sound.js";
import { ComboManager } from "./combo.js";
import { TutorialManager } from "./tutorial.js";
import { SettingsManager } from "./settings.js";
import { StatisticsManager } from "./statistics.js";
import { MenuManager } from "./menu.js";
import { LeaderboardManager } from "./leaderboard.js";
import { DailyChallengeManager } from "./dailychallenge.js";

export class Tile {
  constructor(x, y, type, shift = 0) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.removed = false;
    this.shift = shift;
    this.velocity = 0;
    this.alpha = 1;
    this.processed = false;
    this.popTime = 0;
    this.popTriggered = false;
    this.popAnimationTime = 0;
    this.isPopping = false;
    this.popScale = 1;
  }
}

export class BubbleShooterGame {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.context = context;
    this.initialized = false;
    this.ui = null;

    // Timing
    this.lastFrame = 0;
    this.fpsTime = 0;
    this.frameCount = 0;
    this.fps = 0;

    // Game state
    this.gameState = CONFIG.GAME_STATES.INIT;
    this.previousGameState = null;
    this.score = 0;
    this.highScore = parseInt(
      localStorage.getItem("bubbleShooterHighScore") || "0"
    );
    this.currentLevel = 1;
    this.rowOffset = 0;
    this.chancesUntilNewRow = 5;
    this.shotsWithoutPop = 0;
    this.maxChances = 5;

    // Animation
    this.animationState = 0;
    this.animationTime = 0;

    // Clusters
    this.showCluster = false;
    this.cluster = [];
    this.floatingClusters = [];
    this.hitPosition = { x: 0, y: 0 };

    // 새로운 게임 기능들
    this.wallBounceCount = 0;
    this.comboCount = 0;
    this.precisionAimActive = false;
    this.slowMotionActive = false;

    // Items
    this.items = {
      aimGuide: {
        available: 3,
        active: false,
        duration: 10000,
        startTime: 0,
      },
      bombBubble: {
        available: 3,
      },
    };

    this.initializeLevel();
    this.initializePlayer();
    this.initializeModules();
  }

  initializeLevel() {
    // 실제 캔버스 정보를 전달하여 레벨 설정을 가져옴
    const levelConfig = getLevelConfig(this.canvas);

    this.levelData = {
      x: levelConfig.X,
      y: levelConfig.Y,
      width: levelConfig.WIDTH,
      height: levelConfig.HEIGHT,
      columns: levelConfig.COLUMNS,
      rows: levelConfig.ROWS,
      tileWidth: levelConfig.TILE_WIDTH,
      tileHeight: levelConfig.TILE_HEIGHT,
      rowHeight: levelConfig.ROW_HEIGHT,
      radius: levelConfig.RADIUS,
      tiles: [],
    };

    for (let i = 0; i < this.levelData.columns; i++) {
      this.levelData.tiles[i] = [];
      for (let j = 0; j < this.levelData.rows; j++) {
        this.levelData.tiles[i][j] = new Tile(i, j, -1, 0);
      }
    }
  }

  initializePlayer() {
    this.player = {
      x:
        this.levelData.x +
        this.levelData.width / 2 -
        this.levelData.tileWidth / 2,
      // 캔버스 하단 기준으로 발사대 위치 조정
      y: this.canvas.height - 150,
      angle: 90,
      tileType: 0,
      isBomb: false,
      multiShotActive: false,
      bubble: {
        x: 0,
        y: 0,
        angle: 0,
        speed: CONFIG.BUBBLE.SPEED,
        dropSpeed: CONFIG.BUBBLE.DROP_SPEED,
        tileType: 0,
        visible: false,
        isBomb: false,
      },
      nextBubble: {
        x: 0,
        y: 0,
        tileType: 0,
        isBomb: false,
      },
    };

    this.player.nextBubble.x = this.player.x - 2 * this.levelData.tileWidth;
    this.player.nextBubble.y = this.player.y;
  }

  async initializeModules() {
    // 사운드 시스템 초기화
    this.sound = new SoundManager();
    this.physics = new PhysicsEngine(this);
    this.renderer = new Renderer(this);
    this.input = new InputHandler(this, this.sound);
    this.clusterManager = new ClusterManager(this);
    this.particles = new ParticleSystem(this);
    this.levelManager = new LevelManager(this);
    this.powerUps = new PowerUpManager(this);
    this.achievements = new AchievementManager(this);
    this.effects = new EffectsManager(this);
    this.combo = new ComboManager(this);
    this.tutorial = new TutorialManager(this);
    this.settings = new SettingsManager(this);
    this.statistics = new StatisticsManager(this);
    this.menu = new MenuManager(this);
    this.leaderboard = new LeaderboardManager(this);
    this.dailyChallenge = new DailyChallengeManager(this);
    
    await this.sound.initialize();

    this.canvas.addEventListener("mousemove", (e) => this.input.onMouseMove(e));
    this.canvas.addEventListener("mousedown", (e) => this.input.onMouseDown(e));
    
    // 사운드 활성화를 위한 첫 클릭 이벤트
    this.canvas.addEventListener("click", () => {
      if (this.sound.audioContext && this.sound.audioContext.state === 'suspended') {
        this.sound.audioContext.resume();
      }
    }, { once: true });

    // 키보드 이벤트 추가
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleKeyDown(e) {
    switch (e.key) {
      case 'Escape':
        if (this.gameState === CONFIG.GAME_STATES.READY) {
          this.menu.showMainMenu();
        }
        break;
      case '1':
        this.useItem('aim');
        break;
      case '2':
        this.useItem('bomb');
        break;
      case 'r':
      case 'R':
        if (this.gameState === CONFIG.GAME_STATES.GAME_OVER) {
          this.newGame();
        }
        break;
      case 'p':
      case 'P':
        this.togglePause();
        break;
    }
  }

  togglePause() {
    if (this.gameState === CONFIG.GAME_STATES.READY) {
      this.gameState = CONFIG.GAME_STATES.PAUSED;
    } else if (this.gameState === CONFIG.GAME_STATES.PAUSED) {
      this.gameState = CONFIG.GAME_STATES.READY;
    }
  }

  resumeGame() {
    if (this.previousGameState) {
      this.setGameState(this.previousGameState);
      this.previousGameState = null;
    }
  }

  handleResize() {
    const oldLevelData = { ...this.levelData };
    this.initializeLevel();

    const minColumns = Math.min(oldLevelData.columns, this.levelData.columns);
    const minRows = Math.min(oldLevelData.rows, this.levelData.rows);

    for (let i = 0; i < minColumns; i++) {
      for (let j = 0; j < minRows; j++) {
        if (oldLevelData.tiles[i] && oldLevelData.tiles[i][j]) {
          this.levelData.tiles[i][j].type = oldLevelData.tiles[i][j].type;
          this.levelData.tiles[i][j].removed = oldLevelData.tiles[i][j].removed;
          this.levelData.tiles[i][j].alpha = oldLevelData.tiles[i][j].alpha;
        }
      }
    }

    this.player.x =
      this.levelData.x +
      this.levelData.width / 2 -
      this.levelData.tileWidth / 2;
    this.player.y = this.canvas.height - 150;
    this.player.nextBubble.x = this.player.x - 2 * this.levelData.tileWidth;
    this.player.nextBubble.y = this.player.y;
  }

  start() {
    this.newGame();
    this.initialized = true;
    this.main(0);

  }

  main(tFrame) {
    window.requestAnimationFrame((t) => this.main(t));

    if (!this.initialized) return;

    this.update(tFrame);
    this.renderer.render();
  }

  update(tFrame) {
    let dt = (tFrame - this.lastFrame) / 1000;
    this.lastFrame = tFrame;

    // 일시정지 상태에서는 업데이트 중단
    if (this.gameState === CONFIG.GAME_STATES.PAUSED) return;

    // 시간 스케일 적용 (슬로우 모션 등)
    dt *= this.effects.getTimeScale();

    this.updateFps(dt);
    this.particles.update(dt);
    this.updateItems(tFrame);
    this.powerUps.update(tFrame);
    this.effects.update(dt);
    this.combo.update(dt);

    switch (this.gameState) {
      case CONFIG.GAME_STATES.READY:
        break;
      case CONFIG.GAME_STATES.SHOOT_BUBBLE:
        this.physics.stateShootBubble(dt);
        break;
      case CONFIG.GAME_STATES.REMOVE_CLUSTER:
        this.clusterManager.stateRemoveCluster(dt);
        break;
    }
  }

  updateItems(currentTime) {
    if (this.items.aimGuide.active) {
      const elapsed = currentTime - this.items.aimGuide.startTime;
      this.items.aimGuide.remaining = this.items.aimGuide.duration - elapsed;

      if (elapsed >= this.items.aimGuide.duration) {
        this.items.aimGuide.active = false;
        delete this.items.aimGuide.remaining;
      }
      // 아이템이 활성화된 동안 매 프레임 UI를 업데이트하여 타이머를 표시
      this.updateUI();
    }
  }

  useItem(itemName) {
    if (itemName === 'aim') {
      this.useAimGuide();
    } else if (itemName === 'bomb') {
      this.useBombBubble();
    }
  }

  useAimGuide() {
    if (this.items.aimGuide.available > 0 && !this.items.aimGuide.active) {
      this.items.aimGuide.available--;
      this.items.aimGuide.active = true;
      this.items.aimGuide.startTime = performance.now();
      this.statistics.recordItemUse('aimGuide');
      this.updateUI();
    }
  }

  useBombBubble() {
    if (this.items.bombBubble.available <= 0) return;

    // Prevent using if the current bubble is already a bomb
    if (this.player.isBomb) {
        return;
    }

    this.items.bombBubble.available--;

    // Always change the current bubble
    this.player.isBomb = true;

    this.statistics.recordItemUse('bombBubble');
    this.updateUI();
  }

  onItemButtonClick(itemName) {
    if (this.gameState === CONFIG.GAME_STATES.PAUSED) return; // Do not allow using items while already paused

    this.previousGameState = this.gameState;
    this.setGameState(CONFIG.GAME_STATES.PAUSED);

    const itemInfo = {
      aim: {
        title: getLocalizedString("itemAimTitle"),
        description: getLocalizedString("itemAimDescription")
      },
      bomb: {
        title: getLocalizedString("itemBombTitle"),
        description: getLocalizedString("itemBombDescription")
      }
    };

    const info = itemInfo[itemName];

    this.ui.showModal(info.title, info.description, () => {
      // This is the confirm callback.
      // Ad integration point. e.g., pokiSDK.rewardedBreak().then((withReward) => { ... });
      console.log("Starting ad (Poki/CrazyGames integration point)");
      alert(getLocalizedString("adPlaceholder")); // Placeholder for successful ad view

      if (itemName === 'aim') {
        this.items.aimGuide.available++;
        this.useAimGuide();
      } else if (itemName === 'bomb') {
        this.items.bombBubble.available++;
        this.useBombBubble();
      }
      this.updateUI();
    });
  }

  watchAdForItem(itemNumber) {
    if (itemNumber === 1) {
      this.items.aimGuide.available++;
    } else if (itemNumber === 2) {
      this.items.bombBubble.available++;
    }
    this.updateUI();
  }

  setGameState(newGameState) {
    this.gameState = newGameState;
    this.animationState = 0;
    this.animationTime = 0;
  }

  newGame() {
    this.score = 0;
    this.currentLevel = 1;
    this.rowOffset = 0;
    this.maxChances = 5;
    this.chancesUntilNewRow = this.maxChances;
    this.shotsWithoutPop = 0;
    this.comboCount = 0;
    this.wallBounceCount = 0;

    this.items.aimGuide.active = false;

    // 콤보 리셋
    this.combo.resetCombo();

    // 통계 기록
    this.statistics.recordGameStart();

    this.setGameState(CONFIG.GAME_STATES.READY);
    this.levelManager.initializeGame(); // 랜덤 레벨 생성
    this.nextBubble();
    this.nextBubble();
    this.updateUI();
  }

  updateScore(points) {
    const oldScore = this.score;
    this.score += points;
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("bubbleShooterHighScore", this.highScore.toString());
    }
    
    // 레벨업 체크
    this.levelManager.checkLevelUp(this.score);
    
    this.achievements.checkAchievement('score', this.score);
    this.dailyChallenge.updateProgress('score', { score: this.score });
    this.updateUI();
  }

  updateUI() {
    if (this.ui) {
      this.ui.updateScore(this.score);
      this.ui.updateHighScore(this.highScore);
      this.ui.updateLevel(this.currentLevel);
      this.ui.updateItems(this.items);
      this.ui.updateChances(this.shotsWithoutPop, this.chancesUntilNewRow);
      
      // 레벨 진행률 업데이트
      const progress = this.levelManager.getLevelProgress(this.score);
      const scoreToNext = this.levelManager.getScoreToNextLevel(this.score);
      this.ui.updateLevelProgress(progress, scoreToNext);
    }
  }

  nextBubble() {
    // The launcher bubble takes the properties of the next bubble
    this.player.tileType = this.player.nextBubble.tileType;
    this.player.isBomb = this.player.nextBubble.isBomb;

    // A new "next" bubble is generated for the queue display
    const nextColor = this.getExistingColor();
    this.player.nextBubble.tileType = nextColor;
    this.player.nextBubble.isBomb = false;
  }

  getExistingColor() {
    const existingColors = this.findColors();
    let bubbleType = 0;
    
    if (existingColors.length > 0) {
      bubbleType = existingColors[this.randRange(0, existingColors.length - 1)];
    } else {
      // 기존 색상이 없으면 전체 색상 범위에서 랜덤 생성
      bubbleType = this.randRange(0, CONFIG.BUBBLE.COLORS - 1);
    }
    
    return bubbleType;
  }

  findColors() {
    const foundColors = [];
    const colorTable = new Array(CONFIG.BUBBLE.COLORS).fill(false);

    for (let i = 0; i < this.levelData.columns; i++) {
      for (let j = 0; j < this.levelData.rows; j++) {
        const tile = this.levelData.tiles[i][j];
        if (tile.type >= 0 && tile.type < CONFIG.BUBBLE.COLORS && !colorTable[tile.type]) {
          colorTable[tile.type] = true;
          foundColors.push(tile.type);
        }
      }
    }

    return foundColors;
  }

  randRange(low, high) {
    return Math.floor(low + Math.random() * (high - low + 1));
  }

  updateFps(dt) {
    if (this.fpsTime > 0.25) {
      this.fps = Math.round(this.frameCount / this.fpsTime);
      this.fpsTime = 0;
      this.frameCount = 0;
    }
    this.fpsTime += dt;
    this.frameCount++;
  }

  onClusterRemoved(clusterSize) {
    this.shotsWithoutPop = 0; // 연속 실패가 끊겼으므로 리셋
    this.achievements.checkAchievement('firstPop');
    this.achievements.checkAchievement('combo', clusterSize);
    this.statistics.recordBubblesPop(clusterSize);
    this.dailyChallenge.updateProgress('bubblesPopped', { count: clusterSize });
    
    // 콤보 추가
    const bonusScore = this.combo.addCombo(clusterSize);
    this.statistics.recordCombo(this.combo.currentCombo);
    this.dailyChallenge.updateProgress('combo', { count: this.combo.currentCombo });
    
    if (this.wallBounceCount > 0) {
      this.achievements.checkAchievement('wallBounce');
      this.wallBounceCount = 0;
    }

    // 부드러운 화면 효과
    if (clusterSize >= 10) {
      this.effects.startScreenShake(3, 0.2);
      this.effects.startColorFlash('#ffffff', 0.1);
    } else if (clusterSize >= 5) {
      this.effects.startScreenShake(1, 0.15);
    }
  }

  onLevelComplete() {
    // 모든 버블이 제거되었을 때 새로운 랜덤 레벨 생성
    this.levelManager.createRandomLevel();
    this.achievements.checkAchievement('level', this.currentLevel);
    this.statistics.recordLevelComplete();
    this.dailyChallenge.updateProgress('levelReached', { level: this.currentLevel });
    
    // 레벨 완료 효과
    this.effects.startColorFlash('#00ff88', 0.2);
    if (this.sound) {
      this.sound.play('levelComplete');
    }
  }

  onGameOver() {
    this.combo.resetCombo();
    this.effects.startColorFlash('#ff0000', 0.15);
    
    // 통계 기록
    this.statistics.recordGameEnd(this.score);
    
    // 리더보드 체크
    this.leaderboard.checkNewRecord(this.score, this.currentLevel);
    
    if (this.sound) {
      this.sound.play('gameOver');
    }
  }

  onBubbleShot() {
    this.dailyChallenge.updateProgress('bubbleShot');
  }

  handleMiss() {
    this.shotsWithoutPop++;

    if (this.shotsWithoutPop >= this.chancesUntilNewRow) {
      this.levelManager.addBubbles();
      this.shotsWithoutPop = 0;
      if (this.chancesUntilNewRow > 1) {
        this.chancesUntilNewRow--;
      }
      this.rowOffset = (this.rowOffset + 1) % 2;

      if (this.physics.checkGameOver()) {
        return;
      }
    }

    this.updateUI();
    this.setGameState(CONFIG.GAME_STATES.READY);
  }
}
