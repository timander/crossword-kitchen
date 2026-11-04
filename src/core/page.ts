// Paper sizes and the one-page fitting algorithm (DOM-free: measuring is injected).

export const PAGE_SIZES = {
  letter: { label: "Letter", widthIn: 8.5, heightIn: 11, css: "letter" },
  a4: { label: "A4", widthIn: 8.27, heightIn: 11.69, css: "A4" },
} as const;

export type PageSize = keyof typeof PAGE_SIZES;

export const DEFAULT_PAGE_SIZE: PageSize = "letter";
const MARGIN_IN = 0.5;
export const CSS_DPI = 96;

export const isPageSize = (v: unknown): v is PageSize => typeof v === "string" && Object.hasOwn(PAGE_SIZES, v);

/** Printable width in CSS pixels. */
export const contentWidthPx = (size: PageSize) => (PAGE_SIZES[size].widthIn - 2 * MARGIN_IN) * CSS_DPI;

export interface SheetSizes {
  cellPx: number;
  fontPx: number;
}

export const FIT = {
  maxCellPx: 44,
  minCellPx: 14,
  startFontPx: 13.5,
  minFontPx: 8,
  maxSteps: 120,
} as const;

/**
 * Shrinks grid squares and clue text until `overflows` reports the sheet fits.
 * Squares shrink first; text shrinks more slowly and only once squares get small.
 */
export function fitSizes(cols: number, widthPx: number, overflows: (s: SheetSizes) => boolean): SheetSizes {
  let cell = Math.min(FIT.maxCellPx, Math.floor(widthPx / Math.max(cols, 1)));
  let font: number = FIT.startFontPx;
  const sizes = () => ({ cellPx: Math.floor(cell), fontPx: Math.round(font * 100) / 100 });
  for (let i = 0; i < FIT.maxSteps && overflows(sizes()); i++) {
    if (cell <= FIT.minCellPx && font <= FIT.minFontPx) break;
    if (cell > FIT.minCellPx) cell = Math.max(FIT.minCellPx, cell * 0.97);
    if (font > FIT.minFontPx && (cell < 30 || i % 2 === 0)) font = Math.max(FIT.minFontPx, font * 0.985);
  }
  return sizes();
}

/** Square size for on-screen play on small screens (no page to fit). */
export const compactCellPx = (cols: number, widthPx: number) =>
  Math.max(FIT.minCellPx, Math.min(40, Math.floor(widthPx / Math.max(cols, 1))));
