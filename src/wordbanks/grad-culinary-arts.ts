import type { WordBank } from "./types.ts";

export default {
  id: "grad-culinary-arts",
  name: "Culinary Arts Capstone",
  level: "Culinary Arts Graduates",
  title: "Culinary Arts Capstone Crossword",
  description:
    "Costing, menu engineering, classical cuisine, kitchen management, and food science, all in one grid. Multi-word answers show their letter counts, e.g. (4, 4).",
  words: [
    { word: "Food cost", clue: "Percentage found by dividing ingredient spend by menu sales" },
    { word: "Yield test", clue: "Trial that weighs trim loss to find usable percentage and true price" },
    { word: "Q factor", clue: "Small per-plate charge added in costing for condiments and garnish" },
    { word: "Plowhorse", clue: "Menu engineering label for a popular item with a low contribution margin" },
    { word: "Puzzle", clue: "Menu engineering label for a high-margin item that rarely sells" },
    { word: "Covers", clue: "Number of guests served during a service" },
    { word: "Breakeven", clue: "Point where sales exactly cover fixed plus variable costs" },
    { word: "HACCP", clue: "Seven-principle food safety system built on critical control points (abbr.)" },
    { word: "Escoffier", clue: "Author of Le Guide Culinaire who codified the kitchen brigade" },
    { word: "Careme", clue: 'Chef who first grouped French sauces into families; "king of chefs"' },
    { word: "Allemande", clue: "Veal velouté enriched with an egg-yolk liaison and lemon" },
    { word: "Gastrique", clue: "Caramelized sugar deglazed with vinegar; base for sweet-sour sauces" },
    { word: "Duxelles", clue: "Minced mushrooms and shallots cooked in butter until dry" },
    { word: "Lecithin", clue: "Phospholipid in egg yolk that stabilizes mayonnaise" },
    { word: "Retrogradation", clue: "Starch molecules realigning as they cool, making bread go stale" },
    { word: "Brix", clue: "Scale of sugar content in a liquid, read with a refractometer" },
  ],
} satisfies WordBank;
