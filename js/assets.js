/**
 * 資源預加載與音訊管理系統
 * - 圖片預加載（確保 drawImage 前圖片已就緒）
 * - 音效 SFX 與背景音樂 BGM 管理
 * - 現代瀏覽器 Autoplay Policy 合規處理
 */

// ═══════════════════════════════════════════
//  圖片資源定義與預加載
// ═══════════════════════════════════════════

const IMAGE_PATHS = {
  player: "./assets/images/player.png",
  background: "./assets/images/background.png"
};

const SFX_PATHS = {
  boost: "./assets/audio/boost.mp3",
  crash: "./assets/audio/crash.mp3",
  score: "./assets/audio/score.mp3",
  gameOver: "./assets/audio/game_over.ogg",
  go: "./assets/audio/go.ogg",
  levelUp: "./assets/audio/level_up.ogg",
  newHighscore: "./assets/audio/new_highscore.ogg"
};

const BGM_PATH = "./assets/audio/bgm.mp3";

/** 已加載的圖片快取 */
const images = {};

/** 已加載的音效快取 */
const sfxBuffers = {};

/** 音訊管理器全域狀態 */
let audioCtx = null;
let bgmElement = null;
let bgmGain = null;
let sfxGain = null;
let masterGain = null;
let bgmMuted = false;
let sfxMuted = false;
let audioUnlocked = false;

// ═══════════════════════════════════════════
//  圖片載入
// ═══════════════════════════════════════════

/**
 * 載入單張圖片並回傳 Promise
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image: " + src));
    img.src = src;
  });
}

/**
 * 取得已加載的圖片
 * @param {string} key - IMAGE_PATHS 的鍵名
 * @returns {HTMLImageElement|null}
 */
export function getImage(key) {
  return images[key] || null;
}

// ═══════════════════════════════════════════
//  Web Audio API 音訊系統
// ═══════════════════════════════════════════

export const DEFAULT_BGM_VOLUME = 0.40;
export const DEFAULT_SFX_VOLUME = Number((DEFAULT_BGM_VOLUME * 0.2).toFixed(4)); // 0.08，SFX 的聲音是 BGM 的 0.2 倍

/**
 * 初始化 AudioContext（需在使用者互動後呼叫）
 */
function initAudioContext() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // 主音量節點
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 1.0;
  masterGain.connect(audioCtx.destination);

  // SFX 音量節點（設為 BGM 的 0.2 倍）
  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = DEFAULT_SFX_VOLUME;
  sfxGain.connect(masterGain);

  // BGM 音量節點（透過 MediaElementSource）
  bgmGain = audioCtx.createGain();
  bgmGain.gain.value = DEFAULT_BGM_VOLUME;
  bgmGain.connect(masterGain);
}

/**
 * 載入單一音效到 AudioBuffer
 * @param {string} src
 * @returns {Promise<AudioBuffer>}
 */
async function loadSfxBuffer(src) {
  const response = await fetch(src);
  const arrayBuffer = await response.arrayBuffer();
  return await audioCtx.decodeAudioData(arrayBuffer);
}

/**
 * 播放指定 SFX 音效
 * @param {string} key - SFX_PATHS 的鍵名
 */
export function playSfx(key) {
  if (!audioCtx || sfxMuted) return;
  const buffer = sfxBuffers[key];
  if (!buffer) return;
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(sfxGain);
  source.start(0);
}

/**
 * 啟動 BGM 循環播放（需在使用者互動事件中呼叫）
 */
export function startBGM() {
  if (!audioCtx || !bgmElement) return;

  // 確保 AudioContext 已 resume
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  if (bgmElement.paused) {
    bgmElement.play().catch(() => {
      // 瀏覽器可能仍阻擋，靜默處理
    });
  }
}

/**
 * 停止 BGM
 */
export function stopBGM() {
  if (bgmElement && !bgmElement.paused) {
    bgmElement.pause();
    bgmElement.currentTime = 0;
  }
}

/**
 * 切換 BGM 靜音
 * @returns {boolean} 切換後是否靜音
 */
export function toggleBGM() {
  bgmMuted = !bgmMuted;
  if (bgmGain) {
    bgmGain.gain.value = bgmMuted ? 0 : DEFAULT_BGM_VOLUME;
  }
  return bgmMuted;
}

/**
 * 切換 SFX 靜音
 * @returns {boolean} 切換後是否靜音
 */
export function toggleSFX() {
  sfxMuted = !sfxMuted;
  if (sfxGain) {
    sfxGain.gain.value = sfxMuted ? 0 : DEFAULT_SFX_VOLUME;
  }
  return sfxMuted;
}

/**
 * 取得目前 BGM 靜音狀態
 * @returns {boolean}
 */
export function isBGMMuted() {
  return bgmMuted;
}

/**
 * 取得目前 SFX 靜音狀態
 * @returns {boolean}
 */
export function isSFXMuted() {
  return sfxMuted;
}

/**
 * 解鎖音訊系統（首次使用者互動後呼叫）
 */
export function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  initAudioContext();

  // 預加載所有 SFX buffers
  const sfxPromises = Object.entries(SFX_PATHS).map(async ([key, src]) => {
    try {
      sfxBuffers[key] = await loadSfxBuffer(src);
    } catch (e) {
      console.warn("SFX load failed:", key, e);
    }
  });

  // 初始化 BGM 元素
  bgmElement = new Audio(BGM_PATH);
  bgmElement.loop = true;
  bgmElement.volume = 1.0; // 音量由 bgmGain 控制

  // 透過 MediaElementSource 連接到 AudioContext
  try {
    const bgmSource = audioCtx.createMediaElementSource(bgmElement);
    bgmSource.connect(bgmGain);
  } catch (e) {
    // fallback：直接使用 Audio 元素音量控制
    bgmElement.volume = DEFAULT_BGM_VOLUME;
  }

  // Resume AudioContext
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  return Promise.all(sfxPromises);
}

/**
 * 查詢音訊是否已解鎖
 * @returns {boolean}
 */
export function isAudioUnlocked() {
  return audioUnlocked;
}

// ═══════════════════════════════════════════
//  全域資源預加載入口
// ═══════════════════════════════════════════

/**
 * 預加載所有圖片資源，回傳 Promise
 * 在遊戲啟動前呼叫，確保 drawImage 前圖片已就緒
 * @returns {Promise<void>}
 */
export async function preloadAll() {
  const entries = Object.entries(IMAGE_PATHS);
  const promises = entries.map(async ([key, src]) => {
    images[key] = await loadImage(src);
  });
  await Promise.all(promises);
}
