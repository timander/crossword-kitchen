// Sizes the sheet for where it's shown:
// - page mode (desktop and print): exactly one paper page, scaled down to fit the window
// - compact mode (phones): no page, squares sized to the screen width for comfortable play

import {
  compactCellPx,
  contentWidthPx,
  CSS_DPI,
  fitSizes,
  PAGE_SIZES,
  type PageSize,
  type SheetSizes,
} from "../core/page.ts";

export interface SheetElements {
  sheet: HTMLElement;
  inner: HTMLElement;
  frame: HTMLElement;
  pageRule: HTMLStyleElement;
}

export interface SheetLayout {
  setPageSize(size: PageSize): void;
  /** Re-measure and size the current sheet; `cols` is 0 when there's no puzzle. */
  apply(cols: number): void;
}

const COMPACT_QUERY = "(max-width: 760px)";
const COMPACT_FONT_PX = 15;
/** Safety margin for print-engine rounding differences. */
const FILL_RATIO = 0.97;

export function createSheetLayout({ sheet, inner, frame, pageRule }: SheetElements): SheetLayout {
  const compactQuery = matchMedia(COMPACT_QUERY);
  let pageSize: PageSize = "letter";
  let cols = 0;
  let printing = false;

  const setSizes = ({ cellPx, fontPx }: SheetSizes) => {
    inner.style.setProperty("--cell", `${cellPx}px`);
    inner.style.setProperty("--font", `${fontPx}px`);
  };

  const overflows = (sizes: SheetSizes) => {
    setSizes(sizes);
    const box = inner.getBoundingClientRect();
    const last = inner.lastElementChild?.getBoundingClientRect();
    return !!last && last.bottom - box.top > box.height * FILL_RATIO;
  };

  function applyZoom() {
    const full = PAGE_SIZES[pageSize].widthIn * CSS_DPI;
    const zoom = Math.min(1, frame.clientWidth / full);
    sheet.style.setProperty("zoom", zoom < 1 ? String(zoom) : "");
  }

  function apply(nextCols: number) {
    cols = nextCols;
    const compact = compactQuery.matches && !printing;
    document.body.classList.toggle("compact", compact);
    if (compact) {
      sheet.style.removeProperty("zoom");
      setSizes({ cellPx: compactCellPx(cols, inner.clientWidth), fontPx: COMPACT_FONT_PX });
      return;
    }
    applyZoom();
    if (cols > 0) fitSizes(cols, contentWidthPx(pageSize), overflows);
  }

  function setPageSize(size: PageSize) {
    pageSize = size;
    const page = PAGE_SIZES[size];
    const root = document.documentElement.style;
    root.setProperty("--page-w", `${page.widthIn}in`);
    root.setProperty("--page-h", `${page.heightIn}in`);
    // Update @page through the CSSOM (allowed by the Content-Security-Policy, unlike new inline styles).
    const rule = pageRule.sheet?.cssRules[0];
    if (rule && "style" in rule && rule.style instanceof CSSStyleDeclaration) rule.style.setProperty("size", page.css);
  }

  // Printing always uses the full page layout, even from a phone.
  addEventListener("beforeprint", () => {
    printing = true;
    apply(cols);
  });
  addEventListener("afterprint", () => {
    printing = false;
    apply(cols);
  });
  compactQuery.addEventListener("change", () => {
    apply(cols);
  });
  new ResizeObserver(() => {
    if (document.body.classList.contains("compact")) apply(cols);
    else applyZoom();
  }).observe(frame);

  return { setPageSize, apply };
}
