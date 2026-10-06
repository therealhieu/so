import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { activeBuffer, activeWindow } from "../../core/state/buffers";
import { bodyRows } from "../../core/state/layout";
import {
  panelSide,
  type SidePanelRow,
  sidePanelRows,
} from "../../core/state/side-panel";
import type { AppState, MouseTarget } from "../../core/state/types";
import type { Cursor, LayoutClass } from "../shell";
import { drawCells, themeOf } from "../theme";

export const SIDE_WIDTH = 36;

/** Docked opposite the explorer when open on a terminal of 100 columns or more. */
export const sideDocked = (s: AppState, lc: LayoutClass): boolean =>
  s.panels.side.open && lc !== "narrow";

type Line = {
  /** Text runs painted left to right. */
  parts: { text: string; token: string }[];
  /** The row this line belongs to, for the selection. */
  row?: number;
};

const cells = (t: string) => [...t].length;
const noteName = (path: string) => path.replace(/\.md$/i, "");

/** Cut `text` to `width` cells, ending in `…` when it is longer. */
function end(text: string, width: number): string {
  const c = [...text];
  return c.length <= width
    ? text
    : `${c.slice(0, Math.max(0, width - 1)).join("")}…`;
}

/** An unlinked line around its mention: `…before mention after…` with the mention marked. */
function around(row: SidePanelRow, width: number): Line["parts"] {
  const hit = row.hit;
  if (hit === undefined)
    return [{ text: end(row.text, width), token: "explorerDim" }];
  const at = hit.range.start.col;
  const before = row.text.slice(Math.max(0, at - 12), at).trimStart();
  const after = row.text.slice(hit.range.end.col);
  const room = Math.max(0, width - cells(before) - cells(hit.text) - 2);
  return [
    { text: `…${before}`, token: "explorerDim" },
    { text: hit.text, token: "panelHit" },
    { text: end(`${after}`, room), token: "explorerDim" },
  ];
}

/**
 * The backlinks or outline panel docked right of the windows with a `│`
 * separator: Linked mentions with their link lines, then Unlinked mentions
 * with the mention marked, or the note's headings with the current one
 * marked `▸`. It paints the core's rows; keys go to the core.
 */
export class SidePanelView extends Renderable {
  private s: AppState | undefined;
  private lines: Line[] = [];
  private first = 0;
  private x0 = 0;
  private onLeft = false;
  private h = 0;
  private cursorAt: Cursor | undefined;

  constructor(ctx: RenderContext) {
    super(ctx, { position: "absolute", left: 0, top: 1, zIndex: 20 });
  }

  update(s: AppState, lc: LayoutClass): void {
    this.s = s;
    this.visible = sideDocked(s, lc);
    this.cursorAt = undefined;
    if (!this.visible) return;
    const w = Math.min(s.terminal.cols, SIDE_WIDTH + 1);
    this.h = bodyRows(s.terminal);
    this.onLeft = panelSide(s) === "left";
    this.x0 = this.onLeft ? 0 : s.terminal.cols - w;
    this.left = this.x0;
    this.width = w;
    this.height = this.h;
    const rows = sidePanelRows(s);
    this.lines = this.layout(s, rows);
    const side = s.panels.side;
    const sel = Math.min(side.cursor, rows.length - 1);
    const at = this.lines.findIndex((l) => l.row === sel);
    const room = this.listRows();
    if (at >= 0 && at < this.first) this.first = at;
    if (at >= this.first + room) this.first = at - room + 1;
    this.first = Math.max(0, Math.min(this.first, this.lines.length - room));
    if (side.focused && at >= 0)
      this.cursorAt = {
        x: this.x0 + this.pad() + 1,
        y: 1 + 1 + at - this.first,
        style: "block",
      };
  }

  cursor(): Cursor | undefined {
    return this.cursorAt;
  }

  /** A listed line's row; the title, separator, headings, and hints give -1 (focus only). */
  targetAt(x: number, y: number): MouseTarget | undefined {
    const cols = this.s?.terminal.cols ?? 0;
    const w = Math.min(cols, SIDE_WIDTH + 1);
    if (
      !this.visible ||
      x < this.x0 ||
      x >= this.x0 + w ||
      y < 1 ||
      y >= 1 + this.h
    )
      return undefined;
    const i = y - 2;
    const sep = this.onLeft ? this.x0 + w - 1 : this.x0;
    const line =
      x !== sep && i >= 0 && i < this.listRows()
        ? this.lines[this.first + i]
        : undefined;
    return { kind: "sidePanel", row: line?.row ?? -1 };
  }

  /** Columns before the content: the separator when docked right. */
  private pad(): number {
    return this.onLeft ? 0 : 1;
  }

  /** Lines between the title and the key hints. */
  private listRows(): number {
    return Math.max(0, this.h - 1 - this.hints().length);
  }

  private hints(): string[] {
    const s = this.s;
    if (s === undefined) return [];
    const side = s.panels.side;
    const [enter, leave] = this.onLeft ? ["h", "l"] : ["l", "h"];
    if (!side.focused) return [`C-w ${enter} to focus this panel`];
    return side.kind === "outline"
      ? ["⏎ jump · q close"]
      : ["j/k move · ⏎ open · l link it", `C-w ${leave} back to the editor`];
  }

  private layout(s: AppState, rows: SidePanelRow[]): Line[] {
    const width = SIDE_WIDTH - 1;
    if (s.panels.side.kind === "outline") {
      const line = activeWindow(s)?.content.cursor.line ?? 0;
      let current = -1;
      rows.forEach((r, i) => {
        if (r.line <= line) current = i;
      });
      if (rows.length === 0)
        return [{ parts: [{ text: " No headings", token: "explorerDim" }] }];
      return rows.map((r, i) => {
        const indent = r.text.length - r.text.trimStart().length;
        const mark = i === current ? "▸ " : "  ";
        return {
          row: i,
          parts: [
            {
              text: end(
                ` ${r.text.slice(0, indent)}${mark}${r.text.trimStart()}`,
                width,
              ),
              token: i === current ? "panelHeading" : "explorer",
            },
          ],
        };
      });
    }
    const out: Line[] = [];
    const index = s.index;
    if (index.status === "indexing")
      out.push({
        parts: [
          {
            text: ` ◌ indexing ${index.done}/${index.total}`,
            token: "explorerWarn",
          },
        ],
      });
    if (index.status === "unavailable")
      out.push({
        parts: [{ text: " ✗ index unavailable", token: "explorerError" }],
      });
    const linked = rows.filter((r) => r.section === "linked").length;
    const unlinked = rows.length - linked;
    const pending = s.panels.side.mentions?.pending ?? false;
    out.push({
      parts: [
        { text: "▾ Linked mentions", token: "panelHeading" },
        { text: ` (${linked})`, token: "explorerDim" },
      ],
    });
    if (linked === 0)
      out.push({ parts: [{ text: " No backlinks", token: "explorerDim" }] });
    rows.forEach((r, i) => {
      if (i === linked) {
        out.push({ parts: [] });
        out.push({
          parts: [
            { text: "▾ Unlinked mentions", token: "panelHeadingAlt" },
            { text: ` (${unlinked})`, token: "explorerDim" },
          ],
        });
      }
      out.push({
        row: i,
        parts: [
          {
            text: ` ◇ ${noteName(r.path ?? "")}`,
            token: r.section === "linked" ? "panelLink" : "panelMuted",
          },
          { text: `:${r.line + 1}`, token: "explorerDim" },
        ],
      });
      out.push({
        row: i,
        parts: [
          { text: "   ", token: "explorer" },
          ...(r.section === "linked"
            ? [{ text: end(r.text.trim(), width - 3), token: "explorerDim" }]
            : around(r, width - 3)),
        ],
      });
    });
    if (unlinked === 0) {
      out.push({ parts: [] });
      out.push({
        parts: [
          { text: "▾ Unlinked mentions", token: "panelHeadingAlt" },
          { text: pending ? " (…)" : " (0)", token: "explorerDim" },
        ],
      });
      out.push({
        parts: [
          {
            text: pending ? " searching…" : " No unlinked mentions",
            token: "explorerDim",
          },
        ],
      });
    }
    return out;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined || !this.visible) return;
    const theme = themeOf(s);
    const side = s.panels.side;
    const x0 = this.x + this.pad();
    const w = this.width - 1;
    const sep = this.onLeft ? this.x + w : this.x;
    for (let r = 0; r < this.height; r++) {
      drawCells(buf, theme.style("separator"), sep, this.y + r, "│");
      drawCells(buf, theme.style("explorer"), x0, this.y + r, "", w);
    }
    const b = activeBuffer(s);
    const title =
      side.kind === "outline"
        ? " OUTLINE"
        : ` BACKLINKS · ${b === undefined ? "" : noteName(b.path.slice(b.path.lastIndexOf("/") + 1))}`;
    drawCells(buf, theme.style("explorerTitle"), x0, this.y, end(title, w), w);
    const rows = sidePanelRows(s);
    const sel = Math.min(side.cursor, rows.length - 1);
    const room = this.listRows();
    for (let i = 0; i < room; i++) {
      const line = this.lines[this.first + i];
      if (line === undefined) break;
      const y = this.y + 1 + i;
      const selected = line.row !== undefined && line.row === sel;
      const base = selected
        ? side.focused
          ? "treeSelFocus"
          : "treeSel"
        : undefined;
      if (base !== undefined) drawCells(buf, theme.style(base), x0, y, "", w);
      let x = x0;
      for (const p of line.parts) {
        const left = x0 + w - x;
        if (left <= 0) break;
        const n = Math.min(left, cells(p.text));
        drawCells(buf, theme.style(base ?? p.token), x, y, p.text, n);
        x += n;
      }
    }
    this.hints().forEach((h, i, all) => {
      const y = this.y + this.height - all.length + i;
      drawCells(buf, theme.style("explorerDim"), x0, y, end(` ${h}`, w), w);
    });
  }
}
