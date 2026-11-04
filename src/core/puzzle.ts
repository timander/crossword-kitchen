// Read-only puzzle model built from a layout, plus the pure rules for
// moving around the grid and checking answers. No DOM here.

import type { Layout, Placement } from "./generator.ts";
import { cellKey, delta, otherDir, parseCellKey, type CellKey, type Dir } from "./grid.ts";

export interface PuzzleCell {
  key: CellKey;
  row: number;
  col: number;
  answer: string;
  number?: number;
  across?: Placement;
  down?: Placement;
}

export interface Puzzle {
  rows: number;
  cols: number;
  cells: ReadonlyMap<CellKey, PuzzleCell>;
  /** Across words by number, then down words by number. */
  words: readonly Placement[];
}

/** Letters typed by the player, keyed by cell. */
export type Entries = Readonly<Partial<Record<CellKey, string>>>;

export const wordId = (p: Placement) => `${p.dir}-${p.number}`;

export function cellsOf(p: Placement): CellKey[] {
  const [dr, dc] = delta(p.dir);
  return Array.from({ length: p.answer.length }, (_, i) => cellKey(p.row + dr * i, p.col + dc * i));
}

export function buildPuzzle(layout: Layout): Puzzle {
  const cells = new Map<CellKey, PuzzleCell>();
  for (const p of layout.placements) {
    cellsOf(p).forEach((key, i) => {
      const [row, col] = parseCellKey(key);
      const cell = cells.get(key) ?? { key, row, col, answer: p.answer.charAt(i) };
      cell[p.dir] = p;
      if (i === 0) cell.number = p.number;
      cells.set(key, cell);
    });
  }
  const words = [...layout.placements].sort((a, b) =>
    a.dir === b.dir ? a.number - b.number : a.dir === "across" ? -1 : 1,
  );
  return { rows: layout.rows, cols: layout.cols, cells, words };
}

/** The direction to use at a cell: the requested one if a word runs that way. */
export function usableDir(cell: PuzzleCell, wanted: Dir): Dir {
  return cell[wanted] ? wanted : otherDir(wanted);
}

/** The cell `step` letters along the current word, if there is one. */
export function stepInWord(puzzle: Puzzle, key: CellKey, dir: Dir, step: number): CellKey | undefined {
  const word = puzzle.cells.get(key)?.[dir];
  if (!word) return undefined;
  const keys = cellsOf(word);
  return keys[keys.indexOf(key) + step];
}

/** Nearest letter cell from `key` moving by (dr, dc), skipping blank squares. */
export function scan(puzzle: Puzzle, key: CellKey, dr: number, dc: number): CellKey | undefined {
  let [r, c] = parseCellKey(key);
  for (r += dr, c += dc; r >= 0 && c >= 0 && r < puzzle.rows && c < puzzle.cols; r += dr, c += dc) {
    const next = cellKey(r, c);
    if (puzzle.cells.has(next)) return next;
  }
  return undefined;
}

/** The word before/after `current` in clue order, wrapping around. */
export function adjacentWord(puzzle: Puzzle, current: Placement | undefined, step: number): Placement | undefined {
  const { words } = puzzle;
  const idx = current ? words.indexOf(current) : -1;
  if (idx < 0) return step > 0 ? words[0] : words.at(-1);
  return words[(((idx + step) % words.length) + words.length) % words.length];
}

export function firstEmptyCell(word: Placement, entries: Entries): CellKey {
  const keys = cellsOf(word);
  return keys.find((k) => !entries[k]) ?? cellKey(word.row, word.col);
}

export const isWordFilled = (word: Placement, entries: Entries) => cellsOf(word).every((k) => !!entries[k]);

export interface CheckResult {
  wrong: CellKey[];
  empty: number;
}

export function check(puzzle: Puzzle, entries: Entries): CheckResult {
  const wrong: CellKey[] = [];
  let empty = 0;
  for (const cell of puzzle.cells.values()) {
    const value = entries[cell.key];
    if (!value) empty++;
    else if (value !== cell.answer) wrong.push(cell.key);
  }
  return { wrong, empty };
}

export function isSolved(puzzle: Puzzle, entries: Entries): boolean {
  if (puzzle.cells.size === 0) return false;
  for (const cell of puzzle.cells.values()) if (entries[cell.key] !== cell.answer) return false;
  return true;
}
