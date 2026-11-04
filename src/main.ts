import { generate, enumeration, normalize, type Dir, type Layout, type Placement } from "./generator.ts";
import { WORD_BANKS } from "./wordbanks/index.ts";
import { el, toast, confetti } from "./fx.ts";

// ---------- state ----------

type PageSize = "letter" | "a4";

// Colors live in styles.css under [data-theme="…"]; this list drives the picker.
const THEMES = [
  { id: "tomato", name: "Tomato Gingham" },
  { id: "basil", name: "Basil Garden" },
  { id: "diner", name: "Blueberry Diner" },
  { id: "chalkboard", name: "Chalkboard Café" },
  { id: "berry", name: "Berry Pastry" },
  { id: "ink", name: "Minimal Ink (saves toner)" },
] as const;
type ThemeId = (typeof THEMES)[number]["id"];

interface WordRow {
  word: string;
  clue: string;
}

interface State {
  title: string;
  description: string;
  nameLine: boolean;
  wordBank: boolean;
  pageSize: PageSize;
  theme: ThemeId;
  bankId: string;
  words: WordRow[];
  layout: Layout | null;
  layoutKey: string; // word-list signature the layout was built from
  entries: Record<string, string>; // "r,c" → letter typed by the player
}

const STORAGE_KEY = "crossword-kitchen:v1";
const PAGES: Record<PageSize, { w: number; h: number; css: string }> = {
  letter: { w: 8.5, h: 11, css: "letter" },
  a4: { w: 8.27, h: 11.69, css: "A4" },
};
const DPI = 96;

function stateFromBank(bankId: string, base?: State): State {
  const bank = WORD_BANKS.find((b) => b.id === bankId) ?? WORD_BANKS[0];
  return {
    nameLine: true,
    wordBank: false,
    pageSize: "letter",
    theme: "tomato",
    ...base,
    bankId: bank.id,
    title: bank.title,
    description: bank.description,
    words: bank.words.map((w) => ({ ...w })),
    layout: null,
    layoutKey: "",
    entries: {},
  };
}

function load(): State | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as State) : null;
  } catch {
    return null;
  }
}

let saveTimer: number | undefined;
function save() {
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable (private mode, file:// restrictions) — not fatal */
    }
  }, 250);
}

const saved = load();
let state: State = saved ?? stateFromBank(WORD_BANKS[0].id);
if (!THEMES.some((t) => t.id === state.theme)) state.theme = "tomato";
if (!WORD_BANKS.some((b) => b.id === state.bankId)) state.bankId = WORD_BANKS[0].id;
let reveal = false;
let active: { key: string; dir: Dir } | null = null;

// ---------- elements ----------

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const bankSelect = $<HTMLSelectElement>("bank-select");
const titleInput = $<HTMLInputElement>("title");
const descInput = $<HTMLTextAreaElement>("description");
const optName = $<HTMLInputElement>("opt-name");
const optBank = $<HTMLInputElement>("opt-bank");
const wordList = $("word-list");
const wordCount = $("word-count");
const warnings = $("warnings");
const generateBtn = $<HTMLButtonElement>("generate");
const answersBtn = $<HTMLButtonElement>("toggle-answers");
const pageSelect = $<HTMLSelectElement>("page-size-select");
const notice = $("notice");
const sheet = $("sheet");
const inner = $("sheet-inner");
const paperWrap = sheet.parentElement!;
const bulkDialog = $<HTMLDialogElement>("bulk-dialog");
const bulkText = $<HTMLTextAreaElement>("bulk-text");

// ---------- word list helpers ----------

function validWords() {
  return state.words.filter((w) => normalize(w.word).length >= 2);
}

function signature(words: WordRow[]) {
  return words
    .map((w) => normalize(w.word))
    .filter((w) => w.length >= 2)
    .sort()
    .join("|");
}

function isStale() {
  return !!state.layout && signature(state.words) !== state.layoutKey;
}

function clueMap() {
  const map = new Map<string, string>();
  for (const w of state.words) {
    const k = normalize(w.word);
    if (k && !map.has(k)) map.set(k, w.clue);
  }
  return map;
}

// ---------- editor ----------

function renderBanks() {
  const groups = new Map<string, HTMLOptGroupElement>();
  for (const b of WORD_BANKS) {
    let g = groups.get(b.level);
    if (!g) {
      g = el("optgroup", { label: b.level });
      groups.set(b.level, g);
      bankSelect.append(g);
    }
    g.append(el("option", { value: b.id, textContent: `${b.name} (${b.words.length} words)` }));
  }
  bankSelect.value = state.bankId;
}

function renderWordList(focus?: { index: number; field: "w" | "c" }) {
  wordList.replaceChildren(
    ...state.words.map((w, i) => {
      const wordInput = el("input", {
        type: "text",
        class: "w",
        value: w.word,
        placeholder: "Word",
        spellcheck: false,
        attrs: { "aria-label": `Word ${i + 1}` },
      });
      const clueInput = el("input", {
        type: "text",
        class: "c",
        value: w.clue,
        placeholder: "Clue",
        attrs: { "aria-label": `Clue ${i + 1}` },
      });
      const del = el("button", { class: "del", textContent: "✕", title: "Remove word", type: "button" });

      wordInput.addEventListener("input", () => {
        state.words[i].word = wordInput.value;
        onWordsChanged();
      });
      clueInput.addEventListener("input", () => {
        state.words[i].clue = clueInput.value;
        onCluesChanged();
      });
      wordInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") clueInput.focus();
      });
      clueInput.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        if (i === state.words.length - 1) addWord();
        else (wordList.children[i + 1]?.querySelector(".w") as HTMLInputElement | null)?.focus();
      });
      del.addEventListener("click", () => {
        state.words.splice(i, 1);
        if (state.words.length === 0) state.words.push({ word: "", clue: "" });
        renderWordList();
        onWordsChanged();
      });

      return el("div", { class: "word-row" }, el("span", { class: "idx", textContent: `${i + 1}` }), wordInput, clueInput, del);
    }),
  );
  if (focus) {
    const row = wordList.children[focus.index];
    (row?.querySelector(focus.field === "w" ? ".w" : ".c") as HTMLInputElement | null)?.focus();
  }
  updateWarnings();
}

function addWord() {
  state.words.push({ word: "", clue: "" });
  renderWordList({ index: state.words.length - 1, field: "w" });
  wordList.lastElementChild?.scrollIntoView({ block: "nearest" });
  save();
}

function updateWarnings() {
  const counts = new Map<string, number>();
  for (const w of state.words) {
    const k = normalize(w.word);
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const msgs = new Set<string>();
  state.words.forEach((w, i) => {
    const k = normalize(w.word);
    const row = wordList.children[i] as HTMLElement | undefined;
    let bad = false;
    if (w.word.trim() && k.length < 2) {
      msgs.add(`“${w.word}” needs at least 2 letters.`);
      bad = true;
    }
    if (k && (counts.get(k) ?? 0) > 1) {
      msgs.add(`“${w.word.toUpperCase()}” is listed more than once.`);
      bad = true;
    }
    if (k.length >= 2 && !w.clue.trim()) msgs.add(`“${w.word.toUpperCase()}” has no clue yet.`);
    row?.classList.toggle("bad", bad);
  });
  warnings.replaceChildren(...[...msgs].map((m) => el("div", { textContent: m })));
  const n = validWords().length;
  wordCount.textContent = `${n}`;
}

function onWordsChanged() {
  updateWarnings();
  updateNotice();
  save();
}

function onCluesChanged() {
  scheduleSheetRender();
  updateWarnings();
  save();
}

// ---------- bulk edit ----------

function parseBulk(text: string): WordRow[] {
  const rows: WordRow[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const m = line.match(/^\s*(.+?)\s*(?:\t|\||:|,|=|\s[-–—]\s)\s*(.*)$/);
    rows.push(m ? { word: m[1].trim(), clue: m[2].trim() } : { word: line.trim(), clue: "" });
  }
  return rows;
}

$("bulk-open").addEventListener("click", () => {
  bulkText.value = state.words
    .filter((w) => w.word.trim() || w.clue.trim())
    .map((w) => `${w.word}: ${w.clue}`)
    .join("\n");
  bulkDialog.showModal();
  bulkText.focus();
});

bulkDialog.addEventListener("close", () => {
  if (bulkDialog.returnValue !== "apply") return;
  const rows = parseBulk(bulkText.value);
  state.words = rows.length ? rows : [{ word: "", clue: "" }];
  renderWordList();
  onWordsChanged();
  toast(`Loaded ${rows.length} words. Press Generate when you're ready.`);
});

$("clear-words").addEventListener("click", () => {
  if (validWords().length && !confirm("Remove all words and clues?")) return;
  state.words = [{ word: "", clue: "" }];
  renderWordList({ index: 0, field: "w" });
  onWordsChanged();
});

$("add-word").addEventListener("click", addWord);

$("bank-load").addEventListener("click", () => {
  const bank = WORD_BANKS.find((b) => b.id === bankSelect.value)!;
  const current = signature(state.words);
  const replacing = current && current !== signature(bank.words);
  if (replacing && !confirm(`Replace your current words with “${bank.name}”?`)) return;
  state = stateFromBank(bank.id, state);
  syncForm();
  renderWordList();
  doGenerate();
});

// ---------- sheet options ----------

function syncForm() {
  titleInput.value = state.title;
  descInput.value = state.description;
  optName.checked = state.nameLine;
  optBank.checked = state.wordBank;
  pageSelect.value = state.pageSize;
  bankSelect.value = state.bankId;
  applyPageSize();
}

titleInput.addEventListener("input", () => {
  state.title = titleInput.value;
  scheduleSheetRender();
  save();
});
descInput.addEventListener("input", () => {
  state.description = descInput.value;
  scheduleSheetRender();
  save();
});
optName.addEventListener("change", () => {
  state.nameLine = optName.checked;
  renderSheet();
  save();
});
optBank.addEventListener("change", () => {
  state.wordBank = optBank.checked;
  renderSheet();
  save();
});
pageSelect.addEventListener("change", () => {
  state.pageSize = pageSelect.value as PageSize;
  applyPageSize();
  renderSheet();
  save();
});

function applyPageSize() {
  const page = PAGES[state.pageSize];
  document.documentElement.style.setProperty("--page-w", `${page.w}in`);
  document.documentElement.style.setProperty("--page-h", `${page.h}in`);
  // Zero page margin: the sheet carries its own margin, which also keeps the
  // browser from stamping a URL/date header on the printout.
  $("page-size").textContent = `@page { size: ${page.css}; margin: 0; }`;
  updateZoom();
}

function updateZoom() {
  const full = PAGES[state.pageSize].w * DPI;
  const zoom = Math.min(1, paperWrap.clientWidth / full);
  sheet.style.setProperty("zoom", zoom < 1 ? String(zoom) : "");
}
new ResizeObserver(updateZoom).observe(paperWrap);

// ---------- themes ----------

const themePicker = $("theme-picker");

function renderThemes() {
  themePicker.replaceChildren(
    ...THEMES.map((t) => {
      const b = el("button", {
        type: "button",
        class: "swatch",
        title: t.name,
        attrs: { "data-theme": t.id, "aria-label": t.name, "aria-pressed": String(state.theme === t.id) },
      });
      b.addEventListener("click", () => {
        state.theme = t.id;
        applyTheme();
        save();
        toast(`🎨 ${t.name}`);
      });
      return b;
    }),
  );
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  for (const b of themePicker.children) b.setAttribute("aria-pressed", String(b.getAttribute("data-theme") === state.theme));
  // Title fonts differ per theme, which changes how much fits on the page.
  if (state.layout) fitToPage();
}

// ---------- notice ----------

function updateNotice() {
  const parts: string[] = [];
  if (isStale()) parts.push("✏️ Your word list changed. Press <b>Regenerate</b> to rebuild the puzzle.");
  const unplaced = state.layout?.unplaced ?? [];
  if (unplaced.length) {
    const names = unplaced.map((w) => `<b>${escapeHtml(w.word.toUpperCase())}</b>`).join(", ");
    parts.push(
      `🤔 Couldn't connect ${names} to the rest of the puzzle. Press Regenerate to try again, or add a word that shares letters with ${unplaced.length > 1 ? "them" : "it"}.`,
    );
  }
  notice.innerHTML = parts.join("<br>");
  notice.hidden = parts.length === 0;
  generateBtn.classList.toggle("pulse", isStale() || !state.layout);
  generateBtn.textContent = state.layout ? "🔀 Regenerate" : "✨ Generate";
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// ---------- generate ----------

function doGenerate() {
  const words = validWords();
  if (words.length < 2) {
    toast("Add at least two words first 🥄");
    return;
  }
  state.layout = generate(words);
  state.layoutKey = signature(state.words);
  state.entries = {};
  active = null;
  reveal = false;
  renderSheet();
  updateNotice();
  save();
  const n = state.layout.placements.length;
  toast(`🔀 Fresh layout: ${n} word${n === 1 ? "" : "s"}, ${state.layout.cols}×${state.layout.rows} grid`);
}

generateBtn.addEventListener("click", doGenerate);

// ---------- sheet rendering ----------

interface CellInfo {
  key: string;
  r: number;
  c: number;
  answer: string;
  across?: Placement;
  down?: Placement;
  el: HTMLDivElement;
  input: HTMLInputElement;
}

let cells = new Map<string, CellInfo>();
let clueItems = new Map<Placement, HTMLLIElement>();
let solvedShown = false;

const cellKey = (r: number, c: number) => `${r},${c}`;

function cellsOf(p: Placement): string[] {
  return [...p.answer].map((_, i) => (p.dir === "across" ? cellKey(p.row, p.col + i) : cellKey(p.row + i, p.col)));
}

let renderTimer: number | undefined;
function scheduleSheetRender() {
  clearTimeout(renderTimer);
  renderTimer = window.setTimeout(renderSheet, 120);
}

function renderSheet() {
  clearTimeout(renderTimer);
  const layout = state.layout;
  sheet.classList.toggle("revealed", reveal);
  answersBtn.setAttribute("aria-pressed", String(reveal));
  cells = new Map();
  clueItems = new Map();

  const head = el(
    "header",
    { class: "sheet-head" },
    el(
      "div",
      { class: "title-row" },
      el("h1", { class: "sheet-title", textContent: state.title.trim() || "Crossword Puzzle" }),
      reveal && el("span", { class: "key-badge", textContent: "Answer Key" }),
    ),
    state.nameLine &&
      el(
        "div",
        { class: "name-line" },
        ...["Name", "Date", "Period"].map((label) => el("span", {}, `${label}:`, el("i"))),
      ),
    state.description.trim() && el("p", { class: "sheet-desc", textContent: state.description.trim() }),
  );

  if (!layout || layout.placements.length === 0) {
    inner.replaceChildren(
      head,
      el(
        "div",
        { class: "empty" },
        el("div", { class: "big", textContent: "🥣" }),
        el("p", { textContent: "Add some words and clues, then press Generate." }),
      ),
    );
    return;
  }

  // Grid
  const grid = el("div", { class: "grid" });
  grid.style.setProperty("--cols", String(layout.cols));
  const letters = new Map<string, CellInfo>();
  const numbers = new Map<string, number>();
  for (const p of layout.placements) {
    numbers.set(cellKey(p.row, p.col), p.number);
    cellsOf(p).forEach((k, i) => {
      let info = letters.get(k);
      if (!info) {
        const [r, c] = k.split(",").map(Number);
        info = { key: k, r, c, answer: p.answer[i], el: null!, input: null! };
        letters.set(k, info);
      }
      info[p.dir] = p;
    });
  }
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      const k = cellKey(r, c);
      const info = letters.get(k);
      if (!info) {
        grid.append(el("div", { class: "cell" }));
        continue;
      }
      const input = el("input", {
        type: "text",
        maxLength: 2,
        autocomplete: "off",
        spellcheck: false,
        readOnly: reveal,
        value: reveal ? info.answer : (state.entries[k] ?? ""),
        attrs: { autocapitalize: "characters", "aria-label": `Row ${r + 1}, column ${c + 1}` },
      });
      const num = numbers.get(k);
      const cell = el("div", { class: "cell letter" }, num ? el("span", { class: "num", textContent: String(num) }) : null, input);
      info.el = cell;
      info.input = input;
      wireCell(info);
      cells.set(k, info);
      grid.append(cell);
    }
  }

  // Clues
  const clues = clueMap();
  const list = (dir: Dir) =>
    el(
      "ol",
      {},
      ...layout.placements
        .filter((p) => p.dir === dir)
        .sort((a, b) => a.number - b.number)
        .map((p) => {
          const enumText = enumeration(p.word);
          const li = el(
            "li",
            {},
            el("b", { textContent: String(p.number) }),
            el(
              "span",
              {},
              (clues.get(p.answer) ?? p.clue) || "(no clue)",
              enumText && " ",
              enumText && el("span", { class: "enum", textContent: enumText }),
              el("span", { class: "ans", textContent: ` — ${p.word.toUpperCase()}` }),
            ),
          );
          li.addEventListener("click", () => select(cellKey(p.row, p.col), p.dir, true));
          clueItems.set(p, li);
          return li;
        }),
    );

  const across = el("section", {}, el("h3", { textContent: "Across", attrs: { "data-arrow": "→" } }), list("across"));
  const down = el("section", {}, el("h3", { textContent: "Down", attrs: { "data-arrow": "↓" } }), list("down"));

  const bank =
    state.wordBank &&
    el(
      "div",
      { class: "wordbank" },
      el("div", { class: "wordbank-title", textContent: "WORD BANK" }),
      ...layout.placements
        .map((p) => p.word.trim().toUpperCase())
        .sort()
        .map((w) => el("span", { textContent: w })),
    );

  inner.replaceChildren(
    ...[head, el("div", { class: "grid-wrap" }, grid), bank, el("div", { class: "clues" }, across, down)].filter((n): n is HTMLElement => !!n),
  );
  fitToPage();
  highlight();
  updateProgress(false);
}

/** Shrink grid squares and clue text until everything fits on one page. */
function fitToPage() {
  const layout = state.layout;
  if (!layout) return;
  const page = PAGES[state.pageSize];
  const width = (page.w - 1) * DPI;
  let cell = Math.min(44, Math.floor(width / layout.cols));
  let font = 13.5;
  const apply = () => {
    inner.style.setProperty("--cell", `${Math.floor(cell)}px`);
    inner.style.setProperty("--font", `${font.toFixed(2)}px`);
  };
  apply();
  const overflows = () => {
    const box = inner.getBoundingClientRect();
    const last = inner.lastElementChild!.getBoundingClientRect();
    // Leave a small safety margin for print-engine rounding differences.
    return last.bottom - box.top > box.height * 0.97;
  };
  for (let i = 0; i < 120 && overflows(); i++) {
    if (cell > 14) cell *= 0.97;
    if (font > 8 && (cell < 30 || i % 2 === 0)) font *= 0.985;
    if (cell <= 14 && font <= 8) break;
    apply();
  }
}

// ---------- interactive play ----------

function wireCell(info: CellInfo) {
  const { input, key } = info;
  let wasActive = false;
  input.addEventListener("mousedown", () => {
    wasActive = active?.key === key && document.activeElement === input;
  });
  input.addEventListener("click", () => {
    if (wasActive) toggleDir();
  });
  input.addEventListener("focus", () => {
    if (active?.key !== key) select(key);
  });
  input.addEventListener("keydown", (e) => onKey(e, info));
  // Fallback for mobile keyboards that don't report the key in keydown.
  input.addEventListener("input", () => {
    const v = input.value.replace(/[^a-z]/gi, "").slice(-1).toUpperCase();
    setEntry(info, v);
    if (v) advance(1);
  });
}

function select(key: string, dir?: Dir, focus = true) {
  const info = cells.get(key);
  if (!info) return;
  let d: Dir = dir ?? active?.dir ?? "across";
  if (!info[d]) d = d === "across" ? "down" : "across";
  active = { key, dir: d };
  if (focus && document.activeElement !== info.input) info.input.focus({ preventScroll: true });
  highlight();
}

function toggleDir() {
  if (!active) return;
  const info = cells.get(active.key)!;
  const other: Dir = active.dir === "across" ? "down" : "across";
  if (info[other]) select(active.key, other);
}

function highlight() {
  for (const c of cells.values()) c.el.classList.remove("in-word", "active");
  for (const li of clueItems.values()) li.classList.remove("active");
  if (!active) return;
  const info = cells.get(active.key);
  const p = info?.[active.dir];
  if (!info || !p) return;
  for (const k of cellsOf(p)) cells.get(k)?.el.classList.add("in-word");
  info.el.classList.add("active");
  clueItems.get(p)?.classList.add("active");
}

function setEntry(info: CellInfo, letter: string) {
  if (reveal) {
    info.input.value = info.answer;
    return;
  }
  if (letter) state.entries[info.key] = letter;
  else delete state.entries[info.key];
  info.input.value = letter;
  info.el.classList.remove("wrong");
  save();
  updateProgress(true);
}

function advance(delta: number) {
  if (!active) return;
  const p = cells.get(active.key)?.[active.dir];
  if (!p) return;
  const keys = cellsOf(p);
  const next = keys[keys.indexOf(active.key) + delta];
  if (next) select(next, active.dir);
}

function moveArrow(dr: number, dc: number) {
  if (!active) return;
  const dir: Dir = dc !== 0 ? "across" : "down";
  const info = cells.get(active.key)!;
  if (active.dir !== dir && info[dir]) {
    select(active.key, dir);
    return;
  }
  const layout = state.layout!;
  for (let r = info.r + dr, c = info.c + dc; r >= 0 && c >= 0 && r < layout.rows && c < layout.cols; r += dr, c += dc) {
    const k = cellKey(r, c);
    if (cells.has(k)) {
      select(k, dir);
      return;
    }
  }
}

function orderedPlacements() {
  const ps = state.layout?.placements ?? [];
  return [...ps].sort((a, b) => (a.dir === b.dir ? a.number - b.number : a.dir === "across" ? -1 : 1));
}

function jumpWord(delta: number) {
  if (!active) return;
  const order = orderedPlacements();
  const current = cells.get(active.key)?.[active.dir];
  const idx = current ? order.indexOf(current) : -1;
  const p = order[(idx + delta + order.length) % order.length];
  const keys = cellsOf(p);
  const firstEmpty = keys.find((k) => !state.entries[k]) ?? keys[0];
  select(firstEmpty, p.dir);
}

function onKey(e: KeyboardEvent, info: CellInfo) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (/^[a-z]$/i.test(k)) {
    e.preventDefault();
    setEntry(info, k.toUpperCase());
    advance(1);
    return;
  }
  switch (k) {
    case "Backspace": {
      e.preventDefault();
      if (state.entries[info.key]) setEntry(info, "");
      else {
        advance(-1);
        const prev = active && cells.get(active.key);
        if (prev && prev !== info) setEntry(prev, "");
      }
      break;
    }
    case "Delete":
      e.preventDefault();
      setEntry(info, "");
      break;
    case "ArrowLeft":
      e.preventDefault();
      moveArrow(0, -1);
      break;
    case "ArrowRight":
      e.preventDefault();
      moveArrow(0, 1);
      break;
    case "ArrowUp":
      e.preventDefault();
      moveArrow(-1, 0);
      break;
    case "ArrowDown":
      e.preventDefault();
      moveArrow(1, 0);
      break;
    case " ":
    case "Enter":
      e.preventDefault();
      toggleDir();
      break;
    case "Tab":
      e.preventDefault();
      jumpWord(e.shiftKey ? -1 : 1);
      break;
    case "Escape":
      active = null;
      info.input.blur();
      highlight();
      break;
  }
}

/** Grey out finished clues; celebrate when the whole grid is right. */
function updateProgress(celebrate: boolean) {
  for (const [p, li] of clueItems) li.classList.toggle("done", !reveal && cellsOf(p).every((k) => state.entries[k]));
  const solved = !reveal && cells.size > 0 && [...cells.values()].every((c) => state.entries[c.key] === c.answer);
  sheet.classList.toggle("solved", solved);
  if (solved && celebrate && !solvedShown) {
    confetti();
    toast("🎉 Puzzle solved! Chef's kiss!", 3500);
  }
  solvedShown = solved;
}

answersBtn.addEventListener("click", () => {
  if (!state.layout) return;
  reveal = !reveal;
  renderSheet();
});

$("check").addEventListener("click", () => {
  if (!state.layout) return;
  if (reveal) {
    reveal = false;
    renderSheet();
  }
  let wrong = 0;
  let empty = 0;
  for (const c of cells.values()) {
    const v = state.entries[c.key];
    const isWrong = !!v && v !== c.answer;
    c.el.classList.toggle("wrong", isWrong);
    if (isWrong) wrong++;
    if (!v) empty++;
  }
  if (wrong) toast(`${wrong} square${wrong === 1 ? "" : "s"} need another look 👀`);
  else if (empty) toast(`So far so good! ${empty} square${empty === 1 ? "" : "s"} to go 🍳`);
  else toast("🎉 Every square is correct!");
});

$("reset").addEventListener("click", () => {
  if (Object.keys(state.entries).length && !confirm("Erase all the letters typed into the grid?")) return;
  state.entries = {};
  reveal = false;
  renderSheet();
  save();
});

// ---------- printing ----------

function printSheet(asKey: boolean) {
  if (!state.layout) {
    toast("Generate a puzzle first ✨");
    return;
  }
  const prevReveal = reveal;
  const prevTitle = document.title;
  reveal = asKey;
  renderSheet();
  // The document title becomes the default PDF file name.
  const name = state.title.trim() || "Crossword";
  document.title = asKey ? `${name} - Answer Key` : name;
  const restore = () => {
    window.removeEventListener("afterprint", restore);
    document.title = prevTitle;
    reveal = prevReveal;
    renderSheet();
  };
  window.addEventListener("afterprint", restore);
  window.print();
}

$("print-puzzle").addEventListener("click", () => printSheet(false));
$("print-key").addEventListener("click", () => printSheet(true));

// Re-fit if the user prints with Ctrl/Cmd+P instead of our buttons.
window.addEventListener("beforeprint", fitToPage);

// ---------- start ----------

renderBanks();
renderThemes();
applyTheme();
syncForm();
renderWordList();
if (!state.layout) doGenerate();
else renderSheet();
updateNotice();
document.fonts?.ready.then(fitToPage);
