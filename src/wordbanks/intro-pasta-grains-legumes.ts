import type { WordBank } from "./types.ts";

export default {
  id: "intro-pasta-grains-legumes",
  name: "Pasta, Grains & Legumes",
  level: "Intro to Foods · High School",
  title: "Pasta, Grains & Legumes Crossword",
  description:
    "Test what you know about pasta shapes, the parts of a grain, and the bean family. Multi-word answers show their letter counts, e.g. (2, 5).",
  words: [
    { word: "Al dente", clue: 'Pasta cooked until tender but still firm to the bite; Italian for "to the tooth"' },
    { word: "Semolina", clue: "Coarse flour made from durum wheat, used for dried pasta" },
    { word: "Orzo", clue: "Small rice-shaped pasta often used in soups and salads" },
    { word: "Penne", clue: "Tube-shaped pasta cut on a diagonal" },
    { word: "Farfalle", clue: 'Bow-tie pasta; its name means "butterflies" in Italian' },
    { word: "Couscous", clue: "Tiny steamed granules of semolina from North African cooking" },
    { word: "Risotto", clue: "Creamy Italian dish made by slowly stirring broth into arborio rice" },
    { word: "Quinoa", clue: "Seed cooked like a grain; a complete protein" },
    { word: "Barley", clue: 'Chewy grain often added to soups; "pearled" when polished to remove hull and bran' },
    { word: "Oats", clue: "Grain that is rolled flat to make oatmeal" },
    { word: "Bran", clue: "Fiber-rich outer layer of a whole grain kernel" },
    { word: "Germ", clue: "Small, nutrient-rich part of a kernel that can sprout into a new plant" },
    { word: "Endosperm", clue: "Largest, starchy part of a grain kernel; white flour is made from it" },
    { word: "Legume", clue: "Plant family whose seeds grow in pods, like beans, peas, and peanuts" },
    { word: "Lentil", clue: "Small, lens-shaped legume that cooks quickly without soaking" },
    { word: "Chickpea", clue: "Legume used to make hummus; also called a garbanzo bean" },
  ],
} satisfies WordBank;
