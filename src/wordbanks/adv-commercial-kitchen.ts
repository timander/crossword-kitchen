import type { WordBank } from "./types.ts";

export default {
  id: "adv-commercial-kitchen",
  name: "Commercial Kitchen Basics",
  level: "Advanced Food Prep · College",
  title: "Commercial Kitchen Crossword",
  description:
    "Equipment, stations, and line lingo from a professional kitchen. Multi-word answers show their letter counts, e.g. (5, 3).",
  words: [
    { word: "Salamander", clue: "Overhead broiler used to brown and finish dishes" },
    { word: "Lowboy", clue: "Under-counter refrigerator at a cook's station" },
    { word: "Walk-in", clue: "Large refrigerated room for bulk storage" },
    { word: "Combi oven", clue: "Oven that can cook with steam, convection heat, or both" },
    { word: "Hotel pan", clue: "Standard-size rectangular pan that fits a steam table" },
    { word: "Sheet pan", clue: "Shallow rimmed baking pan; a full one is 18 × 26 inches" },
    { word: "Bain marie", clue: "Hot water bath used to hold sauces warm" },
    { word: "Rondeau", clue: "Wide, shallow, straight-sided pot used for braising" },
    { word: "Hood", clue: "Ventilation system above the line, with built-in fire suppression" },
    { word: "Pass", clue: "Counter where finished plates wait for servers to pick them up" },
    { word: "Expo", clue: "Person at the pass who checks every plate before it goes out" },
    { word: "Ticket", clue: "Printed order sent from the dining room to the kitchen" },
    { word: "Eighty-six", clue: "Line lingo meaning an item has run out" },
    { word: "Par", clue: "___ level: the amount of an item to have on hand for a shift" },
    { word: "FIFO", clue: "\"First in, first out\" stock rotation (abbr.)" },
    { word: "Sanitizer", clue: "Solution in the third basin of a three-compartment sink" },
  ],
} satisfies WordBank;
