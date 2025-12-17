import { CONFIG } from './config.js';

export class UI {
    constructor() {
        this.gridContainer = document.getElementById('grid-container');
        this.timerElement = document.getElementById('timer-val');
        this.minesElement = document.getElementById('mines-val');
        this.faceElement = document.getElementById('reset-btn');
        this.modal = document.getElementById('custom-modal');
        
        // Cache images
        this.imgCache = {};
    }

    // Optimized rendering using DocumentFragment
    initGrid(rows, cols) {
        this.gridContainer.innerHTML = '';
        
        // Set grid template
        this.gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
        const fragment = document.createDocumentFragment();

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.r = r;
                cell.dataset.c = c;
                
                // Accessibility
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}, Hidden`);

                // Initial Image (Tile)
                const img = document.createElement('img');
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

        // We only update changed cells in a real React/VirtualDOM setup, 
        // but for vanilla JS, we can iterate or rely on direct DOM updates during game logic.
        // Here we iterate for safety, but optimized approach would be specific cell updates.
        
        for (let r = 0; r < game.rows; r++) {
            for (let c = 0; c < game.cols; c++) {
                this.updateCell(r, c, game.board[r][c], game.gameOver);
            }
        }
    }

    updateCell(r, c, cellData, isGameOver) {
        // Find cell by dataset - optimization: could cache these in a 2D array
        const cell = this.gridContainer.children[r * this.gridContainer.style.gridTemplateColumns.split(' ').length + c];
        if (!cell) return; // gridTemplateColumns logic above is approximate, better to use index: r * cols + c

        // Correction: Getting children by index is safer
        const targetCell = this.gridContainer.children[(r * cellData.length) + c] || this.gridContainer.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
        
        if (!targetCell) return;
        
        const img = targetCell.querySelector('img');
        let newSrc = CONFIG.ASSETS.IMAGES.TILES.HIDDEN;
        let altText = "Hidden";

        if (cellData.revealed) {
            targetCell.classList.add('revealed');
            if (cellData.isMine) {
                // If it was flagged correctly, it stays a flag (usually)
                if (cellData.flagged) {
                     newSrc = CONFIG.ASSETS.IMAGES.ICONS.FLAG;
                } else if (cellData.exploded) {
                    // ONLY the one we clicked turns red
                    newSrc = CONFIG.ASSETS.IMAGES.ICONS.MINE_EXPLODED;
                } else {
                    // Others are just revealed mines
                    newSrc = CONFIG.ASSETS.IMAGES.ICONS.MINE;
                }
            } else {
                const num = cellData.neighborMines;
                newSrc = num === 0 
                    ? CONFIG.ASSETS.IMAGES.TILES.REVEALED 
                    : CONFIG.ASSETS.IMAGES.NUMBERS[num];
            }
            altText = cellData.isMine ? "Mine" : `${cellData.neighborMines} mines nearby`;

        } else if (cellData.flagged) {
            newSrc = CONFIG.ASSETS.IMAGES.ICONS.FLAG;
             if (isGameOver && !cellData.isMine) {
                // Wrong flag reveal
                newSrc = CONFIG.ASSETS.IMAGES.ICONS.FLAG_WRONG; 
            }
            altText = "Flagged";
        }

        // Only update DOM if src changed
        if (img.getAttribute('src') !== newSrc) {
            img.src = newSrc;
            targetCell.setAttribute('aria-label', altText);
        }
    }

    setFace(state) {
        const img = this.faceElement.querySelector('img');
        let src = CONFIG.ASSETS.IMAGES.UI.SMILEY_NORMAL;
        if (state === 'win') src = CONFIG.ASSETS.IMAGES.UI.SMILEY_WIN;
        else if (state === 'lose') src = CONFIG.ASSETS.IMAGES.UI.SMILEY_LOSE;
        else if (state === 'scared') src = CONFIG.ASSETS.IMAGES.UI.SMILEY_NORMAL; // Or a scared sprite if available

        if (img.src !== src) img.src = src;
    }

    updateTimer(seconds) {
        // Format to 3 digits: 001, 010, 999
        this.timerElement.innerText = seconds.toString().padStart(3, '0');
    }

    updateMineCount(count) {
        this.minesElement.innerText = count.toString().padStart(3, '0');
    }
}