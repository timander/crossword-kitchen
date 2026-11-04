// Composition root: load state, create the store, mount the UI.

import "./styles/themes.css";
import "./styles/app.css";
import "./styles/sheet.css";
import "./styles/print.css";

import { stateFromBank } from "./core/state.ts";
import { mountApp } from "./ui/app.ts";
import { mountEditor } from "./ui/editor.ts";
import { loadState, persist } from "./ui/storage.ts";
import { createStore } from "./ui/store.ts";
import { DEFAULT_BANK, WORD_BANKS } from "./wordbanks/index.ts";

const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return undefined; // blocked by browser settings
  }
})();

const saved = loadState(storage, DEFAULT_BANK);
const store = createStore(saved ?? stateFromBank(DEFAULT_BANK));
persist(store, storage);

const app = mountApp(store);
mountEditor({ store, banks: WORD_BANKS, onGenerate: app.generate });

if (!store.get().layout) app.generate();
// Fonts change text size, so re-fit the page once they're ready.
void document.fonts.ready.then(app.render);
