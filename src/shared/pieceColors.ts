import type { Side, PieceColorSet } from "./types";

export const SIDE_COLORS: Record<Side, PieceColorSet> = {
  w: {
    primary:   "#2a8fa8",
    secondary: "#8fa8b8",
    accent:    "#a88a20",
    dark:      "#071a2e",
    glow:      "#2aaabf",
  },
  b: {
    primary:   "#a02040",
    secondary: "#1e1020",
    accent:    "#5c1e9e",
    dark:      "#120308",
    glow:      "#a02040",
  },
};
