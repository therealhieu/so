/**
 * Replace CSS custom properties in an SVG with their values, for renderers
 * that know neither `var()` nor `color-mix()`. Properties are read from
 * every `--name: value` declaration in the text (the first one wins);
 * `color-mix(in srgb, a p%, b)` of two hex colours becomes one hex colour.
 * An expression that cannot be resolved is left as it is.
 */
export function inlineCssVars(svg: string): string {
  const props = new Map<string, string>();
  for (const m of svg.matchAll(/(--[\w-]+)\s*:\s*([^;"}]+)/g)) {
    const [, name, value] = m;
    if (name !== undefined && value !== undefined && !props.has(name))
      props.set(name, value.trim());
  }
  return substitute(svg, props, 0);
}

const FUNCTIONS = /\b(var|color-mix)\(/g;

/** `text` with every `var()` and `color-mix()` call evaluated. */
function substitute(
  text: string,
  props: ReadonlyMap<string, string>,
  depth: number,
): string {
  if (depth > 16) return text;
  let out = "";
  let at = 0;
  for (const m of text.matchAll(FUNCTIONS)) {
    if (m.index < at) continue;
    const open = m.index + m[0].length;
    const close = closing(text, open);
    if (close === undefined) break;
    const args = splitArgs(text.slice(open, close)).map((a) =>
      substitute(a, props, depth + 1).trim(),
    );
    const value = m[1] === "var" ? lookup(args, props, depth) : mix(args);
    out += text.slice(at, m.index) + (value ?? text.slice(m.index, close + 1));
    at = close + 1;
  }
  return out + text.slice(at);
}

function lookup(
  [name, fallback]: string[],
  props: ReadonlyMap<string, string>,
  depth: number,
): string | undefined {
  const value = name === undefined ? undefined : props.get(name);
  if (value !== undefined) return substitute(value, props, depth + 1).trim();
  return fallback;
}

/** The index of the `)` that closes the call whose arguments start at `from`. */
function closing(text: string, from: number): number | undefined {
  let depth = 0;
  for (let i = from; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") {
      if (depth === 0) return i;
      depth--;
    }
  }
  return undefined;
}

/** Arguments split at top-level commas. */
function splitArgs(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "," && depth === 0) {
      out.push(text.slice(start, i));
      start = i + 1;
    }
  }
  out.push(text.slice(start));
  return out;
}

type Rgb = [number, number, number];

function hex(c: string): Rgb | undefined {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim());
  if (m?.[1] === undefined) return undefined;
  const h = m[1].length === 3 ? [...m[1]].map((d) => d + d).join("") : m[1];
  return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

const toHex = (c: Rgb) =>
  `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

/** A colour and its optional percentage, as `color-mix` takes them. */
function part(arg: string): { rgb: Rgb; pct?: number } | undefined {
  const m = /^(\S+)(?:\s+([\d.]+)%)?$/.exec(arg.trim());
  const rgb = m?.[1] === undefined ? undefined : hex(m[1]);
  if (rgb === undefined) return undefined;
  return m?.[2] === undefined ? { rgb } : { rgb, pct: Number(m[2]) };
}

/** `color-mix(in srgb, a [p%], b [q%])` of two hex colours. */
function mix([space, a, b]: string[]): string | undefined {
  if (space?.trim() !== "in srgb" || a === undefined || b === undefined)
    return undefined;
  const x = part(a);
  const y = part(b);
  if (x === undefined || y === undefined) return undefined;
  const p =
    x.pct !== undefined
      ? x.pct / 100
      : y.pct !== undefined
        ? 1 - y.pct / 100
        : 0.5;
  return toHex(x.rgb.map((v, i) => v * p + (y.rgb[i] ?? 0) * (1 - p)) as Rgb);
}
