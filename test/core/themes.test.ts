import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, isThemeId, THEMES } from "../../src/core/themes.ts";

describe("themes", () => {
  it("has unique ids and minimal ink as the default", () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(DEFAULT_THEME).toBe("ink");
    expect(ids[0]).toBe("ink");
  });

  it("validates theme ids", () => {
    expect(THEMES.every((t) => isThemeId(t.id))).toBe(true);
    expect(isThemeId("neon")).toBe(false);
    expect(isThemeId(undefined)).toBe(false);
  });
});
