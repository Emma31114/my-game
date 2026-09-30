/**
 * 玩家車輛控制、狀態與自繪邏輯
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, ROAD, PLAYER_CONFIG, CARS } from "./config.js";

/**
 * 繪製車體幾何圖形（通用於選車預覽與遊戲中玩家車輛）
 * @param {CanvasRenderingContext2D} g
 * @param {string} carKey - 車款鍵名 (sport | formula | offroad | muscle)
 * @param {number} x - 繪製基準 x 座標
 * @param {number} y - 繪製基準 y 座標
 * @param {number} w - 車體寬度
 * @param {number} h - 車體高度
 * @param {number} scale - 縮放比例
 */
export function drawCar(g, carKey, x, y, w, h, scale = 1) {
  const c = CARS[carKey];
  if (!c) return;
  const cx = x + w / 2;

  g.save();
  g.translate(cx, y);
  g.scale(scale, scale);
  const bw = w / scale;
  const bh = h / scale;
  const left = -bw / 2;

  // 底部黑底暗影
  g.fillStyle = "#111";
  g.fillRect(left + 4, 6, bw - 8, bh);

  if (c.type === "formula") {
    g.fillStyle = c.color;
    g.fillRect(-13, 5, 26, bh - 10);
    g.fillRect(-23, 8, 46, 9);
    g.fillRect(-30, bh - 13, 60, 7);
    g.fillRect(-8, 0, 16, 12);
    g.fillStyle = "#303a3a";
    g.fillRect(-7, 17, 14, 18);
    g.fillStyle = "#111";
    g.fillRect(-28, 14, 8, 17);
    g.fillRect(20, 14, 8, 17);
    g.fillRect(-29, bh - 20, 9, 18);
    g.fillRect(20, bh - 20, 9, 18);
  } else if (c.type === "offroad") {
    g.fillStyle = c.color;
    g.fillRect(left + 5, 5, bw - 10, bh - 10);
    g.fillStyle = "#303a3a";
    g.fillRect(left + 10, 18, bw - 20, 19);
    g.fillStyle = c.dark;
    g.fillRect(left + 8, 40, bw - 16, 18);
    g.fillStyle = "#111";
    g.fillRect(left - 2, 8, 9, 22);
    g.fillRect(left + bw - 7, 8, 9, 22);
    g.fillRect(left - 2, bh - 30, 9, 22);
    g.fillRect(left + bw - 7, bh - 30, 9, 22);
  } else if (c.type === "muscle") {
    g.fillStyle = c.color;
    g.fillRect(left + 2, 9, bw - 4, bh - 12);
    g.fillRect(left - 3, 30, bw + 6, 29);
    g.fillStyle = c.dark;
    g.fillRect(left + 8, 17, bw - 16, 17);
    g.fillStyle = "#303a3a";
    g.fillRect(left + 8, 37, bw - 16, 14);
    g.fillStyle = "#111";
    g.fillRect(left - 2, 12, 8, 18);
    g.fillRect(left + bw - 6, 12, 8, 18);
    g.fillRect(left - 2, bh - 27, 8, 18);
    g.fillRect(left + bw - 6, bh - 27, 8, 18);
  } else {
    // 預設跑車 (sport)
    g.fillStyle = c.color;
    g.fillRect(left + 5, 2, bw - 10, bh - 4);
    g.fillStyle = "#eee6bd";
    g.fillRect(left + 9, 7, bw - 18, 18);
    g.fillStyle = "#303a3a";
    g.fillRect(left + 9, 27, bw - 18, 17);
    g.fillStyle = c.dark;
    g.fillRect(left + 9, 46, bw - 18, 16);
    g.fillStyle = "#8b3830";
    g.fillRect(left + 8, 55, 7, 6);
    g.fillRect(left + bw - 15, 55, 7, 6);
    g.fillStyle = "#111";
    g.fillRect(left - 2, 10, 7, 17);
    g.fillRect(left + bw - 5, 10, 7, 17);
    g.fillRect(left - 2, 45, 7, 17);
    g.fillRect(left + bw - 5, 45, 7, 17);
  }
  g.restore();
}

/**
 * 玩家角色實體
 */
export class Player {
  constructor(carKey = "sport") {
    this.carKey = carKey;
    this.width = PLAYER_CONFIG.width;
    this.height = PLAYER_CONFIG.height;
    this.x = PLAYER_CONFIG.initialX;
    this.y = PLAYER_CONFIG.initialY;
    this.speed = PLAYER_CONFIG.initialSpeed;
  }

  /**
   * 重設玩家狀態
   * @param {string} [carKey] - 可選，更換指定車種
   */
  reset(carKey = this.carKey) {
    this.carKey = carKey;
    this.x = CANVAS_WIDTH / 2 - this.width / 2;
    this.y = PLAYER_CONFIG.initialY;
    this.speed = PLAYER_CONFIG.initialSpeed;
  }

  /**
   * 更新玩家位移與油門速度
   * @param {number} dt - Delta time (秒)
   * @param {Object} keys - 按鍵狀態物件
   */
  update(dt, keys) {
    const steer = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
    this.x += steer * PLAYER_CONFIG.steerSpeed * dt;

    if (keys.ArrowUp) {
      this.speed += PLAYER_CONFIG.accelRate * dt;
    } else if (keys.ArrowDown) {
      this.speed -= PLAYER_CONFIG.brakeRate * dt;
    } else if (this.speed > PLAYER_CONFIG.initialSpeed) {
      this.speed -= PLAYER_CONFIG.naturalDecelRate * dt;
    } else if (this.speed < PLAYER_CONFIG.initialSpeed) {
      this.speed += PLAYER_CONFIG.naturalAccelRate * dt;
    }

    // 限制速度上下限
    this.speed = Math.max(PLAYER_CONFIG.minSpeed, Math.min(PLAYER_CONFIG.maxSpeed, this.speed));

    // 限制賽道左右邊界
    const minX = ROAD.x + PLAYER_CONFIG.roadMargin;
    const maxX = ROAD.x + ROAD.width - this.width - PLAYER_CONFIG.roadMargin;
    this.x = Math.max(minX, Math.min(maxX, this.x));
  }

  /**
   * 繪製玩家車輛
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    drawCar(ctx, this.carKey, this.x, this.y, this.width, this.height, 1);
  }
}
