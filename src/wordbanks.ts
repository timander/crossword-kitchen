import type { WordInput } from "./generator.ts";

export interface WordBank {
  id: string;
  name: string;
  level: string;
  title: string;
  description: string;
  words: WordInput[];
}

export const WORD_BANKS: WordBank[] = [
  {
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
  },
  {
    id: "intro-safety-nutrition",
    name: "Food Safety & Nutrition",
    level: "Intro to Foods · High School",
    title: "Safe & Healthy Kitchen Crossword",
    description:
      "Review food safety and nutrition vocabulary. Read each clue carefully, then write one letter per square.",
    words: [
      { word: "Sanitize", clue: "To reduce germs on a surface to a safe level" },
      { word: "Bacteria", clue: "Tiny living things that can cause foodborne illness" },
      { word: "Danger zone", clue: "The 40°F–140°F range where bacteria grow fastest" },
      { word: "Thermometer", clue: "Tool used to check that food is cooked to a safe temperature" },
      { word: "Handwashing", clue: "Scrubbing with soap for at least 20 seconds before cooking" },
      { word: "Grease fire", clue: "Never use water on this; smother it with a lid instead" },
      { word: "Allergen", clue: "A food like peanuts or shellfish that can cause a serious reaction" },
      { word: "Apron", clue: "Worn over your clothes to keep them clean while cooking" },
      { word: "Protein", clue: "Nutrient that builds and repairs muscles; found in beans, eggs, and meat" },
      { word: "Fiber", clue: "Found in whole grains and vegetables; helps with digestion" },
      { word: "Calorie", clue: "Unit used to measure the energy in food" },
      { word: "Vitamin", clue: "Nutrient like A, C, or D that your body needs in small amounts" },
      { word: "Carbohydrate", clue: "The body's main source of energy, found in bread and pasta" },
      { word: "Sodium", clue: "Mineral found in salt; too much can raise blood pressure" },
      { word: "MyPlate", clue: "USDA guide that shows the five food groups on a dinner plate" },
    ],
  },
  {
    id: "adv-techniques",
    name: "Culinary Techniques & Knife Cuts",
    level: "Advanced Food Prep · College",
    title: "Culinary Techniques Crossword",
    description:
      "Classical techniques, knife cuts, and kitchen terminology. Multi-word answers show their letter counts, e.g. (4, 4).",
    words: [
      { word: "Brunoise", clue: "Fine dice of 1/8-inch cubes, often cut from a julienne" },
      { word: "Julienne", clue: "Matchstick cut, about 1/8 × 1/8 × 2 inches" },
      { word: "Chiffonade", clue: "Thin ribbons of rolled leafy herbs or greens" },
      { word: "Tourne", clue: "Seven-sided, football-shaped cut for root vegetables" },
      { word: "Blanch", clue: "Briefly cook in boiling water, then shock in ice water" },
      { word: "Braise", clue: "Sear, then cook slowly, partly covered in liquid" },
      { word: "Confit", clue: "Food slowly cooked while submerged in fat, like duck legs" },
      { word: "Sous vide", clue: "Vacuum-sealed food cooked in a precisely controlled water bath" },
      { word: "Deglaze", clue: "Add liquid to a hot pan to loosen the browned bits" },
      { word: "Fond", clue: "The browned bits stuck to a pan after searing" },
      { word: "Mirepoix", clue: "Onion, carrot, and celery in a 2:1:1 ratio" },
      { word: "Maillard", clue: "Reaction between amino acids and sugars that browns food" },
      { word: "Carryover", clue: "___ cooking: the temperature keeps rising after food leaves the heat" },
      { word: "Mise en place", clue: "French for \"everything in its place\"; prep before service" },
      { word: "Temper", clue: "Slowly raise the temperature of eggs so they don't curdle" },
      { word: "Brigade", clue: "Escoffier's system of kitchen ranks and stations" },
    ],
  },
  {
    id: "adv-sauces-pastry",
    name: "Sauces & Pastry",
    level: "Advanced Food Prep · College",
    title: "Sauces & Pastry Crossword",
    description:
      "Mother sauces, thickeners, and pastry fundamentals. Multi-word answers show their letter counts, e.g. (6, 5).",
    words: [
      { word: "Bechamel", clue: "Mother sauce of milk thickened with a white roux" },
      { word: "Veloute", clue: "Mother sauce of white stock thickened with a blond roux" },
      { word: "Espagnole", clue: "Brown mother sauce made with brown stock, mirepoix, and tomato" },
      { word: "Hollandaise", clue: "Warm emulsion of egg yolks, butter, and lemon juice" },
      { word: "Roux", clue: "Equal weights of fat and flour cooked together" },
      { word: "Nappe", clue: "Sauce consistency that coats the back of a spoon" },
      { word: "Liaison", clue: "Egg yolks and cream used to enrich and thicken a sauce" },
      { word: "Slurry", clue: "Starch mixed into cold liquid before thickening" },
      { word: "Beurre blanc", clue: "Butter sauce mounted into a wine and shallot reduction" },
      { word: "Consomme", clue: "Stock clarified with a raft of egg whites and ground meat" },
      { word: "Pate a choux", clue: "Cooked dough used for eclairs and cream puffs" },
      { word: "Lamination", clue: "Folding butter into dough to create flaky layers" },
      { word: "Ganache", clue: "Emulsion of chocolate and hot cream" },
      { word: "Sabayon", clue: "Egg yolks whisked over heat until light and foamy" },
      { word: "Proof", clue: "Final rise of shaped yeast dough before baking" },
      { word: "Bloom", clue: "To hydrate gelatin in cold liquid before melting it" },
    ],
  },
];
