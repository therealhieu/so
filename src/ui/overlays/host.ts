import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { bodyRows } from "../../core/state/layout";
import type { AppState, MouseTarget } from "../../core/state/types";
import type { Cursor, LayoutClass, View } from "../shell";
import { drawCells, type Theme } from "../theme";

/**
 * A rounded float: border in `border`, inside filled with `fill`. The title
 * sits on the top border, the footer on the bottom border.
 */
export function drawFrame(
  buf: OptimizedBuffer,
  theme: Theme,
  r: { x: number; y: number; w: number; h: number },
  o: { border: string; fill: string; title?: string; footer?: string },
): void {
  const b = theme.style(o.border);
  const edge = (y: number, l: string, rgt: string, label?: string) => {
    const text = label === undefined ? "" : ` ${label} `;
    const line = `${l}─${text}${"─".repeat(Math.max(0, r.w - 3 - [...text].length))}${rgt}`;
    drawCells(buf, b, r.x, y, line, r.w);
  };
  edge(r.y, "╭", "╮", o.title);
  for (let i = 1; i < r.h - 1; i++) {
    drawCells(buf, b, r.x, r.y + i, "│");
    drawCells(buf, theme.style(o.fill), r.x + 1, r.y + i, "", r.w - 2);
    drawCells(buf, b, r.x + r.w - 1, r.y + i, "│");
  }
  edge(r.y + r.h - 1, "╰", "╯", o.footer);
}

/** A `w`×`h` float centred in the terminal, clipped to it, below the bufferline. */
export function centered(
  s: AppState,
  w: number,
  h: number,
): { x: number; y: number; w: number; h: number } {
  const { cols, rows } = s.terminal;
  const width = Math.min(w, cols);
  const height = Math.min(h, bodyRows(s.terminal));
  return {
    x: Math.max(0, Math.floor((cols - width) / 2)),
    y: Math.max(1, Math.floor((rows - height) / 2) - 1),
    w: width,
    h: height,
  };
}

/** Wrap `text` into lines of at most `width` cells, breaking at spaces when possible. */
export function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  let rest = text;
  while ([...rest].length > width) {
    const cells = [...rest];
    const head = cells.slice(0, width).join("");
    const cut = head.lastIndexOf(" ");
    const at = cut > 0 ? cut : head.length;
    out.push(rest.slice(0, at));
    rest = rest.slice(at).trimStart();
  }
  out.push(rest);
  return out;
}

/**
 * An overlay view. `itemAt` answers for a cell inside its float, `undefined`
 * outside it or while hidden.
 */
type OverlayView = View & {
  itemAt?(x: number, y: number): MouseTarget | undefined;
  dragAt?(x: number, y: number): MouseTarget | undefined;
};

/**
 * Paints the one open overlay above the body. It holds one view per overlay
 * kind; each shows itself only while its kind is open. The non-modal `float`
 * paints below them and shows whenever its own state is set.
 */
export class OverlayHost extends Renderable {
  private readonly views: OverlayView[];
  private open: AppState["overlay"]["kind"] = "none";

  constructor(
    ctx: RenderContext,
    views: OverlayView[] = [],
    private readonly float?: View,
  ) {
    super(ctx, { position: "absolute", left: 0, top: 0, zIndex: 50 });
    this.views = views;
    if (float !== undefined) this.add(float);
    for (const v of views) this.add(v);
  }

  update(s: AppState, lc: LayoutClass): void {
    this.width = s.terminal.cols;
    this.height = s.terminal.rows;
    this.open = s.overlay.kind;
    this.float?.update(s, lc);
    for (const v of this.views) v.update(s, lc);
    this.visible = this.open !== "none" || this.float?.visible === true;
  }

  /**
   * What the open overlay has under the cell. Outside its float the cell is
   * `outside`, so nothing below answers, except for completion, which leaves
   * the cell to the body. Overlays without `itemAt` are `outside` everywhere.
   * The non-modal float answers where the body would: with no overlay
   * open, or outside the completion popup.
   */
  targetAt(x: number, y: number): MouseTarget | undefined {
    if (this.open === "none") return this.float?.targetAt?.(x, y);
    for (const v of this.views) {
      const t = v.visible ? v.itemAt?.(x, y) : undefined;
      if (t !== undefined) return t;
    }
    return this.open === "completion"
      ? this.float?.targetAt?.(x, y)
      : { kind: "outside" };
  }

  /** What a drag that started in the open overlay is over, anywhere on screen. */
  dragAt(x: number, y: number): MouseTarget | undefined {
    if (this.open === "none") return undefined;
    for (const v of this.views) {
      const t = v.visible ? v.dragAt?.(x, y) : undefined;
      if (t !== undefined) return t;
    }
    return undefined;
  }

  cursor(): Cursor | undefined {
    if (this.open === "none") return undefined;
    return this.views.map((v) => v.cursor?.()).find((c) => c !== undefined);
  }

  protected renderSelf(): void {}
}
