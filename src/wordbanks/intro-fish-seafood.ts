import type { WordBank } from "./types.ts";

export default {
  id: "intro-fish-seafood",
  name: "Fish & Seafood",
  level: "Intro to Foods · High School",
  title: "Fish & Seafood Crossword",
  description:
    "Kinds of seafood, signs of freshness, safe handling, and ways to cook fish. Multi-word answers show their letter counts, e.g. (2, 9).",
  words: [
    { word: "Shellfish", clue: "Seafood such as shrimp, crab, or clams that has no backbone" },
    { word: "Mollusk", clue: "Soft-bodied sea animal group that includes clams, oysters, and squid" },
    { word: "Crustacean", clue: "Sea animal with jointed legs and a hard outer shell, like a crab or lobster" },
    { word: "Fillet", clue: "Boneless side of fish cut away from the backbone" },
    { word: "Gills", clue: "On a fresh whole fish, these should be bright red, not dull brown" },
    { word: "Eyes", clue: "On a fresh fish, these should be clear and bulging, not cloudy or sunken" },
    { word: "Smell", clue: "Fresh fish should have a mild, sea-breeze ___, never a strong sour one" },
    { word: "Opaque", clue: "Fish is done at 145°F when the flesh turns ___ and flakes easily" },
    { word: "Thaw", clue: "Do this to frozen fish overnight in the fridge, never on the counter" },
    { word: "Mussels", clue: "Blue-black bivalves that should close when tapped; toss any that stay open" },
    { word: "Shrimp", clue: "Popular seafood that turns pink and curls into a C when cooked" },
    { word: "Salmon", clue: "Pink-orange fish rich in heart-healthy omega-3 fats" },
    { word: "Poach", clue: "To cook fish gently in barely simmering liquid" },
    { word: "En papillote", clue: "Baking fish sealed in a parchment paper pouch so it steams" },
    { word: "Mercury", clue: "Metal in big fish like swordfish and shark that pregnant people should limit" },
    { word: "Sustainable", clue: "Caught or farmed in ways that protect fish populations for the future" },
  ],
} satisfies WordBank;
