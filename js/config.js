export const CONFIG = {
  DIFFICULTY: {
    BEGINNER: { rows: 9, cols: 9, mines: 10 },
    INTERMEDIATE: { rows: 16, cols: 16, mines: 40 },
    EXPERT: { rows: 16, cols: 30, mines: 99 },
    CUSTOM: { rows: 20, cols: 20, mines: 50 },
  },
  ASSETS: {
    IMAGES: {
      TILES: {
        HIDDEN: "assets/images/tiles/tile.webp",
        REVEALED: "assets/images/tiles/tile-revealed.webp",
      },
      NUMBERS: [
        null, // 0 has no image
        "assets/images/numbers/1.webp",
        "assets/images/numbers/2.webp",
        "assets/images/numbers/3.webp",
        "assets/images/numbers/4.webp",
        "assets/images/numbers/5.webp",
        "assets/images/numbers/6.webp",
        "assets/images/numbers/7.webp",
        "assets/images/numbers/8.webp",
        "assets/images/numbers/cb0.webp",
        "assets/images/numbers/cb1.webp",
        "assets/images/numbers/cb2.webp",
        "assets/images/numbers/cb3.webp",
        "assets/images/numbers/cb4.webp",
        "assets/images/numbers/cb5.webp",
        "assets/images/numbers/cb6.webp",
        "assets/images/numbers/cb7.webp",
        "assets/images/numbers/cb8.webp",
        "assets/images/numbers/cb9.webp",
      ],
      ICONS: {
        FLAG: "assets/images/icons/flag.webp",
        FLAG_WRONG: "assets/images/icons/flag-wrong.webp",
        MINE: "assets/images/icons/mine.webp",
        MINE_EXPLODED: "assets/images/icons/mine-exploded.webp",
      },
      UI: {
        SMILEY_NORMAL: "assets/images/ui/smiley-normal.webp",
        SMILEY_WIN: "assets/images/ui/smiley-win.webp",
        SMILEY_LOSE: "assets/images/ui/smiley-lose.webp",
        SMILEY_PRESSED: "assets/images/ui/smiley-pressed.webp",
      },
    },
    FONTS: {
      DIGITAL: "assets/fonts/Seven Segment.ttf",
    },
  },
};
