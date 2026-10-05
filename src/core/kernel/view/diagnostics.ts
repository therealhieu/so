import type { Range } from "../text/pos";
import type { Decoration, DecorationProvider } from "./decorations";
import type { Sign, TextView } from "./types";

/** Error, warning, info, hint: a lower number is more severe. */
export type DiagnosticSeverity = 1 | 2 | 3 | 4;

/** A problem in a buffer; `range` uses buffer lines and UTF-16 columns. */
export type Diagnostic = {
  range: Range;
  severity: DiagnosticSeverity;
  message: string;
  source?: string;
  code?: string;
};

const SIGN: Record<DiagnosticSeverity, Sign> = {
  1: { text: "E", style: "diagnosticError" },
  2: { text: "W", style: "diagnosticWarn" },
  3: { text: "I", style: "diagnosticInfo" },
  4: { text: "H", style: "diagnosticHint" },
};

/** `n` within [0, max]; anything that is not a number ≥ 0 becomes 0. */
const clamp = (n: number, max: number) => (n >= 0 ? Math.min(n, max) : 0);

/**
 * `d.range` limited to lines `[line, last)` and their lengths. A zero-width
 * range covers the next character, or the last one at the end of a line.
 */
function visibleRange(
  v: TextView,
  d: Diagnostic,
  line: number,
  last: number,
): Range {
  const startLen = v.buf.line(line).length;
  let start = clamp(d.range.start.col, startLen);
  const endLine = Math.min(Math.max(d.range.end.line, line), last - 1);
  const endLen = endLine === line ? startLen : v.buf.line(endLine).length;
  let end =
    endLine === d.range.end.line ? clamp(d.range.end.col, endLen) : endLen;
  if (endLine === line && end <= start) {
    if (start < startLen) end = start + 1;
    else {
      start = Math.max(0, startLen - 1);
      end = startLen;
    }
  }
  return { start: { line, col: start }, end: { line: endLine, col: end } };
}

/** Signs (highest severity per line) and underlines for the visible lines; ranges are clamped to the buffer. */
export function diagnosticMarks(
  shown: readonly Diagnostic[],
): DecorationProvider {
  return (v) => {
    const from = v.visible.from;
    const last = Math.min(v.visible.to, v.buf.lineCount);
    const worst = new Map<number, DiagnosticSeverity>();
    const marks: { severity: DiagnosticSeverity; deco: Decoration }[] = [];
    for (const d of shown) {
      const line = d.range.start.line;
      if (!(line >= from && line < last) || !Number.isInteger(line)) continue;
      const seen = worst.get(line);
      if (seen === undefined || d.severity < seen) worst.set(line, d.severity);
      marks.push({
        severity: d.severity,
        deco: {
          kind: "mark",
          range: visibleRange(v, d, line, last),
          style: SIGN[d.severity].style,
        },
      });
    }
    // Later marks win where they overlap, so the most severe goes last.
    marks.sort((a, b) => b.severity - a.severity);
    const signs: Decoration[] = [...worst]
      .sort(([a], [b]) => a - b)
      .map(([line, severity]) => ({
        kind: "line",
        line,
        sign: SIGN[severity],
      }));
    return [...signs, ...marks.map((m) => m.deco)];
  };
}

const TEXT_STYLE: Record<DiagnosticSeverity, string> = {
  1: "diagnosticTextError",
  2: "diagnosticTextWarn",
  3: "diagnosticTextInfo",
  4: "diagnosticTextHint",
};

/**
 * The most severe diagnostic of each visible line, as `  ● message` after
 * the line: its first message line, and `(+N)` for the others on the line.
 */
export function endOfLineDiagnosticMarks(
  shown: readonly Diagnostic[],
): DecorationProvider {
  return (v) => {
    const from = v.visible.from;
    const last = Math.min(v.visible.to, v.buf.lineCount);
    const byLine = new Map<number, Diagnostic[]>();
    for (const d of shown) {
      const line = d.range.start.line;
      if (!(line >= from && line < last) || !Number.isInteger(line)) continue;
      byLine.set(line, [...(byLine.get(line) ?? []), d]);
    }
    return [...byLine]
      .sort(([a], [b]) => a - b)
      .map(([line, ds]): Decoration => {
        const worst = ds.reduce((a, b) => (b.severity < a.severity ? b : a));
        const more = ds.length > 1 ? ` (+${ds.length - 1})` : "";
        const message = worst.message.split("\n")[0] ?? "";
        const end = { line, col: v.buf.line(line).length };
        return {
          kind: "replace",
          range: { start: end, end },
          block: false,
          spans: [
            {
              text: `  ● ${message}${more}`,
              style: TEXT_STYLE[worst.severity],
              virtual: "eol",
            },
          ],
        };
      });
  };
}
