import type { Span } from "../../core/kernel/view/types";
import { paintLine } from "../editors/text-view";
import { drawCells } from "../theme";
import type { PaintTarget, WidgetPainter } from "./registry";

/** What core lays out for a note embed. */
type EmbedData = {
  title: string;
  rows: Span[][];
  more: number;
  state: "ok" | "loading" | "missing";
};

/** Draw `parts` left to right on row `i` of the target, padding the rest. */
function drawRow(t: PaintTarget, i: number, parts: [string, string][]): void {
  let x = 0;
  for (const [text, token] of parts) {
    if (x >= t.width) break;
    const n = Math.min([...text].length, t.width - x);
    drawCells(t.buf, t.theme.style(token), t.x + x, t.y + i, text, n);
    x += n;
  }
  if (x < t.width)
    drawCells(t.buf, t.theme.style("text"), t.x + x, t.y + i, "", t.width - x);
}

/** Span rows from core, one per target row; `prefix` cells come first. */
function drawSpans(
  t: PaintTarget,
  from: number,
  rows: readonly Span[][],
  prefix = 0,
): number {
  let i = from;
  for (const spans of rows) {
    if (i >= t.rows) break;
    if (prefix > 0) drawRow(t, i, [["│ ", "dim"]]);
    paintLine(
      t.buf,
      t.theme,
      { x: t.x + prefix, y: t.y + i, width: Math.max(0, t.width - prefix) },
      spans,
      {
        leftCol: 0,
        tabWidth: t.state.config.editor.tabWidth,
        cursorline: false,
      },
    );
    i++;
  }
  return i;
}

/**
 * Span-row widgets: a `text` widget's rows as they are, and a note embed as
 * a framed title, its rows, and `… N more lines` when capped; `loading…`
 * while the target is read, and the title in the unresolved style when it
 * is missing.
 */
export const paintEmbed: WidgetPainter = (t, w) => {
  if (Array.isArray(w.data)) {
    let i = drawSpans(t, 0, w.data as Span[][]);
    for (; i < t.rows; i++) drawRow(t, i, []);
    return;
  }
  const e = w.data as EmbedData;
  if (e.state === "missing") {
    drawRow(t, 0, [[`↳ ${e.title}`, "linkUnresolved"]]);
    for (let i = 1; i < t.rows; i++) drawRow(t, i, []);
    return;
  }
  drawRow(t, 0, [
    ["╭ ", "dim"],
    [`↳ ${e.title}`, "mdLink"],
  ]);
  let i = 1;
  if (e.state === "loading") {
    if (i < t.rows) drawRow(t, i++, [["│ loading…", "dim"]]);
  } else i = drawSpans(t, 1, e.rows, 2);
  if (e.more > 0 && i < t.rows)
    drawRow(t, i++, [[`╰ … ${e.more} more lines`, "dim"]]);
  for (; i < t.rows; i++) drawRow(t, i, [["│", "dim"]]);
};
