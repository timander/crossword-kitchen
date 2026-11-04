// Feedback effects: a toast message and food-emoji confetti.

import { byId, el } from "./dom.ts";

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function toast(message: string, ms = 2200) {
  const node = byId("toast", HTMLElement);
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    node.classList.remove("show");
  }, ms);
}

const FOODS = ["🍅", "🥕", "🧀", "🍋", "🥐", "🍓", "🥦", "🍩", "🌽", "🧁", "🍕", "🥑", "🍪", "🥨"];
const pick = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

export function confetti(count = 46) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < count; i++) {
    const piece = el("span", { class: "confetti", textContent: pick(FOODS) ?? "🍅", ariaHidden: "true" });
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.fontSize = `${1.2 + Math.random() * 1.4}rem`;
    piece.style.animationDuration = `${2.2 + Math.random() * 2}s`;
    piece.style.animationDelay = `${Math.random() * 0.9}s`;
    piece.style.setProperty("--spin", `${Math.random() * 720 - 360}deg`);
    piece.addEventListener("animationend", () => {
      piece.remove();
    });
    document.body.append(piece);
  }
}
