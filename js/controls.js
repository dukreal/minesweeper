export class Controls {
    constructor(game, ui) {
        this.game = game;
        this.ui = ui;
        this.isMouseDown = false;
        this.activeChordTargets = null; // Track highlighted cells
        this.touchStartTime = 0;
        this.longPressTimer = null;
        this.longPressDuration = 400; // ms
        this.lastTouchElement = null;

        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleResetClick = this.handleResetClick.bind(this);
    }

    init() {
        const grid = this.ui.gridContainer;
        const resetBtn = document.getElementById('reset-btn');

        grid.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.handleMouseUp);
        grid.addEventListener('mouseleave', this.handleMouseLeave);
        grid.addEventListener('contextmenu', this.handleContextMenu);

        grid.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        grid.addEventListener('touchend', this.handleTouchEnd);
        
        resetBtn.addEventListener('click', this.handleResetClick);
    }

    cleanup() {
        const grid = this.ui.gridContainer;
        const resetBtn = document.getElementById('reset-btn');

        if (grid) {
            grid.removeEventListener('mousedown', this.handleMouseDown);
            window.removeEventListener('mouseup', this.handleMouseUp);
            grid.removeEventListener('mouseleave', this.handleMouseLeave);
            grid.removeEventListener('contextmenu', this.handleContextMenu);
            grid.removeEventListener('touchstart', this.handleTouchStart);
            grid.removeEventListener('touchend', this.handleTouchEnd);
        }
        
        if (resetBtn) {
            resetBtn.removeEventListener('click', this.handleResetClick);
        }
    }

    getCellFromEvent(e) {
        const target = e.target.closest('.cell');
        if (!target) return null;
        const r = parseInt(target.dataset.r);
        const c = parseInt(target.dataset.c);
        return { r, c, target };
    }

    handleMouseLeave() {
        // Optional: clear highlights if needed
    }

    handleContextMenu(e) {
        e.preventDefault();
    }

    handleResetClick() {
        document.dispatchEvent(new CustomEvent('game-reset'));
    }

    handleMouseDown(e) {
        if (this.game.gameOver) return;
        
        const cellData = this.getCellFromEvent(e);
        if (!cellData) return;

        this.isMouseDown = true;
        this.ui.setFace('scared');

        const cell = this.game.board[cellData.r][cellData.c];
        
        // VISUAL FEEDBACK
        if (cell.revealed) {
            // Always highlight neighbors on press (even if flags don't match yet)
            const targets = this.game.getChordTargets(cellData.r, cellData.c);
            this.activeChordTargets = targets;
            this.ui.highlightNeighbors(this.game, targets, true);
        } else if (!cell.flagged && e.button === 0) {
             // Highlight single cell press
             this.ui.updateCell(cellData.r, cellData.c, cell, false, true);
        }
    }

    handleMouseUp(e) {
        if (!this.isMouseDown) return;
        this.isMouseDown = false;
        
        // 1. Clear Highlights immediately on release
        if (this.activeChordTargets) {
            this.ui.highlightNeighbors(this.game, this.activeChordTargets, false);
            this.activeChordTargets = null;
        }

        if (this.game.gameOver) {
            this.ui.setFace(this.game.won ? 'win' : 'lose');
            return;
        }
        this.ui.setFace('normal');

        const cellData = this.getCellFromEvent(e);
        if (!cellData) return;

        const { r, c } = cellData;

        // Left Click (0)
        if (e.button === 0) {
            if (this.game.board[r][c].revealed) {
                // Game logic decides if reveal actually happens
                const chordingHappened = this.game.chord(r, c);
                if (chordingHappened) this.playSound('click');
            } else if (!this.game.board[r][c].flagged) {
                this.game.reveal(r, c);
                this.playSound('click');
            }
        }
        // Middle Click (1)
        else if (e.button === 1) {
            const chordingHappened = this.game.chord(r, c);
            if (chordingHappened) this.playSound('click');
        }
        // Right Click (2)
        else if (e.button === 2) {
            if (!this.game.board[r][c].revealed) {
                this.game.toggleFlag(r, c);
                this.playSound('flag');
            }
        }

        this.ui.render(this.game);
    }

    handleTouchStart(e) {
        if (this.game.gameOver) return;
        
        const cellData = this.getCellFromEvent(e);
        if (!cellData) return;

        this.lastTouchElement = cellData.target;
        this.touchStartTime = Date.now();
        this.ui.setFace('scared');

        const cell = this.game.board[cellData.r][cellData.c];

        // VISUAL FEEDBACK (Mobile)
        if (cell.revealed) {
            const targets = this.game.getChordTargets(cellData.r, cellData.c);
            this.activeChordTargets = targets;
            this.ui.highlightNeighbors(this.game, targets, true);
        } else if (!cell.flagged) {
            this.ui.updateCell(cellData.r, cellData.c, cell, false, true);
        }

        // Long press detection for flagging
        this.longPressTimer = setTimeout(() => {
            // Cancel visual highlight before flagging
            if (this.activeChordTargets) {
                this.ui.highlightNeighbors(this.game, this.activeChordTargets, false);
                this.activeChordTargets = null;
            }
            this.ui.updateCell(cellData.r, cellData.c, cell, false, false);

            if (!this.game.board[cellData.r][cellData.c].revealed) {
                this.game.toggleFlag(cellData.r, cellData.c);
                this.playSound('flag');
                this.ui.render(this.game);
                if (navigator.vibrate) navigator.vibrate(50);
            }
            
            this.lastTouchElement = null; 
            this.ui.setFace('normal');
        }, this.longPressDuration);
    }

    handleTouchEnd(e) {
        clearTimeout(this.longPressTimer);
        this.ui.setFace('normal');

        // Clear Highlights
        if (this.activeChordTargets) {
            this.ui.highlightNeighbors(this.game, this.activeChordTargets, false);
            this.activeChordTargets = null;
        }

        if (!this.lastTouchElement) return;

        const timeDiff = Date.now() - this.touchStartTime;
        const cellData = this.getCellFromEvent(e);

        if (cellData && timeDiff < this.longPressDuration) {
             if (this.game.board[cellData.r][cellData.c].revealed) {
                 const chordingHappened = this.game.chord(cellData.r, cellData.c);
                 if (chordingHappened) this.playSound('click');
             } else if (!this.game.board[cellData.r][cellData.c].flagged) {
                 this.game.reveal(cellData.r, cellData.c);
                 this.playSound('click');
             }
             this.ui.render(this.game);
        }
    }
    
    playSound(type) {
        document.dispatchEvent(new CustomEvent('play-sound', { detail: type }));
    }
}