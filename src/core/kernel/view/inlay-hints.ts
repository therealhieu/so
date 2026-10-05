import type { Pos } from "../text/pos";
import type { Decoration, DecorationProvider } from "./decorations";

/** Text a language server shows before the character at `pos`, padding included. */
export type InlayHint = { pos: Pos; label: string };

/**
 * The hints on the visible lines, drawn before their characters. Hints on
 * `hideLine` are left out: the line being typed on has moved under them.
 * Positions past a line's end sit at its end.
 */
export function inlayHintMarks(
  hints: readonly InlayHint[],
  hideLine?: number,
): DecorationProvider {
  return (v) => {
    const last = Math.min(v.visible.to, v.buf.lineCount);
    const out: Decoration[] = [];
    for (const h of hints) {
      const { line } = h.pos;
      if (line < v.visible.from || line >= last || line === hideLine) continue;
      if (h.label === "") continue;
      const col = Math.max(0, Math.min(h.pos.col, v.buf.line(line).length));
      const at = { line, col };
      out.push({
        kind: "replace",
        range: { start: at, end: at },
        block: false,
        spans: [{ text: h.label, style: "inlayHint", virtual: "inline" }],
      });
    }
    return out;
  };
}
