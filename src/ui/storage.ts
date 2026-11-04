// Saves app state to localStorage and loads it back through validation.

import { parseState, type AppState, type BankDefaults } from "../core/state.ts";
import { debounce } from "./dom.ts";
import type { Store } from "./store.ts";

export const STORAGE_KEY = "crossword-kitchen:v1";

export function loadState(storage: Storage | undefined, fallback: BankDefaults): AppState | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? parseState(JSON.parse(raw), fallback) : null;
  } catch {
    // Corrupt JSON or storage blocked: start fresh.
    return null;
  }
}

export function persist(store: Store<AppState>, storage: Storage | undefined, delayMs = 250) {
  const save = debounce(() => {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(store.get()));
    } catch {
      // Storage full or unavailable (private mode). Not fatal: the app still works.
    }
  }, delayMs);
  // Don't lose the last edits when the tab is closed or reloaded mid-debounce.
  addEventListener("pagehide", save.flush);
  const unsubscribe = store.subscribe(save);
  return () => {
    unsubscribe();
    removeEventListener("pagehide", save.flush);
  };
}
