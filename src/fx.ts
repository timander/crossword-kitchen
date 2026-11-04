// Small DOM helpers: element builder, toast, and food-emoji confetti.

type Child = Node | string | null | undefined | false;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { class?: string; attrs?: Record<string, string> } = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  const { class: cls, attrs, ...rest } = props;
  if (cls) node.className = cls;
  Object.assign(node, rest);
  if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) if (c !== null && c !== undefined && c !== false) node.append(c);
  return node;
}

let toastTimer: number | undefined;
export function toast(message: string, ms = 2200) {
  const t = document.getElementById("toast")!;
  t.textContent = message;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove("show"), ms);
}

const FOODS = ["🍅", "🥕", "🧀", "🍋", "🥐", "🍓", "🥦", "🍩", "🌽", "🧁", "🍕", "🥑", "🍪", "🥨"];

export function confetti(count = 46) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < count; i++) {
    const s = el("span", { class: "confetti", textContent: FOODS[(Math.random() * FOODS.length) | 0] });
    s.style.left = `${Math.random() * 100}vw`;
    s.style.fontSize = `${1.2 + Math.random() * 1.4}rem`;
    s.style.animationDuration = `${2.2 + Math.random() * 2}s`;
    s.style.animationDelay = `${Math.random() * 0.9}s`;
    s.style.setProperty("--spin", `${Math.random() * 720 - 360}deg`);
    s.addEventListener("animationend", () => s.remove());
    document.body.append(s);
  }
}
