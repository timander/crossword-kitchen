// Wires the sheet, player, toolbar, notices, editor drawer, and printing to the store.

import { generate } from "../core/generator.ts";
import { buildPuzzle, check, type Puzzle } from "../core/puzzle.ts";
import type { AppState } from "../core/state.ts";
import { generatorInput, signature } from "../core/words.ts";
import { byId, debounce, el } from "./dom.ts";
import { confetti, toast } from "./fx.ts";
import { createSheetLayout } from "./layout.ts";
import { createPlayer } from "./player.ts";
import { clueLookup, renderSheet, type SheetRefs } from "./sheet.ts";
import { changed, type Store } from "./store.ts";

export interface App {
  generate: () => void;
  /** Re-render and re-fit the sheet (e.g. once web fonts finish loading). */
  render: () => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function mountApp(store: Store<AppState>, confirm = window.confirm.bind(window)): App {
  const sheet = byId("sheet", HTMLElement);
  const inner = byId("sheet-inner", HTMLElement);
  const generateBtn = byId("generate", HTMLButtonElement);
  const answersBtn = byId("toggle-answers", HTMLButtonElement);
  const editorBtn = byId("toggle-editor", HTMLButtonElement);
  const pageSelect = byId("page-size-select", HTMLSelectElement);
  const notice = byId("notice", HTMLElement);
  const editor = byId("editor", HTMLElement);
  const backdrop = byId("editor-backdrop", HTMLElement);

  const layout = createSheetLayout({
    sheet,
    inner,
    frame: byId("paper-frame", HTMLElement),
    pageRule: byId("page-size", HTMLStyleElement),
  });

  let reveal = false;
  let puzzle: Puzzle | null = null;
  let puzzleSource: AppState["layout"] = null;
  let refs: SheetRefs = { cells: new Map(), clues: new Map() };

  const currentPuzzle = () => {
    const { layout: source } = store.get();
    if (source !== puzzleSource) {
      puzzleSource = source;
      puzzle = source ? buildPuzzle(source) : null;
    }
    return puzzle;
  };

  const player = createPlayer({
    root: inner,
    store,
    view: () => {
      const p = currentPuzzle();
      return p ? { puzzle: p, refs, reveal } : null;
    },
    onSolved: () => {
      confetti();
      toast("🎉 Puzzle solved! Chef's kiss!", 3500);
    },
  });

  // ---------- rendering ----------

  function render() {
    renderLater.cancel();
    const s = store.get();
    const p = currentPuzzle();
    sheet.classList.toggle("revealed", reveal);
    answersBtn.setAttribute("aria-pressed", String(reveal));
    refs = renderSheet(inner, {
      title: s.title,
      description: s.description,
      nameLine: s.nameLine,
      wordBank: s.wordBank,
      puzzle: p,
      clues: clueLookup(s.words),
      entries: s.entries,
      reveal,
    });
    layout.apply(p?.cols ?? 0);
    player.refresh();
  }
  const renderLater = debounce(render, 120);

  function updateNotice() {
    const s = store.get();
    const stale = !!s.layout && signature(s.words) !== s.layoutKey;
    const unplaced = s.layout?.unplaced ?? [];
    const lines: Node[] = [];
    if (stale)
      lines.push(
        el(
          "p",
          {},
          "✏️ Your word list changed. Press ",
          el("b", { textContent: "Regenerate" }),
          " to rebuild the puzzle.",
        ),
      );
    if (unplaced.length > 0) {
      const names = unplaced.map((w) => w.word.toUpperCase()).join(", ");
      lines.push(
        el(
          "p",
          {},
          "🤔 Couldn't connect ",
          el("b", { textContent: names }),
          " to the rest of the puzzle. Regenerate to try again, or add a word that shares letters with ",
          unplaced.length > 1 ? "them." : "it.",
        ),
      );
    }
    notice.replaceChildren(...lines);
    notice.hidden = lines.length === 0;
    generateBtn.classList.toggle("pulse", stale || !s.layout);
    generateBtn.textContent = s.layout ? "🔀 Regenerate" : "✨ Generate";
  }

  function applyChrome() {
    const s = store.get();
    document.body.classList.toggle("editor-hidden", !s.editorOpen);
    editor.hidden = !s.editorOpen;
    backdrop.hidden = !s.editorOpen;
    editorBtn.setAttribute("aria-expanded", String(s.editorOpen));
    editorBtn.textContent = s.editorOpen ? "✕ Close" : "✏️ Customize";
    pageSelect.value = s.pageSize;
    layout.setPageSize(s.pageSize);
  }

  store.subscribe((s, prev) => {
    if (changed(s, prev, "editorOpen", "pageSize")) applyChrome();
    if (changed(s, prev, "words", "layout", "layoutKey")) updateNotice();
    if (changed(s, prev, "layout", "nameLine", "wordBank", "pageSize", "editorOpen")) render();
    else if (changed(s, prev, "title", "description", "words")) renderLater();
  });

  // ---------- actions ----------

  function doGenerate() {
    const words = generatorInput(store.get().words);
    if (words.length < 2) {
      toast("Add at least two words first 🥄");
      return;
    }
    reveal = false;
    player.reset();
    const next = generate(words);
    store.set({ layout: next, layoutKey: signature(store.get().words), entries: {} });
    toast(`🔀 Fresh layout: ${plural(next.placements.length, "word")}, ${next.cols}×${next.rows} grid`);
  }

  generateBtn.addEventListener("click", doGenerate);

  answersBtn.addEventListener("click", () => {
    if (!currentPuzzle()) return;
    reveal = !reveal;
    render();
  });

  byId("check", HTMLButtonElement).addEventListener("click", () => {
    const p = currentPuzzle();
    if (!p) return;
    if (reveal) {
      reveal = false;
      render();
    }
    const { wrong, empty } = check(p, store.get().entries);
    player.markWrong(wrong);
    if (wrong.length > 0)
      toast(`${plural(wrong.length, "square")} need${wrong.length === 1 ? "s" : ""} another look 👀`);
    else if (empty > 0) toast(`So far so good! ${plural(empty, "square")} to go 🍳`);
    else toast("🎉 Every square is correct!");
  });

  byId("reset", HTMLButtonElement).addEventListener("click", () => {
    if (Object.keys(store.get().entries).length > 0 && !confirm("Erase all the letters typed into the grid?")) return;
    reveal = false;
    store.set({ entries: {} });
    render();
  });

  // ---------- editor drawer ----------
  // A side column on wide screens; on narrower ones it slides over the puzzle (see app.css).

  function openEditor() {
    store.set({ editorOpen: true });
    byId("close-editor", HTMLButtonElement).focus();
  }

  function closeEditor() {
    const hadFocus = editor.contains(document.activeElement);
    store.set({ editorOpen: false });
    if (hadFocus) editorBtn.focus();
  }

  editorBtn.addEventListener("click", () => {
    if (store.get().editorOpen) closeEditor();
    else openEditor();
  });
  byId("close-editor", HTMLButtonElement).addEventListener("click", closeEditor);
  backdrop.addEventListener("click", closeEditor);
  editor.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEditor();
  });

  pageSelect.addEventListener("change", () => {
    if (pageSelect.value === "letter" || pageSelect.value === "a4") store.set({ pageSize: pageSelect.value });
  });

  // ---------- printing ----------

  function print(asKey: boolean) {
    if (!currentPuzzle()) {
      toast("Generate a puzzle first ✨");
      return;
    }
    const previous = { reveal, title: document.title };
    reveal = asKey;
    render();
    // The document title becomes the default PDF file name.
    const name = store.get().title.trim() || "Crossword";
    document.title = asKey ? `${name} - Answer Key` : name;
    addEventListener(
      "afterprint",
      () => {
        document.title = previous.title;
        reveal = previous.reveal;
        render();
      },
      { once: true },
    );
    window.print();
  }

  byId("print-puzzle", HTMLButtonElement).addEventListener("click", () => {
    print(false);
  });
  byId("print-key", HTMLButtonElement).addEventListener("click", () => {
    print(true);
  });

  applyChrome();
  updateNotice();
  render();

  return { generate: doGenerate, render };
}
