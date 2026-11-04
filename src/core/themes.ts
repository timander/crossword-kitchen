// Theme list for the picker. Colors live in src/styles/themes.css under [data-theme="…"].

export const THEMES = [
  { id: "ink", name: "Minimal Ink (saves toner)" },
  { id: "tomato", name: "Tomato Gingham" },
  { id: "basil", name: "Basil Garden" },
  { id: "diner", name: "Blueberry Diner" },
  { id: "chalkboard", name: "Chalkboard Café" },
  { id: "berry", name: "Berry Pastry" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "ink";

export const isThemeId = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);
