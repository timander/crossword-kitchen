// Pure helpers for the editable word list: normalizing, parsing, validating.

export interface WordRow {
  word: string;
  clue: string;
}

/** Input limits. They keep the generator fast and the printout on one page. */
export const LIMITS = {
  maxWords: 60,
  maxWordChars: 30,
  maxAnswerLetters: 24,
  maxClueChars: 200,
} as const;

/** Uppercase, strip accents and anything that isn't A–Z. */
export function normalize(word: string): string {
  return word
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

/** Letter counts per part for multi-word answers, e.g. "Sous vide" → "(4, 4)". */
export function enumeration(word: string): string {
  const parts = word
    .split(/[\s-]+/)
    .map(normalize)
    .filter(Boolean);
  return parts.length > 1 ? `(${parts.map((p) => p.length).join(", ")})` : "";
}

/** True when the row has an answer the generator can use. */
export const isUsable = (row: WordRow) => normalize(row.word).length >= 2;

/** Order-independent identity of a word list, used to detect edits since the last generate. */
export function signature(words: readonly WordRow[]): string {
  return words
    .map((w) => normalize(w.word))
    .filter((w) => w.length >= 2)
    .sort()
    .join("|");
}

/** Truncates fields and the list itself to the input limits. */
export function clampWords(words: readonly WordRow[]): WordRow[] {
  return words.slice(0, LIMITS.maxWords).map((w) => ({
    word: w.word.slice(0, LIMITS.maxWordChars),
    clue: w.clue.slice(0, LIMITS.maxClueChars),
  }));
}

const BULK_LINE = /^\s*(.+?)\s*(?:\t|\||:|,|=|\s[-–—]\s)\s*(.*)$/;

/** Parses "word: clue" lines. Accepts :, |, tab, comma, =, or " - " as the separator. */
export function parseBulk(text: string): WordRow[] {
  const rows = text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const m = BULK_LINE.exec(line);
      return m ? { word: (m[1] ?? "").trim(), clue: (m[2] ?? "").trim() } : { word: line.trim(), clue: "" };
    });
  return clampWords(rows);
}

export function formatBulk(words: readonly WordRow[]): string {
  return words
    .filter((w) => w.word.trim() || w.clue.trim())
    .map((w) => `${w.word}: ${w.clue}`)
    .join("\n");
}

export interface WordIssues {
  messages: string[];
  /** Row indexes whose word itself is invalid. */
  badRows: Set<number>;
}

/** Problems worth telling the teacher about before they generate. */
export function findIssues(words: readonly WordRow[]): WordIssues {
  const counts = new Map<string, number>();
  for (const w of words) {
    const k = normalize(w.word);
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const messages = new Set<string>();
  const badRows = new Set<number>();
  words.forEach((w, i) => {
    const answer = normalize(w.word);
    const label = `“${w.word.trim().toUpperCase()}”`;
    if (w.word.trim() && answer.length < 2) {
      messages.add(`${label} needs at least 2 letters.`);
      badRows.add(i);
    }
    if (answer.length > LIMITS.maxAnswerLetters) {
      messages.add(`${label} is longer than ${LIMITS.maxAnswerLetters} letters.`);
      badRows.add(i);
    }
    if ((counts.get(answer) ?? 0) > 1) {
      messages.add(`${label} is listed more than once.`);
      badRows.add(i);
    }
    if (answer.length >= 2 && !w.clue.trim()) messages.add(`${label} has no clue yet.`);
  });
  return { messages: [...messages], badRows };
}

/** Words ready for the generator: usable, within limits. */
export function generatorInput(words: readonly WordRow[]): WordRow[] {
  return words.filter((w) => {
    const n = normalize(w.word).length;
    return n >= 2 && n <= LIMITS.maxAnswerLetters;
  });
}
