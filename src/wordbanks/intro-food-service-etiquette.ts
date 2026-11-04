import type { WordBank } from "./types.ts";

export default {
  id: "intro-food-service-etiquette",
  name: "Food Service Etiquette",
  level: "Intro to Foods · High School",
  title: "Food Service Etiquette Crossword",
  description:
    "Table setting, dining room jobs, and good manners when serving guests. Multi-word answers show their letter counts, e.g. (5, 4).",
  words: [
    { word: "Etiquette", clue: "Rules of polite behavior, like those at the dinner table" },
    { word: "Hospitality", clue: "Making guests feel welcome and cared for" },
    { word: "Host", clue: "Restaurant worker who greets guests and seats them" },
    { word: "Server", clue: "Takes guests' orders and brings food to the table" },
    { word: "Busser", clue: "Clears dirty dishes and resets tables" },
    { word: "Reservation", clue: "Booking a table ahead of time" },
    { word: "Gratuity", clue: "Another word for a tip" },
    { word: "Allergy", clue: "Always tell the kitchen about a guest's food ___" },
    { word: "Left", clue: "Traditionally, food is served from the guest's ___ side" },
    { word: "Right", clue: "Traditionally, plates are cleared from the guest's ___ side" },
    { word: "Napkin", clue: "Place this on your lap as soon as you sit down" },
    { word: "Salad fork", clue: "Smaller fork set on the outside, so it's used first" },
    { word: "Bread plate", clue: "Small plate set above the forks, at the upper left" },
    { word: "Water glass", clue: "Sits just above the tip of the dinner knife" },
    { word: "Charger", clue: "Large decorative plate set under the dinner plate" },
    { word: "Tray", clue: "Carried on a server's palm at shoulder height" },
  ],
} satisfies WordBank;
