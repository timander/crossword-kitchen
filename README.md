# 🍳 Crossword Kitchen

Make crossword puzzles from your own words and clues. Students can play them on screen, or you can print them one page per sheet (or save as PDF) for class.

**Try it:** https://timander.github.io/crossword-kitchen/

The finished app is **one self-contained file**: `dist/crossword.html` (also published as `index.html`). Open it in any browser. It works offline and needs no install, so you can email it or put it on a USB stick.

## Using it

1. Pick a word bank and press **Load**, or type your own words and clues. To paste a whole list at once, use **Bulk edit** with one `word: clue` per line.
2. Press **Generate**. Press **Regenerate** to shuffle until you like the layout.
3. Set the title, instructions, Name/Date/Period line, and optional word bank. The page preview updates as you type.
4. The editor stays out of the way until you need it: **✏️ Customize** opens it (a side panel on wide screens, a slide-in drawer on tablets and phones), and **Done**, <kbd>Esc</kbd>, or tapping outside closes it. The look is a single toner-friendly black-and-white style.
5. **Print puzzle** prints a blank student copy. **Print key** prints the filled-in answer key. Both always fit on one page (Letter or A4). For a PDF, choose "Save as PDF" in the print dialog.
6. To play on screen, click a square and type. <kbd>Space</kbd> switches across/down, <kbd>Tab</kbd> jumps to the next word, and **Check** marks wrong letters. On a phone, tap a square and use the on-screen keyboard.

Your words, settings, and current puzzle are saved in the browser automatically.

## Word banks

| Intro to Foods · High School | Advanced Food Prep · College     | Graduates & Professional |
| ---------------------------- | -------------------------------- | ------------------------ |
| Kitchen Basics               | Culinary Techniques & Knife Cuts | Culinary Arts Graduates  |
| Food Safety & Nutrition      | Sauces & Pastry                  | Michelin-Star Kitchen    |
| Pasta, Grains & Legumes      | Commercial Kitchen Basics        |                          |
| Recipe Math & Measurement    | Poultry                          |                          |
| Food Service Etiquette       |                                  |                          |
| Fish & Seafood               |                                  |                          |

An expert-chef review of every bank, with the fixes made and suggested topics for new banks, is in [`docs/chef-review.md`](docs/chef-review.md).

### How they're stored

Each bank is a small TypeScript file in [`src/wordbanks/`](src/wordbanks/) that exports one object:

```ts
export default {
  id: "adv-poultry",                     // unique; must match the file name
  name: "Poultry",                       // shown in the picker
  level: "Advanced Food Prep · College", // picker group
  title: "Poultry Crossword",            // default puzzle title
  description: "…",                      // default instructions
  words: [{ word: "Truss", clue: "Tie a bird with twine…" }, …],
} satisfies WordBank;
```

[`src/wordbanks/index.ts`](src/wordbanks/index.ts) imports every bank and lists them in picker order. At build time they're bundled into the HTML file, so the published page needs no server.

**To add a bank:** copy an existing file, change its `id`, fill in the words, and import it in `index.ts`. `make test` checks that every file is registered, the ids are unique, every word has a clue, no clue gives away its own answer, and every word fits into a puzzle.

Edits a teacher makes in the browser are saved only in that browser's `localStorage`. The bank files never change. To turn a list made in the browser into a built-in bank, use **Bulk edit** to copy it out.

## Development

Requires Node 24+ and pnpm. `make` wraps the pnpm scripts:

```sh
make install    # dependencies + Playwright's Chromium
make dev        # Vite dev server with hot reload
make check      # types, lint, format, knip, unit tests + coverage, build (CI's check job)
make e2e        # Playwright smoke test on desktop + phone, against the production build
make mutation   # Stryker mutation testing of src/core (~4 min)
make open       # build and open the single file in your browser
make deploy     # push main → CI tests, builds, and publishes to GitHub Pages
```

```
index.html              page template (Vite entry)
src/main.ts             composition root: load state, create store, mount UI
src/core/               pure logic, no DOM: generator, puzzle model & navigation,
                        words (parse/validate/limits), state validation, page fitting
src/ui/                 DOM: app (wiring), sheet (render), player (play), editor,
                        layout (fit/phone/print), store, storage, dom & fx helpers
src/styles/             tokens.css (colors and fonts), app.css, sheet.css, print.css
src/wordbanks/          one file per bank + index.ts registry
test/                   Vitest unit (core/) and DOM integration (ui/) tests
e2e/                    Playwright smoke tests
vite.config.ts          single-file build + Content-Security-Policy + Vitest config
```

Quality and security tooling, and what each check is for, is described in [`docs/engineering-review.md`](docs/engineering-review.md). In short: strict TypeScript, typescript-eslint (strict, type-checked) with DOM-XSS rules, Prettier, knip, Vitest with coverage thresholds, Stryker, Playwright, `pnpm audit`, Dependabot, SHA-pinned Actions, and a hash-based CSP with Trusted Types in the shipped file.
