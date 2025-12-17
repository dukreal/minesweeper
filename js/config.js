export const CONFIG = {
    DIFFICULTY: {
        BEGINNER: { rows: 9, cols: 9, mines: 10 },
        INTERMEDIATE: { rows: 16, cols: 16, mines: 40 },
        EXPERT: { rows: 16, cols: 30, mines: 99 },
        CUSTOM: { rows: 20, cols: 20, mines: 50 } // Default custom values
    },
    ASSETS: {
        IMAGES: {
            TILES: {
                HIDDEN: 'assets/images/tiles/tile.png',
                REVEALED: 'assets/images/tiles/tile-revealed.png'
            },
            NUMBERS: [
                null, // 0 has no image
                'assets/images/numbers/1.png',
                'assets/images/numbers/2.png',
                'assets/images/numbers/3.png',
                'assets/images/numbers/4.png',
                'assets/images/numbers/5.png',
                'assets/images/numbers/6.png',
                'assets/images/numbers/7.png',
                'assets/images/numbers/8.png'
            ],
            ICONS: {
                FLAG: 'assets/images/icons/flag.png',
                FLAG_WRONG: 'assets/images/icons/flag-wrong.png',
                MINE: 'assets/images/icons/mine.png',
                MINE_EXPLODED: 'assets/images/icons/mine-exploded.png',
                MINE_WRONG: 'assets/images/icons/mine-wrong.png'
            },
            UI: {
                SMILEY_NORMAL: 'assets/images/ui/smiley-normal.png',
                SMILEY_WIN: 'assets/images/ui/smiley-win.png',
                SMILEY_LOSE: 'assets/images/ui/smiley-lose.png'
            }
        },
        SOUNDS: {
            CLICK: 'assets/sounds/click.wav',
            FLAG: 'assets/sounds/flag.wav',
            LOSE: 'assets/sounds/lose.mp3',
            WIN: 'assets/sounds/win.mp3' // Assuming you might have one, or reuse click
        },
        FONTS: {
            DIGITAL: 'assets/fonts/Seven Segment.ttf'
        }
    }
};