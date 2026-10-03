import type { Pos } from "../text/pos";
import type { TextBuffer } from "../text/text-buffer";
import { findMatch, searchPattern } from "./search";
import type { SearchState, VimEnv, VimState } from "./types";

export type MotionCtx = {
  hasCount: boolean;
  /** Display column vertical motions return to. */
  want: number;
  env: VimEnv;
  /** The pending operator ("d", "c", …), if any. */
  operator?: string;
  /** Character argument of f, F, t, T. */
  char?: string;
  lastFind?: VimState["lastFind"];
  search?: SearchState;
};

export type MotionResult = {
  to: Pos;
  linewise: boolean;
  inclusive: boolean;
  /** Display column to remember; omitted = the new cursor column. */
  want?: number;
};

export type Motion = (
  buf: TextBuffer,
  at: Pos,
  count: number,
  ctx: MotionCtx,
) => MotionResult | null;

const TABSTOP = 8;

// --- Columns -----------------------------------------------------------------

const isHigh = (s: string, i: number) => {
  const c = s.charCodeAt(i);
  return c >= 0xd800 && c <= 0xdbff;
};
const isLow = (s: string, i: number) => {
  const c = s.charCodeAt(i);
  return c >= 0xdc00 && c <= 0xdfff;
};
/** Column of the character after the one at `col`. */
export const nextCol = (s: string, col: number) =>
  col + (isHigh(s, col) ? 2 : 1);
/** Column of the character before `col`. */
export const prevCol = (s: string, col: number) =>
  col - (col >= 2 && isLow(s, col - 1) && isHigh(s, col - 2) ? 2 : 1);
/** Column of the last character, 0 on an empty line. */
export const lastCol = (s: string) =>
  s.length === 0 ? 0 : prevCol(s, s.length);

/** Display column where the character at `col` starts (tabs expand to 8). */
function displayCol(s: string, col: number): number {
  let v = 0;
  for (let i = 0; i < col && i < s.length; i = nextCol(s, i))
    v = s[i] === "\t" ? v + TABSTOP - (v % TABSTOP) : v + 1;
  return v;
}

/** Display column of a Normal-mode cursor (the end of a tab, like Vim). */
export function cursorDisplayCol(s: string, col: number): number {
  const v = displayCol(s, col);
  return s[col] === "\t" ? v + TABSTOP - (v % TABSTOP) - 1 : v;
}

/** The character column covering display column `want`, or the last character. */
export function colForDisplay(s: string, want: number): number {
  let v = 0;
  for (let i = 0; i < s.length; i = nextCol(s, i)) {
    const w = s[i] === "\t" ? TABSTOP - (v % TABSTOP) : 1;
    if (v + w > want) return i;
    v += w;
  }
  return lastCol(s);
}

export const firstNonBlank = (s: string) => {
  const m = s.match(/^[ \t]*/)?.[0].length ?? 0;
  return m < s.length ? m : lastCol(s);
};

// --- Vim's character walk: a position may sit on the end of a line ----------

/** Vim inc(): 0 moved within the line, 2 moved onto its end, 1 to the next line, -1 at the end. */
export function inc(buf: TextBuffer, p: Pos): number {
  const s = buf.line(p.line);
  if (p.col < s.length) {
    p.col = nextCol(s, p.col);
    return p.col < s.length ? 0 : 2;
  }
  if (p.line < buf.lineCount - 1) {
    p.line++;
    p.col = 0;
    return 1;
  }
  return -1;
}

/** Vim dec(): 0 within the line, 1 onto the end of the previous line, -1 at the start. */
export function dec(buf: TextBuffer, p: Pos): number {
  if (p.col > 0) {
    p.col = prevCol(buf.line(p.line), p.col);
    return 0;
  }
  if (p.line > 0) {
    p.line--;
    p.col = buf.line(p.line).length;
    return 1;
  }
  return -1;
}

/** Like inc(), but skips the end of a non-empty line. */
export function incl(buf: TextBuffer, p: Pos): number {
  let r = inc(buf, p);
  if (r >= 1 && p.col > 0) r = inc(buf, p);
  return r;
}

/** Like dec(), but skips the end of a non-empty line. */
export function decl(buf: TextBuffer, p: Pos): number {
  let r = dec(buf, p);
  if (r === 1 && p.col > 0) r = dec(buf, p);
  return r;
}

export function charAt(buf: TextBuffer, p: Pos): string {
  const s = buf.line(p.line);
  if (p.col >= s.length) return "";
  return String.fromCodePoint(s.codePointAt(p.col) as number);
}

/** Vim character class: 0 blank (or end of line), 1 punctuation, 2 word. */
export function cls(buf: TextBuffer, p: Pos, big: boolean): number {
  const c = charAt(buf, p);
  if (c === "" || c === " " || c === "\t" || c === " ") return 0;
  if (big) return 1;
  return /[\p{L}\p{N}_]/u.test(c) ? 2 : 1;
}

const lineEmpty = (buf: TextBuffer, line: number) =>
  buf.line(line).length === 0;

function skipChars(
  buf: TextBuffer,
  p: Pos,
  cclass: number,
  big: boolean,
  dir: 1 | -1,
) {
  while (cls(buf, p, big) === cclass)
    if ((dir === 1 ? inc(buf, p) : dec(buf, p)) === -1) return true;
  return false;
}

/** Vim fwd_word(); `eol` stops at the end of the line on the last count. */
export function fwdWord(
  buf: TextBuffer,
  p: Pos,
  count: number,
  big: boolean,
  eol: boolean,
) {
  for (let n = count - 1; n >= 0; n--) {
    const sclass = cls(buf, p, big);
    const lastLine = p.line === buf.lineCount - 1;
    let i = inc(buf, p);
    if (i === -1 || (i >= 1 && lastLine)) return false;
    if (i >= 1 && eol && n === 0) return true;
    if (sclass !== 0)
      while (cls(buf, p, big) === sclass) {
        i = inc(buf, p);
        if (i === -1 || (i >= 1 && eol && n === 0)) return true;
      }
    while (cls(buf, p, big) === 0) {
      if (p.col === 0 && lineEmpty(buf, p.line)) break;
      i = inc(buf, p);
      if (i === -1 || (i >= 1 && eol && n === 0)) return true;
    }
  }
  return true;
}

/** Vim end_word(); `stop` stays at the end of the current word, `empty` stops on empty lines. */
export function endWord(
  buf: TextBuffer,
  p: Pos,
  count: number,
  big: boolean,
  stop: boolean,
  empty: boolean,
) {
  for (let n = count - 1; n >= 0; n--) {
    const sclass = cls(buf, p, big);
    if (inc(buf, p) === -1) return false;
    let finished = false;
    if (cls(buf, p, big) === sclass && sclass !== 0) {
      if (skipChars(buf, p, sclass, big, 1)) return false;
    } else if (!stop || sclass === 0) {
      while (cls(buf, p, big) === 0) {
        if (p.col === 0 && lineEmpty(buf, p.line) && empty) {
          finished = true;
          break;
        }
        if (inc(buf, p) === -1) return false;
      }
      if (!finished && skipChars(buf, p, cls(buf, p, big), big, 1))
        return false;
    }
    if (!finished) dec(buf, p);
    stop = false;
  }
  return true;
}

/** Vim bck_word(). */
function bckWord(
  buf: TextBuffer,
  p: Pos,
  count: number,
  big: boolean,
  stop: boolean,
) {
  for (let n = count - 1; n >= 0; n--) {
    const sclass = cls(buf, p, big);
    if (dec(buf, p) === -1) return false;
    let finished = false;
    if (!stop || sclass === cls(buf, p, big) || sclass === 0) {
      while (cls(buf, p, big) === 0) {
        if (p.col === 0 && lineEmpty(buf, p.line)) {
          finished = true;
          break;
        }
        if (dec(buf, p) === -1) return true;
      }
      if (!finished && skipChars(buf, p, cls(buf, p, big), big, -1))
        return true;
    }
    if (!finished) inc(buf, p);
    stop = false;
  }
  return true;
}

// --- Motions -----------------------------------------------------------------

const vertical = (
  buf: TextBuffer,
  line: number,
  want: number,
): MotionResult => ({
  to: { line, col: colForDisplay(buf.line(line), want) },
  linewise: true,
  inclusive: false,
  want,
});

function wordMotion(big: boolean): Motion {
  return (buf, at, count, ctx) => {
    const p = { ...at };
    if (ctx.operator === "c" && cls(buf, p, big) !== 0) {
      // "cw" changes to the end of the word, like "ce".
      if (!endWord(buf, p, count, big, true, false)) return null;
      return { to: p, linewise: false, inclusive: true };
    }
    const ok = fwdWord(buf, p, count, big, ctx.operator !== undefined);
    if (!ok && ctx.operator === undefined) return null;
    let inclusive = false;
    const len = buf.line(p.line).length;
    if ((p.line > at.line || p.col > at.col) && p.col > 0 && p.col >= len) {
      p.col = prevCol(buf.line(p.line), p.col);
      inclusive = true;
    }
    return { to: p, linewise: false, inclusive };
  };
}

function endMotion(big: boolean): Motion {
  return (buf, at, count, ctx) => {
    const p = { ...at };
    if (
      !endWord(buf, p, count, big, false, false) &&
      ctx.operator === undefined
    )
      return null;
    return { to: p, linewise: false, inclusive: true };
  };
}

function backMotion(big: boolean): Motion {
  return (buf, at, count) => {
    const p = { ...at };
    if (!bckWord(buf, p, count, big, false)) return null;
    return { to: p, linewise: false, inclusive: false };
  };
}

/** f/F/t/T: `repeat` is true for ; and , (t then skips an adjacent match). */
function find(
  buf: TextBuffer,
  at: Pos,
  count: number,
  key: "f" | "F" | "t" | "T",
  char: string,
  repeat: boolean,
): MotionResult | null {
  const s = buf.line(at.line);
  const forward = key === "f" || key === "t";
  const till = key === "t" || key === "T";
  let col = at.col;
  if (till && repeat && count === 1)
    col = forward ? nextCol(s, col) : prevCol(s, col);
  for (let n = 0; n < count; n++) {
    const next = forward
      ? s.indexOf(char, nextCol(s, col))
      : s.lastIndexOf(char, col - 1);
    if (next < 0 || (!forward && col === 0)) return null;
    col = next;
  }
  if (till) col = forward ? prevCol(s, col) : nextCol(s, col);
  return { to: { line: at.line, col }, linewise: false, inclusive: forward };
}

const BRACKETS: Record<string, [string, string, 1 | -1]> = {
  "(": ["(", ")", 1],
  "[": ["[", "]", 1],
  "{": ["{", "}", 1],
  ")": ["(", ")", -1],
  "]": ["[", "]", -1],
  "}": ["{", "}", -1],
};

/** The bracket matching the one at `p` (searching across lines), or null. */
function matchBracket(buf: TextBuffer, p: Pos): Pos | null {
  const pair = BRACKETS[charAt(buf, p)];
  if (pair === undefined) return null;
  const [open, close, dir] = pair;
  const q = { ...p };
  let depth = 0;
  for (;;) {
    const c = charAt(buf, q);
    if (c === open) depth += dir;
    else if (c === close) depth -= dir;
    if (depth === 0) return q;
    if ((dir === 1 ? inc(buf, q) : dec(buf, q)) === -1) return null;
  }
}

/** Unmatched `open` before `p` (dir -1) or unmatched `close` after `p` (dir 1). */
export function findUnmatched(
  buf: TextBuffer,
  p: Pos,
  open: string,
  close: string,
  dir: 1 | -1,
) {
  const q = { ...p };
  let depth = 0;
  for (;;) {
    if ((dir === 1 ? inc(buf, q) : dec(buf, q)) === -1) return null;
    const c = charAt(buf, q);
    if (c === (dir === 1 ? open : close)) depth++;
    else if (c === (dir === 1 ? close : open)) {
      if (depth === 0) return q;
      depth--;
    }
  }
}

const percent: Motion = (buf, at, count, ctx) => {
  if (ctx.hasCount) {
    if (count > 100) return null;
    const line = Math.max(
      0,
      Math.floor((count * buf.lineCount + 99) / 100) - 1,
    );
    return vertical(buf, line, ctx.want);
  }
  const s = buf.line(at.line);
  let col = at.col;
  while (col < s.length && BRACKETS[s[col] as string] === undefined) col++;
  if (col >= s.length) return null;
  const to = matchBracket(buf, { line: at.line, col });
  return to === null ? null : { to, linewise: false, inclusive: true };
};

/** Vim findpar(): `{` and `}` stop at empty lines that follow text. */
function paragraph(dir: 1 | -1): Motion {
  return (buf, at, count) => {
    let curr = at.line;
    for (let n = count - 1; n >= 0; n--) {
      let didSkip = false;
      for (let first = true; ; first = false) {
        if (!lineEmpty(buf, curr)) didSkip = true;
        if (!first && didSkip && lineEmpty(buf, curr)) break;
        curr += dir;
        if (curr < 0 || curr >= buf.lineCount) {
          if (n > 0) return null;
          curr -= dir;
          break;
        }
      }
    }
    if (curr === buf.lineCount - 1 && dir === 1 && !lineEmpty(buf, curr)) {
      const s = buf.line(curr);
      return {
        to: { line: curr, col: lastCol(s) },
        linewise: false,
        inclusive: true,
      };
    }
    if (curr === at.line && at.col === 0) return null;
    return { to: { line: curr, col: 0 }, linewise: false, inclusive: false };
  };
}

function window(which: "H" | "M" | "L"): Motion {
  return (buf, _at, count, ctx) => {
    const top = Math.min(ctx.env.topLine, buf.lineCount - 1);
    const bottom = Math.min(top + ctx.env.rows - 1, buf.lineCount - 1);
    const line =
      which === "H"
        ? Math.min(top + count - 1, bottom)
        : which === "L"
          ? Math.max(bottom - count + 1, top)
          : top + Math.floor((bottom - top) / 2);
    return vertical(buf, line, ctx.want);
  };
}

function scroll(dir: 1 | -1): Motion {
  return (buf, at, count, ctx) => {
    const amount = ctx.hasCount
      ? count
      : Math.max(1, Math.floor(ctx.env.rows / 2));
    if (dir === 1 ? at.line >= buf.lineCount - 1 : at.line === 0) return null;
    const line = Math.min(
      buf.lineCount - 1,
      Math.max(0, at.line + dir * amount),
    );
    return vertical(buf, line, ctx.want);
  };
}

/** The keyword under or after the cursor, for `*` and `#`. */
export function wordUnderCursor(
  buf: TextBuffer,
  at: Pos,
): { word: string; col: number } | null {
  const s = buf.line(at.line);
  const re = /[\p{L}\p{N}_]+/gu;
  for (let m = re.exec(s); m !== null; m = re.exec(s))
    if (m.index + m[0].length > at.col) return { word: m[0], col: m.index };
  return null;
}

function searchMotion(dir: 1 | -1): Motion {
  return (buf, at, count, ctx) => {
    if (ctx.search === undefined) return null;
    const re = searchPattern(ctx.search.pattern);
    if (re === undefined) return null;
    const to = findMatch(buf, at, re, (ctx.search.dir * dir) as 1 | -1, count);
    return to === undefined ? null : { to, linewise: false, inclusive: false };
  };
}

/** Motions by key. Linewise motions keep the remembered display column. */
export const motions: Record<string, Motion> = {
  h: (buf, at, count) => {
    if (at.col === 0) return null;
    const s = buf.line(at.line);
    let col = at.col;
    for (let n = 0; n < count && col > 0; n++) col = prevCol(s, col);
    return { to: { line: at.line, col }, linewise: false, inclusive: false };
  },
  l: (buf, at, count, ctx) => {
    const s = buf.line(at.line);
    const max = ctx.operator !== undefined ? s.length : lastCol(s);
    if (at.col >= max) return null;
    let col = at.col;
    for (let n = 0; n < count && col < max; n++) col = nextCol(s, col);
    return { to: { line: at.line, col }, linewise: false, inclusive: false };
  },
  j: (buf, at, count, ctx) =>
    at.line >= buf.lineCount - 1
      ? null
      : vertical(buf, Math.min(buf.lineCount - 1, at.line + count), ctx.want),
  k: (buf, at, count, ctx) =>
    at.line === 0
      ? null
      : vertical(buf, Math.max(0, at.line - count), ctx.want),
  w: wordMotion(false),
  W: wordMotion(true),
  b: backMotion(false),
  B: backMotion(true),
  e: endMotion(false),
  E: endMotion(true),
  "0": (_buf, at) => ({
    to: { line: at.line, col: 0 },
    linewise: false,
    inclusive: false,
  }),
  "^": (buf, at) => ({
    to: { line: at.line, col: firstNonBlank(buf.line(at.line)) },
    linewise: false,
    inclusive: false,
  }),
  $: (buf, at, count) => {
    const line = at.line + count - 1;
    if (line >= buf.lineCount) return null;
    return {
      to: { line, col: lastCol(buf.line(line)) },
      linewise: false,
      inclusive: true,
      want: Number.POSITIVE_INFINITY,
    };
  },
  G: (buf, _at, count, ctx) =>
    vertical(
      buf,
      ctx.hasCount ? Math.min(count, buf.lineCount) - 1 : buf.lineCount - 1,
      ctx.want,
    ),
  gg: (buf, _at, count, ctx) =>
    vertical(
      buf,
      ctx.hasCount ? Math.min(count, buf.lineCount) - 1 : 0,
      ctx.want,
    ),
  f: (buf, at, count, ctx) =>
    ctx.char ? find(buf, at, count, "f", ctx.char, false) : null,
  F: (buf, at, count, ctx) =>
    ctx.char ? find(buf, at, count, "F", ctx.char, false) : null,
  t: (buf, at, count, ctx) =>
    ctx.char ? find(buf, at, count, "t", ctx.char, false) : null,
  T: (buf, at, count, ctx) =>
    ctx.char ? find(buf, at, count, "T", ctx.char, false) : null,
  ";": (buf, at, count, ctx) =>
    ctx.lastFind
      ? find(buf, at, count, ctx.lastFind.key, ctx.lastFind.char, true)
      : null,
  ",": (buf, at, count, ctx) => {
    if (!ctx.lastFind) return null;
    const reverse = { f: "F", F: "f", t: "T", T: "t" } as const;
    return find(
      buf,
      at,
      count,
      reverse[ctx.lastFind.key],
      ctx.lastFind.char,
      true,
    );
  },
  "%": percent,
  "}": paragraph(1),
  "{": paragraph(-1),
  H: window("H"),
  M: window("M"),
  L: window("L"),
  "<C-d>": scroll(1),
  "<C-u>": scroll(-1),
  n: searchMotion(1),
  N: searchMotion(-1),
  "*": searchMotion(1),
  "#": searchMotion(1),
};
