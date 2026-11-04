import type { WordBank } from "./types.ts";

export default {
  id: "pro-michelin-kitchen",
  name: "Michelin-Star Kitchen",
  level: "Professional · Michelin-Star Kitchen",
  title: "Michelin-Star Kitchen Crossword",
  description:
    "Brigade roles, service calls, advanced technique, ingredients, and plating from the top of the profession. Multi-word answers show their letter counts, e.g. (4, 2, 6).",
  words: [
    { word: "Chef de partie", clue: "Head of a single station, such as fish or roast, in the brigade" },
    { word: "Commis", clue: "Junior cook who assists a station chef while learning the line" },
    { word: "Saucier", clue: "Senior station chef in charge of sautéed meats and their jus" },
    { word: "Entremetier", clue: "Station chef responsible for vegetables, starches, soups, and eggs" },
    { word: "Garde manger", clue: "Cold station for terrines, cured meats, salads, and canapés" },
    { word: "Oui chef", clue: "Instant reply confirming you heard a call from the pass" },
    { word: "Fire", clue: "Call from the pass to start cooking a table's next course" },
    { word: "Hands", clue: "Call meaning finished plates at the pass need runners now" },
    { word: "Stage", clue: "Short, often unpaid working trial in another chef's kitchen" },
    { word: "Quenelle", clue: "Smooth three-sided oval of mousse or sorbet shaped with spoons" },
    { word: "Beurre noisette", clue: "Butter cooked until its milk solids turn toasty hazelnut brown" },
    { word: "Arroser", clue: "To baste a protein continuously with foaming butter as it cooks" },
    { word: "Glace de viande", clue: "Brown stock reduced until syrupy; it sets like rubber when chilled" },
    { word: "Ikejime", clue: "Japanese method of quickly killing fish to preserve flavor and texture" },
    { word: "Bresse", clue: "French region whose AOP chickens have blue feet, white feathers, red combs" },
    { word: "Tweezers", clue: "Fine-tipped plating tool for placing microgreens and delicate garnishes" },
  ],
} satisfies WordBank;
