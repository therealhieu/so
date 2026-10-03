import type { Pos, Range } from "../text/pos";
import type { TextBuffer } from "../text/text-buffer";
import {
  charAt,
  cls,
  dec,
  decl,
  endWord,
  findUnmatched,
  fwdWord,
  inc,
  incl,
  nextCol,
} from "./motions";

/** A text object's range (end exclusive); `linewise` for whole-line objects. */
export type TextObject = (
  buf: TextBuffer,
  at: Pos,
  count: number,
) => (Range & { linewise?: true }) | null;

const after = (buf: TextBuffer, p: Pos): Pos => {
  const s = buf.line(p.line);
  return { line: p.line, col: p.col < s.length ? nextCol(s, p.col) : s.length };
};

/** Vim back_in_line(): to the start of the run of same-class characters. */
function backInLine(buf: TextBuffer, p: Pos, big: boolean) {
  const sclass = cls(buf, p, big);
  while (p.col > 0) {
    dec(buf, p);
    if (cls(buf, p, big) !== sclass) {
      inc(buf, p);
      break;
    }
  }
}

/** Vim current_word() outside Visual mode. */
function word(include: boolean, big: boolean): TextObject {
  return (buf, at, count) => {
    const p = { ...at };
    backInLine(buf, p, big);
    let start = { ...p };
    let inclusive = true;
    let includeWhite = false;
    if ((cls(buf, p, big) === 0) === include) {
      if (!endWord(buf, p, 1, big, true, true)) return null;
    } else {
      fwdWord(buf, p, 1, big, true);
      if (p.col === 0) decl(buf, p);
      else dec(buf, p);
      if (include) includeWhite = true;
    }
    for (let n = count - 1; n > 0; n--) {
      inclusive = true;
      if (incl(buf, p) === -1) return null;
      if (include !== (cls(buf, p, big) === 0)) {
        if (!fwdWord(buf, p, 1, big, true) && n > 1) return null;
        if (p.col === 0) inclusive = false;
        else dec(buf, p);
      } else if (!endWord(buf, p, 1, big, true, true)) return null;
    }
    if (
      includeWhite &&
      (cls(buf, p, big) !== 0 || (p.col === 0 && !inclusive))
    ) {
      const q = { ...start };
      if (q.col > 0) {
        dec(buf, q);
        backInLine(buf, q, big);
        if (cls(buf, q, big) === 0 && q.col > 0) start = q;
      }
    }
    return { start, end: inclusive ? after(buf, p) : p };
  };
}

const isWhite = (c: string | undefined) => c === " " || c === "\t";

function nextQuote(s: string, from: number, q: string): number {
  for (let i = from; i < s.length; i++) {
    if (s[i] === "\\") i++;
    else if (s[i] === q) return i;
  }
  return -1;
}

function prevQuote(s: string, from: number, q: string): number {
  let col = from;
  while (col > 0) {
    col--;
    let n = 0;
    while (col - n > 0 && s[col - n - 1] === "\\") n++;
    if (n % 2 === 1) col -= n;
    else if (s[col] === q) break;
  }
  return col;
}

/** Vim current_quote() outside Visual mode: quotes are matched within the line. */
function quote(include: boolean, q: string): TextObject {
  return (buf, at) => {
    const s = buf.line(at.line);
    let start: number;
    let end: number;
    if (s[at.col] === q) {
      const first = at.col;
      end = 0;
      for (;;) {
        start = nextQuote(s, end, q);
        if (start < 0 || start > first) return null;
        end = nextQuote(s, start + 1, q);
        if (end < 0) return null;
        if (start <= first && first <= end) break;
        end++;
      }
    } else {
      start = prevQuote(s, at.col, q);
      if (s[start] !== q) {
        start = nextQuote(s, start, q);
        if (start < 0) return null;
      }
      end = nextQuote(s, start + 1, q);
      if (end < 0) return null;
    }
    if (include) {
      if (isWhite(s[end + 1])) while (isWhite(s[end + 1])) end++;
      else while (start > 0 && isWhite(s[start - 1])) start--;
      return {
        start: { line: at.line, col: start },
        end: { line: at.line, col: end + 1 },
      };
    }
    return {
      start: { line: at.line, col: start + 1 },
      end: { line: at.line, col: end },
    };
  };
}

/** Vim inindent(extra): the cursor plus `extra` columns lie inside the indent. */
const inIndent = (buf: TextBuffer, p: Pos, extra: number) =>
  (buf.line(p.line).match(/^[ \t]*/)?.[0].length ?? 0) >= p.col + extra;

/** Vim current_block() outside Visual mode. */
function block(include: boolean, open: string, close: string): TextObject {
  return (buf, at, count) => {
    const p = { ...at };
    if (open === "{") while (inIndent(buf, p, 1)) if (inc(buf, p) !== 0) break;
    if (charAt(buf, p) === open) p.col++;
    let start: Pos | null = null;
    let from: Pos = p;
    for (let n = 0; n < count; n++) {
      const found = findUnmatched(buf, from, open, close, -1);
      if (found === null) break;
      start = found;
      from = found;
    }
    if (start === null) return null;
    const endBracket = findUnmatched(buf, start, open, close, 1);
    if (endBracket === null) return null;
    if (include) return { start, end: after(buf, endBracket) };
    const s = { ...start };
    incl(buf, s);
    const e = { ...endBracket };
    let sol = e.col === 0;
    decl(buf, e);
    while (inIndent(buf, e, 1)) {
      sol = true;
      if (decl(buf, e) !== 0) break;
    }
    if (sol) {
      incl(buf, e);
      return { start: s, end: e };
    }
    if (s.line < e.line || (s.line === e.line && s.col <= e.col))
      return { start: s, end: after(buf, e) };
    return { start: s, end: s };
  };
}

const isBlankLine = (buf: TextBuffer, line: number) =>
  /^[ \t]*$/.test(buf.line(line));

/** Vim current_par() outside Visual mode. */
function paragraph(include: boolean): TextObject {
  return (buf, at, count) => {
    const last = buf.lineCount - 1;
    let start = at.line;
    const whiteInFront = isBlankLine(buf, start);
    while (start > 0) {
      if (
        whiteInFront
          ? !isBlankLine(buf, start - 1)
          : isBlankLine(buf, start - 1)
      )
        break;
      start--;
    }
    let end = start;
    while (end <= last && isBlankLine(buf, end)) end++;
    end--;
    let i = count;
    if (!include && whiteInFront) i--;
    while (i-- > 0) {
      if (end === last) return null;
      const doWhite = !include && isBlankLine(buf, end + 1);
      if (include || !doWhite) {
        end++;
        while (end < last && !isBlankLine(buf, end + 1)) end++;
      }
      if (i === 0 && whiteInFront && include) break;
      if (include || doWhite)
        while (end < last && isBlankLine(buf, end + 1)) end++;
    }
    if (!whiteInFront && !isBlankLine(buf, end) && include)
      while (start > 0 && isBlankLine(buf, start - 1)) start--;
    return {
      start: { line: start, col: 0 },
      end: { line: end, col: buf.line(end).length },
      linewise: true,
    };
  };
}

/** Text objects by key ("iw", "a(", "ip", …). */
export const textObjects: Record<string, TextObject> = {
  iw: word(false, false),
  aw: word(true, false),
  iW: word(false, true),
  aW: word(true, true),
  'i"': quote(false, '"'),
  'a"': quote(true, '"'),
  "i'": quote(false, "'"),
  "a'": quote(true, "'"),
  "i`": quote(false, "`"),
  "a`": quote(true, "`"),
  ip: paragraph(false),
  ap: paragraph(true),
};

for (const [open, close, alias] of [
  ["(", ")", "b"],
  ["[", "]", ""],
  ["{", "}", "B"],
] as const)
  for (const include of [false, true]) {
    const prefix = include ? "a" : "i";
    const obj = block(include, open, close);
    for (const k of [open, close, alias])
      if (k !== "") textObjects[prefix + k] = obj;
  }
