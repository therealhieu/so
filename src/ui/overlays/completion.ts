import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import { activeBuffer, activeWindow } from "../../core/state/buffers";
import { COMPLETION_ROWS } from "../../core/state/completion";
import type { AppState, CompletionState } from "../../core/state/types";
import type { Cursor, LayoutClass } from "../shell";
import { drawCells, themeOf } from "../theme";
import { drawFrame } from "./host";

const WIDTH = 48;
/** Rows below the cursor line under which the popup opens above it. */
const ABOVE_UNDER = 10;
const FOOTER = " C-n/C-p · ⏎/Tab accept · esc";
const cells = (t: string) => [...t].length;
const basename = (path: string) =>
  path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/i, "");

function titleOf(c: CompletionState): string {
  if (c.mode === "notes") return "notes & aliases";
  const note = basename(c.target ?? "");
  return `${c.mode === "headings" ? "headings" : "blocks"} · ${note}`;
}

/**
 * The `[[` completion popup: a float under the `[[` (above it when there is
 * no room below) listing notes and aliases, a note's headings, or its block
 * ids, with the selection marked. It paints the core's state; keys go to
 * the core.
 */
export class CompletionView extends Renderable {
  private s: AppState | undefined;
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
    const at = this.editorCursor();
    this.visible = s.overlay.kind === "completion" && at !== undefined;
    if (s.overlay.kind !== "completion" || at === undefined) return;
    const c = s.overlay.completion;
    const b = activeBuffer(s);
    const w = activeWindow(s);
    const typed =
      b === undefined || w === undefined
        ? ""
        : b.text.line(c.anchor.line).slice(c.anchor.col, w.content.cursor.col);
    const { cols, rows } = s.terminal;
    const width = Math.min(WIDTH, cols);
    const h = Math.max(1, Math.min(COMPLETION_ROWS, c.items.length)) + 3;
    // Below the cursor line, or above it when fewer than 10 rows remain
    // above the statusline; never on the cursor row.
    const below = rows - 2 - (at.y + 1);
    const y =
      below >= ABOVE_UNDER && below >= h ? at.y + 1 : Math.max(0, at.y - h);
    const x = Math.max(0, Math.min(cols - width, at.x - cells(typed) - 2));
    this.box = { x, y, w: width, h };
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined || s.overlay.kind !== "completion" || !this.visible)
      return;
    const c = s.overlay.completion;
    const theme = themeOf(s);
    const box = this.box;
    drawFrame(buf, theme, box, {
      border: "floatBorder",
      fill: "float",
      title: titleOf(c),
    });
    const inner = box.w - 2;
    const room = box.h - 3;
    const footerY = box.y + box.h - 2;
    if (c.items.length === 0)
      drawCells(
        buf,
        theme.style("floatDim"),
        box.x + 1,
        box.y + 1,
        "   No matches",
        inner,
      );
    const first = Math.max(
      0,
      Math.min(c.selected - room + 1, c.items.length - room),
    );
    for (let i = 0; i < room; i++) {
      const item = c.items[first + i];
      if (item === undefined) break;
      const selected = first + i === c.selected;
      const y = box.y + 1 + i;
      const icon = c.mode === "notes" ? "◇ " : "";
      const head = `${selected ? " ▸ " : "   "}${icon}${item.label}`;
      drawCells(
        buf,
        theme.style(selected ? "floatSel" : "float"),
        box.x + 1,
        y,
        head,
        inner,
      );
      const detail = item.detail ?? "";
      const room = inner - cells(head) - 2;
      if (detail !== "" && room > 0) {
        const text =
          cells(detail) > room
            ? `…${[...detail].slice(-(room - 1)).join("")}`
            : detail;
        drawCells(
          buf,
          theme.style(selected ? "floatSel" : "floatDim"),
          box.x + 1 + inner - cells(text) - 1,
          y,
          text,
          cells(text),
        );
      }
    }
    drawCells(buf, theme.style("floatDim"), box.x + 1, footerY, FOOTER, inner);
  }
}
