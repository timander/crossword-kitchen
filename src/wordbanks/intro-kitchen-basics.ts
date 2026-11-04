import type { WordBank } from "./types.ts";

export default {
  id: "intro-kitchen-basics",
  name: "Kitchen Basics",
  level: "Intro to Foods · High School",
  title: "Kitchen Basics Crossword",
  description:
    "Use the clues to fill in the puzzle with kitchen tools and cooking terms we've learned in class. Each square holds one letter.",
  words: [
    { word: "Whisk", clue: "Tool made of wire loops, used to beat eggs or whip cream" },
    { word: "Spatula", clue: "Flat, flexible tool used to flip pancakes or scrape a bowl" },
    { word: "Colander", clue: "Bowl with holes used to drain cooked pasta" },
    { word: "Ladle", clue: "Long-handled, deep spoon used to serve soup" },
    { word: "Peeler", clue: "Tool that removes the skin from carrots and potatoes" },
    { word: "Grater", clue: "Tool with sharp holes, used for shredding cheese" },
    { word: "Simmer", clue: "To cook liquid just below boiling, with small, gentle bubbles" },
    { word: "Boil", clue: "To heat liquid until large bubbles rise quickly (212°F at sea level)" },
    { word: "Dice", clue: "To cut food into small, even cubes" },
    { word: "Mince", clue: "To chop food into very tiny pieces, like garlic" },
    { word: "Preheat", clue: "To turn the oven on early so it's hot when the food goes in" },
    { word: "Recipe", clue: "A list of ingredients and directions for making a dish" },
    { word: "Knead", clue: "To press, fold, and turn bread dough to build gluten" },
    { word: "Saute", clue: "To cook quickly in a little fat over medium-high heat" },
    { word: "Teaspoon", clue: "Smallest common measuring spoon, abbreviated tsp" },
    { word: "Yield", clue: "The number of servings a recipe makes" },
  ],
} satisfies WordBank;
