import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { menuAnnotation, pdfMenuItems } from "../../core/state/pdf-annotate";
import type { AppState, MouseTarget } from "../../core/state/types";
import type { Rect } from "../editors/text-view";
import { drawCells, themeOf } from "../theme";
import { drawFrame, wrap } from "./host";

/** The widest a note's text wraps to, and the most of its lines shown. */
const NOTE_WIDTH = 48;
const NOTE_LINES = 8;

/** One action in the float's action row, `x` cells after the row's start. */
type Item = { key: string; label: string; x: number; w: number };

/** What the PDF action float shows: a note's lines, then its actions. */
export type PdfMenuContent = {
  title?: string;
  lines: string[];
  items: Item[];
  /** Outer size, border included. */
  w: number;
  h: number;
};

const cells = (t: string) => [...t].length;

/** The open PDF action float's content, or nothing when it is not open. */
export function pdfMenuContent(s: AppState): PdfMenuContent | undefined {
  const o = s.overlay;
  if (o.kind !== "pdfMenu") return undefined;
  const target = menuAnnotation(s);
  if (o.on.kind === "annotation" && target === undefined) return undefined;
  const note = target?.item.note;
  const wrapped =
    note === undefined
      ? []
      : note.split("\n").flatMap((l) => wrap(l, NOTE_WIDTH));
  const lines = wrapped.slice(0, NOTE_LINES);
  if (wrapped.length > NOTE_LINES) lines[NOTE_LINES - 1] = "…";
  let x = 1;
  const items = pdfMenuItems(s).map((i) => {
    const item = { ...i, x, w: cells(`${i.key} ${i.label}`) };
    x += item.w + 2;
    return item;
  });
  const row = items.length === 0 ? 0 : x - 1;
  const w = Math.max(row, ...lines.map((l) => cells(l) + 2)) + 2;
  const h = lines.length + (items.length === 0 ? 0 : 1) + 2;
  const title = target === undefined ? undefined : target.item.kind;
  return { ...(title === undefined ? {} : { title }), lines, items, w, h };
}

/**
 * Where a `size` float goes for text whose cells are `at`: below the text
 * when it fits in `area`, else above it, else at the area's bottom; its
 * left edge under the text's start, kept inside the area.
 */
export function pdfMenuBox(
  at: { x: number; top: number; bottom: number },
  size: { w: number; h: number },
  area: Rect,
): Rect {
  const w = Math.min(size.w, area.w);
  const h = Math.min(size.h, area.h);
  const x = Math.max(area.x, Math.min(at.x, area.x + area.w - w));
  const below = at.bottom + 1;
  const y =
    below + h <= area.y + area.h
      ? below
      : at.top - h >= area.y
        ? at.top - h
        : area.y + area.h - h;
  return { x, y, w, h };
}

/**
 * The PDF action float, at the box the PDF window placed it (the window
 * leaves the page out under it). It owns no key; the core runs its actions.
 */
export class PdfMenuView extends Renderable {
  private s: AppState | undefined;
  private shown: { box: Rect; content: PdfMenuContent } | undefined;

  constructor(
    ctx: RenderContext,
    private readonly box: () => Rect | undefined,
  ) {
    super(ctx, { position: "absolute", left: 0, top: 0 });
  }

  update(s: AppState): void {
    this.s = s;
    this.width = s.terminal.cols;
    this.height = s.terminal.rows;
    const content = pdfMenuContent(s);
    const box = content === undefined ? undefined : this.box();
    this.shown =
      content === undefined || box === undefined ? undefined : { box, content };
    this.visible = this.shown !== undefined;
  }

  /** An action under the cell, else the float itself; nothing outside it. */
  itemAt(x: number, y: number): MouseTarget | undefined {
    const shown = this.shown;
    if (shown === undefined) return undefined;
    const { box, content } = shown;
    if (x < box.x || x >= box.x + box.w || y < box.y || y >= box.y + box.h)
      return undefined;
    const row = box.y + 1 + content.lines.length;
    const index = content.items.findIndex(
      (i) => y === row && x >= box.x + 1 + i.x && x < box.x + 1 + i.x + i.w,
    );
    return index < 0 ? { kind: "overlay" } : { kind: "overlayItem", index };
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    const shown = this.shown;
    if (s === undefined || shown === undefined) return;
    const theme = themeOf(s);
    const { box, content } = shown;
    drawFrame(buf, theme, box, {
      border: "floatBorder",
      fill: "float",
      ...(content.title === undefined ? {} : { title: content.title }),
    });
    content.lines.forEach((l, i) => {
      drawCells(
        buf,
        theme.style("float"),
        box.x + 1,
        box.y + 1 + i,
        ` ${l}`,
        box.w - 2,
      );
    });
    const y = box.y + 1 + content.lines.length;
    for (const i of content.items) {
      const x = box.x + 1 + i.x;
      drawCells(buf, theme.style("floatKey"), x, y, i.key);
      drawCells(buf, theme.style("float"), x + 2, y, i.label);
    }
  }
}
