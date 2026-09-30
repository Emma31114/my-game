/**
 * 遊戲啟動入口與全域事件監聽
 */
import { Game } from "./game.js";
import { drawCar } from "./player.js";

// DOM 載入後啟動遊戲
window.addEventListener("DOMContentLoaded", () => {
  const game = new Game();

  // 繪製選車面板微型畫布預覽圖
  document.querySelectorAll(".mini").forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#303030";
    ctx.fillRect(0, 0, 90, 90);
    drawCar(ctx, canvas.dataset.preview, 45, 10, 38, 70, 1);
  });

  // 車輛選擇卡片互動控制
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
      selected = card.dataset.car;
      updateCarSelection();
    });
  });

  // 開始按鈕
  const startBtn = document.getElementById("startBtn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      game.start();
    });
  }

  // 鍵盤操作監聽（選單、遊戲控制與結算切換）
  window.addEventListener("keydown", (e) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Enter"].includes(e.key)) {
      e.preventDefault();
    }

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

  // 預設車款同步並啟動主循環
  updateCarSelection();
  game.init();
});
