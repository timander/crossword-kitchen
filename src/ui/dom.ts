// Tiny DOM helpers. Text always goes in via textContent/append, never HTML strings.

type Child = Node | string | null | undefined | false;

type Props<K extends keyof HTMLElementTagNameMap> = Partial<Omit<HTMLElementTagNameMap[K], "className">> & {
  class?: string;
  attrs?: Record<string, string>;
  dataset?: Record<string, string>;
};

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props<K> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  const { class: cls, attrs, dataset, ...rest } = props;
  if (cls) node.className = cls;
  Object.assign(node, rest);
  for (const [k, v] of Object.entries(attrs ?? {})) node.setAttribute(k, v);
  Object.assign(node.dataset, dataset);
  for (const child of children) if (child !== null && child !== undefined && child !== false) node.append(child);
  return node;
}

/** Looks up an element by id and checks its type, so callers get a typed element without casts. */
export function byId<T extends HTMLElement>(id: string, type: abstract new () => T): T {
  const node = document.getElementById(id);
  if (!(node instanceof type)) throw new Error(`Expected #${id} to be a ${type.name}`);
  return node;
}

/** Delays `fn` until calls stop for `ms`. `flush` runs a pending call now; `cancel` drops it. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: A | undefined;
  const run = (...args: A) => {
    clearTimeout(timer);
    pending = args;
    timer = setTimeout(run.flush, ms);
  };
  run.flush = () => {
    clearTimeout(timer);
    const args = pending;
    pending = undefined;
    if (args) fn(...args);
  };
  run.cancel = () => {
    clearTimeout(timer);
    pending = undefined;
  };
  return run;
}
