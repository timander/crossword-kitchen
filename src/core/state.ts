// App state shape, defaults, and validation of anything loaded from storage.
// Saved data is untrusted input: parseState() rebuilds a clean object field by
// field and drops anything malformed instead of trusting JSON.parse output.

import type { Layout, Placement, WordInput } from "./generator.ts";
import type { CellKey, Dir } from "./grid.ts";
import { DEFAULT_PAGE_SIZE, isPageSize, type PageSize } from "./page.ts";
import { DEFAULT_THEME, isThemeId, type ThemeId } from "./themes.ts";
import { clampWords, LIMITS, normalize, type WordRow } from "./words.ts";
import type { Entries } from "./puzzle.ts";

export interface AppState {
  title: string;
  description: string;
  nameLine: boolean;
  wordBank: boolean;
  pageSize: PageSize;
  theme: ThemeId;
  editorOpen: boolean;
  bankId: string;
  words: WordRow[];
  layout: Layout | null;
  /** Word-list signature the layout was built from. */
  layoutKey: string;
  entries: Entries;
}

export interface BankDefaults {
  id: string;
  title: string;
  description: string;
  words: readonly WordInput[];
}

export const MAX_TITLE_CHARS = 120;
export const MAX_DESCRIPTION_CHARS = 600;
const MAX_GRID = 60;

export function stateFromBank(bank: BankDefaults, base?: Partial<AppState>): AppState {
  return {
    nameLine: true,
    wordBank: false,
    pageSize: DEFAULT_PAGE_SIZE,
    theme: DEFAULT_THEME,
    editorOpen: true,
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

// ---------- validation ----------

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number, fallback = "") => (typeof v === "string" ? v.slice(0, max) : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
const int = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : undefined;
const isDir = (v: unknown): v is Dir => v === "across" || v === "down";

function parseWords(v: unknown): WordRow[] {
  if (!Array.isArray(v)) return [];
  return clampWords(v.filter(isObj).map((w) => ({ word: str(w.word, 1000), clue: str(w.clue, 1000) })));
}

function parsePlacement(v: unknown, rows: number, cols: number): Placement | undefined {
  if (!isObj(v) || !isDir(v.dir)) return undefined;
  const answer = str(v.answer, LIMITS.maxAnswerLetters);
  const row = int(v.row, 0, rows - 1);
  const col = int(v.col, 0, cols - 1);
  const number = int(v.number, 1, 999);
  if (row === undefined || col === undefined || number === undefined) return undefined;
  if (answer.length < 2 || answer !== normalize(answer)) return undefined;
  const end = v.dir === "across" ? col + answer.length : row + answer.length;
  if (end > (v.dir === "across" ? cols : rows)) return undefined;
  const word = str(v.word, LIMITS.maxWordChars);
  return { answer, word, clue: str(v.clue, LIMITS.maxClueChars), row, col, dir: v.dir, number };
}

function parseLayout(v: unknown): Layout | null {
  if (!isObj(v) || !Array.isArray(v.placements)) return null;
  const rows = int(v.rows, 1, MAX_GRID);
  const cols = int(v.cols, 1, MAX_GRID);
  if (rows === undefined || cols === undefined) return null;
  const placements = v.placements.map((p) => parsePlacement(p, rows, cols));
  if (placements.length === 0 || !placements.every((p) => p !== undefined)) return null;
  const unplaced = Array.isArray(v.unplaced) ? parseWords(v.unplaced) : [];
  return { rows, cols, placements, unplaced };
}

function parseEntries(v: unknown): Entries {
  if (!isObj(v)) return {};
  const entries: Partial<Record<CellKey, string>> = {};
  for (const [key, value] of Object.entries(v)) {
    if (/^\d{1,2},\d{1,2}$/.test(key) && typeof value === "string" && /^[A-Z]$/.test(value)) {
      entries[key as CellKey] = value;
    }
  }
  return entries;
}

/** Validates saved state; returns null if it isn't usable at all. */
export function parseState(raw: unknown, fallbackBank: BankDefaults): AppState | null {
  if (!isObj(raw)) return null;
  const base = stateFromBank(fallbackBank);
  const words = parseWords(raw.words);
  return {
    title: str(raw.title, MAX_TITLE_CHARS, base.title),
    description: str(raw.description, MAX_DESCRIPTION_CHARS, base.description),
    nameLine: bool(raw.nameLine, base.nameLine),
    wordBank: bool(raw.wordBank, base.wordBank),
    pageSize: isPageSize(raw.pageSize) ? raw.pageSize : base.pageSize,
    theme: isThemeId(raw.theme) ? raw.theme : base.theme,
    editorOpen: bool(raw.editorOpen, base.editorOpen),
    bankId: str(raw.bankId, 100, base.bankId),
    words: words.length > 0 ? words : [{ word: "", clue: "" }],
    layout: parseLayout(raw.layout),
    layoutKey: str(raw.layoutKey, 10_000),
    entries: parseEntries(raw.entries),
  };
}
