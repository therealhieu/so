import type { Edit, Pos, Range } from "./pos";

/**
 * Immutable text storage. Lines are split on "\n"; the original line
 * separator, final newline, and BOM are kept by the owner, not here.
 */
export interface TextBuffer {
  readonly version: number;
  readonly lineCount: number;
  line(i: number): string;
  apply(edit: Edit): { buffer: TextBuffer; inverse: Edit };
  slice(range: Range): string;
}

export function createTextBuffer(text: string): TextBuffer {
  return makeBuffer(text.split("\n"), 0);
}

function makeBuffer(lines: readonly string[], version: number): TextBuffer {
  const checkPos = (p: Pos) => {
    const text = lines[p.line];
    if (text === undefined || p.col < 0 || p.col > text.length)
      throw new RangeError(`position ${p.line}:${p.col} is outside the buffer`);
  };
  const checkRange = (r: Range) => {
    checkPos(r.start);
    checkPos(r.end);
    if (
      r.end.line < r.start.line ||
      (r.end.line === r.start.line && r.end.col < r.start.col)
    )
      throw new RangeError("range end is before its start");
  };
  const slice = (r: Range): string => {
    checkRange(r);
    if (r.start.line === r.end.line)
      return (lines[r.start.line] ?? "").slice(r.start.col, r.end.col);
    return [
      (lines[r.start.line] ?? "").slice(r.start.col),
      ...lines.slice(r.start.line + 1, r.end.line),
      (lines[r.end.line] ?? "").slice(0, r.end.col),
    ].join("\n");
  };
  return {
    version,
    lineCount: lines.length,
    line(i) {
      const text = lines[i];
      if (text === undefined)
        throw new RangeError(`line ${i} is outside the buffer`);
      return text;
    },
    slice,
    apply(edit) {
      const removed = slice(edit.range);
      const { start, end } = edit.range;
      const head = (lines[start.line] ?? "").slice(0, start.col);
      const tail = (lines[end.line] ?? "").slice(end.col);
      const inserted = edit.text.split("\n");
      const last = inserted.length - 1;
      const replacement = inserted.map((t, i) => {
        const withHead = i === 0 ? head + t : t;
        return i === last ? withHead + tail : withHead;
      });
      const next = [
        ...lines.slice(0, start.line),
        ...replacement,
        ...lines.slice(end.line + 1),
      ];
      const endCol =
        last === 0
          ? start.col + edit.text.length
          : (inserted[last] ?? "").length;
      return {
        buffer: makeBuffer(next, version + 1),
        inverse: {
          range: { start, end: { line: start.line + last, col: endCol } },
          text: removed,
        },
      };
    },
  };
}
