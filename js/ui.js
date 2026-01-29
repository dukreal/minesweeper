import { CONFIG } from "./config.js";

export class UI {
  constructor() {
    this.gridContainer = document.getElementById("grid-container");
    this.timerElement = document.getElementById("timer-val");
    this.minesElement = document.getElementById("mines-val");
    this.faceElement = document.getElementById("reset-btn");
    this.modal = document.getElementById("custom-modal");
  }

  initGrid(rows, cols) {
    this.gridContainer.innerHTML = "";
    this.gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    const fragment = document.createDocumentFragment();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.r = r;
        cell.dataset.c = c;

        cell.setAttribute("role", "gridcell");
        cell.setAttribute(
          "aria-label",
          `Row ${r + 1}, Column ${c + 1}, Hidden`
        );

        const img = document.createElement("img");
        img.src = CONFIG.ASSETS.IMAGES.TILES.HIDDEN;
        img.draggable = false;
        cell.appendChild(img);

        fragment.appendChild(cell);
      }
    }

    this.gridContainer.appendChild(fragment);
  }

  render(game) {
    this.updateMineCount(game.minesRemaining);
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        this.updateCell(r, c, game);
      }
    }
  }

  updateCell(r, c, game, isPressed = false) {
    const cellData = game.board[r][c];
    const isGameOver = game.gameOver;

    const targetCell = this.gridContainer.querySelector(
      `.cell[data-r="${r}"][data-c="${c}"]`
    );
    if (!targetCell) return;

    targetCell.classList.remove('highlight-3bv');
    if (game.show3BVHighlights && !cellData.revealed && !cellData.flagged) {
        const isVector = game.puzzleStats.threeBVectors.some(v => v[0] === r && v[1] === c);
        if (isVector) {
            targetCell.classList.add('highlight-3bv');
        }
    }

    const img = targetCell.querySelector("img");
    let newSrc = CONFIG.ASSETS.IMAGES.TILES.HIDDEN;
    let altText = "Hidden";

    if (isPressed && !cellData.revealed && !cellData.flagged) {
      newSrc = CONFIG.ASSETS.IMAGES.TILES.REVEALED;
    } else if (cellData.revealed) {
      targetCell.classList.add("revealed");
      if (cellData.isMine) {
        if (cellData.flagged) {
          newSrc = CONFIG.ASSETS.IMAGES.ICONS.FLAG;
        } else if (cellData.exploded) {
          newSrc = CONFIG.ASSETS.IMAGES.ICONS.MINE_EXPLODED;
        } else {
          newSrc = CONFIG.ASSETS.IMAGES.ICONS.MINE;
        }
      } else {
        const num = cellData.neighborMines;
        newSrc =
          num === 0
            ? CONFIG.ASSETS.IMAGES.TILES.REVEALED
            : CONFIG.ASSETS.IMAGES.NUMBERS[num];
      }
      altText = cellData.isMine
        ? "Mine"
        : `${cellData.neighborMines} mines nearby`;
    } else if (cellData.flagged) {
      newSrc = CONFIG.ASSETS.IMAGES.ICONS.FLAG;
      if (isGameOver && !cellData.isMine) {
        newSrc = CONFIG.ASSETS.IMAGES.ICONS.FLAG_WRONG;
      }
      altText = "Flagged";
    }

    if (img.getAttribute("src") !== newSrc) {
      img.src = newSrc;
      targetCell.setAttribute("aria-label", altText);
    }
  }

  highlightNeighbors(game, neighbors, active) {
    neighbors.forEach(([nr, nc]) => {
      this.updateCell(nr, nc, game, active);
    });
  }

  setFace(state) {
    const img = this.faceElement.querySelector("img");
    let src = CONFIG.ASSETS.IMAGES.UI.SMILEY_NORMAL;

    if (state === "win") src = CONFIG.ASSETS.IMAGES.UI.SMILEY_WIN;
    else if (state === "lose") src = CONFIG.ASSETS.IMAGES.UI.SMILEY_LOSE;
    else if (state === "scared") src = CONFIG.ASSETS.IMAGES.UI.SMILEY_PRESSED; // Updated to use the pressed image

    if (img.src !== src) img.src = src;
  }

  updateTimer(seconds) {
    this.updateCounter(this.timerElement, seconds);
  }

  updateMineCount(count) {
    this.updateCounter(this.minesElement, count);
  }

  updateCounter(element, value) {
    const paddedValue = value.toString().padStart(3, "0");
    element.innerHTML = "";

    for (let i = 0; i < 3; i++) {
      const digit = parseInt(paddedValue[i], 10);
      const img = document.createElement("img");
      img.src = CONFIG.ASSETS.IMAGES.NUMBERS[digit + 9];
      element.appendChild(img);
    }
  }
  displayOptimalClicks(cells) {
    // Backwards-compatible helper: map cells to highlight class
    const allCells = this.gridContainer.querySelectorAll('.cell');
    allCells.forEach(cell => cell.classList.remove('highlight-3bv'));

    if (cells && cells.length > 0) {
      cells.forEach(({ r, c }) => {
        const cellEl = this.gridContainer.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
        if (cellEl) cellEl.classList.add('highlight-3bv');
      });
    }
  }

  render(game) {
    this.updateMineCount(game.minesRemaining);
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        this.updateCell(r, c, game);
      }
    }
  }

  updateCell(r, c, game, isPressed = false) {
    const cellData = game.board[r][c];
    const isGameOver = game.gameOver;

    const targetCell = this.gridContainer.querySelector(
      `.cell[data-r="${r}"][data-c="${c}"]`
    );
    if (!targetCell) return;

    // Ensure 3BV highlight state is kept in sync
    targetCell.classList.remove('highlight-3bv');
    if (game.show3BVHighlights && !cellData.revealed && !cellData.flagged) {
      const isVector = (game.puzzleStats.threeBVectors || []).some(v => v[0] === r && v[1] === c);
      if (isVector) targetCell.classList.add('highlight-3bv');
    }

    const img = targetCell.querySelector("img");
    let newSrc = CONFIG.ASSETS.IMAGES.TILES.HIDDEN;
    let altText = "Hidden";

    if (isPressed && !cellData.revealed && !cellData.flagged) {
      newSrc = CONFIG.ASSETS.IMAGES.TILES.REVEALED;
    } else if (cellData.revealed) {
      targetCell.classList.add("revealed");
      if (cellData.isMine) {
        if (cellData.flagged) {
          newSrc = CONFIG.ASSETS.IMAGES.ICONS.FLAG;
        } else if (cellData.exploded) {
          newSrc = CONFIG.ASSETS.IMAGES.ICONS.MINE_EXPLODED;
        } else {
          newSrc = CONFIG.ASSETS.IMAGES.ICONS.MINE;
        }
      } else {
        const num = cellData.neighborMines;
        newSrc = num === 0 ? CONFIG.ASSETS.IMAGES.TILES.REVEALED : CONFIG.ASSETS.IMAGES.NUMBERS[num];
      }
      altText = cellData.isMine ? "Mine" : `${cellData.neighborMines} mines nearby`;
    } else if (cellData.flagged) {
      newSrc = CONFIG.ASSETS.IMAGES.ICONS.FLAG;
      if (isGameOver && !cellData.isMine) newSrc = CONFIG.ASSETS.IMAGES.ICONS.FLAG_WRONG;
      altText = "Flagged";
    }

    if (img.getAttribute("src") !== newSrc) {
      img.src = newSrc;
      targetCell.setAttribute("aria-label", altText);
    }
  }

  highlightNeighbors(game, neighbors, active) {
    neighbors.forEach(([nr, nc]) => {
      this.updateCell(nr, nc, game, active);
    });
  }
}