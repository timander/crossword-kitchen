import type { WordBank } from "./types.ts";

export default {
  id: "intro-safety-nutrition",
  name: "Food Safety & Nutrition",
  level: "Intro to Foods · High School",
  title: "Safe & Healthy Kitchen Crossword",
  description: "Review food safety and nutrition vocabulary. Multi-word answers show their letter counts, e.g. (6, 4).",
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
} satisfies WordBank;
