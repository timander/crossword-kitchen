// Crossword layout engine: places words so they intersect, tries many
// randomized layouts, and keeps the most compact one.

import { cellKey, delta, DIRECTIONS, type CellKey, type Dir } from "./grid.ts";
import { normalize } from "./words.ts";

export interface WordInput {
  word: string; // as typed, e.g. "Mise en place"
  clue: string;
}

export interface Placement {
  answer: string; // letters only, e.g. "MISEENPLACE"
  word: string; // original text
  clue: string;
  row: number;
  col: number;
  dir: Dir;
  number: number;
}

export interface Layout {
  rows: number;
  cols: number;
  placements: Placement[];
  unplaced: WordInput[];
}

export interface GenerateOptions {
  attempts?: number; // max layouts to try
  timeBudgetMs?: number; // stop early after this long (after a minimum number of attempts)
  random?: () => number;
  now?: () => number;
}

interface Candidate {
  input: WordInput;
  answer: string;
}

interface Placed extends Candidate {
  row: number;
  col: number;
  dir: Dir;
}

interface BoardCell {
  ch: string;
  across: boolean;
  down: boolean;
}

// The grid shares a page with the clues, so a slightly wide grid prints best.
const TARGET_ASPECT = 1.15;
const MIN_ATTEMPTS = 20;
const RETRY_PASSES = 3;

const aspectPenalty = (w: number, h: number) => Math.abs(Math.log(w / h / TARGET_ASPECT));

/** A partially built crossword on an unbounded grid. */
class Board {
  readonly cells = new Map<CellKey, BoardCell>();
  readonly byLetter = new Map<string, [number, number][]>();
  readonly placed: Placed[] = [];
  crossings = 0;
  minR = 0;
  maxR = 0;
  minC = 0;
  maxC = 0;

  get width() {
    return this.maxC - this.minC + 1;
  }

  get height() {
    return this.maxR - this.minR + 1;
  }

  private has(r: number, c: number) {
    return this.cells.has(cellKey(r, c));
  }

  /** Number of letters shared with existing words, or -1 if the word can't go here. */
  crossingsAt(answer: string, row: number, col: number, dir: Dir): number {
    const [dr, dc] = delta(dir);
    const len = answer.length;
    if (this.has(row - dr, col - dc) || this.has(row + dr * len, col + dc * len)) return -1;
    let crossings = 0;
    for (let i = 0; i < len; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      const cell = this.cells.get(cellKey(r, c));
      if (cell) {
        if (cell.ch !== answer.charAt(i) || cell[dir]) return -1;
        crossings++;
      } else if (this.has(r + dc, c + dr) || this.has(r - dc, c - dr)) {
        // A new letter must not sit beside another word's letters.
        return -1;
      }
    }
    return crossings;
  }

  place(word: Candidate, row: number, col: number, dir: Dir, crossings: number) {
    const [dr, dc] = delta(dir);
    const { answer } = word;
    for (let i = 0; i < answer.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      const key = cellKey(r, c);
      let cell = this.cells.get(key);
      if (!cell) {
        const ch = answer.charAt(i);
        cell = { ch, across: false, down: false };
        this.cells.set(key, cell);
        const list = this.byLetter.get(ch) ?? [];
        list.push([r, c]);
        this.byLetter.set(ch, list);
      }
      cell[dir] = true;
    }
    const endR = row + dr * (answer.length - 1);
    const endC = col + dc * (answer.length - 1);
    if (this.placed.length === 0) {
      [this.minR, this.minC, this.maxR, this.maxC] = [row, col, endR, endC];
    } else {
      this.minR = Math.min(this.minR, row);
      this.minC = Math.min(this.minC, col);
      this.maxR = Math.max(this.maxR, endR);
      this.maxC = Math.max(this.maxC, endC);
    }
    this.crossings += crossings;
    this.placed.push({ ...word, row, col, dir });
  }

  /** Finds the best-scoring spot that crosses an existing word and places it there. */
  tryPlace(word: Candidate, rand: () => number): boolean {
    const { answer } = word;
    let best: { row: number; col: number; dir: Dir; crossings: number; score: number } | undefined;
    const seen = new Set<string>();
    for (let i = 0; i < answer.length; i++) {
      for (const [r, c] of this.byLetter.get(answer.charAt(i)) ?? []) {
        for (const dir of DIRECTIONS) {
          const [dr, dc] = delta(dir);
          const row = r - dr * i;
          const col = c - dc * i;
          const id = `${row},${col},${dir}`;
          if (seen.has(id)) continue;
          seen.add(id);
          const crossings = this.crossingsAt(answer, row, col, dir);
          if (crossings < 1) continue;
          const score = this.scorePlacement(answer.length, row, col, dir, crossings) + rand() * 6;
          if (!best || score > best.score) best = { row, col, dir, crossings, score };
        }
      }
    }
    if (!best) return false;
    this.place(word, best.row, best.col, best.dir, best.crossings);
    return true;
  }

  /** Prefers many crossings and little growth toward a printable shape. */
  private scorePlacement(len: number, row: number, col: number, dir: Dir, crossings: number) {
    const [dr, dc] = delta(dir);
    const w = Math.max(this.maxC, col + dc * (len - 1)) - Math.min(this.minC, col) + 1;
    const h = Math.max(this.maxR, row + dr * (len - 1)) - Math.min(this.minR, row) + 1;
    const growth = w * h - this.width * this.height;
    return crossings * 12 - growth * 0.35 - aspectPenalty(w, h) * 10 - Math.max(w, h) * 0.6;
  }

  /** Overall quality: every placed word matters most, then compactness. */
  fitness() {
    const w = this.width;
    const h = this.height;
    // Cell size on paper is driven by the larger dimension, so keep it small.
    return (
      this.placed.length * 1000 +
      this.crossings * 6 -
      Math.max(w, h * TARGET_ASPECT) * 10 -
      w * h * 0.15 -
      aspectPenalty(w, h) * 15
    );
  }
}

function buildOnce(words: readonly Candidate[], rand: () => number) {
  // Longer words first (they're easiest to cross), with some shuffling.
  const [first, ...rest] = words
    .map((w) => ({ w, sortKey: w.answer.length + rand() * 4 }))
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ w }) => w);
  const board = new Board();
  if (!first) return { board, unplaced: [] };
  board.place(first, 0, 0, rand() < 0.5 ? "across" : "down", 0);

  let queue = rest;
  // Words that don't fit yet get another chance once more letters are down.
  for (let pass = 0; pass < RETRY_PASSES && queue.length > 0; pass++) {
    const failed = queue.filter((w) => !board.tryPlace(w, rand));
    if (failed.length === queue.length) break;
    queue = failed;
  }
  return { board, unplaced: queue.map((w) => w.input) };
}

/** Unique words with at least two letters, keeping the first spelling. */
function candidates(inputs: readonly WordInput[]): Candidate[] {
  const seen = new Set<string>();
  const result: Candidate[] = [];
  for (const input of inputs) {
    const answer = normalize(input.word);
    if (answer.length < 2 || seen.has(answer)) continue;
    seen.add(answer);
    result.push({ input, answer });
  }
  return result;
}

/** Converts the board to a 0-based layout with clue numbers in reading order. */
function toLayout(board: Board, unplaced: WordInput[]): Layout {
  const placements = board.placed.map<Placement>((p) => ({
    answer: p.answer,
    word: p.input.word,
    clue: p.input.clue,
    row: p.row - board.minR,
    col: p.col - board.minC,
    dir: p.dir,
    number: 0,
  }));
  placements.sort((a, b) => a.row - b.row || a.col - b.col || (a.dir === "across" ? -1 : 1));
  const numbers = new Map<CellKey, number>();
  for (const p of placements) {
    const key = cellKey(p.row, p.col);
    const number = numbers.get(key) ?? numbers.size + 1;
    numbers.set(key, number);
    p.number = number;
  }
  return { rows: board.height, cols: board.width, placements, unplaced };
}

export function generate(inputs: readonly WordInput[], options: GenerateOptions = {}): Layout {
  const { attempts = 400, timeBudgetMs = 250, random = Math.random, now = Date.now } = options;
  const words = candidates(inputs);
  if (words.length === 0) return { rows: 0, cols: 0, placements: [], unplaced: [] };

  const start = now();
  let best = buildOnce(words, random);
  let bestScore = best.board.fitness();
  for (let i = 1; i < attempts; i++) {
    if (i >= MIN_ATTEMPTS && now() - start > timeBudgetMs) break;
    const result = buildOnce(words, random);
    const score = result.board.fitness();
    if (score > bestScore) {
      best = result;
      bestScore = score;
    }
  }
  return toLayout(best.board, best.unplaced);
}

/** Letter grid for a layout (null = blank square). */
export function toGrid(layout: Layout): (string | null)[][] {
  const grid = Array.from({ length: layout.rows }, () => Array<string | null>(layout.cols).fill(null));
  for (const p of layout.placements) {
    const [dr, dc] = delta(p.dir);
    for (let i = 0; i < p.answer.length; i++) {
      const row = grid[p.row + dr * i];
      if (row) row[p.col + dc * i] = p.answer.charAt(i);
    }
  }
  return grid;
}
