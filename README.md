# 🍳 Crossword Kitchen

Make crossword puzzles from your own words and clues. Students can play them on screen, or you can print them one page per sheet (or save as PDF) for class.

**Try it:** https://timander.github.io/crossword-kitchen/

The finished app is **one self-contained file**: `dist/crossword.html`. Open it in any browser. It works offline and needs no install, so you can email it or put it on a USB stick.

## Using it

1. Pick a word bank and press **Load**, or type your own words and clues. To paste a whole list at once, use **Bulk edit** with one `word: clue` per line.
2. Press **Generate**. Press **Regenerate** to shuffle until you like the layout.
3. Set the title, instructions, Name/Date/Period line, and optional word bank. The page preview updates as you type.
4. Choose a **theme** in the top-right corner: Tomato Gingham, Basil Garden, Blueberry Diner, Chalkboard Café, Berry Pastry, or Minimal Ink (saves toner). Themes change the app's look and the accent colors and title font on the printout. The printed page always stays white paper.
5. **Print puzzle** prints a blank student copy. **Print key** prints the filled-in answer key. Both always fit on one page (Letter or A4). For a PDF, choose "Save as PDF" in the print dialog.
6. To play on screen, click a square and type. <kbd>Space</kbd> switches across/down, <kbd>Tab</kbd> jumps to the next word, and **Check** marks wrong letters.

Your words, settings, and current puzzle are saved in the browser automatically.

## Word banks

| Intro to Foods · High School | Advanced Food Prep · College |
| --- | --- |
| Kitchen Basics | Culinary Techniques & Knife Cuts |
| Food Safety & Nutrition | Sauces & Pastry |
| Pasta, Grains & Legumes | Commercial Kitchen Basics |
| Recipe Math & Measurement | Poultry |
| Food Service Etiquette | |

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

[`src/wordbanks/index.ts`](src/wordbanks/index.ts) imports every bank and lists them in picker order. At build time, esbuild bundles them into the HTML file, so the published page needs no server.

**To add a bank:** copy an existing file, change its `id`, and fill in the words. Then import it in `index.ts`. `make test` checks that every file is registered, the ids are unique, every word has a clue, and every word fits into a puzzle.

Edits a teacher makes in the browser are saved only in that browser's `localStorage`. The bank files never change. To turn a list made in the browser into a built-in bank, use **Bulk edit** to copy it out.

## Development

Use `make` (thin wrappers over the pnpm scripts):

```sh
make            # list targets
make check      # typecheck + test + build (same as CI)
make dev        # rebuild on change
make open       # build and open in your browser
make deploy     # push main → GitHub Actions publishes to Pages
```

| File | What it does |
| --- | --- |
| `src/generator.ts` | Layout engine. It tries hundreds of randomized placements and keeps the most compact, fully connected grid. |
| `src/main.ts` | Editor, themes, sheet rendering, on-screen play, fit-to-page, and printing |
| `src/wordbanks/` | One file per word bank, plus the `index.ts` registry |
| `src/styles.css` | Styles. Themes are blocks of color/font tokens under `[data-theme="…"]`. |
| `scripts/build.ts` | Bundles everything into one HTML file with esbuild |
| `.github/workflows/pages.yml` | On every push to `main`: test, build, and publish to GitHub Pages |
