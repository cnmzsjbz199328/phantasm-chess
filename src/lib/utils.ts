/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Chess coordinate helpers
export function algebraicToIndex(coords: string): [number, number] {
  const col = coords.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 8 - parseInt(coords[1]);
  return [col, row];
}

export function indexToPosition(col: number, row: number): [number, number, number] {
  // Center is 0,0, each square is 1x1
  return [col - 3.5, 0, row - 3.5];
}
