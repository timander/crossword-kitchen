// Mounts the real index.html into happy-dom and starts the app, like main.ts does.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { vi } from "vitest";
import { stateFromBank, type AppState } from "../../src/core/state.ts";
import { mountApp } from "../../src/ui/app.ts";
import { mountEditor } from "../../src/ui/editor.ts";
import { createStore } from "../../src/ui/store.ts";
import { DEFAULT_BANK, WORD_BANKS } from "../../src/wordbanks/index.ts";

const html = readFileSync(resolve(import.meta.dirname, "../../index.html"), "utf8");

export function mount(overrides: Partial<AppState> = {}) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  parsed.querySelectorAll("script").forEach((s) => {
    s.remove();
  });
  document.head.replaceChildren(...[...parsed.head.childNodes].map((n) => document.importNode(n, true)));
  document.body.replaceChildren(...[...parsed.body.childNodes].map((n) => document.importNode(n, true)));
  const confirm = vi.fn(() => true);
  const store = createStore({ ...stateFromBank(DEFAULT_BANK), ...overrides });
  const app = mountApp(store, confirm);
  mountEditor({ store, banks: WORD_BANKS, onGenerate: app.generate, confirm });
  if (!store.get().layout) app.generate();
  return { store, app, confirm };
}

/** querySelector that throws if the element is missing or of the wrong type. */
export function $<T extends HTMLElement = HTMLElement>(selector: string, type?: abstract new () => T): T {
  const node = document.querySelector(selector);
  if (!(node instanceof (type ?? HTMLElement))) throw new Error(`missing ${selector}`);
  return node as T;
}
export const $$ = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)];

export const click = (selector: string) => {
  $(selector).click();
};

export const key = (target: Element, k: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));

export const cellInput = (k: string) => $(`input[data-key="${k}"]`, HTMLInputElement);

export const typeInto = (target: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  target.value = value;
  target.dispatchEvent(new Event("input", { bubbles: true }));
};
