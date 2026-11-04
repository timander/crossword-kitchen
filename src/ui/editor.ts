// The left-hand editor: word bank picker, sheet options, and the word/clue list.

import { MAX_DESCRIPTION_CHARS, MAX_TITLE_CHARS, stateFromBank, type AppState } from "../core/state.ts";
import { findIssues, formatBulk, generatorInput, LIMITS, parseBulk, signature, type WordRow } from "../core/words.ts";
import type { WordBank } from "../wordbanks/types.ts";
import { byId, el } from "./dom.ts";
import { toast } from "./fx.ts";
import type { Store } from "./store.ts";

export interface EditorDeps {
  store: Store<AppState>;
  banks: readonly WordBank[];
  onGenerate: () => void;
  confirm?: (message: string) => boolean;
}

const EMPTY_ROW: WordRow = { word: "", clue: "" };

export function mountEditor({ store, banks, onGenerate, confirm = window.confirm.bind(window) }: EditorDeps) {
  const bankSelect = byId("bank-select", HTMLSelectElement);
  const title = byId("title", HTMLInputElement);
  const description = byId("description", HTMLTextAreaElement);
  const optName = byId("opt-name", HTMLInputElement);
  const optBank = byId("opt-bank", HTMLInputElement);
  const list = byId("word-list", HTMLElement);
  const count = byId("word-count", HTMLElement);
  const warnings = byId("warnings", HTMLElement);
  const bulkDialog = byId("bulk-dialog", HTMLDialogElement);
  const bulkText = byId("bulk-text", HTMLTextAreaElement);

  title.maxLength = MAX_TITLE_CHARS;
  description.maxLength = MAX_DESCRIPTION_CHARS;

  const words = () => store.get().words;
  const setWords = (next: WordRow[]) => {
    store.set({ words: next.length > 0 ? next : [EMPTY_ROW] });
  };

  // ---------- bank picker ----------

  const groups = Map.groupBy(banks, (b) => b.level);
  bankSelect.replaceChildren(
    ...[...groups].map(([level, items]) =>
      el(
        "optgroup",
        { label: level },
        ...items.map((b) => el("option", { value: b.id, textContent: `${b.name} (${b.words.length} words)` })),
      ),
    ),
  );

  byId("bank-load", HTMLButtonElement).addEventListener("click", () => {
    const bank = banks.find((b) => b.id === bankSelect.value);
    if (!bank) return;
    const current = signature(words());
    if (current && current !== signature(bank.words) && !confirm(`Replace your current words with “${bank.name}”?`))
      return;
    const { nameLine, wordBank, pageSize, theme, editorOpen } = store.get();
    store.set(stateFromBank(bank, { nameLine, wordBank, pageSize, theme, editorOpen }));
    syncForm();
    renderRows();
    onGenerate();
  });

  // ---------- sheet options ----------

  function syncForm() {
    const s = store.get();
    title.value = s.title;
    description.value = s.description;
    optName.checked = s.nameLine;
    optBank.checked = s.wordBank;
    bankSelect.value = s.bankId;
  }

  title.addEventListener("input", () => {
    store.set({ title: title.value });
  });
  description.addEventListener("input", () => {
    store.set({ description: description.value });
  });
  optName.addEventListener("change", () => {
    store.set({ nameLine: optName.checked });
  });
  optBank.addEventListener("change", () => {
    store.set({ wordBank: optBank.checked });
  });

  // ---------- word rows ----------

  function row(w: WordRow, i: number) {
    const n = String(i + 1);
    const field = (name: "word" | "clue", max: number, placeholder: string) =>
      el("input", {
        type: "text",
        class: name === "word" ? "w" : "c",
        value: w[name],
        placeholder,
        maxLength: max,
        spellcheck: name === "clue",
        dataset: { index: String(i), field: name },
        attrs: { "aria-label": `${placeholder} ${n}` },
      });
    return el(
      "div",
      { class: "word-row" },
      el("span", { class: "idx", textContent: n, ariaHidden: "true" }),
      field("word", LIMITS.maxWordChars, "Word"),
      field("clue", LIMITS.maxClueChars, "Clue"),
      el("button", {
        type: "button",
        class: "del",
        textContent: "✕",
        title: "Remove word",
        dataset: { index: String(i) },
        attrs: { "aria-label": `Remove word ${n}` },
      }),
    );
  }

  function renderRows(focus?: { index: number; field: "word" | "clue" }) {
    list.replaceChildren(...words().map(row));
    if (focus)
      list.querySelector<HTMLInputElement>(`[data-index="${focus.index}"][data-field="${focus.field}"]`)?.focus();
    updateIssues();
  }

  function updateIssues() {
    const { messages, badRows } = findIssues(words());
    if (words().length >= LIMITS.maxWords) messages.push(`That's the maximum of ${LIMITS.maxWords} words.`);
    warnings.replaceChildren(...messages.map((m) => el("div", { textContent: m })));
    list.querySelectorAll(".word-row").forEach((r, i) => r.classList.toggle("bad", badRows.has(i)));
    count.textContent = String(generatorInput(words()).length);
  }

  function addRow() {
    if (words().length >= LIMITS.maxWords) {
      toast(`Puzzles can have up to ${LIMITS.maxWords} words.`);
      return;
    }
    setWords([...words(), EMPTY_ROW]);
    renderRows({ index: words().length - 1, field: "word" });
    list.lastElementChild?.scrollIntoView({ block: "nearest" });
  }

  const indexOf = (target: EventTarget | null) =>
    target instanceof HTMLElement && target.dataset.index ? Number(target.dataset.index) : -1;

  list.addEventListener("input", (e) => {
    const i = indexOf(e.target);
    if (!(e.target instanceof HTMLInputElement) || i < 0) return;
    const fieldName = e.target.dataset.field === "clue" ? "clue" : "word";
    setWords(words().map((w, j) => (j === i ? { ...w, [fieldName]: (e.target as HTMLInputElement).value } : w)));
    updateIssues();
  });

  list.addEventListener("keydown", (e) => {
    const i = indexOf(e.target);
    if (e.key !== "Enter" || !(e.target instanceof HTMLInputElement) || i < 0) return;
    e.preventDefault();
    if (e.target.dataset.field === "word") renderRowsFocus(i, "clue");
    else if (i === words().length - 1) addRow();
    else renderRowsFocus(i + 1, "word");
  });

  const renderRowsFocus = (index: number, field: "word" | "clue") =>
    list.querySelector<HTMLInputElement>(`[data-index="${index}"][data-field="${field}"]`)?.focus();

  list.addEventListener("click", (e) => {
    if (!(e.target instanceof HTMLButtonElement) || !e.target.classList.contains("del")) return;
    const i = indexOf(e.target);
    setWords(words().filter((_, j) => j !== i));
    renderRows();
  });

  byId("add-word", HTMLButtonElement).addEventListener("click", addRow);

  byId("clear-words", HTMLButtonElement).addEventListener("click", () => {
    if (generatorInput(words()).length > 0 && !confirm("Remove all words and clues?")) return;
    setWords([]);
    renderRows({ index: 0, field: "word" });
  });

  // ---------- bulk edit ----------

  byId("bulk-open", HTMLButtonElement).addEventListener("click", () => {
    bulkText.value = formatBulk(words());
    bulkDialog.showModal();
    bulkText.focus();
  });
  byId("bulk-cancel", HTMLButtonElement).addEventListener("click", () => {
    bulkDialog.close();
  });
  byId("bulk-apply", HTMLButtonElement).addEventListener("click", () => {
    const rows = parseBulk(bulkText.value);
    bulkDialog.close();
    setWords(rows);
    renderRows();
    toast(`Loaded ${rows.length} words. Press Generate when you're ready.`);
  });

  syncForm();
  renderRows();
}
