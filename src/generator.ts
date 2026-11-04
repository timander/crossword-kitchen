// Crossword layout engine: places words so they intersect, tries many
// randomized layouts, and keeps the most compact one.

export type Dir = "across" | "down";

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
  timeBudgetMs?: number; // stop early after this long
  random?: () => number;
}

/** Uppercase, strip accents and anything that isn't A–Z. */
export function normalize(word: string): string {
  return word
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

/** Letter counts per part for multi-word answers, e.g. "Sous vide" → "(4, 4)". */
export function enumeration(word: string): string {
  const parts = word
    .split(/[\s\-]+/)
    .map(normalize)
    .filter(Boolean);
  return parts.length > 1 ? `(${parts.map((p) => p.length).join(", ")})` : "";
}

interface Cell {
  ch: string;
  across: boolean;
  down: boolean;
}

interface Placed {
  input: WordInput;
  answer: string;
  row: number;
  col: number;
  dir: Dir;
}

const key = (r: number, c: number) => `${r},${c}`;
const step = (dir: Dir) => (dir === "across" ? [0, 1] : [1, 0]);

class Board {
  cells = new Map<string, Cell>();
  byLetter = new Map<string, [number, number][]>();
  placed: Placed[] = [];
  crossings = 0;
  minR = 0;
  maxR = 0;
  minC = 0;
  maxC = 0;

  has(r: number, c: number) {
    return this.cells.has(key(r, c));
  }

  /** Returns crossing count, or -1 if the word can't go here. */
  check(answer: string, row: number, col: number, dir: Dir): number {
    const [dr, dc] = step(dir);
    const len = answer.length;
    if (this.has(row - dr, col - dc) || this.has(row + dr * len, col + dc * len)) return -1;
    let crossings = 0;
    for (let i = 0; i < len; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      const cell = this.cells.get(key(r, c));
      if (cell) {
        if (cell.ch !== answer[i] || cell[dir]) return -1;
        crossings++;
      } else if (this.has(r + dc, c + dr) || this.has(r - dc, c - dr)) {
        // A new letter must not sit beside another word's letters.
        return -1;
      }
    }
    return crossings;
  }

  place(input: WordInput, answer: string, row: number, col: number, dir: Dir, crossings: number) {
    const [dr, dc] = step(dir);
    for (let i = 0; i < answer.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      const k = key(r, c);
      let cell = this.cells.get(k);
      if (!cell) {
        cell = { ch: answer[i], across: false, down: false };
        this.cells.set(k, cell);
        const list = this.byLetter.get(answer[i]) ?? [];
        list.push([r, c]);
        this.byLetter.set(answer[i], list);
      }
      cell[dir] = true;
    }
    const endR = row + dr * (answer.length - 1);
    const endC = col + dc * (answer.length - 1);
    if (this.placed.length === 0) {
      this.minR = row;
      this.minC = col;
      this.maxR = endR;
      this.maxC = endC;
    } else {
      this.minR = Math.min(this.minR, row);
      this.minC = Math.min(this.minC, col);
      this.maxR = Math.max(this.maxR, endR);
      this.maxC = Math.max(this.maxC, endC);
    }
    this.crossings += crossings;
    this.placed.push({ input, answer, row, col, dir });
  }

  get width() {
    return this.maxC - this.minC + 1;
  }
  get height() {
    return this.maxR - this.minR + 1;
  }
}

// The grid shares a page with the clues, so a slightly wide grid prints best.
const TARGET_ASPECT = 1.15;

function aspectPenalty(w: number, h: number) {
  return Math.abs(Math.log(w / h / TARGET_ASPECT));
}

function tryPlace(board: Board, input: WordInput, answer: string, rand: () => number): boolean {
  let best: { row: number; col: number; dir: Dir; crossings: number; score: number } | null = null;
  const seen = new Set<string>();
  for (let i = 0; i < answer.length; i++) {
    for (const [r, c] of board.byLetter.get(answer[i]) ?? []) {
      const cell = board.cells.get(key(r, c))!;
      for (const dir of ["across", "down"] as Dir[]) {
        if (cell[dir]) continue;
        const [dr, dc] = step(dir);
        const row = r - dr * i;
        const col = c - dc * i;
        const id = `${row},${col},${dir}`;
        if (seen.has(id)) continue;
        seen.add(id);
        const crossings = board.check(answer, row, col, dir);
        if (crossings < 1) continue;
        const endR = row + dr * (answer.length - 1);
        const endC = col + dc * (answer.length - 1);
        const w = Math.max(board.maxC, endC) - Math.min(board.minC, col) + 1;
        const h = Math.max(board.maxR, endR) - Math.min(board.minR, row) + 1;
        const growth = w * h - board.width * board.height;
        const score =
          crossings * 12 - growth * 0.35 - aspectPenalty(w, h) * 10 - Math.max(w, h) * 0.6 + rand() * 6;
        if (!best || score > best.score) best = { row, col, dir, crossings, score };
      }
    }
  }
  if (!best) return false;
  board.place(input, answer, best.row, best.col, best.dir, best.crossings);
  return true;
}

function buildOnce(words: { input: WordInput; answer: string }[], rand: () => number) {
  // Longer words first (they're easiest to cross), with some shuffling.
  const order = [...words].sort(
    (a, b) => b.answer.length + rand() * 4 - (a.answer.length + rand() * 4),
  );
  const board = new Board();
  const [first, ...rest] = order;
  board.place(first.input, first.answer, 0, 0, rand() < 0.5 ? "across" : "down", 0);

  let queue = rest;
  // Words that don't fit yet get another chance once more letters are down.
  for (let pass = 0; pass < 3 && queue.length; pass++) {
    const failed: typeof queue = [];
    for (const w of queue) if (!tryPlace(board, w.input, w.answer, rand)) failed.push(w);
    if (failed.length === queue.length) break;
    queue = failed;
  }
  return { board, unplaced: queue.map((w) => w.input) };
}

function fitness(board: Board) {
  const w = board.width;
  const h = board.height;
  // Cell size on paper is driven by the larger dimension, so keep it small.
  return (
    board.placed.length * 1000 +
    board.crossings * 6 -
    Math.max(w, h * TARGET_ASPECT) * 10 -
    w * h * 0.15 -
    aspectPenalty(w, h) * 15
  );
}

export function generate(inputs: WordInput[], options: GenerateOptions = {}): Layout {
  const rand = options.random ?? Math.random;
  const attempts = options.attempts ?? 400;
  const budget = options.timeBudgetMs ?? 250;

  const seen = new Set<string>();
  const words: { input: WordInput; answer: string }[] = [];
  for (const input of inputs) {
    const answer = normalize(input.word);
    if (answer.length < 2 || seen.has(answer)) continue;
    seen.add(answer);
    words.push({ input, answer });
  }
  if (words.length === 0) return { rows: 0, cols: 0, placements: [], unplaced: [] };

  const start = Date.now();
  let best: ReturnType<typeof buildOnce> | null = null;
  let bestScore = -Infinity;
  for (let i = 0; i < attempts; i++) {
    const result = buildOnce(words, rand);
    const score = fitness(result.board);
    if (score > bestScore) {
      best = result;
      bestScore = score;
    }
    if (Date.now() - start > budget && i >= 20) break;
  }

  const { board, unplaced } = best!;
  const placements = board.placed.map<Placement>((p) => ({
    answer: p.answer,
    word: p.input.word,
    clue: p.input.clue,
    row: p.row - board.minR,
    col: p.col - board.minC,
    dir: p.dir,
    number: 0,
  }));

  // Number start cells left-to-right, top-to-bottom.
  placements.sort((a, b) => a.row - b.row || a.col - b.col || (a.dir === "across" ? -1 : 1));
  const numbers = new Map<string, number>();
  for (const p of placements) {
    const k = key(p.row, p.col);
    if (!numbers.has(k)) numbers.set(k, numbers.size + 1);
    p.number = numbers.get(k)!;
  }

  return { rows: board.height, cols: board.width, placements, unplaced };
}

/** Letter grid for a layout (null = blank square). */
export function toGrid(layout: Layout): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: layout.rows }, () =>
    Array<string | null>(layout.cols).fill(null),
  );
  for (const p of layout.placements) {
    const [dr, dc] = step(p.dir);
    for (let i = 0; i < p.answer.length; i++) grid[p.row + dr * i][p.col + dc * i] = p.answer[i];
  }
  return grid;
}
