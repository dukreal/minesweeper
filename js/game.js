export class MinesweeperGame {
    constructor(rows, cols, mines) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.board = [];
        this.gameOver = false;
        this.won = false;
        this.minesRemaining = mines;
        this.firstClick = true;
        this.onGameStateChange = null; 
        this.show3BVHighlights = false;
        
        // Statistics Tracking
        this.stats = {
            left: { active: 0, wasted: 0 },
            right: { active: 0, wasted: 0 },
            chord: { active: 0, wasted: 0 }
        };

        this.puzzleStats = {
            threeBV: 0,
            threeBVectors: []
        };

        this.initBoard();
    }

    initBoard() {
        this.board = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push({
                    isMine: false,
                    revealed: false,
                    flagged: false,
                    neighborMines: 0,
                    exploded: false
                });
            }
            this.board.push(row);
        }
    }

    placeMines(excludeR, excludeC) {
        let minesPlaced = 0;

        // With a certain probability, force one mine to be adjacent to the first click to "nerf" the opening
        if (this.mines > 0 && Math.random() < 0.4) {
            const neighbors = this.getNeighbors(excludeR, excludeC);
            if (neighbors.length > 0) {
                const randomNeighborIndex = Math.floor(Math.random() * neighbors.length);
                const [nr, nc] = neighbors[randomNeighborIndex];
                this.board[nr][nc].isMine = true;
                minesPlaced = 1;
            }
        }

        // Place the rest of the mines randomly
        while (minesPlaced < this.mines) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);

            // Ensure we don't place on the first-clicked cell or overwrite an existing mine
            if (!this.board[r][c].isMine && (r !== excludeR || c !== excludeC)) {
                this.board[r][c].isMine = true;
                minesPlaced++;
            }
        }

        this.calculateNeighbors();
        this.calculate3BV();
    }

    calculateNeighbors() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c].isMine) continue;
                let count = 0;
                this.getNeighbors(r, c).forEach(([nr, nc]) => {
                    if (this.board[nr][nc].isMine) count++;
                });
                this.board[r][c].neighborMines = count;
            }
        }
    }

    calculate3BV() {
        let threeBV = 0;
        const vectors = [];
        const visited = new Array(this.rows).fill(false).map(() => new Array(this.cols).fill(false));

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.board[r][c].isMine && !visited[r][c]) {
                    if (this.board[r][c].neighborMines === 0) {
                        threeBV++;
                        vectors.push([r,c]);
                        const queue = [[r, c]];
                        visited[r][c] = true;
                        while(queue.length > 0) {
                            const [cr, cc] = queue.shift();
                            this.getNeighbors(cr, cc).forEach(([nr, nc]) => {
                                if (!visited[nr][nc] && !this.board[nr][nc].isMine) {
                                    visited[nr][nc] = true;
                                    if (this.board[nr][nc].neighborMines === 0) {
                                        queue.push([nr, nc]);
                                    }
                                }
                            });
                        }
                    }
                }
            }
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.board[r][c].isMine && !visited[r][c]) {
                    threeBV++;
                    vectors.push([r,c]);
                }
            }
        }
        
        this.puzzleStats.threeBV = threeBV;
        this.puzzleStats.threeBVectors = vectors;
    }

    toggle3BVHighlights() {
        if (this.firstClick) return; // Can't show before board is generated
        this.show3BVHighlights = !this.show3BVHighlights;
        if (this.onGameStateChange) this.onGameStateChange({ type: 'ui-change' });
    }


    getNeighbors(r, c) {
        const neighbors = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const nr = r + i;
                const nc = c + j;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    neighbors.push([nr, nc]);
                }
            }
        }
        return neighbors;
    }

    reveal(r, c) {
        if (this.gameOver || this.board[r][c].flagged || this.board[r][c].revealed) return false;

        if (this.firstClick) {
            this.placeMines(r, c);
            this.firstClick = false;
        }

        const cell = this.board[r][c];
        cell.revealed = true;

        if (cell.isMine) {
            cell.exploded = true;
            this.endGame(false);
            return true;
        }

        if (cell.neighborMines === 0) {
            this.floodFill(r, c);
        }

        this.checkWin();
        if (this.onGameStateChange) this.onGameStateChange({ type: 'reveal', r, c });
        return true;
    }

    floodFill(startR, startC) {
        const queue = [[startR, startC]];
        const visited = new Set([`${startR},${startC}`]);

        while (queue.length > 0) {
            const [r, c] = queue.shift();
            const neighbors = this.getNeighbors(r, c);

            for (const [nr, nc] of neighbors) {
                const key = `${nr},${nc}`;
                const neighbor = this.board[nr][nc];

                if (!neighbor.revealed && !neighbor.flagged && !visited.has(key)) {
                    neighbor.revealed = true;
                    visited.add(key);

                    if (neighbor.neighborMines === 0) {
                        queue.push([nr, nc]);
                    }
                    
                    if (this.onGameStateChange) this.onGameStateChange({ type: 'reveal', r: nr, c: nc });
                }
            }
        }
    }

    chord(r, c) {
        if (this.gameOver || !this.board[r][c].revealed) return false;

        const cell = this.board[r][c];
        const neighbors = this.getNeighbors(r, c);
        
        const flagCount = neighbors.reduce((count, [nr, nc]) => {
            return count + (this.board[nr][nc].flagged ? 1 : 0);
        }, 0);

        if (flagCount === cell.neighborMines) {
            let revealedSomething = false;
            neighbors.forEach(([nr, nc]) => {
                if (!this.board[nr][nc].revealed && !this.board[nr][nc].flagged) {
                    this.reveal(nr, nc);
                    revealedSomething = true;
                }
            });
            return revealedSomething;
        }
        return false;
    }

    // Return neighbors even if flag count doesn't match for visual feedback
    getChordTargets(r, c) {
        if (this.gameOver || !this.board[r][c].revealed) return [];

        const neighbors = this.getNeighbors(r, c);
        
        return neighbors.filter(([nr, nc]) => 
            !this.board[nr][nc].revealed && !this.board[nr][nc].flagged
        );
    }

    toggleFlag(r, c) {
        if (this.gameOver || this.board[r][c].revealed) return false;

        const cell = this.board[r][c];
        cell.flagged = !cell.flagged;
        this.minesRemaining += cell.flagged ? -1 : 1;

        if (this.onGameStateChange) this.onGameStateChange({ type: 'flag', r, c, flagged: cell.flagged });
        return true;
    }

    checkWin() {
        let revealedCount = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c].revealed) revealedCount++;
            }
        }

        if (revealedCount === (this.rows * this.cols) - this.mines) {
            this.endGame(true);
        }
    }

    endGame(win) {
        this.gameOver = true;
        this.won = win;
        
        if (!win) {
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.board[r][c].isMine) {
                        this.board[r][c].revealed = true;
                    }
                }
            }
        } else {
            this.minesRemaining = 0;
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.board[r][c].isMine) {
                        this.board[r][c].flagged = true;
                    }
                }
            }
        }
        
        if (this.onGameStateChange) this.onGameStateChange({ type: 'gameOver', win });
    }

    forceWin() {
        if (this.gameOver) return;
        if (this.firstClick) {
            this.placeMines(-1, -1);
            this.firstClick = false;
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.board[r][c].isMine) {
                    this.board[r][c].revealed = true;
                }
            }
        }
        this.endGame(true);
    }
}