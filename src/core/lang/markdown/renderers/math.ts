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

/** TeX as Unicode text only when every token has a mapping (all or nothing). */
export function mathText(tex: string): MathResult {
  const scanner = new TexScanner(tex);
  const text = scanner.sequence();
  return text !== null && scanner.done()
    ? { kind: "unicode", text }
    : { kind: "source", tex };
}

/** Recursive-descent scanner; every method returns `null` when a token has no mapping. */
class TexScanner {
  private index = 0;

  constructor(private readonly tex: string) {}

  done(): boolean {
    return this.index >= this.tex.length;
  }

  /** Reads atoms until the end of input or a closing brace (left unread). */
  sequence(): string | null {
    let text = "";
    while (!this.done() && this.tex[this.index] !== "}") {
      const char = this.tex[this.index] ?? "";
      if (char === "^" || char === "_") {
        this.index += 1;
        const script = this.argument();
        const table = char === "^" ? SUPERSCRIPT : SUBSCRIPT;
        const mapped = script === null ? null : toScript(script, table);
        if (mapped === null) return null;
        text += mapped;
        continue;
      }
      const atom = this.atom();
      if (atom === null) return null;
      text += atom;
    }
    return text;
  }

  /** One atom: a literal character, a command, or a braced group. */
  private atom(): string | null {
    const char = this.tex[this.index] ?? "";
    if (char === "{") return this.group();
    if (char === "\\") return this.command();
    if (SPECIAL.has(char)) return null;
    this.index += 1;
    return char;
  }

  /** A script or `\frac` argument: a braced group or a single atom. */
  private argument(): string | null {
    if (this.done() || this.tex[this.index] === "}") return null;
    return this.atom();
  }

  private group(): string | null {
    this.index += 1;
    const inner = this.sequence();
    if (inner === null || this.tex[this.index] !== "}") return null;
    this.index += 1;
    return inner;
  }

  private command(): string | null {
    const match = /^\\([A-Za-z]+)/.exec(this.tex.slice(this.index));
    const name = match?.[1];
    if (!match || !name) return null;
    this.index += match[0].length;
    if (name === "frac") {
      const numerator = this.argument();
      const denominator = numerator === null ? null : this.argument();
      return numerator === null || denominator === null
        ? null
        : `${toOperand(numerator)}/${toOperand(denominator)}`;
    }
    if (name === "sqrt") {
      if (this.tex[this.index] === "[") return null;
      const radicand = this.argument();
      if (radicand === null) return null;
      return `√${toOperand(radicand)}`;
    }
    return GREEK[name] ?? SYMBOLS[name] ?? null;
  }
}

/** Wraps an operand in parentheses unless it is one word or number, so `a+b` over `c` reads `(a+b)/c`. */
function toOperand(text: string): string {
  return /^[\p{L}\p{N}.]+$/u.test(text) ? text : `(${text})`;
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

const blocks = new RenderCache<MathResult>();

/** A `$$` block as one row of Unicode text, or its source under a label. */
export const mathRenderer: BlockRenderer = (block, v) => {
  const range = wholeBlock(v.buf, block);
  const r = blocks.get(block.hash, () =>
    mathText(fenceBody(v.buf, block).join(" ").trim()),
  );
  return r.kind === "unicode"
    ? [
        {
          kind: "replace",
          range,
          block: true,
          spans: [{ text: r.text, style: "mdCode" }],
        },
      ]
    : [labelAbove(range.start.line, "math: unsupported TeX shown as source")];
};
