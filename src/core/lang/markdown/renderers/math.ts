import { scriptSpans } from "../../../kernel/view/sized";
import type { Span, StyleToken } from "../../../kernel/view/types";
import { fenceBody, wholeBlock } from "../block-text";
import type { BlockRenderer } from "../live-preview";
import { RenderCache } from "../render-cache";
import { labelAbove } from "./rows";

/** Math as terminal text: Unicode when every TeX token maps, otherwise the TeX source unchanged. */
export type MathResult =
  | { kind: "unicode"; text: string }
  | { kind: "source"; tex: string };

const GREEK: Readonly<Record<string, string>> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  varepsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  vartheta: "ϑ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  pi: "π",
  varpi: "ϖ",
  rho: "ρ",
  varrho: "ϱ",
  sigma: "σ",
  varsigma: "ς",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  varphi: "φ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  Gamma: "Γ",
  Delta: "Δ",
  Theta: "Θ",
  Lambda: "Λ",
  Xi: "Ξ",
  Pi: "Π",
  Sigma: "Σ",
  Upsilon: "Υ",
  Phi: "Φ",
  Psi: "Ψ",
  Omega: "Ω",
};

const SYMBOLS: Readonly<Record<string, string>> = {
  le: "≤",
  leq: "≤",
  ge: "≥",
  geq: "≥",
  ne: "≠",
  neq: "≠",
  approx: "≈",
  equiv: "≡",
  sim: "∼",
  propto: "∝",
  times: "×",
  cdot: "·",
  div: "÷",
  pm: "±",
  mp: "∓",
  infty: "∞",
  to: "→",
  rightarrow: "→",
  leftarrow: "←",
  Rightarrow: "⇒",
  Leftarrow: "⇐",
  leftrightarrow: "↔",
  sum: "∑",
  prod: "∏",
  int: "∫",
  oint: "∮",
  partial: "∂",
  nabla: "∇",
  in: "∈",
  notin: "∉",
  subset: "⊂",
  subseteq: "⊆",
  cup: "∪",
  cap: "∩",
  emptyset: "∅",
  forall: "∀",
  exists: "∃",
  neg: "¬",
  land: "∧",
  lor: "∨",
  ldots: "…",
  cdots: "⋯",
};

const SUPERSCRIPT: Readonly<Record<string, string>> = {
  ...digitMap("⁰¹²³⁴⁵⁶⁷⁸⁹"),
  "+": "⁺",
  "-": "⁻",
  "=": "⁼",
  "(": "⁽",
  ")": "⁾",
  a: "ᵃ",
  b: "ᵇ",
  c: "ᶜ",
  d: "ᵈ",
  e: "ᵉ",
  f: "ᶠ",
  g: "ᵍ",
  h: "ʰ",
  i: "ⁱ",
  j: "ʲ",
  k: "ᵏ",
  l: "ˡ",
  m: "ᵐ",
  n: "ⁿ",
  o: "ᵒ",
  p: "ᵖ",
  r: "ʳ",
  s: "ˢ",
  t: "ᵗ",
  u: "ᵘ",
  v: "ᵛ",
  w: "ʷ",
  x: "ˣ",
  y: "ʸ",
  z: "ᶻ",
  A: "ᴬ",
  B: "ᴮ",
  D: "ᴰ",
  E: "ᴱ",
  G: "ᴳ",
  H: "ᴴ",
  I: "ᴵ",
  J: "ᴶ",
  K: "ᴷ",
  L: "ᴸ",
  M: "ᴹ",
  N: "ᴺ",
  O: "ᴼ",
  P: "ᴾ",
  R: "ᴿ",
  T: "ᵀ",
  U: "ᵁ",
  V: "ⱽ",
  W: "ᵂ",
};

const SUBSCRIPT: Readonly<Record<string, string>> = {
  ...digitMap("₀₁₂₃₄₅₆₇₈₉"),
  "+": "₊",
  "-": "₋",
  "=": "₌",
  "(": "₍",
  ")": "₎",
  a: "ₐ",
  e: "ₑ",
  h: "ₕ",
  i: "ᵢ",
  j: "ⱼ",
  k: "ₖ",
  l: "ₗ",
  m: "ₘ",
  n: "ₙ",
  o: "ₒ",
  p: "ₚ",
  r: "ᵣ",
  s: "ₛ",
  t: "ₜ",
  u: "ᵤ",
  v: "ᵥ",
  x: "ₓ",
};

/** Characters that are TeX syntax, not literal text; any of them outside the scanner's rules is unmapped. */
const SPECIAL = new Set(["\\", "^", "_", "{", "}", "&", "$", "#", "%", "~"]);

function digitMap(glyphs: string): Record<string, string> {
  return Object.fromEntries(
    [...glyphs].map((glyph, digit) => [String(digit), glyph]),
  );
}

/** A piece of math text; a script piece is raised (`sup`) or lowered (`sub`). */
export type MathRun = { text: string; place?: "sup" | "sub" };

/**
 * How the scanner writes scripts: as Unicode script characters (every one
 * mapped, nested scripts refused), or as runs of any characters (nested
 * scripts flattened into their outer script).
 */
type ScriptMode = "unicode" | "runs";

/** TeX as Unicode text only when every token has a mapping (all or nothing). */
export function mathText(tex: string): MathResult {
  const runs = scan(tex, "unicode");
  return runs === null
    ? { kind: "source", tex }
    : { kind: "unicode", text: textOf(runs) };
}

/** TeX as text and script runs when every token outside scripts has a mapping. */
export function mathRuns(tex: string): MathRun[] | null {
  return scan(tex, "runs");
}

/**
 * TeX as `style` spans with each script as half-size pairs (`scriptSpans`),
 * or undefined when a token has no mapping or a script has a wide character.
 */
function mathSpans(tex: string, style: StyleToken): Span[] | undefined {
  const runs = mathRuns(tex);
  if (runs === null) return undefined;
  const out: Span[] = [];
  for (const r of runs) {
    const spans =
      r.place === undefined
        ? [{ text: r.text, style }]
        : scriptSpans(r.text, r.place, style);
    if (spans === undefined) return undefined;
    out.push(...spans);
  }
  return out;
}

/**
 * TeX as spans: half-size scripts with sized text when it can, else the
 * Unicode text, else undefined.
 */
export function mathTextSpans(
  tex: string,
  style: StyleToken,
  sizedText: boolean,
): Span[] | undefined {
  const sized = sizedText ? mathSpans(tex, style) : undefined;
  if (sized !== undefined) return sized;
  const r = mathText(tex);
  return r.kind === "unicode" ? [{ text: r.text, style }] : undefined;
}

function scan(tex: string, scripts: ScriptMode): MathRun[] | null {
  const scanner = new TexScanner(tex, scripts);
  const runs = scanner.sequence();
  return runs !== null && scanner.done() ? runs : null;
}

const textOf = (runs: readonly MathRun[]) => runs.map((r) => r.text).join("");

/** Appends `run` to `out`, joining it to the last run of the same place. */
function append(out: MathRun[], run: MathRun): void {
  if (run.text === "") return;
  const last = out.at(-1);
  if (last !== undefined && last.place === run.place)
    out[out.length - 1] = { ...last, text: last.text + run.text };
  else out.push(run);
}

/** Recursive-descent scanner; every method returns `null` when a token has no mapping. */
class TexScanner {
  private index = 0;

  constructor(
    private readonly tex: string,
    private readonly scripts: ScriptMode,
  ) {}

  done(): boolean {
    return this.index >= this.tex.length;
  }

  /** Reads atoms until the end of input or a closing brace (left unread). */
  sequence(): MathRun[] | null {
    const out: MathRun[] = [];
    while (!this.done() && this.tex[this.index] !== "}") {
      const char = this.tex[this.index] ?? "";
      if (char === "^" || char === "_") {
        this.index += 1;
        const script = this.argument();
        if (script === null) return null;
        if (this.scripts === "runs") {
          append(out, {
            text: textOf(script),
            place: char === "^" ? "sup" : "sub",
          });
          continue;
        }
        const table = char === "^" ? SUPERSCRIPT : SUBSCRIPT;
        const mapped = toScript(textOf(script), table);
        if (mapped === null) return null;
        append(out, { text: mapped });
        continue;
      }
      const atom = this.atom();
      if (atom === null) return null;
      for (const run of atom) append(out, run);
    }
    return out;
  }

  /** One atom: a literal character, a command, or a braced group. */
  private atom(): MathRun[] | null {
    const char = this.tex[this.index] ?? "";
    if (char === "{") return this.group();
    if (char === "\\") return this.command();
    if (SPECIAL.has(char)) return null;
    this.index += 1;
    return [{ text: char }];
  }

  /** A script or `\frac` argument: a braced group or a single atom. */
  private argument(): MathRun[] | null {
    if (this.done() || this.tex[this.index] === "}") return null;
    return this.atom();
  }

  private group(): MathRun[] | null {
    this.index += 1;
    const inner = this.sequence();
    if (inner === null || this.tex[this.index] !== "}") return null;
    this.index += 1;
    return inner;
  }

  private command(): MathRun[] | null {
    const match = /^\\([A-Za-z]+)/.exec(this.tex.slice(this.index));
    const name = match?.[1];
    if (!match || !name) return null;
    this.index += match[0].length;
    if (name === "frac") {
      const numerator = this.argument();
      const denominator = numerator === null ? null : this.argument();
      return numerator === null || denominator === null
        ? null
        : [...toOperand(numerator), { text: "/" }, ...toOperand(denominator)];
    }
    if (name === "sqrt") {
      if (this.tex[this.index] === "[") return null;
      const radicand = this.argument();
      if (radicand === null) return null;
      return [{ text: "√" }, ...toOperand(radicand)];
    }
    const symbol = GREEK[name] ?? SYMBOLS[name];
    return symbol === undefined ? null : [{ text: symbol }];
  }
}

/** Wraps an operand in parentheses unless it is one word or number, so `a+b` over `c` reads `(a+b)/c`. */
function toOperand(runs: MathRun[]): MathRun[] {
  return /^[\p{L}\p{N}.]+$/u.test(textOf(runs))
    ? runs
    : [{ text: "(" }, ...runs, { text: ")" }];
}

function toScript(
  text: string,
  table: Readonly<Record<string, string>>,
): string | null {
  let mapped = "";
  for (const char of text) {
    const glyph = table[char];
    if (glyph === undefined) return null;
    mapped += glyph;
  }
  return mapped;
}

const blocks = new RenderCache<Span[] | undefined>();

/**
 * A `$$` block as one row of text (half-size scripts with sized text, else
 * Unicode), or its source under a label.
 */
export const mathRenderer: BlockRenderer = (block, v, { ctx }) => {
  const range = wholeBlock(v.buf, block);
  const spans = blocks.get(`${block.hash}|${ctx.sizedText}`, () =>
    mathTextSpans(
      fenceBody(v.buf, block).join(" ").trim(),
      "mdCode",
      ctx.sizedText,
    ),
  );
  return spans !== undefined
    ? [{ kind: "replace", range, block: true, spans }]
    : [labelAbove(range.start.line, "math: unsupported TeX shown as source")];
};
