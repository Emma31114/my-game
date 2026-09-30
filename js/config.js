/**
 * 遊戲整體設定與參數常數
 */

// 畫布基礎尺寸
export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 650;

// 賽道尺寸與邊界
export const ROAD = {
  x: 75,
  width: 350
};

// 玩家車輛參數與操控設定
export const PLAYER_CONFIG = {
  width: 38,
  height: 70,
  initialX: 231,
  initialY: 545,
  initialSpeed: 250,
  minSpeed: 170,
  maxSpeed: 430,
  steerSpeed: 300,
  accelRate: 180,
  brakeRate: 220,
  naturalDecelRate: 70,
  naturalAccelRate: 35,
  roadMargin: 7,
  collisionPadding: 5
};

// 車款資料定義
export const CARS = {
  sport: {
    name: "閃電 GT",
    color: "#e0523f",
    dark: "#8f2f25",
    type: "sport",
    desc: "BALANCED"
  },
  formula: {
    name: "獵鷹 F1",
    color: "#4c91d9",
    dark: "#28527f",
    type: "formula",
    desc: "SLIM & FAST"
  },
  offroad: {
    name: "荒野王者",
    color: "#63a85b",
    dark: "#3d6e38",
    type: "offroad",
    desc: "TOUGH"
  },
  muscle: {
    name: "赤焰 V8",
    color: "#c58b32",
    dark: "#76531e",
    type: "muscle",
    desc: "WIDE & POWER"
  }
};

// 遊戲運行數值與存檔鍵名
export const GAME_CONFIG = {
  storageKey: "microRacingBestV2",
  initialSpawnInterval: 0.9,
  minSpawnInterval: 0.20,
  levelSpawnReduction: 0.75,
  scorePerLevel: 50,
  speedBoostPerLevel: 35
};
