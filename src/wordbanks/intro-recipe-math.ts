import type { WordBank } from "./types.ts";

export default {
  id: "intro-recipe-math",
  name: "Recipe Math & Measurement",
  level: "Intro to Foods · High School",
  title: "Recipe Math Crossword",
  description:
    "Equivalents, conversions, and scaling recipes up or down. Keep a measurement chart handy if you get stuck!",
  words: [
    { word: "Tablespoon", clue: "Three teaspoons equal one ___" },
    { word: "Cup", clue: "Sixteen tablespoons equal one ___" },
    { word: "Pint", clue: "Two cups equal one ___" },
    { word: "Quart", clue: "Four cups, or two pints, equal one ___" },
    { word: "Gallon", clue: "Four quarts equal one ___" },
    { word: "Ounce", clue: "Two tablespoons equal one fluid ___" },
    { word: "Pound", clue: "Sixteen ounces of weight equal one ___" },
    { word: "Gram", clue: "Metric unit of weight; about 28 of them make an ounce" },
    { word: "Liter", clue: "Metric unit of volume, slightly more than a quart" },
    { word: "Dozen", clue: "A carton of twelve eggs" },
    { word: "Pinch", clue: "Tiny amount you can hold between your thumb and finger" },
    { word: "Fraction", clue: "Numbers like 1/2 and 3/4 on a measuring cup are written as a ___" },
    { word: "Yield", clue: "The number of servings a recipe makes" },
    { word: "Factor", clue: "Conversion ___: the new yield divided by the original yield" },
    { word: "Double", clue: "To make twice as many servings, multiply every ingredient by two" },
    { word: "Halve", clue: "To cut a recipe down to half the original amount" },
  ],
} satisfies WordBank;
