// On-screen play: selection, typing, keyboard navigation, and progress.
// Uses event delegation on the sheet, so re-rendering never re-binds listeners.

import type { CellKey, Dir } from "../core/grid.ts";
import { otherDir } from "../core/grid.ts";
import {
  adjacentWord,
  cellsOf,
  firstEmptyCell,
  isSolved,
  isWordFilled,
  scan,
  stepInWord,
  usableDir,
  wordId,
  type Entries,
  type Puzzle,
} from "../core/puzzle.ts";
import type { AppState } from "../core/state.ts";
import type { SheetRefs } from "./sheet.ts";
import type { Store } from "./store.ts";

interface PlayView {
  puzzle: Puzzle;
  refs: SheetRefs;
  reveal: boolean;
}

export interface PlayerDeps {
  root: HTMLElement;
  store: Store<AppState>;
  view: () => PlayView | null;
  onSolved: () => void;
}

export interface Player {
  /** Re-apply highlight, values, and progress after the sheet re-renders. */
  refresh(): void;
  markWrong(keys: readonly CellKey[]): void;
  reset(): void;
}

const ARROWS: Partial<Record<string, [number, number]>> = {
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
};

const isLetter = (key: string) => /^[a-z]$/i.test(key);

export function createPlayer({ root, store, view, onSolved }: PlayerDeps): Player {
  let active: { key: CellKey; dir: Dir } | null = null;
  let wasSolved = false;

  const keyOf = (target: EventTarget | null): CellKey | undefined =>
    target instanceof HTMLInputElement && target.dataset.key ? (target.dataset.key as CellKey) : undefined;

  function highlight() {
    const v = view();
    if (!v) return;
    for (const ref of v.refs.cells.values()) ref.box.classList.remove("in-word", "active");
    for (const li of v.refs.clues.values()) li.classList.remove("active");
    const ref = active && v.refs.cells.get(active.key);
    const word = active && ref?.cell[active.dir];
    if (!ref || !word) return;
    for (const key of cellsOf(word)) v.refs.cells.get(key)?.box.classList.add("in-word");
    ref.box.classList.add("active");
    v.refs.clues.get(wordId(word))?.classList.add("active");
  }

  function select(key: CellKey, dir?: Dir, focus = true) {
    const ref = view()?.refs.cells.get(key);
    if (!ref) return;
    active = { key, dir: usableDir(ref.cell, dir ?? active?.dir ?? "across") };
    if (focus && document.activeElement !== ref.input) ref.input.focus({ preventScroll: true });
    highlight();
  }

  function toggleDir() {
    const cell = active && view()?.puzzle.cells.get(active.key);
    if (active && cell?.[otherDir(active.dir)]) select(active.key, otherDir(active.dir));
  }

  function setEntry(key: CellKey, letter: string) {
    const v = view();
    if (!v || v.reveal) return;
    const { [key]: _old, ...rest } = store.get().entries;
    const entries: Entries = letter ? { ...rest, [key]: letter } : rest;
    v.refs.cells.get(key)?.box.classList.remove("wrong");
    store.set({ entries });
  }

  function advance(step: number) {
    const v = view();
    if (!v || !active) return;
    const next = stepInWord(v.puzzle, active.key, active.dir, step);
    if (next) select(next, active.dir);
  }

  function moveArrow(dr: number, dc: number) {
    const v = view();
    if (!v || !active) return;
    const dir: Dir = dc !== 0 ? "across" : "down";
    if (active.dir !== dir && v.puzzle.cells.get(active.key)?.[dir]) {
      select(active.key, dir);
      return;
    }
    const next = scan(v.puzzle, active.key, dr, dc);
    if (next) select(next, dir);
  }

  function jumpWord(step: number) {
    const v = view();
    if (!v || !active) return;
    const word = adjacentWord(v.puzzle, v.puzzle.cells.get(active.key)?.[active.dir], step);
    if (word) select(firstEmptyCell(word, store.get().entries), word.dir);
  }

  function backspace(key: CellKey) {
    if (store.get().entries[key]) {
      setEntry(key, "");
      return;
    }
    advance(-1);
    if (active && active.key !== key) setEntry(active.key, "");
  }

  function onKeyDown(e: KeyboardEvent) {
    const key = keyOf(e.target);
    if (!key || e.metaKey || e.ctrlKey || e.altKey) return;
    const arrow = ARROWS[e.key];
    if (isLetter(e.key)) {
      setEntry(key, e.key.toUpperCase());
      advance(1);
    } else if (arrow) moveArrow(...arrow);
    else if (e.key === "Backspace") backspace(key);
    else if (e.key === "Delete") setEntry(key, "");
    else if (e.key === " " || e.key === "Enter") toggleDir();
    else if (e.key === "Tab") jumpWord(e.shiftKey ? -1 : 1);
    else if (e.key === "Escape") {
      active = null;
      highlight();
      if (e.target instanceof HTMLElement) e.target.blur();
      return;
    } else return;
    e.preventDefault();
  }

  // Mobile keyboards often report "Unidentified" in keydown; read the input instead.
  function onInput(e: Event) {
    const key = keyOf(e.target);
    if (!key || !(e.target instanceof HTMLInputElement)) return;
    const letter = e.target.value
      .replace(/[^a-z]/gi, "")
      .slice(-1)
      .toUpperCase();
    setEntry(key, letter);
    if (letter) advance(1);
  }

  let pointerOnActive = false;
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("input", onInput);
  root.addEventListener("focusin", (e) => {
    const key = keyOf(e.target);
    if (key && active?.key !== key) select(key, undefined, false);
  });
  root.addEventListener("pointerdown", (e) => {
    const key = keyOf(e.target);
    pointerOnActive = !!key && active?.key === key && document.activeElement === e.target;
  });
  root.addEventListener("click", (e) => {
    if (keyOf(e.target)) {
      if (pointerOnActive) toggleDir();
      return;
    }
    const li = e.target instanceof Element ? e.target.closest<HTMLElement>("li[data-word]") : null;
    const word = li && view()?.puzzle.words.find((w) => wordId(w) === li.dataset.word);
    if (word) select(firstEmptyCell(word, store.get().entries), word.dir);
  });

  /** Sync letters, finished clues, and the solved state with the store. */
  function syncProgress(celebrate: boolean) {
    const v = view();
    if (!v) return;
    const { entries } = store.get();
    for (const [key, ref] of v.refs.cells) {
      const value = v.reveal ? ref.cell.answer : (entries[key] ?? "");
      if (ref.input.value !== value) ref.input.value = value;
    }
    for (const word of v.puzzle.words) {
      v.refs.clues.get(wordId(word))?.classList.toggle("done", !v.reveal && isWordFilled(word, entries));
    }
    const solved = !v.reveal && isSolved(v.puzzle, entries);
    root.closest(".sheet")?.classList.toggle("solved", solved);
    if (solved && celebrate && !wasSolved) onSolved();
    wasSolved = solved;
  }

  store.subscribe((state, prev) => {
    if (state.entries !== prev.entries) syncProgress(true);
  });

  return {
    refresh() {
      const v = view();
      if (active && !v?.refs.cells.has(active.key)) active = null;
      highlight();
      syncProgress(false);
    },
    markWrong(keys) {
      const v = view();
      if (!v) return;
      const wrong = new Set(keys);
      for (const [key, ref] of v.refs.cells) ref.box.classList.toggle("wrong", wrong.has(key));
    },
    reset() {
      active = null;
      wasSolved = false;
    },
  };
}
