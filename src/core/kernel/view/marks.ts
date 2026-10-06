import type { Range } from "../text/pos";
import { matchesInLine, searchPattern } from "../vim/search";
import type { SearchState } from "../vim/types";
import type { Decoration, DecorationProvider } from "./decorations";
import type { Highlighter, StyleToken } from "./types";

const mark = (
  line: number,
  from: number,
  to: number,
  style: StyleToken,
): Decoration => ({
  kind: "mark",
  range: { start: { line, col: from }, end: { line, col: to } },
  style,
});

/** Syntax colours for the visible lines; a failing highlighter gives no marks. */
export function highlightMarks(h: Highlighter | undefined): DecorationProvider {
  return (v) => {
    if (h === undefined) return [];
    let lines: ReturnType<Highlighter["highlight"]>;
    try {
      lines = h.highlight(v.buf, v.visible);
    } catch {
      return [];
    }
    const out: Decoration[] = [];
    lines.forEach((spans, i) => {
      let col = 0;
      for (const s of spans) {
        if (s.text !== "")
          out.push(mark(v.visible.from + i, col, col + s.text.length, s.style));
        col += s.text.length;
      }
    });
    return out;
  };
}

/** Matches of the last search on the visible lines. */
export function searchMarks(
  search: SearchState | undefined,
): DecorationProvider {
  return (v) => {
    const re = search === undefined ? undefined : searchPattern(search.pattern);
    if (re === undefined) return [];
    const out: Decoration[] = [];
    const last = Math.min(v.visible.to, v.buf.lineCount);
    for (let line = v.visible.from; line < last; line++)
      for (const m of matchesInLine(v.buf.line(line), re))
        if (m.length > 0)
          out.push(mark(line, m.col, m.col + m.length, "searchMatch"));
    return out;
  };
}

/** The selection clipped to the visible lines. */
export function selectionMarks(
  selection: Range | undefined,
): DecorationProvider {
  return (v) => {
    const last = Math.min(v.visible.to, v.buf.lineCount) - 1;
    if (selection === undefined || last < v.visible.from) return [];
    if (selection.end.line < v.visible.from || selection.start.line > last)
      return [];
    const start =
      selection.start.line < v.visible.from
        ? { line: v.visible.from, col: 0 }
        : selection.start;
    const end =
      selection.end.line > last
        ? { line: last, col: v.buf.line(last).length }
        : selection.end;
    return [{ kind: "mark", range: { start, end }, style: "selection" }];
  };
}

/** Uses of the symbol under the cursor, on the visible lines. */
export function referenceMarks(ranges: readonly Range[]): DecorationProvider {
  return (v) =>
    ranges
      .filter(
        (r) => r.end.line >= v.visible.from && r.start.line < v.visible.to,
      )
      .map((range) => ({ kind: "mark", range, style: "lspReference" }));
}
