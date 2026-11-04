import type { WordInput } from "../generator.ts";

export interface WordBank {
  /** Stable, unique id (also the file name). */
  id: string;
  /** Short name shown in the word bank picker. */
  name: string;
  /** Picker group, e.g. "Intro to Foods · High School". */
  level: string;
  /** Default puzzle title when the bank is loaded. */
  title: string;
  /** Default instructions printed under the title. */
  description: string;
  words: WordInput[];
}
