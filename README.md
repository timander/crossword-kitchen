# 🍳 Crossword Kitchen

Make crossword puzzles from your own words and clues. Students can play them on screen, or you can print them one page per sheet (or save as PDF) for class.

The finished app is **one self-contained file**: `dist/crossword.html`. Open it in any browser. It works offline and needs no install, so you can email it or put it on a USB stick.

## Using it

1. Pick a word bank and press **Load**, or type your own words and clues. To paste a whole list at once, use **Bulk edit** with one `word: clue` per line.
2. Press **Generate**. Press **Regenerate** to shuffle until you like the layout.
3. Set the title, instructions, Name/Date/Period line, and optional word bank. The page preview updates as you type.
4. **Print puzzle** prints a blank student copy. **Print key** prints the filled-in answer key. Both always fit on one page (Letter or A4). For a PDF, choose "Save as PDF" in the print dialog.
5. To play on screen, click a square and type. <kbd>Space</kbd> switches across/down, <kbd>Tab</kbd> jumps to the next word, and **Check** marks wrong letters.

Your words and current puzzle are saved in the browser automatically.

## Development

```sh
pnpm install
pnpm build       # → dist/crossword.html
pnpm dev         # rebuild on change
pnpm test        # layout generator tests
pnpm typecheck
```

| File | What it does |
| --- | --- |
| `src/generator.ts` | Layout engine. It tries hundreds of randomized placements and keeps the most compact, fully connected grid. |
| `src/main.ts` | Editor, sheet rendering, on-screen play, fit-to-page, and printing |
| `src/wordbanks.ts` | Sample word banks (Intro to Foods and Advanced Food Prep) |
| `src/styles.css`, `src/index.html` | Look and page template |
| `scripts/build.ts` | Bundles everything into one HTML file with esbuild |
