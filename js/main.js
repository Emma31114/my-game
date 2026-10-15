/**
 * 遊戲啟動入口、資源預加載與全域事件監聽
 * - 資源預加載防護：確保圖片載入完成後才啟動主循環與選車預覽
 * - 音訊解鎖系統：遵循瀏覽器 Autoplay 規範，首次互動後解鎖 Web Audio
 * - 靜音切換按鈕控制（BGM 與 SFX 獨立控制）
 */
import { Game } from "./game.js";
import { drawCar } from "./player.js";
import { preloadAll, unlockAudio, toggleBGM, toggleSFX } from "./assets.js";

// DOM 載入後啟動遊戲
window.addEventListener("DOMContentLoaded", async () => {
  // 1. 資源預加載保護（避免圖片未加載前 drawImage 報錯或閃爍）
  try {
    await preloadAll();
  } catch (err) {
    console.warn("資源預加載警告（將啟用回退渲染）:", err);
  }

  const game = new Game();

  // 2. 設置使用者互動解鎖音訊（符合現代瀏覽器 Autoplay Policy）
  let audioUnlocked = false;
  const tryUnlockAudio = () => {
    if (!audioUnlocked) {
      audioUnlocked = true;
      unlockAudio();
    }
  };
  ["click", "keydown", "touchstart", "pointerdown"].forEach((evtName) => {
    window.addEventListener(evtName, tryUnlockAudio, { passive: true });
  });

  // 3. 畫面右上角音訊控制按鈕監聽
  const bgmToggleBtn = document.getElementById("bgmToggleBtn");
  const sfxToggleBtn = document.getElementById("sfxToggleBtn");

  if (bgmToggleBtn) {
    bgmToggleBtn.addEventListener("click", () => {
      tryUnlockAudio();
      const muted = toggleBGM();
      bgmToggleBtn.textContent = muted ? "🎵 BGM: OFF" : "🎵 BGM: ON";
      bgmToggleBtn.classList.toggle("muted", muted);
    });
  }

  if (sfxToggleBtn) {
    sfxToggleBtn.addEventListener("click", () => {
      tryUnlockAudio();
      const muted = toggleSFX();
      sfxToggleBtn.textContent = muted ? "🔇 SFX: OFF" : "🔊 SFX: ON";
      sfxToggleBtn.classList.toggle("muted", muted);
    });
  }

  // 4. 繪製選車面板微型畫布預覽圖
  document.querySelectorAll(".mini").forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#303030";
    ctx.fillRect(0, 0, 90, 90);
    drawCar(ctx, canvas.dataset.preview, 45, 10, 38, 70, 1);
  });

  // 5. 車輛選擇卡片互動控制
  const carCards = [...document.querySelectorAll(".car-card")];
  let selected = "sport";

  function updateCarSelection() {
    carCards.forEach((card) => {
      card.classList.toggle("selected", card.dataset.car === selected);
    });
    game.setSelectedCar(selected);
  }

  function moveCarSelection(direction) {
    let index = carCards.findIndex((card) => card.dataset.car === selected);
    if (index < 0) index = 0;
    index = (index + direction + carCards.length) % carCards.length;
    selected = carCards[index].dataset.car;
    updateCarSelection();
  }

  carCards.forEach((card) => {
    card.addEventListener("click", () => {
      tryUnlockAudio();
      selected = card.dataset.car;
      updateCarSelection();
    });
  });

  // 6. 開始按鈕
  const startBtn = document.getElementById("startBtn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      tryUnlockAudio();
      game.start();
    });
  }

  // 7. 鍵盤操作監聽（選單、遊戲控制與結算切換）
  window.addEventListener("keydown", (e) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Enter"].includes(e.key)) {
      e.preventDefault();
    }
    tryUnlockAudio();

    const menu = document.getElementById("menu");
    const gameScreen = document.getElementById("gameScreen");

    // 選車選單中操作
    if (menu && !menu.classList.contains("hidden")) {
      if (e.key === "ArrowLeft") {
        moveCarSelection(-1);
        return;
      }
      if (e.key === "ArrowRight") {
        moveCarSelection(1);
        return;
      }
      if (e.key === "Enter") {
        game.start();
        return;
      }
    }

    // 遊戲畫面中操作
    if (gameScreen && !gameScreen.classList.contains("hidden")) {
      if (e.key === "Escape") {
        game.backToMenu();
        return;
      }
      if (e.key === " " && game.gameOver) {
        game.reset();
        return;
      }
    }

    // 駕駛按鍵狀態更新
    if (e.key in game.keys) {
      game.keys[e.key] = true;
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.key in game.keys) {
      game.keys[e.key] = false;
    }
  });

  // 8. 預設車款同步並啟動遊戲主實例
  updateCarSelection();
  game.init();
});
