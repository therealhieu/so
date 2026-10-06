import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { FLOAT_RULE } from "../../core/state/lsp-hover";
import type { LspFloat } from "../../core/state/lsp-types";
import type { AppState, MouseTarget } from "../../core/state/types";
import type { Cursor, LayoutClass } from "../shell";
import { drawCells, themeOf } from "../theme";
import { drawFrame } from "./host";

const MAX_WIDTH = 80;
const MAX_HEIGHT = 12;
/** Border and one cell of padding on each side. */
const CHROME = 4;
const cells = (t: string) => [...t].length;

/** One painted row: a piece of float line `line` starting at UTF-16 offset `from`. */
type Row = { text: string; line: number; from: number };

/** `lines` wrapped to `width` cells, breaking after a space when possible. */
function wrapRows(lines: readonly string[], width: number): Row[] {
  const out: Row[] = [];
  lines.forEach((text, line) => {
    let from = 0;
    for (;;) {
      const rest = text.slice(from);
      const cps = [...rest];
      if (cps.length <= width) {
        out.push({ text: rest, line, from });
        break;
      }
      const head = cps.slice(0, width).join("");
      const space = head.lastIndexOf(" ");
      const at = space > 0 ? space + 1 : head.length;
      out.push({ text: rest.slice(0, at), line, from });
      from += at;
    }
  });
  return out;
}

/**
 * Hover, signature help, and cursor diagnostics: a float under the window
 * cursor (above it when there is no room below), clamped to the screen and
 * at most 80 columns by 12 rows. It is non-modal: it never takes keys, and a
 * click on it does nothing.
 */
export class LspFloatView extends Renderable {
  private float: LspFloat | undefined;
  private s: AppState | undefined;
  private rows: Row[] = [];
  private wrapWidth = 0;
  private box = { x: 0, y: 0, w: 0, h: 0 };

  constructor(
    ctx: RenderContext,
    /** The editor's cursor on screen, read after the windows are laid out. */
    private readonly editorCursor: () => Cursor | undefined,
  ) {
    super(ctx, { position: "absolute", left: 0, top: 0 });
  }

  update(s: AppState, _lc: LayoutClass): void {
    this.s = s;
    this.width = s.terminal.cols;
    this.height = s.terminal.rows;
    const f = s.lsp.float;
    const at = f === undefined ? undefined : this.editorCursor();
    this.visible = f !== undefined && at !== undefined;
    if (f === undefined || at === undefined) {
      this.float = undefined;
      return;
    }
    const { cols, rows } = s.terminal;
    const maxW = Math.min(MAX_WIDTH, cols);
    const wrapWidth = Math.max(1, maxW - CHROME);
    if (this.float !== f || this.wrapWidth !== wrapWidth) {
      this.rows = wrapRows(f.lines, wrapWidth);
      this.wrapWidth = wrapWidth;
    }
    this.float = f;
    const widest = this.rows.reduce((n, r) => Math.max(n, cells(r.text)), 0);
    const w = Math.min(maxW, widest + CHROME);
    // Rows between the bufferline and the statusline, below or above the cursor.
    const below = rows - 2 - (at.y + 1);
    const above = at.y - 1;
    const want = Math.min(MAX_HEIGHT, this.rows.length + 2);
    const h = Math.max(0, Math.min(want, Math.max(below, above)));
    const y = below >= h ? at.y + 1 : at.y - h;
    const x = Math.max(0, Math.min(cols - w, at.x));
    this.box = { x, y, w, h };
    if (h < 3) this.visible = false;
  }

  /** Any cell of the float, which takes no click. */
  targetAt(x: number, y: number): MouseTarget | undefined {
    const b = this.box;
    return this.visible &&
      x >= b.x &&
      x < b.x + b.w &&
      y >= b.y &&
      y < b.y + b.h
      ? { kind: "inert" }
      : undefined;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    const f = this.float;
    if (s === undefined || f === undefined || !this.visible) return;
    const theme = themeOf(s);
    const box = this.box;
    drawFrame(buf, theme, box, { border: "floatBorder", fill: "float" });
    const inner = box.w - CHROME;
    const body = theme.style("float");
    const active = theme.style("floatActive");
    for (let i = 0; i < box.h - 2; i++) {
      const row = this.rows[i];
      if (row === undefined) break;
      const x = box.x + 2;
      const y = box.y + 1 + i;
      const styled = f.spans?.[row.line];
      if (styled?.[0]?.style === FLOAT_RULE)
        drawCells(buf, theme.style("floatDim"), x, y, "─".repeat(inner), inner);
      else {
        drawCells(buf, body, x, y, row.text, inner);
        if (styled !== undefined) {
          // Code colours on the float's background.
          let at = 0;
          for (const sp of styled) {
            const start = Math.max(at, row.from);
            const end = Math.min(
              at + sp.text.length,
              row.from + row.text.length,
            );
            at += sp.text.length;
            if (end <= start) continue;
            const lead = cells(row.text.slice(0, start - row.from));
            if (lead >= inner) break;
            const piece = sp.text.slice(
              start - (at - sp.text.length),
              end - (at - sp.text.length),
            );
            drawCells(
              buf,
              { ...theme.style(sp.style), bg: body.bg },
              x + lead,
              y,
              piece,
              Math.min(cells(piece), inner - lead),
            );
          }
        }
      }
      const a = f.active;
      if (a === undefined || a.line !== row.line) continue;
      const from = Math.max(a.start, row.from) - row.from;
      const to = Math.min(a.end, row.from + row.text.length) - row.from;
      if (to <= from) continue;
      const lead = cells(row.text.slice(0, from));
      if (lead >= inner) continue;
      drawCells(
        buf,
        active,
        x + lead,
        y,
        row.text.slice(from, to),
        Math.min(cells(row.text.slice(from, to)), inner - lead),
      );
    }
  }
}
