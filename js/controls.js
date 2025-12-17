export class Controls {
    constructor(game, ui) {
        this.game = game;
        this.ui = ui;
        this.isMouseDown = false;
        this.touchStartTime = 0;
        this.longPressTimer = null;
        this.longPressDuration = 400; // ms
        this.lastTouchElement = null;

        // Bind methods to 'this' so they can be added/removed as listeners correctly
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

        // Mouse Events
        grid.addEventListener('mousedown', this.handleMouseDown);
        grid.addEventListener('mouseup', this.handleMouseUp);
        grid.addEventListener('mouseleave', this.handleMouseLeave);
        grid.addEventListener('contextmenu', this.handleContextMenu);

        // Touch Events (Mobile)
        grid.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        grid.addEventListener('touchend', this.handleTouchEnd);
        
        // Reset Button
        resetBtn.addEventListener('click', this.handleResetClick);
    }

    // New method to remove listeners prevents "stacking" games
    cleanup() {
        const grid = this.ui.gridContainer;
        const resetBtn = document.getElementById('reset-btn');

        if (grid) {
            grid.removeEventListener('mousedown', this.handleMouseDown);
            grid.removeEventListener('mouseup', this.handleMouseUp);
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
        this.isMouseDown = false;
        this.ui.setFace('normal');
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
        this.ui.setFace('scared'); // Face "ooh" while holding
    }

    handleMouseUp(e) {
        if (!this.isMouseDown || this.game.gameOver) return;
        this.isMouseDown = false;
        this.ui.setFace('normal');

        const cellData = this.getCellFromEvent(e);
        if (!cellData) return;
        const { r, c } = cellData;

        // Left Click (0)
        if (e.button === 0) {
            if (this.game.board[r][c].revealed) {
                // CHORDING: Allow left-click on revealed number to chord
                const chordingHappened = this.game.chord(r, c);
                if (chordingHappened) this.playSound('click');
            } else {
                this.game.reveal(r, c);
                this.playSound('click');
            }
        }
        // Middle Click (1) - CHORDING
        else if (e.button === 1) {
            const chordingHappened = this.game.chord(r, c);
            if (chordingHappened) this.playSound('click');
        }
        // Right Click (2) - FLAG
        else if (e.button === 2) {
            this.game.toggleFlag(r, c);
            this.playSound('flag');
        }

        this.ui.render(this.game);
    }

    handleTouchStart(e) {
        if (this.game.gameOver) return;
        // e.preventDefault(); // Prevents scroll, careful
        
        const cellData = this.getCellFromEvent(e);
        if (!cellData) return;

        this.lastTouchElement = cellData.target;
        this.touchStartTime = Date.now();
        this.ui.setFace('scared');

        // Long press detection
        this.longPressTimer = setTimeout(() => {
            this.game.toggleFlag(cellData.r, cellData.c);
            this.playSound('flag');
            this.ui.render(this.game);
            
            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(50);
            
            this.lastTouchElement = null; // Mark as handled
            this.ui.setFace('normal');
        }, this.longPressDuration);
    }

    handleTouchEnd(e) {
        clearTimeout(this.longPressTimer);
        this.ui.setFace('normal');

        // If lastTouchElement is null, it was already handled by long press
        if (!this.lastTouchElement) return;

        const timeDiff = Date.now() - this.touchStartTime;
        const cellData = this.getCellFromEvent(e);

        if (cellData && timeDiff < this.longPressDuration) {
             // Short tap = Reveal
             // (Or chord if already revealed)
             if (this.game.board[cellData.r][cellData.c].revealed) {
                 const chordingHappened = this.game.chord(cellData.r, cellData.c);
                 if (chordingHappened) this.playSound('click');
             } else {
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