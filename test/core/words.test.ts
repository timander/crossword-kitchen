import { describe, expect, it } from "vitest";
import {
  clampWords,
  enumeration,
  findIssues,
  formatBulk,
  generatorInput,
  isUsable,
  LIMITS,
  normalize,
  parseBulk,
  signature,
} from "../../src/core/words.ts";

describe("normalize", () => {
  it("strips accents, spaces, and punctuation", () => {
    expect(normalize("Pâte à choux")).toBe("PATEACHOUX");
    expect(normalize("Eighty-six!")).toBe("EIGHTYSIX");
    expect(normalize("  ")).toBe("");
  });
});

describe("enumeration", () => {
  it("shows letter counts only for multi-word answers", () => {
    expect(enumeration("Sous vide")).toBe("(4, 4)");
    expect(enumeration("Walk-in")).toBe("(4, 2)");
    expect(enumeration("Pâte à choux")).toBe("(4, 1, 5)");
    expect(enumeration("Roux")).toBe("");
  });
});

describe("signature", () => {
  it("ignores order, case, and unusable rows", () => {
    const a = signature([
      { word: "Whisk", clue: "1" },
      { word: "dice", clue: "2" },
      { word: "x", clue: "" },
    ]);
    expect(a).toBe("DICE|WHISK");
    expect(
      signature([
        { word: "DICE", clue: "" },
        { word: "whisk", clue: "" },
      ]),
    ).toBe(a);
  });
});

describe("parseBulk", () => {
  it.each([
    ["Whisk: Tool", "Whisk", "Tool"],
    ["Whisk | Tool", "Whisk", "Tool"],
    ["Whisk\tTool", "Whisk", "Tool"],
    ["Whisk, Tool, with comma", "Whisk", "Tool, with comma"],
    ["Whisk = Tool", "Whisk", "Tool"],
    ["Sous vide - Water bath", "Sous vide", "Water bath"],
    ["Mise en place – Prep", "Mise en place", "Prep"],
    ["Mirepoix: 2:1:1 onion, carrot, celery", "Mirepoix", "2:1:1 onion, carrot, celery"],
    ["Lonely", "Lonely", ""],
  ])("parses %j", (line, word, clue) => {
    expect(parseBulk(line)).toEqual([{ word, clue }]);
  });

  it("skips blank lines and handles CRLF", () => {
    expect(parseBulk("A1: x\r\n\r\n  \nB2: y")).toHaveLength(2);
  });

  it("enforces input limits", () => {
    const many = Array.from({ length: 100 }, (_, i) => `w${i}: ${"c".repeat(500)}`).join("\n");
    const rows = parseBulk(many);
    expect(rows).toHaveLength(LIMITS.maxWords);
    expect(rows[0]?.clue).toHaveLength(LIMITS.maxClueChars);
  });

  it("round-trips with formatBulk, dropping empty rows", () => {
    const rows = [
      { word: "Whisk", clue: "Tool" },
      { word: "", clue: "" },
      { word: "Dice", clue: "Cut" },
    ];
    expect(formatBulk(rows)).toBe("Whisk: Tool\nDice: Cut");
    expect(parseBulk(formatBulk(rows))).toEqual([rows[0], rows[2]]);
  });
});

describe("clampWords", () => {
  it("truncates long words", () => {
    expect(clampWords([{ word: "w".repeat(99), clue: "" }])[0]?.word).toHaveLength(LIMITS.maxWordChars);
  });
});

describe("findIssues", () => {
  it("reports short, long, duplicate, and clueless words", () => {
    const { messages, badRows } = findIssues([
      { word: "a", clue: "x" },
      { word: "Dice", clue: "" },
      { word: "dice", clue: "y" },
      { word: "z".repeat(LIMITS.maxAnswerLetters + 1), clue: "long" },
      { word: "Whisk", clue: "fine" },
      { word: "", clue: "" },
    ]);
    expect(messages).toEqual([
      "“A” needs at least 2 letters.",
      "“DICE” is listed more than once.",
      "“DICE” has no clue yet.",
      `“${"Z".repeat(LIMITS.maxAnswerLetters + 1)}” is longer than ${LIMITS.maxAnswerLetters} letters.`,
    ]);
    expect([...badRows].sort()).toEqual([0, 1, 2, 3]);
  });

  it("is quiet for a clean list", () => {
    expect(findIssues([{ word: "Whisk", clue: "Tool" }])).toEqual({ messages: [], badRows: new Set() });
  });
});

describe("generatorInput / isUsable", () => {
  it("keeps only words the generator can place", () => {
    const rows = [
      { word: "ok", clue: "" },
      { word: "a", clue: "" },
      { word: "z".repeat(LIMITS.maxAnswerLetters), clue: "" },
      { word: "z".repeat(LIMITS.maxAnswerLetters + 1), clue: "" },
    ];
    expect(generatorInput(rows).map((r) => r.word.length)).toEqual([2, LIMITS.maxAnswerLetters]);
    expect(rows.map(isUsable)).toEqual([true, false, true, true]);
  });
});
