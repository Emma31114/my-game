/**
 * 障礙物與敵對物件生成、更新、碰撞檢測與繪製邏輯
 */
import { CANVAS_HEIGHT, ROAD, PLAYER_CONFIG, GAME_CONFIG } from "./config.js";

/**
 * 區間隨機數
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function random(a, b) {
  return Math.random() * (b - a) + a;
}

/**
 * 盒型碰撞檢測（具有指定 padding 縮小判定區）
 * @param {Object} a - 物件 A { x, y, width, height }
 * @param {Object} b - 物件 B { x, y, width, height }
 * @param {number} [p=5] - 碰撞邊界安全寬容值
 * @returns {boolean}
 */
export function checkCollision(a, b, p = PLAYER_CONFIG.collisionPadding) {
  return (
    a.x + p < b.x + b.width - p &&
    a.x + a.width - p > b.x + p &&
    a.y + p < b.y + b.height - p &&
    a.y + a.height - p > b.y + p
  );
}

/**
 * 繪製障礙物
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} o - 障礙物資料
 */
export function drawObstacle(ctx, o) {
  const x = o.x;
  const y = o.y;
  const w = o.width;
  const h = o.height;

  // 障礙物影子
  ctx.fillStyle = "#191919";
  ctx.fillRect(x + 4, y + 5, w, h);

  if (o.type === "barrier") {
    // 施工護欄 / 斑馬條紋路障
    ctx.fillStyle = "#b9ad7c";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#181818";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = "#454545";
    for (let i = -h; i < w + h; i += 18) {
      ctx.save();
      ctx.translate(x + i, y);
      ctx.rotate(-0.65);
      ctx.fillRect(0, 0, 7, h * 1.6);
      ctx.restore();
    }
    ctx.restore();

    ctx.fillStyle = "#e8dfb7";
    ctx.fillRect(x + 5, y + 7, 6, 6);
    ctx.fillRect(x + w - 11, y + 7, 6, 6);
  } else {
    // 賽道落石 / 岩石
    ctx.fillStyle = "#726d61";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y);
    ctx.lineTo(x + w * 0.78, y + 2);
    ctx.lineTo(x + w, y + h * 0.55);
    ctx.lineTo(x + w * 0.72, y + h);
    ctx.lineTo(x + w * 0.15, y + h * 0.88);
    ctx.lineTo(x, y + h * 0.35);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#171717";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#8b8577";
    ctx.fillRect(x + w * 0.28, y + h * 0.22, w * 0.25, 5);
  }
}

/**
 * 障礙物管理器
 */
export class ObstacleManager {
  constructor() {
    this.obstacles = [];
    this.spawnTimer = 0;
    this.spawnInterval = GAME_CONFIG.initialSpawnInterval;
  }

  /**
   * 重設障礙物清單與計時器
   */
  reset() {
    this.obstacles = [];
    this.spawnTimer = 0;
    this.spawnInterval = GAME_CONFIG.initialSpawnInterval;
  }

  /**
   * 隨機產生一個新障礙物
   */
  spawn() {
    const w = random(34, 52);
    const h = random(45, 70);
    this.obstacles.push({
      x: random(ROAD.x + 15, ROAD.x + ROAD.width - w - 15),
      y: -h - 20,
      width: w,
      height: h,
      speed: random(40, 110),
      passed: false,
      type: Math.random() > 0.5 ? "barrier" : "rock"
    });
  }

  /**
   * 更新障礙物位置、生成計時、超車得分與碰撞檢測
   * @param {number} dt - Delta time
   * @param {Object} player - 玩家物件實體
   * @param {number} score - 目前分數
   * @param {Function} onScore - 成功避開得分回調
   * @param {Function} onCollision - 發生碰撞回調
   * @returns {boolean} 是否發生碰撞 (true 代表撞車)
   */
  update(dt, player, score, onScore, onCollision) {
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawn();
      const speedLevel = Math.floor(score / GAME_CONFIG.scorePerLevel);
      this.spawnInterval = Math.max(
        GAME_CONFIG.minSpawnInterval,
        GAME_CONFIG.initialSpawnInterval - speedLevel * GAME_CONFIG.levelSpawnReduction
      );
    }

    const speedLevel = Math.floor(score / GAME_CONFIG.scorePerLevel);

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.y += (player.speed + o.speed + speedLevel * GAME_CONFIG.speedBoostPerLevel) * dt;

      // 碰撞檢測
      if (checkCollision(player, o)) {
        if (onCollision) onCollision();
        return true;
      }

      // 超車得分
      if (!o.passed && o.y > player.y + player.height) {
        o.passed = true;
        if (onScore) onScore();
      }

      // 移出視野下方清理
      if (o.y > CANVAS_HEIGHT + 100) {
        this.obstacles.splice(i, 1);
      }
    }

    return false;
  }

  /**
   * 繪製全部障礙物
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    this.obstacles.forEach((o) => drawObstacle(ctx, o));
  }
}
