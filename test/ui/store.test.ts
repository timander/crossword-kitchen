import { describe, expect, it, vi } from "vitest";
import { changed, createStore } from "../../src/ui/store.ts";

describe("createStore", () => {
  it("merges patches and notifies listeners with the previous state", () => {
    const store = createStore({ a: 1, b: "x" });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.set({ a: 2 });
    expect(store.get()).toEqual({ a: 2, b: "x" });
    expect(listener).toHaveBeenCalledWith({ a: 2, b: "x" }, { a: 1, b: "x" });
    unsubscribe();
    store.set({ a: 3 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("detects which keys changed", () => {
    const list = [1];
    expect(changed({ a: list, b: 1 }, { a: list, b: 2 }, "a")).toBe(false);
    expect(changed({ a: list, b: 1 }, { a: list, b: 2 }, "a", "b")).toBe(true);
  });
});
