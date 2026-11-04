// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { stateFromBank } from "../../src/core/state.ts";
import { loadState, persist, STORAGE_KEY } from "../../src/ui/storage.ts";
import { createStore } from "../../src/ui/store.ts";

const bank = { id: "b", title: "T", description: "D", words: [{ word: "Whisk", clue: "Tool" }] };

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("loadState", () => {
  it("returns null when nothing is saved or storage is missing", () => {
    expect(loadState(localStorage, bank)).toBeNull();
    expect(loadState(undefined, bank)).toBeNull();
  });

  it("ignores corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadState(localStorage, bank)).toBeNull();
  });

  it("validates what it loads", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ title: "Mine", theme: "evil" }));
    expect(loadState(localStorage, bank)).toMatchObject({ title: "Mine", theme: "ink" });
  });
});

describe("persist", () => {
  it("saves after changes settle", () => {
    vi.useFakeTimers();
    const store = createStore(stateFromBank(bank));
    persist(store, localStorage, 100);
    store.set({ title: "A" });
    store.set({ title: "B" });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    vi.advanceTimersByTime(100);
    expect(loadState(localStorage, bank)?.title).toBe("B");
  });

  it("saves immediately when the page is hidden", () => {
    vi.useFakeTimers();
    const store = createStore(stateFromBank(bank));
    const stop = persist(store, localStorage, 10_000);
    store.set({ title: "Leaving" });
    window.dispatchEvent(new Event("pagehide"));
    expect(loadState(localStorage, bank)?.title).toBe("Leaving");
    stop();
  });

  it("survives storage errors", () => {
    vi.useFakeTimers();
    const broken = {
      setItem: () => {
        throw new Error("quota");
      },
    } as unknown as Storage;
    const store = createStore(stateFromBank(bank));
    persist(store, broken, 10);
    store.set({ title: "A" });
    expect(() => vi.advanceTimersByTime(10)).not.toThrow();
  });
});
