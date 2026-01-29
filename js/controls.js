export class Controls {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.isMouseDown = false;
    this.activeChordTargets = null;
    this.touchStartTime = 0;
    this.longPressTimer = null;
    this.longPressDuration = 400;
    this.lastTouchElement = null;

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleResetClick = this.handleResetClick.bind(this);

    // Bindings for Face Button Interaction
    this.handleFaceDown = this.handleFaceDown.bind(this);
    this.handleFaceLeave = this.handleFaceLeave.bind(this);
  }

  init() {
    const grid = this.ui.gridContainer;
    const resetBtn = document.getElementById("reset-btn");

    grid.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mouseup", this.handleMouseUp);
    grid.addEventListener("mouseleave", this.handleMouseLeave);
    grid.addEventListener("contextmenu", this.handleContextMenu);

    // Passive: false allows e.preventDefault() to work for the ghost click fix
    grid.addEventListener("touchstart", this.handleTouchStart, {
      passive: false,
    });
    grid.addEventListener("touchend", this.handleTouchEnd);

    resetBtn.addEventListener("click", this.handleResetClick);

    // Face Button Interaction Listeners
    resetBtn.addEventListener("mousedown", this.handleFaceDown);
    resetBtn.addEventListener("mouseleave", this.handleFaceLeave);
    resetBtn.addEventListener("touchstart", this.handleFaceDown, {
      passive: true,
    });
    resetBtn.addEventListener("touchend", this.handleFaceLeave);
  }

  cleanup() {
    const grid = this.ui.gridContainer;
    const resetBtn = document.getElementById("reset-btn");

    if (grid) {
      grid.removeEventListener("mousedown", this.handleMouseDown);
      window.removeEventListener("mouseup", this.handleMouseUp);
      grid.removeEventListener("mouseleave", this.handleMouseLeave);
      grid.removeEventListener("contextmenu", this.handleContextMenu);
      grid.removeEventListener("touchstart", this.handleTouchStart);
      grid.removeEventListener("touchend", this.handleTouchEnd);
    }

    if (resetBtn) {
      resetBtn.removeEventListener("click", this.handleResetClick);
      resetBtn.removeEventListener("mousedown", this.handleFaceDown);
      resetBtn.removeEventListener("mouseleave", this.handleFaceLeave);
      resetBtn.removeEventListener("touchstart", this.handleFaceDown);
      resetBtn.removeEventListener("touchend", this.handleFaceLeave);
    }
  }

  getCellFromEvent(e) {
    const target = e.target.closest(".cell");
    if (!target) return null;
    const r = parseInt(target.dataset.r);
    const c = parseInt(target.dataset.c);
    return { r, c, target };
  }

  handleMouseLeave() {}

  handleContextMenu(e) {
    e.preventDefault();
  }

  handleResetClick() {
    document.dispatchEvent(new CustomEvent("game-reset"));
  }

  handleFaceDown(e) {
    if (e.type === "mousedown" && e.button !== 0) return;
    this.ui.setFace("scared");
  }

  handleFaceLeave() {
    if (this.game.gameOver) {
      this.ui.setFace(this.game.won ? "win" : "lose");
    } else {
      this.ui.setFace("normal");
    }
  }

  handleMouseDown(e) {
    if (this.game.gameOver) return;

    const cellData = this.getCellFromEvent(e);
    if (!cellData) return;

    this.isMouseDown = true;

    const cell = this.game.board[cellData.r][cellData.c];

    if (cell.revealed && e.button !== 2) {
      const targets = this.game.getChordTargets(cellData.r, cellData.c);
      this.activeChordTargets = targets;
      this.ui.highlightNeighbors(this.game, targets, true);
    } else if (!cell.flagged && e.button === 0) {
      this.ui.updateCell(cellData.r, cellData.c, this.game, false, true);
    }
  }

  handleMouseUp(e) {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;

    if (this.activeChordTargets) {
      this.ui.highlightNeighbors(this.game, this.activeChordTargets, false);
      this.activeChordTargets = null;
    }

    if (this.game.gameOver) {
      this.ui.setFace(this.game.won ? "win" : "lose");
      return;
    }
    this.ui.setFace("normal");

    const cellData = this.getCellFromEvent(e);
    if (!cellData) return;

    const { r, c } = cellData;

    if (e.button === 0) {
      if (this.game.board[r][c].revealed) {
        if (this.game.chord(r, c)) {
          this.game.stats.chord.active++;
          this.playSound("click");
        } else {
          if (this.game.board[r][c].neighborMines !== 0) {
            this.game.stats.chord.wasted++;
          }
        }
      } else if (!this.game.board[r][c].flagged) {
        if (this.game.reveal(r, c)) {
          this.game.stats.left.active++;
          this.playSound("click");
        } else {
          this.game.stats.left.wasted++;
        }
      } else {
        this.game.stats.left.wasted++;
      }
    } else if (e.button === 1) {
      if (this.game.chord(r, c)) {
        this.game.stats.chord.active++;
        this.playSound("click");
      } else {
        this.game.stats.chord.wasted++;
      }
    } else if (e.button === 2) {
      if (this.game.toggleFlag(r, c)) {
        if (this.game.board[r][c].flagged) {
          this.game.stats.right.active++;
        } else {
          this.game.stats.right.active--;
          this.game.stats.right.wasted += 2;
        }
        this.playSound("flag");
      }
    }

    this.ui.render(this.game);
  }

  handleTouchStart(e) {
    if (this.game.gameOver) return;

    e.preventDefault();

    const cellData = this.getCellFromEvent(e);
    if (!cellData) return;

    this.lastTouchElement = cellData.target;
    this.touchStartTime = Date.now();

    const cell = this.game.board[cellData.r][cellData.c];

    if (cell.revealed) {
      const targets = this.game.getChordTargets(cellData.r, cellData.c);
      this.activeChordTargets = targets;
      this.ui.highlightNeighbors(this.game, targets, true);
    } else if (!cell.flagged) {
      this.ui.updateCell(cellData.r, cellData.c, this.game, false, true);
    }

    this.longPressTimer = setTimeout(() => {
      if (this.activeChordTargets) {
        this.ui.highlightNeighbors(this.game, this.activeChordTargets, false);
        this.activeChordTargets = null;
      }
      this.ui.updateCell(cellData.r, cellData.c, this.game, false, false);

      if (!this.game.board[cellData.r][cellData.c].revealed) {
        if (this.game.toggleFlag(cellData.r, cellData.c)) {
          if (this.game.board[cellData.r][cellData.c].flagged) {
            this.game.stats.right.active++;
          } else {
            this.game.stats.right.active--;
            this.game.stats.right.wasted += 2;
          }
          this.playSound("flag");
        } else {
          this.game.stats.right.wasted++;
        }
        this.ui.render(this.game);
        if (navigator.vibrate) navigator.vibrate(50);
      } else {
        if (this.game.board[cellData.r][cellData.c].neighborMines !== 0) {
          this.game.stats.right.wasted++;
        }
      }

      this.lastTouchElement = null;
      this.ui.setFace("normal");
    }, this.longPressDuration);
  }

  handleTouchEnd(e) {
    e.preventDefault();

    clearTimeout(this.longPressTimer);
    this.ui.setFace("normal");

    if (this.activeChordTargets) {
      this.ui.highlightNeighbors(this.game, this.activeChordTargets, false);
      this.activeChordTargets = null;
    }

    if (!this.lastTouchElement) return;

    const timeDiff = Date.now() - this.touchStartTime;
    const cellData = this.getCellFromEvent(e);

    if (cellData && timeDiff < this.longPressDuration) {
      if (this.game.board[cellData.r][cellData.c].revealed) {
        if (this.game.chord(cellData.r, cellData.c)) {
          this.game.stats.chord.active++;
          this.playSound("click");
        } else {
          if (this.game.board[cellData.r][cellData.c].neighborMines !== 0) {
            this.game.stats.chord.wasted++;
          }
        }
      } else if (!this.game.board[cellData.r][cellData.c].flagged) {
        if (this.game.reveal(cellData.r, cellData.c)) {
          this.game.stats.left.active++;
          this.playSound("click");
        } else {
          this.game.stats.left.wasted++;
        }
      } else {
        this.game.stats.left.wasted++; // Tapped on flag
      }
      this.ui.render(this.game);
    }
  }

  playSound(type) {
    document.dispatchEvent(new CustomEvent("play-sound", { detail: type }));
  }
}
