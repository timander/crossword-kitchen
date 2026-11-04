import { test } from "node:test";
import assert from "node:assert/strict";
import { generate, normalize, enumeration, toGrid, type Layout } from "../src/generator.ts";
import { WORD_BANKS } from "../src/wordbanks/index.ts";

/** Every horizontal/vertical run of 2+ letters in the grid must be exactly one placed word. */
function assertValid(layout: Layout) {
  const grid = toGrid(layout);
  const words = new Set(layout.placements.map((p) => `${p.dir}:${p.row},${p.col}:${p.answer}`));
  const runs: string[] = [];
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      if (!grid[r][c]) continue;
      for (const dir of ["across", "down"] as const) {
        const [dr, dc] = dir === "across" ? [0, 1] : [1, 0];
        const pr = r - dr, pc = c - dc;
        if (grid[pr]?.[pc]) continue; // not a run start
        let s = "";
        for (let rr = r, cc = c; grid[rr]?.[cc]; rr += dr, cc += dc) s += grid[rr][cc];
        if (s.length > 1) runs.push(`${dir}:${r},${c}:${s}`);
      }
    }
  }
  assert.deepEqual(new Set(runs), words, "grid runs must match placed words exactly");

  // Connected: flood fill from first letter reaches every letter.
  const cells = layout.placements.flatMap((p) =>
    [...p.answer].map((_, i) => (p.dir === "across" ? `${p.row},${p.col + i}` : `${p.row + i},${p.col}`)),
  );
  const all = new Set(cells);
  const seen = new Set([cells[0]]);
  const stack = [cells[0]];
  while (stack.length) {
    const [r, c] = stack.pop()!.split(",").map(Number);
    for (const n of [`${r + 1},${c}`, `${r - 1},${c}`, `${r},${c + 1}`, `${r},${c - 1}`])
      if (all.has(n) && !seen.has(n)) (seen.add(n), stack.push(n));
  }
  assert.equal(seen.size, all.size, "grid must be connected");

  // Numbers ascend in reading order.
  const starts = [...new Map(layout.placements.map((p) => [`${p.row},${p.col}`, p])).values()];
  starts.forEach((p, i) => assert.equal(p.number, i + 1));
}

test("normalize and enumeration", () => {
  assert.equal(normalize("Pâte à choux"), "PATEACHOUX");
  assert.equal(enumeration("Sous vide"), "(4, 4)");
  assert.equal(enumeration("Roux"), "");
});

for (const bank of WORD_BANKS) {
  test(`places every word: ${bank.name}`, () => {
    for (let i = 0; i < 10; i++) {
      const layout = generate(bank.words);
      assertValid(layout);
      assert.equal(layout.unplaced.length, 0, `unplaced: ${layout.unplaced.map((w) => w.word)}`);
      if (i === 0) console.log(`  ${bank.name}: ${layout.cols}×${layout.rows}`);
    }
  });
}

test("skips duplicates and reports words that can't connect", () => {
  const layout = generate([
    { word: "apple", clue: "a" },
    { word: "Apple", clue: "dupe" },
    { word: "plate", clue: "b" },
    { word: "xyz", clue: "no shared letters" },
  ]);
  assertValid(layout);
  assert.equal(layout.placements.length, 2);
  assert.deepEqual(layout.unplaced.map((w) => w.word), ["xyz"]);
});
