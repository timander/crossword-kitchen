// Shared grid vocabulary: directions and cell coordinates.

export type Dir = "across" | "down";

export const DIRECTIONS: readonly Dir[] = ["across", "down"];

/** "row,col" — used as a map key for grid cells. */
export type CellKey = `${number},${number}`;

export const cellKey = (row: number, col: number): CellKey => `${row},${col}`;

export function parseCellKey(key: CellKey): [row: number, col: number] {
  const [row = 0, col = 0] = key.split(",").map(Number);
  return [row, col];
}

/** Row/column step for one letter in a direction. */
export const delta = (dir: Dir): [dr: number, dc: number] => (dir === "across" ? [0, 1] : [1, 0]);

export const otherDir = (dir: Dir): Dir => (dir === "across" ? "down" : "across");
