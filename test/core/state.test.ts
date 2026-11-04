import { describe, expect, it } from "vitest";
import { parseState, stateFromBank, type AppState } from "../../src/core/state.ts";
import { generate } from "../../src/core/generator.ts";
import { LIMITS } from "../../src/core/words.ts";

const bank = {
  id: "test-bank",
  title: "Test Title",
  description: "Test description",
  words: [
    { word: "Whisk", clue: "Tool" },
    { word: "Sift", clue: "Strain flour" },
  ],
};

describe("stateFromBank", () => {
  it("uses the bank's content and keeps given preferences", () => {
    const s = stateFromBank(bank, { theme: "basil", wordBank: true });
    expect(s).toMatchObject({ bankId: "test-bank", title: "Test Title", theme: "basil", wordBank: true, layout: null });
    expect(s.words).toEqual(bank.words);
    expect(s.words[0]).not.toBe(bank.words[0]); // copied, not shared
  });

  it("has sensible defaults", () => {
    expect(stateFromBank(bank)).toEqual({
      bankId: "test-bank",
      title: "Test Title",
      description: "Test description",
      words: bank.words,
      nameLine: true,
      wordBank: false,
      pageSize: "letter",
      theme: "ink",
      editorOpen: true,
      layout: null,
      layoutKey: "",
      entries: {},
    });
  });
});

describe("parseState", () => {
  const valid = (): AppState => ({
    ...stateFromBank(bank),
    layout: generate(bank.words, { random: () => 0.3 }),
    entries: { "0,0": "W" },
  });

  it("round-trips a valid saved state", () => {
    const s = valid();
    expect(parseState(JSON.parse(JSON.stringify(s)), bank)).toEqual(s);
  });

  it.each([null, 42, "text", []])("rejects non-object input %j", (raw) => {
    expect(parseState(raw, bank)).toBeNull();
  });

  it("falls back to defaults for wrong types", () => {
    const s = parseState({ title: 5, theme: "neon", pageSize: "legal", nameLine: "yes", words: "nope" }, bank);
    expect(s).toMatchObject({ title: "Test Title", theme: "ink", pageSize: "letter", nameLine: true });
    expect(s?.words).toEqual([{ word: "", clue: "" }]);
  });

  it("truncates oversized strings and lists", () => {
    const words = Array.from({ length: 500 }, () => ({ word: "w".repeat(500), clue: "c".repeat(5000) }));
    const s = parseState({ title: "t".repeat(10_000), words }, bank);
    expect(s?.title.length).toBeLessThanOrEqual(120);
    expect(s?.words).toHaveLength(LIMITS.maxWords);
    expect(s?.words[0]?.clue).toHaveLength(LIMITS.maxClueChars);
  });

  it("drops layouts that don't fit their grid or have bad answers", () => {
    const base = valid();
    const layout = base.layout;
    if (!layout) throw new Error("expected layout");
    const tweak = (patch: object) => parseState({ ...base, layout: { ...layout, ...patch } }, bank)?.layout;
    expect(tweak({ rows: 0 })).toBeNull();
    expect(tweak({ cols: 1000 })).toBeNull();
    expect(tweak({ placements: [] })).toBeNull();
    expect(tweak({ placements: [{ ...layout.placements[0], answer: "<img>" }] })).toBeNull();
    expect(tweak({ placements: [{ ...layout.placements[0], dir: "diagonal" }] })).toBeNull();
    expect(tweak({ placements: [{ ...layout.placements[0], row: -1 }] })).toBeNull();
    expect(tweak({ placements: [{ ...layout.placements[0], col: layout.cols - 1, dir: "across" }] })).toBeNull();
    expect(parseState({ ...base, layout: "x" }, bank)?.layout).toBeNull();
  });

  it("keeps saved booleans and defaults missing strings", () => {
    const s = parseState({ nameLine: false, wordBank: true, editorOpen: false }, bank);
    expect(s).toMatchObject({ nameLine: false, wordBank: true, editorOpen: false, layoutKey: "" });
    expect(parseState({ nameLine: "false" }, bank)?.nameLine).toBe(true);
  });

  it("checks placement numbers and grid edges exactly", () => {
    const at = (p: object) => ({
      rows: 3,
      cols: 3,
      placements: [{ answer: "ABC", word: "abc", clue: "", row: 2, col: 0, dir: "across", number: 1, ...p }],
    });
    expect(parseState({ layout: at({}) }, bank)?.layout?.unplaced).toEqual([]);
    expect(parseState({ layout: at({ row: 3 }) }, bank)?.layout).toBeNull();
    expect(parseState({ layout: at({ row: 1.5 }) }, bank)?.layout).toBeNull();
    expect(parseState({ layout: at({ row: "2" }) }, bank)?.layout).toBeNull();
    expect(parseState({ layout: at({ dir: "down" }) }, bank)?.layout).toBeNull();
    expect(parseState({ layout: at({ dir: "up" }) }, bank)?.layout).toBeNull();
    expect(parseState({ layout: at({ number: 0 }) }, bank)?.layout).toBeNull();
    expect(parseState({ layout: { ...at({}), rows: 61 } }, bank)?.layout).toBeNull();
  });

  it("keeps only well-formed entries", () => {
    const s = parseState({ entries: { "0,0": "A", "1,1": "ab", "x,y": "B", "2,2": "c", "3,3": 7 } }, bank);
    expect(s?.entries).toEqual({ "0,0": "A" });
    expect(parseState({ entries: [] }, bank)?.entries).toEqual({});
  });
});
