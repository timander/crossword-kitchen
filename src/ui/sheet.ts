// Builds the printable sheet (title, grid, word bank, clues) from data.
// Pure rendering: no event handling and no state changes.

import type { Placement } from "../core/generator.ts";
import { cellKey, type CellKey, type Dir } from "../core/grid.ts";
import { wordId, type Entries, type Puzzle, type PuzzleCell } from "../core/puzzle.ts";
import { enumeration, normalize } from "../core/words.ts";
import { el } from "./dom.ts";

export interface SheetModel {
  title: string;
  description: string;
  nameLine: boolean;
  wordBank: boolean;
  puzzle: Puzzle | null;
  /** Current clue text by answer, so clue edits show without regenerating. */
  clues: ReadonlyMap<string, string>;
  entries: Entries;
  reveal: boolean;
}

interface CellRef {
  cell: PuzzleCell;
  box: HTMLDivElement;
  input: HTMLInputElement;
}

export interface SheetRefs {
  cells: Map<CellKey, CellRef>;
  clues: Map<string, HTMLLIElement>;
}

const NAME_FIELDS = ["Name", "Date", "Period"];

function header(model: SheetModel) {
  return el(
    "header",
    { class: "sheet-head" },
    el(
      "div",
      { class: "title-row" },
      el("h1", { class: "sheet-title", textContent: model.title.trim() || "Crossword Puzzle" }),
      model.reveal && el("span", { class: "key-badge", textContent: "Answer Key" }),
    ),
    model.nameLine &&
      el("div", { class: "name-line" }, ...NAME_FIELDS.map((label) => el("span", {}, `${label}:`, el("i")))),
    model.description.trim() && el("p", { class: "sheet-desc", textContent: model.description.trim() }),
  );
}

function cellLabel(cell: PuzzleCell) {
  const word = cell.across ?? cell.down;
  if (!word) return `Row ${cell.row + 1}, column ${cell.col + 1}`;
  const index = word.dir === "across" ? cell.col - word.col : cell.row - word.row;
  return `${word.number} ${word.dir}, letter ${index + 1} of ${word.answer.length}`;
}

function grid(puzzle: Puzzle, model: SheetModel, refs: SheetRefs) {
  const node = el("div", { class: "grid", attrs: { role: "group", "aria-label": "Crossword grid" } });
  node.style.setProperty("--cols", String(puzzle.cols));
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      const key = cellKey(r, c);
      const cell = puzzle.cells.get(key);
      if (!cell) {
        node.append(el("div", { class: "cell" }));
        continue;
      }
      const input = el("input", {
        type: "text",
        maxLength: 2,
        autocomplete: "off",
        spellcheck: false,
        readOnly: model.reveal,
        value: model.reveal ? cell.answer : (model.entries[key] ?? ""),
        dataset: { key },
        attrs: { autocapitalize: "characters", enterkeyhint: "next", "aria-label": cellLabel(cell) },
      });
      const box = el(
        "div",
        { class: "cell letter" },
        cell.number !== undefined && el("span", { class: "num", textContent: String(cell.number), ariaHidden: "true" }),
        input,
      );
      refs.cells.set(key, { cell, box, input });
      node.append(box);
    }
  }
  return el("div", { class: "grid-wrap" }, node);
}

function clueItem(word: Placement, model: SheetModel) {
  const enumText = enumeration(word.word);
  const clue = model.clues.get(word.answer) ?? word.clue;
  return el(
    "li",
    { dataset: { word: wordId(word) } },
    el("b", { textContent: String(word.number) }),
    el(
      "span",
      {},
      clue || "(no clue)",
      enumText && " ",
      enumText && el("span", { class: "enum", textContent: enumText }),
      el("span", { class: "ans", textContent: ` — ${word.word.toUpperCase()}` }),
    ),
  );
}

function clueList(puzzle: Puzzle, model: SheetModel, refs: SheetRefs, dir: Dir) {
  const heading = dir === "across" ? "Across" : "Down";
  const items = puzzle.words
    .filter((w) => w.dir === dir)
    .map((w) => {
      const li = clueItem(w, model);
      refs.clues.set(wordId(w), li);
      return li;
    });
  return el(
    "section",
    {},
    el("h3", { textContent: heading, dataset: { arrow: dir === "across" ? "→" : "↓" } }),
    el("ol", {}, ...items),
  );
}

function wordBank(puzzle: Puzzle) {
  const words = puzzle.words.map((w) => w.word.trim().toUpperCase()).sort();
  return el(
    "div",
    { class: "wordbank" },
    el("div", { class: "wordbank-title", textContent: "WORD BANK" }),
    ...words.map((w) => el("span", { textContent: w })),
  );
}

const emptyState = () =>
  el(
    "div",
    { class: "empty" },
    el("div", { class: "big", textContent: "🥣" }),
    el("p", { textContent: "Add some words and clues, then press Generate." }),
  );

/** Replaces the contents of `root` with the sheet and returns handles to its interactive parts. */
export function renderSheet(root: HTMLElement, model: SheetModel): SheetRefs {
  const refs: SheetRefs = { cells: new Map(), clues: new Map() };
  const { puzzle } = model;
  if (!puzzle || puzzle.cells.size === 0) {
    root.replaceChildren(header(model), emptyState());
    return refs;
  }
  root.replaceChildren(
    header(model),
    grid(puzzle, model, refs),
    ...(model.wordBank ? [wordBank(puzzle)] : []),
    el("div", { class: "clues" }, clueList(puzzle, model, refs, "across"), clueList(puzzle, model, refs, "down")),
  );
  return refs;
}

/** Current clue text keyed by answer letters. */
export function clueLookup(words: readonly { word: string; clue: string }[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const w of words) {
    const answer = normalize(w.word);
    if (answer && !map.has(answer)) map.set(answer, w.clue);
  }
  return map;
}
