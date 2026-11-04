import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { normalize } from "../src/generator.ts";
import { WORD_BANKS } from "../src/wordbanks/index.ts";

test("bank ids are unique and match their file names", () => {
  const ids = WORD_BANKS.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length);
  const files = readdirSync(new URL("../src/wordbanks/", import.meta.url))
    .filter((f) => !["index.ts", "types.ts"].includes(f))
    .map((f) => f.replace(/\.ts$/, ""));
  assert.deepEqual([...ids].sort(), files.sort(), "every bank file must be registered in index.ts");
});

for (const bank of WORD_BANKS) {
  test(`bank is well-formed: ${bank.name}`, () => {
    for (const field of ["name", "level", "title", "description"] as const) assert.ok(bank[field].trim(), field);
    const seen = new Set<string>();
    for (const w of bank.words) {
      const answer = normalize(w.word);
      assert.ok(answer.length >= 2, `"${w.word}" too short`);
      assert.ok(w.clue.trim(), `"${w.word}" has no clue`);
      assert.ok(!seen.has(answer), `"${w.word}" repeated`);
      seen.add(answer);
    }
  });
}
