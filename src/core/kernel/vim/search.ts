import type { Pos } from "../text/pos";
import type { TextBuffer } from "../text/text-buffer";

const WORD = "[\\p{L}\\p{N}_]";

// Vim "magic" escapes that differ from JavaScript.
const ESCAPED: Record<string, string> = {
  "<": `(?<!${WORD})(?=${WORD})`,
  ">": `(?<=${WORD})(?!${WORD})`,
  "+": "+",
  "?": "?",
  "=": "?",
  "|": "|",
  "(": "(",
  ")": ")",
  "/": "/",
  a: "[A-Za-z]",
  A: "[^A-Za-z]",
  l: "[a-z]",
  u: "[A-Z]",
  t: "\\t",
};

/**
 * Translate a Vim search pattern ('magic': `\<`, `\>`, `\{n,m}`, `\(`, `\|`, …)
 * into a RegExp; `undefined` when the pattern is invalid.
 */
export function searchPattern(pattern: string): RegExp | undefined {
  let out = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i] as string;
    if (c === "\\") {
      const n = pattern[i + 1];
      if (n === undefined) return undefined;
      i++;
      if (n === "{") {
        const close = pattern.indexOf("}", i);
        if (close < 0) return undefined;
        const body = pattern.slice(i + 1, close);
        const lazy = body.startsWith("-");
        const range = lazy ? body.slice(1) : body;
        out +=
          range === "" ? (lazy ? "*?" : "*") : `{${range}}${lazy ? "?" : ""}`;
        i = close;
      } else out += ESCAPED[n] ?? `\\${n}`;
    } else if (c === "[") {
      const close = pattern.indexOf(
        "]",
        pattern[i + 1] === "]" ? i + 2 : i + 1,
      );
      if (close < 0) out += "\\[";
      else {
        out += pattern.slice(i, close + 1);
        i = close;
      }
    } else if ("+?|(){}/".includes(c)) out += `\\${c}`;
    else if (c === "~") out += "~";
    else out += c;
  }
  try {
    return new RegExp(out, "gu");
  } catch {
    return undefined;
  }
}

/**
 * The message for a search that cannot move the cursor: the pattern is
 * invalid or matches nowhere in the buffer. `undefined` when it matches.
 */
export function searchError(
  buf: TextBuffer,
  pattern: string,
): string | undefined {
  const re = searchPattern(pattern);
  const found =
    re !== undefined &&
    findMatch(buf, { line: 0, col: 0 }, re, 1) !== undefined;
  return found ? undefined : `E486: Pattern not found: ${pattern}`;
}

/** Match start columns in one line, in order. */
export function matchesInLine(
  text: string,
  re: RegExp,
): { col: number; length: number }[] {
  const out: { col: number; length: number }[] = [];
  re.lastIndex = 0;
  for (let m = re.exec(text); m !== null; m = re.exec(text)) {
    out.push({ col: m.index, length: m[0].length });
    if (m[0].length === 0) re.lastIndex++;
    if (re.lastIndex > text.length) break;
  }
  return out;
}

/** The `count`-th match after (dir 1) or before (dir -1) `from`, wrapping around. */
export function findMatch(
  buf: TextBuffer,
  from: Pos,
  re: RegExp,
  dir: 1 | -1,
  count = 1,
): Pos | undefined {
  let at: Pos = from;
  for (let n = 0; n < count; n++) {
    const next = findOne(buf, at, re, dir);
    if (next === undefined) return undefined;
    at = next;
  }
  return at;
}

function findOne(
  buf: TextBuffer,
  from: Pos,
  re: RegExp,
  dir: 1 | -1,
): Pos | undefined {
  const lines = buf.lineCount;
  for (let i = 0; i <= lines; i++) {
    const line = (((from.line + dir * i) % lines) + lines) % lines;
    const cols = matchesInLine(buf.line(line), re).map((m) => m.col);
    const hit =
      dir === 1
        ? cols.find((c) => i > 0 || c > from.col)
        : cols.findLast((c) => i > 0 || c < from.col);
    if (
      hit !== undefined &&
      (i < lines || (dir === 1 ? hit <= from.col : hit >= from.col))
    )
      return { line, col: hit };
  }
  return undefined;
}

/** Where the cursor sits among a pattern's matches, Neovim's `[current/total]`. */
export type SearchCount = {
  /** Matches starting at or before the cursor. */
  current: number;
  total: number;
  /** More than `cap` matches; `total` stops at `cap + 1`. */
  capped: boolean;
};

/** Match starts in buffer order, stopping after `limit`. */
export function matchStarts(buf: TextBuffer, re: RegExp, limit: number): Pos[] {
  const out: Pos[] = [];
  for (let line = 0; line < buf.lineCount && out.length < limit; line++)
    for (const m of matchesInLine(buf.line(line), re)) {
      out.push({ line, col: m.col });
      if (out.length === limit) break;
    }
  return out;
}

/** The cursor's place among `starts` (from `matchStarts` with `cap + 1`). */
export function searchCount(
  starts: readonly Pos[],
  at: Pos,
  cap: number,
): SearchCount {
  let lo = 0;
  let hi = starts.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const p = starts[mid] as Pos;
    if (p.line < at.line || (p.line === at.line && p.col <= at.col))
      lo = mid + 1;
    else hi = mid;
  }
  return { current: lo, total: starts.length, capped: starts.length > cap };
}
