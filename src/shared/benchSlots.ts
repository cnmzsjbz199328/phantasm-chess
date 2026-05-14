import type { Vec3 } from "./types";

// White pieces bench: +X side (beyond column h)
// Black pieces bench: -X side (beyond column a)
// Each bench has 2 rows of 8 slots (15 pieces max per side)
const WHITE_ROWS = [6.5, 7.8];
const BLACK_ROWS = [-6.5, -7.8];
const SLOT_Z = [-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5];
// Ground level — matches WorldStage WORLD_GROUND_Y
const BENCH_Y = -0.7;

export function getBenchSlot(side: "w" | "b", index: number): Vec3 {
  const rows = side === "w" ? WHITE_ROWS : BLACK_ROWS;
  const row = rows[Math.floor(index / SLOT_Z.length)] ?? rows[rows.length - 1];
  const z = SLOT_Z[index % SLOT_Z.length] ?? 0;
  return [row, BENCH_Y, z];
}
