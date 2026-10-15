/**
 * 玩家車輛控制、精靈圖動畫與狀態管理
 * - drawImage() 動態精靈圖切割播放
 * - 左右轉向鏡像反轉
 * - 加速/待機/移動多幀動態切換
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, ROAD, PLAYER_CONFIG, CARS, SPRITE_CONFIG } from "./config.js";
import { getImage } from "./assets.js";

/**
 * 使用精靈圖 drawImage 繪製車輛
 * @param {CanvasRenderingContext2D} g - Canvas 上下文
 * @param {string} carKey - 車款鍵名
 * @param {number} x - 繪製目標 x 座標
 * @param {number} y - 繪製目標 y 座標
 * @param {number} w - 目標繪製寬度
 * @param {number} h - 目標繪製高度
 * @param {number} frameCol - 精靈圖欄索引
 * @param {boolean} flipX - 是否水平鏡像反轉
 */
export function drawCarSprite(g, carKey, x, y, w, h, frameCol = 0, flipX = false) {
  const spriteSheet = getImage("player");
  if (!spriteSheet) {
    // 精靈圖尚未載入，回退繪製彩色方塊
    drawCarFallback(g, carKey, x, y, w, h);
    return;
  }

  const row = SPRITE_CONFIG.carRowMap[carKey] !== undefined
    ? SPRITE_CONFIG.carRowMap[carKey]
    : 0;
  const sx = frameCol * SPRITE_CONFIG.frameWidth;
  const sy = row * SPRITE_CONFIG.frameHeight;

  g.save();

  if (flipX) {
    // 水平鏡像：先平移到目標中心，翻轉 X 軸，再偏移回來
    g.translate(x + w / 2, y);
    g.scale(-1, 1);
    g.drawImage(
      spriteSheet,
      sx, sy,
      SPRITE_CONFIG.frameWidth, SPRITE_CONFIG.frameHeight,
      -w / 2, 0,
      w, h
    );
  } else {
    g.drawImage(
      spriteSheet,
      sx, sy,
      SPRITE_CONFIG.frameWidth, SPRITE_CONFIG.frameHeight,
      x, y,
      w, h
    );
  }

  g.restore();
}

/**
 * 使用精靈圖繪製敵車（從 Row 2 取幀）
 * @param {CanvasRenderingContext2D} g
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} frameCol
 */
export function drawEnemyCarSprite(g, x, y, w, h, frameCol = 0) {
  const spriteSheet = getImage("player");
  if (!spriteSheet) return;

  const row = SPRITE_CONFIG.enemyRow;
  const sx = frameCol * SPRITE_CONFIG.frameWidth;
  const sy = row * SPRITE_CONFIG.frameHeight;

  g.drawImage(
    spriteSheet,
    sx, sy,
    SPRITE_CONFIG.frameWidth, SPRITE_CONFIG.frameHeight,
    x, y,
    w, h
  );
}

/**
 * 回退方塊繪製（圖片未加載時使用）
 * @param {CanvasRenderingContext2D} g
 * @param {string} carKey
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
function drawCarFallback(g, carKey, x, y, w, h) {
  const c = CARS[carKey];
  if (!c) return;
  g.save();
  g.fillStyle = "#111";
  g.fillRect(x + 4, y + 5, w, h);
  g.fillStyle = c.color;
  g.fillRect(x, y, w, h);
  g.strokeStyle = "#181818";
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);
  g.fillStyle = "#eee6bd";
  g.fillRect(x + 6, y + 5, w - 12, 14);
  g.fillStyle = c.dark;
  g.fillRect(x + 6, y + h - 18, w - 12, 12);
  g.restore();
}

/**
 * 繪製車體（供選車面板微型預覽使用）
 * 使用精靈圖第 0 欄靜態幀
 * @param {CanvasRenderingContext2D} g
 * @param {string} carKey
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} scale
 */
export function drawCar(g, carKey, x, y, w, h, scale = 1) {
  const spriteSheet = getImage("player");
  if (!spriteSheet) {
    // 圖片尚未載入，使用回退方塊
    drawCarFallback(g, carKey, x - w / 2, y, w, h);
    return;
  }

  const row = SPRITE_CONFIG.carRowMap[carKey] !== undefined
    ? SPRITE_CONFIG.carRowMap[carKey]
    : 0;
  const sx = 0;
  const sy = row * SPRITE_CONFIG.frameHeight;

  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  g.drawImage(
    spriteSheet,
    sx, sy,
    SPRITE_CONFIG.frameWidth, SPRITE_CONFIG.frameHeight,
    -w / 2, 0,
    w, h
  );
  g.restore();
}

/**
 * 精靈動畫控制器
 */
class SpriteAnimator {
  constructor() {
    this.timer = 0;
    this.frameIndex = 0;
    this.currentFrames = SPRITE_CONFIG.idleFrames;
  }

  /**
   * 設定目前播放的動畫幀序列
   * @param {number[]} frames - 欄索引陣列
   */
  setAnimation(frames) {
    if (this.currentFrames !== frames) {
      this.currentFrames = frames;
      this.frameIndex = 0;
      this.timer = 0;
    }
  }

  /**
   * 更新動畫計時
   * @param {number} dt - Delta time (秒)
   * @returns {number} 目前應顯示的精靈欄索引
   */
  update(dt) {
    this.timer += dt;
    const frameDuration = 1 / SPRITE_CONFIG.animSpeed;
    if (this.timer >= frameDuration) {
      this.timer -= frameDuration;
      this.frameIndex = (this.frameIndex + 1) % this.currentFrames.length;
    }
    return this.currentFrames[this.frameIndex];
  }

  /**
   * 取得目前幀欄索引
   * @returns {number}
   */
  getCurrentFrame() {
    return this.currentFrames[this.frameIndex];
  }
}

/**
 * 玩家角色實體
 * - 嚴格維持原有物理數值與碰撞判定
 * - width/height/x/y 維持與原始碰撞箱完全一致
 */
export class Player {
  constructor(carKey = "sport") {
    this.carKey = carKey;
    this.width = PLAYER_CONFIG.width;
    this.height = PLAYER_CONFIG.height;
    this.x = PLAYER_CONFIG.initialX;
    this.y = PLAYER_CONFIG.initialY;
    this.speed = PLAYER_CONFIG.initialSpeed;

    // 精靈動畫控制
    this.animator = new SpriteAnimator();

    // 轉向狀態
    this.steerDir = 0;  // -1 左, 0 直行, 1 右
    this.isBoosting = false;
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
    this.steerDir = 0;
    this.isBoosting = false;
    this.animator = new SpriteAnimator();
  }

  /**
   * 更新玩家位移與油門速度
   * 物理參數 100% 保留原始數值，絕不修改
   * @param {number} dt - Delta time (秒)
   * @param {Object} keys - 按鍵狀態物件
   */
  update(dt, keys) {
    const steer = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
    this.steerDir = steer;
    this.x += steer * PLAYER_CONFIG.steerSpeed * dt;

    if (keys.ArrowUp) {
      this.speed += PLAYER_CONFIG.accelRate * dt;
      this.isBoosting = true;
    } else if (keys.ArrowDown) {
      this.speed -= PLAYER_CONFIG.brakeRate * dt;
      this.isBoosting = false;
    } else if (this.speed > PLAYER_CONFIG.initialSpeed) {
      this.speed -= PLAYER_CONFIG.naturalDecelRate * dt;
      this.isBoosting = false;
    } else if (this.speed < PLAYER_CONFIG.initialSpeed) {
      this.speed += PLAYER_CONFIG.naturalAccelRate * dt;
      this.isBoosting = false;
    } else {
      this.isBoosting = false;
    }

    // 限制速度上下限（原始數值不變）
    this.speed = Math.max(PLAYER_CONFIG.minSpeed, Math.min(PLAYER_CONFIG.maxSpeed, this.speed));

    // 限制賽道左右邊界（原始碰撞箱範圍不變）
    const minX = ROAD.x + PLAYER_CONFIG.roadMargin;
    const maxX = ROAD.x + ROAD.width - this.width - PLAYER_CONFIG.roadMargin;
    this.x = Math.max(minX, Math.min(maxX, this.x));

    // 更新精靈動畫狀態
    if (this.isBoosting) {
      this.animator.setAnimation(SPRITE_CONFIG.boostFrames);
    } else if (steer !== 0) {
      this.animator.setAnimation(SPRITE_CONFIG.runFrames);
    } else {
      this.animator.setAnimation(SPRITE_CONFIG.idleFrames);
    }
    this.animator.update(dt);
  }

  /**
   * 繪製玩家車輛（精靈圖 drawImage）
   * 繪製範圍對齊原始碰撞箱 (x, y, width, height)
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    const frameCol = this.animator.getCurrentFrame();
    const flipX = this.steerDir < 0; // 左轉時鏡像反轉

    drawCarSprite(
      ctx,
      this.carKey,
      this.x,
      this.y,
      this.width,
      this.height,
      frameCol,
      flipX
    );
  }
}
