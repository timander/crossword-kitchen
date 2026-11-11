// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Layout } from "../../src/core/generator.ts";
import { signature } from "../../src/core/words.ts";
import { $, $$, cellInput, click, key, mount, typeInto } from "./harness.ts";

//   0 1 2 3
// 0 D I C E      1-across DICE, 2-down COOK
// 1 . . O .
// 2 . . O .
// 3 . . K .
const words = [
  { word: "Dice", clue: "Cut into cubes" },
  { word: "Cook", clue: "Apply heat" },
];
const layout: Layout = {
  rows: 4,
  cols: 4,
  unplaced: [],
  placements: [
    { answer: "DICE", word: "Dice", clue: "Cut into cubes", row: 0, col: 0, dir: "across", number: 1 },
    { answer: "COOK", word: "Cook", clue: "Apply heat", row: 0, col: 2, dir: "down", number: 2 },
  ],
};
const fixed = () => mount({ words, layout, layoutKey: signature(words) });
const active = () => document.activeElement as HTMLInputElement;
const typeWord = (letters: string) => {
  for (const ch of letters) key(active(), ch);
};

const print = vi.fn();
beforeEach(() => {
  window.print = print;
});

describe("sheet", () => {
  it("renders the grid, numbers, and clues", () => {
    fixed();
    expect($$(".cell.letter")).toHaveLength(7);
    expect($$(".cell .num").map((n) => n.textContent)).toEqual(["1", "2"]);
    expect($$(".clues li").map((li) => li.textContent)).toEqual(["1Cut into cubes — DICE", "2Apply heat — COOK"]);
    expect(cellInput("0,0").getAttribute("aria-label")).toBe("1 across, letter 1 of 4");
  });

  it("generates a puzzle on first run", () => {
    const { store } = mount();
    expect(store.get().layout?.placements.length).toBeGreaterThan(10);
    expect($("#generate").textContent).toContain("Regenerate");
  });

  it("shows clue edits live and flags word edits as stale", () => {
    const { store } = fixed();
    typeInto($('[data-index="0"][data-field="clue"]', HTMLInputElement), "Small cubes");
    expect(store.get().words[0]?.clue).toBe("Small cubes");
    expect($("#notice").hidden).toBe(true);
    typeInto($('[data-index="0"][data-field="word"]', HTMLInputElement), "Dices");
    expect($("#notice").hidden).toBe(false);
    expect($("#notice").textContent).toContain("Regenerate");
  });
});

describe("playing", () => {
  it("types across, then switches direction at a crossing", () => {
    const { store } = fixed();
    cellInput("0,0").focus();
    typeWord("dice");
    expect(store.get().entries).toEqual({ "0,0": "D", "0,1": "I", "0,2": "C", "0,3": "E" });
    expect($('li[data-word="across-1"]').classList.contains("done")).toBe(true);

    cellInput("0,2").focus();
    key(active(), " ");
    key(active(), "c");
    expect(active().dataset.key).toBe("1,2");
    expect($('li[data-word="down-2"]').classList.contains("active")).toBe(true);
  });

  it("moves with arrows, tab, and backspace", () => {
    const { store } = fixed();
    cellInput("0,0").focus();
    key(active(), "ArrowRight");
    expect(active().dataset.key).toBe("0,1");
    key(active(), "Tab");
    expect(active().dataset.key).toBe("0,2");
    // Tab landed on 2-down, so the direction is already "down".
    key(active(), "ArrowDown");
    expect(active().dataset.key).toBe("1,2");
    key(active(), "ArrowLeft"); // no across word here and no letter to the left: stay put
    expect(active().dataset.key).toBe("1,2");
    key(active(), "ArrowUp");
    key(active(), "ArrowUp");
    expect(active().dataset.key).toBe("0,2");
    key(active(), "Tab", { shiftKey: true });
    expect(active().dataset.key).toBe("0,0");

    typeWord("di");
    key(active(), "Backspace");
    expect(store.get().entries).toEqual({ "0,0": "D" });
    key(active(), "Backspace");
    expect(store.get().entries).toEqual({});
    key(active(), "Escape");
    expect($$(".cell.active")).toHaveLength(0);
  });

  it("accepts letters from mobile keyboards via input events", () => {
    const { store } = fixed();
    cellInput("3,2").focus();
    typeInto(cellInput("3,2"), "k");
    expect(store.get().entries["3,2"]).toBe("K");
  });

  it("selects a word by clicking its clue", () => {
    fixed();
    click('li[data-word="down-2"]');
    expect(active().dataset.key).toBe("0,2");
  });

  it("checks answers and celebrates a solve", () => {
    fixed();
    cellInput("0,0").focus();
    typeWord("dixe");
    click("#check");
    expect($$(".cell.wrong").map((c) => c.querySelector("input")?.dataset.key)).toEqual(["0,2"]);
    expect($("#toast").textContent).toContain("1 square needs");

    cellInput("0,2").focus();
    typeWord("c");
    cellInput("1,2").focus();
    typeWord("ook");
    expect($("#sheet").classList.contains("solved")).toBe(true);
    expect($("#toast").textContent).toContain("solved");
  });

  it("reveals answers without touching the player's letters", () => {
    const { store } = fixed();
    cellInput("0,0").focus();
    typeWord("x");
    click("#toggle-answers");
    expect(cellInput("0,0").value).toBe("D");
    expect(cellInput("0,0").readOnly).toBe(true);
    click("#toggle-answers");
    expect(cellInput("0,0").value).toBe("X");
    expect(store.get().entries).toEqual({ "0,0": "X" });
  });

  it("clears the grid after confirming", () => {
    const { store, confirm } = fixed();
    cellInput("0,0").focus();
    typeWord("d");
    click("#reset");
    expect(confirm).toHaveBeenCalled();
    expect(store.get().entries).toEqual({});
    expect(cellInput("0,0").value).toBe("");
  });
});

describe("editor", () => {
  it("adds, edits, and removes words", () => {
    const { store } = fixed();
    click("#add-word");
    expect(store.get().words).toHaveLength(3);
    typeInto($('[data-index="2"][data-field="word"]', HTMLInputElement), "Sear");
    click('button.del[data-index="0"]');
    expect(store.get().words.map((w) => w.word)).toEqual(["Cook", "Sear"]);
    expect($("#word-count").textContent).toBe("2");
  });

  it("applies a bulk edit", () => {
    const { store } = fixed();
    click("#bulk-open");
    expect($("#bulk-text", HTMLTextAreaElement).value).toBe("Dice: Cut into cubes\nCook: Apply heat");
    $("#bulk-text", HTMLTextAreaElement).value = "Whisk: Beat eggs\nLadle | Serve soup";
    click("#bulk-apply");
    expect(store.get().words).toEqual([
      { word: "Whisk", clue: "Beat eggs" },
      { word: "Ladle", clue: "Serve soup" },
    ]);
  });

  it("warns about problems in the list", () => {
    fixed();
    typeInto($('[data-index="1"][data-field="word"]', HTMLInputElement), "dice");
    expect($("#warnings").textContent).toContain("listed more than once");
  });

  it("loads a word bank and generates", () => {
    const { store } = fixed();
    $("#bank-select", HTMLSelectElement).value = "adv-poultry";
    click("#bank-load");
    expect(store.get().bankId).toBe("adv-poultry");
    expect(store.get().layout?.placements.length).toBe(16);
    expect($("#title", HTMLInputElement).value).toContain("Poultry");
  });

  it("refuses to generate with fewer than two words", () => {
    const { store, app } = fixed();
    click("#clear-words");
    app.generate();
    expect(store.get().layout).toBe(layout);
    expect($("#toast").textContent).toContain("at least two words");
  });
});

describe("chrome", () => {
  it("starts with the editor closed, and opens and closes it from the toolbar", () => {
    const { store } = fixed();
    expect($("#editor").hidden).toBe(true);
    expect($("#editor-backdrop").hidden).toBe(true);
    expect($("#toggle-editor").getAttribute("aria-expanded")).toBe("false");

    click("#toggle-editor");
    expect(store.get().editorOpen).toBe(true);
    expect($("#editor").hidden).toBe(false);
    expect($("#editor-backdrop").hidden).toBe(false);
    expect($("#toggle-editor").getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe($("#close-editor"));

    click("#toggle-editor");
    expect($("#editor").hidden).toBe(true);
  });

  it.each([
    [
      "Done",
      () => {
        click("#close-editor");
      },
    ],
    [
      "the backdrop",
      () => {
        click("#editor-backdrop");
      },
    ],
    ["Escape", () => key($("#title"), "Escape")],
  ])("closes the editor with %s and returns focus to the toolbar", (_, close) => {
    const { store } = fixed();
    click("#toggle-editor");
    $("#title").focus();
    close();
    expect(store.get().editorOpen).toBe(false);
    expect($("#editor").hidden).toBe(true);
    expect(document.activeElement).toBe($("#toggle-editor"));
  });

  it("changes paper size", () => {
    const { store } = fixed();
    const select = $("#page-size-select", HTMLSelectElement);
    select.value = "a4";
    select.dispatchEvent(new Event("change"));
    expect(store.get().pageSize).toBe("a4");
    expect(document.documentElement.style.getPropertyValue("--page-w")).toBe("8.27in");
  });

  it("prints the key, then restores the playing view", () => {
    fixed();
    click("#print-key");
    expect(print).toHaveBeenCalled();
    expect($(".key-badge").textContent).toBe("Answer Key");
    expect(document.title).toContain("Answer Key");
    window.dispatchEvent(new Event("afterprint"));
    expect(document.querySelector(".key-badge")).toBeNull();
    expect(document.title).toBe("Crossword Kitchen");
  });
});
