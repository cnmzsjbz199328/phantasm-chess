import type { Side, PieceColorSet } from "./types";

export const SIDE_COLORS: Record<Side, PieceColorSet> = {
  w: {
    primary:   "#00d2ff",
    secondary: "#c8d8e8",
    accent:    "#ffcc00",
    dark:      "#0a2540",
    glow:      "#00f2ff",
  },
  b: {
    primary:   "#ff0055",
    secondary: "#2a1a2e",
    accent:    "#8e2de2",
    dark:      "#1a0510",
    glow:      "#ff0055",
  },
};
