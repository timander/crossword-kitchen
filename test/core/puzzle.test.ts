import { describe, expect, it } from "vitest";
import type { Layout, Placement } from "../../src/core/generator.ts";
import {
  adjacentWord,
  buildPuzzle,
  cellsOf,
  check,
  firstEmptyCell,
  isSolved,
  isWordFilled,
  scan,
  stepInWord,
  usableDir,
  wordId,
} from "../../src/core/puzzle.ts";

//   0 1 2 3
// 0 D I C E
// 1 . . O .
// 2 . . O .
// 3 . . K .
const dice: Placement = { answer: "DICE", word: "Dice", clue: "Cut", row: 0, col: 0, dir: "across", number: 1 };
const cook: Placement = { answer: "COOK", word: "Cook", clue: "Heat", row: 0, col: 2, dir: "down", number: 2 };
const layout: Layout = { rows: 4, cols: 4, placements: [cook, dice], unplaced: [] };
const puzzle = buildPuzzle(layout);
const cell = (key: `${number},${number}`) => {
  const c = puzzle.cells.get(key);
  if (!c) throw new Error(`no cell ${key}`);
  return c;
};

describe("buildPuzzle", () => {
  it("indexes cells with answers, numbers, and both words at crossings", () => {
    expect(puzzle.cells.size).toBe(7);
    expect(cell("0,0")).toMatchObject({ answer: "D", number: 1, row: 0, col: 0 });
    expect(cell("0,2").across).toBe(dice);
    expect(cell("0,2").down).toBe(cook);
    expect(cell("0,2").number).toBe(2);
    expect(cell("1,2").number).toBeUndefined();
  });

  it("orders words across-first by number", () => {
    expect(puzzle.words.map(wordId)).toEqual(["across-1", "down-2"]);
  });
});

// Four words given out of order: 1-across ABC, 2-down BAD, 3-across DEN, 4-down EGG… (only ordering matters here)
const ordered = buildPuzzle({
  rows: 9,
  cols: 9,
  unplaced: [],
  placements: [
    { answer: "XX", word: "xx", clue: "", row: 6, col: 0, dir: "down", number: 4 },
    { answer: "YY", word: "yy", clue: "", row: 4, col: 0, dir: "across", number: 3 },
    { answer: "ZZ", word: "zz", clue: "", row: 2, col: 0, dir: "down", number: 2 },
    { answer: "WW", word: "ww", clue: "", row: 0, col: 0, dir: "across", number: 1 },
  ],
});

describe("word order", () => {
  it("sorts across words by number, then down words by number", () => {
    expect(ordered.words.map(wordId)).toEqual(["across-1", "across-3", "down-2", "down-4"]);
  });

  it("steps through words in clue order from any starting point", () => {
    const [a1, a3, d2, d4] = ordered.words;
    expect(adjacentWord(ordered, undefined, 1)).toBe(a1);
    expect(adjacentWord(ordered, undefined, -1)).toBe(d4);
    expect(adjacentWord(ordered, a1, 1)).toBe(a3);
    expect(adjacentWord(ordered, a3, 1)).toBe(d2);
    expect(adjacentWord(ordered, a1, -1)).toBe(d4);
    expect(adjacentWord(ordered, d4, 2)).toBe(a3);
  });
});

describe("navigation", () => {
  it("lists a word's cells", () => {
    expect(cellsOf(cook)).toEqual(["0,2", "1,2", "2,2", "3,2"]);
  });

  it("keeps the wanted direction only if a word runs that way", () => {
    expect(usableDir(cell("0,2"), "down")).toBe("down");
    expect(usableDir(cell("1,2"), "across")).toBe("down");
    expect(usableDir(cell("0,0"), "down")).toBe("across");
  });

  it("steps within a word and stops at its ends", () => {
    expect(stepInWord(puzzle, "0,0", "across", 1)).toBe("0,1");
    expect(stepInWord(puzzle, "0,3", "across", 1)).toBeUndefined();
    expect(stepInWord(puzzle, "1,2", "down", -1)).toBe("0,2");
    expect(stepInWord(puzzle, "1,2", "across", 1)).toBeUndefined();
    expect(stepInWord(puzzle, "3,3", "down", 1)).toBeUndefined();
  });

  it("scans past blank squares and stops at the edge", () => {
    expect(scan(puzzle, "3,2", -1, 0)).toBe("2,2");
    expect(scan(puzzle, "0,3", 1, 0)).toBeUndefined();
    expect(scan(puzzle, "0,0", 0, -1)).toBeUndefined();
    expect(scan(puzzle, "0,1", 0, 1)).toBe("0,2");
    expect(scan(puzzle, "0,1", 0, -1)).toBe("0,0");
    expect(scan(puzzle, "0,3", 0, 1)).toBeUndefined();
    expect(scan(puzzle, "3,2", 1, 0)).toBeUndefined();
    expect(scan(puzzle, "1,2", 0, 1)).toBeUndefined();
  });

  it("cycles through words in both directions", () => {
    expect(adjacentWord(puzzle, dice, 1)).toBe(cook);
    expect(adjacentWord(puzzle, cook, 1)).toBe(dice);
    expect(adjacentWord(puzzle, dice, -1)).toBe(cook);
    expect(adjacentWord(puzzle, undefined, 1)).toBe(dice);
    expect(adjacentWord(buildPuzzle({ ...layout, placements: [] }), undefined, 1)).toBeUndefined();
  });
});

describe("progress", () => {
  const solved = { "0,0": "D", "0,1": "I", "0,2": "C", "0,3": "E", "1,2": "O", "2,2": "O", "3,2": "K" } as const;

  it("finds the first empty cell of a word, or its start when full", () => {
    expect(firstEmptyCell(cook, { "0,2": "C" })).toBe("1,2");
    expect(firstEmptyCell(cook, solved)).toBe("0,2");
  });

  it("knows when a word is filled", () => {
    expect(isWordFilled(dice, solved)).toBe(true);
    expect(isWordFilled(dice, { "0,0": "D" })).toBe(false);
  });

  it("reports wrong and empty squares", () => {
    expect(check(puzzle, { "0,0": "D", "0,1": "X" })).toEqual({ wrong: ["0,1"], empty: 5 });
  });

  it("detects a solved puzzle", () => {
    expect(isSolved(puzzle, solved)).toBe(true);
    expect(isSolved(puzzle, { ...solved, "3,2": "X" })).toBe(false);
    expect(isSolved(buildPuzzle({ ...layout, placements: [] }), {})).toBe(false);
  });
});
