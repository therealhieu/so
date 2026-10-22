import { type OptimizedBuffer, TextAttributes } from "@opentui/core";
import { sizedCell, underText } from "../core/kernel/view/sized";
import type {
  SizedChunk,
  SizedScale,
  StyleToken,
} from "../core/kernel/view/types";
import { rowBytes, type SizedText } from "./sized-text";
import { drawCells, type Style, type Theme } from "./theme";

/**
 * The look of text in `token` over its line style `under`: a token without
 * a background of its own takes the line's, and on the cursor line every
 * token but selection and search matches takes the cursorline background.
 */
export function lookOf(
  theme: Theme,
  { style: token, under }: { style: StyleToken; under?: StyleToken },
  cursorline: boolean,
): Style {
  const own = theme.style(token);
  const st =
    under !== undefined && own.bg.equals(theme.style("text").bg)
      ? { ...own, bg: theme.style(under).bg }
      : own;
  return cursorline &&
    token !== "selection" &&
    token !== "searchMatch" &&
    token !== "searchCurrent"
    ? { ...st, bg: theme.style("cursorline").bg }
    : st;
}

/**
 * One zoomed row of `chunks` from (x, y), a sized cell tall, with `rows`
 * screen rows left for it: every character at normal size where its sized
 * glyph starts, in its look, blanks below it, and the terminal drawing it
 * larger over them. A bar is drawn at normal size on every row, its `down`
 * text below its first. A blank between sized words keeps an underline
 * only on its last row, near the sized text's, and none is struck. A row
 * cut at the bottom or wider than `width` keeps its normal-size text and
 * is not sent. `gutter` paints each screen row's gutter first.
 */
export function paintZoomRow(o: {
  buf: OptimizedBuffer;
  sizedText: SizedText;
  x: number;
  y: number;
  width: number;
  rows: number;
  scale: SizedScale;
  chunks: readonly SizedChunk[];
  look: (c: SizedChunk) => Style;
  fill: Style;
  gutter?: (r: number) => void;
}): void {
  const step = sizedCell(o.scale);
  const cells = o.chunks.reduce((n, c) => n + c.cells, 0);
  const whole = step <= o.rows && cells <= o.width;
  const blankLook = (c: SizedChunk, r: number): Style => {
    const st = o.look(c);
    const drop =
      TextAttributes.STRIKETHROUGH |
      (r === step - 1 ? 0 : TextAttributes.UNDERLINE);
    return { ...st, attrs: st.attrs & ~drop };
  };
  /** Screen row `r`'s chunks; returns the column after them. */
  const paintChunks = (buf: OptimizedBuffer, r: number): number => {
    let x = 0;
    for (const c of o.chunks) {
      const n = Math.min(o.width - x, whole ? c.cells : (c.w ?? c.cells));
      if (n <= 0) break;
      const text =
        c.bar === true
          ? r === 0
            ? c.text
            : (c.down ?? c.text)
          : r === 0 && c.plain !== true
            ? whole
              ? underText(c, o.scale)
              : c.text
            : "";
      const st = c.plain === true && whole ? blankLook(c, r) : o.look(c);
      drawCells(buf, st, o.x + x, o.y + r, text, n);
      x += n;
    }
    return x;
  };
  for (let r = 0; r < step && r < o.rows; r++) {
    o.gutter?.(r);
    const x = paintChunks(o.buf, r);
    if (x < o.width)
      drawCells(o.buf, o.fill, o.x + x, o.y + r, "", o.width - x);
  }
  if (whole)
    o.sizedText.draw(
      [{ x: o.x, y: o.y, w: cells, h: step }],
      rowBytes(o.chunks, o.scale, o.x, o.y, o.look),
      (buf) => {
        for (let r = 0; r < step; r++) paintChunks(buf, r);
      },
    );
}
