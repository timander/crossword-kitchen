import { describe, expect, it } from "vitest";
import { compactCellPx, contentWidthPx, FIT, fitSizes, isPageSize } from "../../src/core/page.ts";

describe("page sizes", () => {
  it("knows printable widths", () => {
    expect(contentWidthPx("letter")).toBe(7.5 * 96);
    expect(contentWidthPx("a4")).toBeCloseTo(7.27 * 96);
  });

  it("validates page size ids", () => {
    expect(isPageSize("a4")).toBe(true);
    expect(isPageSize("toString")).toBe(false);
    expect(isPageSize(3)).toBe(false);
  });
});

describe("fitSizes", () => {
  it("keeps the largest sizes when everything fits", () => {
    expect(fitSizes(10, 720, () => false)).toEqual({ cellPx: FIT.maxCellPx, fontPx: FIT.startFontPx });
  });

  it("starts from the width limit for wide grids", () => {
    expect(fitSizes(24, 720, () => false).cellPx).toBe(30);
  });

  it("shrinks until the content fits", () => {
    const result = fitSizes(15, 720, (s) => s.cellPx * 15 + s.fontPx * 40 > 900);
    expect(result.cellPx * 15 + result.fontPx * 40).toBeLessThanOrEqual(900);
    expect(result.cellPx).toBeLessThan(FIT.maxCellPx);
  });

  it("never goes below the minimum sizes", () => {
    let calls = 0;
    const result = fitSizes(15, 720, () => (calls++, true));
    expect(result).toEqual({ cellPx: FIT.minCellPx, fontPx: FIT.minFontPx });
    expect(calls).toBeLessThanOrEqual(FIT.maxSteps);
  });
});

describe("fitSizes shrink schedule", () => {
  const trace = (cols: number, steps: number) => {
    const seen: string[] = [];
    fitSizes(cols, 720, (s) => (seen.push(`${s.cellPx}/${s.fontPx}`), seen.length <= steps));
    return seen;
  };

  it("shrinks squares every step and text every other step while squares are large", () => {
    expect(trace(10, 3)).toEqual(["44/13.5", "42/13.3", "41/13.3", "40/13.1"]);
  });

  it("shrinks text every step once squares are small", () => {
    const seen = trace(40, 2);
    expect(seen).toEqual(["18/13.5", "17/13.3", "16/13.1"]);
  });

  it("keeps shrinking text after squares bottom out, then stops", () => {
    const seen = trace(51, 200);
    expect(seen[0]).toBe("14/13.5");
    expect(seen.at(-1)).toBe("14/8");
    expect(seen.filter((s) => s === "14/8")).toHaveLength(1);
  });
});

describe("compactCellPx", () => {
  it("fills the screen width within limits", () => {
    expect(compactCellPx(10, 360)).toBe(36);
    expect(compactCellPx(5, 360)).toBe(40);
    expect(compactCellPx(40, 360)).toBe(FIT.minCellPx);
  });
});
