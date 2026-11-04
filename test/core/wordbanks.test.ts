import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalize } from "../../src/core/words.ts";
import { DEFAULT_BANK, WORD_BANKS } from "../../src/wordbanks/index.ts";

describe("word banks", () => {
  it("are all registered, with unique ids matching file names", () => {
    const files = readdirSync(new URL("../../src/wordbanks/", import.meta.url))
      .filter((f) => !["index.ts", "types.ts"].includes(f))
      .map((f) => f.replace(/\.ts$/, ""));
    expect(WORD_BANKS.map((b) => b.id).sort()).toEqual(files.sort());
    expect(WORD_BANKS).toContain(DEFAULT_BANK);
  });

  it.each(WORD_BANKS.map((b) => [b.name, b] as const))("%s is well-formed", (_, bank) => {
    for (const field of ["name", "level", "title", "description"] as const) expect(bank[field].trim()).not.toBe("");
    expect(bank.words.length).toBeGreaterThanOrEqual(15);
    const answers = bank.words.map((w) => normalize(w.word));
    expect(new Set(answers).size).toBe(answers.length);
    for (const w of bank.words) {
      const answer = normalize(w.word);
      expect(answer.length, w.word).toBeGreaterThanOrEqual(2);
      expect(w.clue.trim(), w.word).not.toBe("");
      // A clue must not give away its own answer.
      expect(normalize(w.clue).includes(answer) && answer.length > 3, `${w.word}: ${w.clue}`).toBe(false);
    }
  });
});
