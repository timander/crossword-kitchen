import { describe, expect, it } from "vitest";
import { generate, toGrid, type Layout } from "../../src/core/generator.ts";
import { WORD_BANKS } from "../../src/wordbanks/index.ts";

/** Seeded PRNG so failures are reproducible. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type At = (r: number, c: number) => string | null;

/** Every horizontal/vertical run of 2+ letters in the grid. */
function letterRuns(layout: Layout, at: At) {
  const runs = new Set<string>();
  const runFrom = (r: number, c: number, dr: number, dc: number) => {
    let s = "";
    for (let rr = r, cc = c; at(rr, cc); rr += dr, cc += dc) s += at(rr, cc) ?? "";
    return s;
  };
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      if (!at(r, c)) continue;
      for (const [dir, dr, dc] of [["across", 0, 1] as const, ["down", 1, 0] as const]) {
        const s = at(r - dr, c - dc) ? "" : runFrom(r, c, dr, dc);
        if (s.length > 1) runs.add(`${dir}:${r},${c}:${s}`);
      }
    }
  }
  return runs;
}

/** A flood fill from one letter reaches every letter. */
function expectConnected(layout: Layout, at: At) {
  const cells = new Set<string>();
  for (let r = 0; r < layout.rows; r++) for (let c = 0; c < layout.cols; c++) if (at(r, c)) cells.add(`${r},${c}`);
  const [first = ""] = cells;
  const seen = new Set([first]);
  const stack = [first];
  while (stack.length) {
    const [r = 0, c = 0] = (stack.pop() ?? "").split(",").map(Number);
    const unseen = [`${r + 1},${c}`, `${r - 1},${c}`, `${r},${c + 1}`, `${r},${c - 1}`].filter(
      (n) => cells.has(n) && !seen.has(n),
    );
    unseen.forEach((n) => seen.add(n));
    stack.push(...unseen);
  }
  expect(seen.size).toBe(cells.size);
}

/** Valid crossword: runs are exactly the placed words, connected, tight, numbered in reading order. */
function expectValid(layout: Layout) {
  const grid = toGrid(layout);
  const at: At = (r, c) => grid[r]?.[c] ?? null;
  expect(letterRuns(layout, at)).toEqual(
    new Set(layout.placements.map((p) => `${p.dir}:${p.row},${p.col}:${p.answer}`)),
  );
  expectConnected(layout, at);
  expect(layout.placements.some((p) => p.row === 0)).toBe(true);
  expect(layout.placements.some((p) => p.col === 0)).toBe(true);
  const starts = [...new Map(layout.placements.map((p) => [`${p.row},${p.col}`, p])).values()];
  expect(starts.map((p) => p.number)).toEqual(starts.map((_, i) => i + 1));
}

describe("generate", () => {
  it.each(WORD_BANKS.map((b) => [b.name, b] as const))("places every word: %s", (_, bank) => {
    for (let seed = 1; seed <= 5; seed++) {
      const layout = generate(bank.words, { random: mulberry32(seed) });
      expectValid(layout);
      expect(layout.unplaced).toEqual([]);
      expect(layout.placements).toHaveLength(bank.words.length);
    }
  });

  it("keeps the original word and clue on each placement", () => {
    const layout = generate([
      { word: "Sous vide", clue: "Water bath" },
      { word: "Sauce", clue: "Liquid" },
    ]);
    const sousVide = layout.placements.find((p) => p.answer === "SOUSVIDE");
    expect(sousVide).toMatchObject({ word: "Sous vide", clue: "Water bath" });
  });

  it("skips duplicates and short words and reports words that can't connect", () => {
    const layout = generate([
      { word: "apple", clue: "a" },
      { word: "Apple", clue: "dupe" },
      { word: "x", clue: "too short" },
      { word: "plate", clue: "b" },
      { word: "xyz", clue: "no shared letters" },
    ]);
    expectValid(layout);
    expect(layout.placements.map((p) => p.answer).sort()).toEqual(["APPLE", "PLATE"]);
    expect(layout.unplaced.map((w) => w.word)).toEqual(["xyz"]);
  });

  it("returns an empty layout for no usable words", () => {
    expect(generate([{ word: "a", clue: "" }])).toEqual({ rows: 0, cols: 0, placements: [], unplaced: [] });
  });

  it("lays out a single word in one row", () => {
    const layout = generate([{ word: "Whisk", clue: "" }], { random: () => 0.1 });
    expect(layout).toMatchObject({ rows: 1, cols: 5 });
    expect(layout.placements[0]).toMatchObject({ row: 0, col: 0, dir: "across", number: 1 });
  });

  it("stops after the time budget once the minimum attempts are done", () => {
    let calls = 0;
    let time = 0;
    generate(WORD_BANKS[0]?.words ?? [], { attempts: 1000, timeBudgetMs: 10, now: () => (calls++, (time += 1)) });
    expect(calls).toBeLessThan(100);
  });

  it("is deterministic for a given random source", () => {
    const words = WORD_BANKS[0]?.words ?? [];
    expect(generate(words, { random: mulberry32(7), attempts: 30 })).toEqual(
      generate(words, { random: mulberry32(7), attempts: 30 }),
    );
  });
});
