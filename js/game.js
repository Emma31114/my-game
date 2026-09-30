/**
 * 遊戲主循環、狀態控制與場景繪製
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, ROAD, CARS, GAME_CONFIG } from "./config.js";
import { Player } from "./player.js";
import { ObstacleManager } from "./enemy.js";

export class Game {
  constructor() {
    // 取得 DOM 元素
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    this.menu = document.getElementById("menu");
    this.gameScreen = document.getElementById("gameScreen");
    this.scoreEl = document.getElementById("score");
    this.bestEl = document.getElementById("best");
    this.carLabelEl = document.getElementById("carLabel");
    this.speedLevelEl = document.getElementById("speedLevel");

    // 遊戲核心狀態
    this.selectedCar = "sport";
    this.score = 0;

    // 安全讀取 localStorage
    try {
      this.best = Number(localStorage.getItem(GAME_CONFIG.storageKey)) || 0;
    } catch (e) {
      this.best = 0;
    }

    this.gameOver = false;
    this.lastTime = 0;
    this.roadOffset = 0;

    // 按鍵狀態監聽
    this.keys = {
      ArrowLeft: false,
      ArrowRight: false,
      ArrowUp: false,
      ArrowDown: false
    };

    // 子系統實例
    this.player = new Player(this.selectedCar);
    this.obstacleManager = new ObstacleManager();

    // 綁定 loop
    this.loop = this.loop.bind(this);
  }

  /**
   * 初始化遊戲實例與 HUD 初始顯示
   */
  init() {
    this.updateHUD();
    requestAnimationFrame(this.loop);
  }

  /**
   * 設定玩家選擇的車種
   * @param {string} carKey
   */
  setSelectedCar(carKey) {
    if (CARS[carKey]) {
      this.selectedCar = carKey;
      if (this.player) {
        this.player.carKey = carKey;
      }
    }
  }

  /**
   * 刷新 HUD 計分板資訊
   */
  updateHUD() {
    if (this.scoreEl) this.scoreEl.textContent = this.score;
    if (this.bestEl) this.bestEl.textContent = this.best;
    if (this.speedLevelEl) {
      this.speedLevelEl.textContent = Math.floor(this.score / GAME_CONFIG.scorePerLevel) + 1;
    }
    if (this.carLabelEl && CARS[this.selectedCar]) {
      this.carLabelEl.textContent = CARS[this.selectedCar].name;
    }
  }

  /**
   * 重設局內狀態
   */
  reset() {
    this.score = 0;
    this.gameOver = false;
    this.roadOffset = 0;
    this.player.reset(this.selectedCar);
    this.obstacleManager.reset();
    for (const k in this.keys) {
      this.keys[k] = false;
    }
    this.updateHUD();
  }

  /**
   * 從選單開始競賽
   */
  start() {
    this.menu.classList.add("hidden");
    this.gameScreen.classList.remove("hidden");
    if (this.carLabelEl && CARS[this.selectedCar]) {
      this.carLabelEl.textContent = CARS[this.selectedCar].name;
    }
    this.reset();
    this.lastTime = performance.now();
  }

  /**
   * 返回車輛選擇選單
   */
  backToMenu() {
    this.gameScreen.classList.add("hidden");
    this.menu.classList.remove("hidden");
    this.gameOver = false;
    for (const k in this.keys) {
      this.keys[k] = false;
    }
  }

  /**
   * 繪製滾動賽道與路肩草地
   */
  drawBackground() {
    const W = CANVAS_WIDTH;
    const H = CANVAS_HEIGHT;

    // 兩側草地
    this.ctx.fillStyle = "#53634b";
    this.ctx.fillRect(0, 0, W, H);
    this.ctx.fillStyle = "#5d6d55";
    for (let y = -20; y < H; y += 32) {
      const o = Math.floor((this.roadOffset * 0.35) % 32);
      this.ctx.fillRect(10, y + o, 5, 2);
      this.ctx.fillRect(38, y + o + 13, 4, 2);
      this.ctx.fillRect(450, y + o + 7, 5, 2);
      this.ctx.fillRect(475, y + o + 20, 4, 2);
    }

    // 柏油路面
    this.ctx.fillStyle = "#303030";
    this.ctx.fillRect(ROAD.x, 0, ROAD.width, H);

    // 兩側邊線
    this.ctx.fillStyle = "#d0c48f";
    this.ctx.fillRect(ROAD.x, 0, 5, H);
    this.ctx.fillRect(ROAD.x + ROAD.width - 5, 0, 5, H);

    this.ctx.fillStyle = "#454545";
    this.ctx.fillRect(ROAD.x + 5, 0, 5, H);
    this.ctx.fillRect(ROAD.x + ROAD.width - 10, 0, 5, H);

    // 中央虛線
    this.ctx.fillStyle = "#cfc18b";
    const cycle = 62;
    const o = this.roadOffset % cycle;
    for (let y = -cycle + o; y < H; y += cycle) {
      this.ctx.fillRect(W / 2 - 3, y, 6, 32);
    }
  }

  /**
   * 繪製撞車結算彈窗
   */
  drawGameOver() {
    const W = CANVAS_WIDTH;
    const H = CANVAS_HEIGHT;

    this.ctx.fillStyle = "rgba(10,10,10,.78)";
    this.ctx.fillRect(0, 0, W, H);

    const pw = 340;
    const ph = 220;
    const px = (W - pw) / 2;
    const py = (H - ph) / 2;

    this.ctx.fillStyle = "#222";
    this.ctx.fillRect(px, py, pw, ph);
    this.ctx.strokeStyle = "#d6c79a";
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(px, py, pw, ph);

    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#eee6bd";
    this.ctx.font = "bold 32px Courier New";
    this.ctx.fillText("GAME OVER", W / 2, py + 53);

    this.ctx.font = "17px Courier New";
    this.ctx.fillStyle = "#c9bd91";
    this.ctx.fillText("CAR: " + CARS[this.selectedCar].name, W / 2, py + 87);
    this.ctx.fillText("SCORE: " + this.score + "   BEST: " + this.best, W / 2, py + 116);
    this.ctx.fillText("SPEED LEVEL: " + (Math.floor(this.score / GAME_CONFIG.scorePerLevel) + 1), W / 2, py + 140);

    this.ctx.font = "14px Courier New";
    this.ctx.fillStyle = "#eee6bd";
    this.ctx.fillText("SPACE = RESTART", W / 2, py + 164);
    this.ctx.fillText("ESC = CAR SELECT", W / 2, py + 188);
    this.ctx.textAlign = "start";
  }

  /**
   * 遊戲邏輯更新
   * @param {number} dt - Delta time
   */
  update(dt) {
    if (this.gameOver) return;

    // 玩家位移與操控
    this.player.update(dt, this.keys);

    // 賽道滾動
    this.roadOffset += this.player.speed * dt;

    // 障礙物推進與碰撞判定
    this.obstacleManager.update(
      dt,
      this.player,
      this.score,
      () => {
        // 超車得分回調
        this.score++;
        if (this.score > this.best) {
          this.best = this.score;
        }
        this.updateHUD();
      },
      () => {
        // 發生碰撞回調
        this.gameOver = true;
        if (this.score > this.best) {
          this.best = this.score;
          try {
            localStorage.setItem(GAME_CONFIG.storageKey, this.best.toString());
          } catch (e) {
            // 忽略 localStorage 權限限制
          }
        }
        this.updateHUD();
      }
    );
  }

  /**
   * 畫面繪製渲染
   */
  draw() {
    this.drawBackground();
    this.obstacleManager.draw(this.ctx);
    this.player.draw(this.ctx);
    if (this.gameOver) {
      this.drawGameOver();
    }
  }

  /**
   * 幀循環循環器
   * @param {DOMHighResTimeStamp} t
   */
  loop(t) {
    if (!this.lastTime) this.lastTime = t;
    const dt = Math.min((t - this.lastTime) / 1000, 0.05);
    this.lastTime = t;

    if (!this.gameScreen.classList.contains("hidden")) {
      this.update(dt);
      this.draw();
    }

    requestAnimationFrame(this.loop);
  }
}
