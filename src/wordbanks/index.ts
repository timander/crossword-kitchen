// Word bank registry. To add a bank: create a file next to this one
// (copy an existing bank as a template), then import it and add it below.
// Banks appear in the picker in this order, grouped by `level`.
import type { WordBank } from "./types.ts";

import introKitchenBasics from "./intro-kitchen-basics.ts";
import introSafetyNutrition from "./intro-safety-nutrition.ts";
import introPastaGrainsLegumes from "./intro-pasta-grains-legumes.ts";
import introRecipeMath from "./intro-recipe-math.ts";
import introFoodServiceEtiquette from "./intro-food-service-etiquette.ts";
import advTechniques from "./adv-techniques.ts";
import advSaucesPastry from "./adv-sauces-pastry.ts";
import advCommercialKitchen from "./adv-commercial-kitchen.ts";
import advPoultry from "./adv-poultry.ts";
import introFishSeafood from "./intro-fish-seafood.ts";
import gradCulinaryArts from "./grad-culinary-arts.ts";
import proMichelinKitchen from "./pro-michelin-kitchen.ts";

export type { WordBank };

export const WORD_BANKS: WordBank[] = [
  introKitchenBasics,
  introSafetyNutrition,
  introPastaGrainsLegumes,
  introRecipeMath,
  introFoodServiceEtiquette,
  introFishSeafood,
  advTechniques,
  advSaucesPastry,
  advCommercialKitchen,
  advPoultry,
  gradCulinaryArts,
  proMichelinKitchen,
];

// Loaded on a first visit.
export const DEFAULT_BANK: WordBank = introKitchenBasics;
