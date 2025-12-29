import { MinesweeperGame } from "./game.js";
import { UI } from "./ui.js";
import { Controls } from "./controls.js";
import { CONFIG } from "./config.js";

let game, ui, controls;
let timerInterval;
let startTime;
let endTime;
let currentDifficulty = "BEGINNER";
let difficultyButtons = [];

// Asset Preloading
async function loadAssets() {
  const imagesToLoad = [
    ...Object.values(CONFIG.ASSETS.IMAGES.TILES),
    ...CONFIG.ASSETS.IMAGES.NUMBERS.filter((n) => n),
    ...Object.values(CONFIG.ASSETS.IMAGES.ICONS),
    ...Object.values(CONFIG.ASSETS.IMAGES.UI),
  ];

  const loadPromises = imagesToLoad.map((src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = resolve;
      img.onerror = resolve; // Continue even if fail
    });
  });

  const font = new FontFace(
    "Digital7",
    `url("${CONFIG.ASSETS.FONTS.DIGITAL}")`
  );
  loadPromises.push(
    font
      .load()
      .then((f) => document.fonts.add(f))
      .catch((e) => console.log("Font load error", e))
  );

  await Promise.all(loadPromises);
  document.getElementById("loading").style.display = "none";
  document.getElementById("game-app").style.display = "flex";
}

function initGame(difficultySettings) {
  if (controls) {
    controls.cleanup();
  }

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  document.getElementById("game-over-modal").classList.remove("visible");
  document.getElementById("version-modal").style.display = "none";

  const { rows, cols, mines } =
    difficultySettings || CONFIG.DIFFICULTY[currentDifficulty];

  game = new MinesweeperGame(rows, cols, mines);
  ui = new UI();

  ui.initGrid(rows, cols);
  ui.updateMineCount(mines);
  ui.updateTimer(0);
  ui.setFace("normal");

  controls = new Controls(game, ui);
  controls.init();

  game.onGameStateChange = (event) => {
    if (event.type === "reveal" && !timerInterval && !game.gameOver) {
      startTimer();
    }
    if (event.type === "gameOver") {
      stopTimer();
      ui.setFace(event.win ? "win" : "lose");
      ui.render(game);

      setTimeout(() => {
        showGameOverPopup(event.win);
      }, 500);
    }
  };

  ui.render(game);
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const delta = Math.floor((Date.now() - startTime) / 1000);
    const cappedTime = Math.min(delta, 999);
    ui.updateTimer(cappedTime);
  }, 1000);
}

function stopTimer() {
  endTime = Date.now();
  clearInterval(timerInterval);
  timerInterval = null;
}

function showGameOverPopup(win) {
  const modal = document.getElementById("game-over-modal");
  const title = document.getElementById("msg-title");
  const text = document.getElementById("msg-text");
  const icon = document.getElementById("msg-icon");
  const timeTaken = ((endTime - startTime) / 1000);

  if (win) {
    title.innerText = "Game Won";
    text.innerHTML = `Congratulations!<br>You finished in ${timeTaken.toFixed(3)} seconds.`;
    icon.innerHTML = `<span class="icon-win">i</span>`;
  } else {
    title.innerText = "Game Lost";
    text.innerText = "Sorry, you hit a mine!";
    icon.innerHTML = `<span class="icon-lose">X</span>`;
  }

  const stats = game.stats;
  const totalClicks = stats.left.active + stats.chord.active;
  const threeBV = game.puzzleStats.threeBV;
  const threeBVPS = (threeBV / timeTaken).toFixed(2);
  const efficiency = totalClicks > 0 ? ((threeBV / totalClicks) * 100).toFixed(2) : 0;

  const tableHTML = `
        <table class="stats-table">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Active</th>
                    <th>Wasted</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Left Clicks</td>
                    <td>${stats.left.active}</td>
                    <td>${stats.left.wasted}</td>
                </tr>
                <tr>
                    <td>Right Clicks</td>
                    <td>${stats.right.active}</td>
                    <td>${stats.right.wasted}</td>
                </tr>
                <tr>
                    <td>Chords</td>
                    <td>${stats.chord.active}</td>
                    <td>${stats.chord.wasted}</td>
                </tr>
                <tr>
                    <td>3BV</td>
                    <td colspan="2">${threeBV}</td>
                </tr>
                <tr>
                    <td>3BV/s</td>
                    <td colspan="2">${win ? threeBVPS : "N/A"}</td>
                </tr>
                <tr>
                    <td>Efficiency</td>
                    <td colspan="2">${win ? efficiency : "N/A"}%</td>
                </tr>
            </tbody>
        </table>
    `;

  text.innerHTML += tableHTML;
  modal.classList.add("visible");
}

document.addEventListener("game-reset", () => initGame());
document.addEventListener("play-sound", (e) => {
  let src;
  switch (e.detail) {
    case "click":
      src = CONFIG.ASSETS.SOUNDS.CLICK;
      break;
    case "flag":
      src = CONFIG.ASSETS.SOUNDS.FLAG;
      break;
  }
  if (src) new Audio(src).play().catch(() => {});
});

document.getElementById("msg-restart-btn").addEventListener("click", () => {
  initGame();
});

document.getElementById("version-tag").addEventListener("click", () => {
  document.getElementById("version-modal").style.display = "flex";
});

const closeVersionLog = () => {
  document.getElementById("version-modal").style.display = "none";
};

document
  .getElementById("close-log-btn")
  .addEventListener("click", closeVersionLog);
document
  .getElementById("close-log-x")
  .addEventListener("click", closeVersionLog);

const setActiveDifficultyButton = (val) => {
  difficultyButtons.forEach((btn) => {
    if (btn.dataset.diff === val) btn.classList.add("active");
    else btn.classList.remove("active");
  });
};

const attachDifficultyButtons = () => {
  difficultyButtons = Array.from(document.querySelectorAll(".difficulty-pill"));
  difficultyButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.diff;
      if (val === "CUSTOM") {
        setActiveDifficultyButton(val);
        document.getElementById("custom-modal").style.display = "flex";
        return;
      }
      currentDifficulty = val;
      setActiveDifficultyButton(val);
      initGame();
    });
  });
};

document.getElementById("custom-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const rows = parseInt(document.getElementById("custom-rows").value);
  const cols = parseInt(document.getElementById("custom-cols").value);
  const mines = parseInt(document.getElementById("custom-mines").value);

  CONFIG.DIFFICULTY.CUSTOM = { rows, cols, mines };
  currentDifficulty = "CUSTOM";

  document.getElementById("custom-modal").style.display = "none";
  setActiveDifficultyButton("CUSTOM");
  initGame();
});

document.getElementById("zoom-select").addEventListener("change", (e) => {
  const size = parseInt(e.target.value);
  const scale = (size / 48).toFixed(2);
  document.documentElement.style.setProperty("--game-scale", scale);
});

loadAssets().then(() => {
  attachDifficultyButtons();
  setActiveDifficultyButton(currentDifficulty);
  initGame();
});

let keySequence = [];
document.addEventListener('keydown', (e) => {
    keySequence.push(e.key);
    if (keySequence.length > 11) {
        keySequence.shift();
    }
    if (keySequence.join('').toLowerCase() === 'minesweeper') {
        game.forceWin();
    }
});
