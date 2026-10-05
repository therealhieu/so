import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type { Hunk, HunkKind } from "../../core/features/git/diff";
import { GIT_SIGNS } from "../../core/features/git/signs";
import type { AppState, MouseTarget } from "../../core/state/types";
import type { Rect } from "../editors/text-view";
import type { LayoutClass } from "../shell";
import { drawCells, themeOf } from "../theme";
import { centered, drawFrame } from "./host";

const KIND_LABEL: Readonly<Record<HunkKind, string>> = {
  add: "added",
  change: "changed",
  delete: "deleted below",
  topdelete: "deleted at top",
  changedelete: "changed + deleted",
  untracked: "untracked",
};

/** Widest float beside a docked explorer; a narrow terminal spans the editor. */
const MAX_WIDTH = 72;

/** The active editor's text area and the cursor's screen row. */
export type HunkAnchor = { text: Rect; cursorY: number };

type Row = { text: string; token: string };

/** `line N`, `lines N–M`, `after line N`, or `at top`, in 1-based buffer lines. */
function rangeOf(h: Hunk): string {
  if (h.kind === "topdelete") return "at top";
  if (h.kind === "delete") return `after line ${h.new.start}`;
  const first = h.new.start + 1;
  return h.new.count > 1
    ? `lines ${first}–${h.new.start + h.new.count}`
    : `line ${first}`;
}

/**
 * The hunk at the cursor in a float: the index lines it removed, then the
 * buffer lines that replaced them, below the cursor row (above it when it
 * does not fit there), inside the editor area. It computes no diff and owns
 * no key; the core closes it.
 */
export class HunkView extends Renderable {
  private s: AppState | undefined;
  private shown: { box: Rect; rows: Row[] } | undefined;

  constructor(
    ctx: RenderContext,
    private readonly anchor: () => HunkAnchor | undefined,
  ) {
    super(ctx, { position: "absolute", left: 0, top: 0 });
  }

  update(s: AppState, lc: LayoutClass): void {
    this.s = s;
    this.width = s.terminal.cols;
    this.height = s.terminal.rows;
    this.visible = s.overlay.kind === "gitHunk";
    this.shown = this.visible ? this.layout(s, lc) : undefined;
  }

  /** Any cell of the float, which takes no click; a click elsewhere closes it. */
  itemAt(x: number, y: number): MouseTarget | undefined {
    const b = this.shown?.box;
    return b !== undefined &&
      x >= b.x &&
      x < b.x + b.w &&
      y >= b.y &&
      y < b.y + b.h
      ? { kind: "overlay" }
      : undefined;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    const shown = this.shown;
    if (s === undefined || shown === undefined) return;
    const theme = themeOf(s);
    const { box, rows } = shown;
    drawFrame(buf, theme, box, {
      border: "floatBorder",
      fill: "float",
      title: "hunk preview",
      footer: "esc / q close",
    });
    rows.forEach((r, i) => {
      drawCells(
        buf,
        theme.style(r.token),
        box.x + 1,
        box.y + 1 + i,
        ` ${r.text}`,
        box.w - 2,
      );
    });
  }

  /** The float's rows and box, or nothing when its buffer is gone. */
  private layout(
    s: AppState,
    lc: LayoutClass,
  ): { box: Rect; rows: Row[] } | undefined {
    if (s.overlay.kind !== "gitHunk") return undefined;
    const { hunk, bufferId } = s.overlay;
    const b = s.buffers[bufferId];
    if (b === undefined) return undefined;
    const hunks = s.git.files[b.path]?.hunks ?? [];
    const n = hunks.findIndex((h) => h.new.start === hunk.new.start);
    const position = n < 0 ? "" : ` · hunk ${n + 1}/${hunks.length}`;
    const header = {
      text: `${GIT_SIGNS[hunk.kind].text} ${KIND_LABEL[hunk.kind]} · ${rangeOf(hunk)}${position}`,
      token: "floatDim",
    };
    const added = Array.from(
      { length: Math.min(hunk.new.count, b.text.lineCount - hunk.new.start) },
      (_, i) => b.text.line(hunk.new.start + i),
    );
    const diff: Row[] = [
      ...hunk.oldLines.map((l) => ({ text: `- ${l}`, token: "diffDel" })),
      ...added.map((l) => ({ text: `+ ${l}`, token: "diffAdd" })),
    ];
    const a = this.anchor();
    const area = a?.text ?? centered(s, s.terminal.cols, s.terminal.rows);
    const cap = lc === "narrow" ? 8 : 12;
    const width = lc === "narrow" ? area.w : Math.min(MAX_WIDTH, area.w);
    // Below the cursor row when the whole float fits, else above it, else
    // on the roomier side, clipped; it never covers the cursor row.
    const want = 3 + Math.min(diff.length, cap) + (diff.length > cap ? 1 : 0);
    const cy = a?.cursorY;
    const below = cy === undefined ? area.h : area.y + area.h - (cy + 1);
    const above = cy === undefined ? 0 : cy - area.y;
    const down = want <= below || below >= above;
    const room = down ? below : above;
    const body = Math.max(0, Math.min(want, room) - 3);
    const show =
      diff.length <= Math.min(cap, body)
        ? diff.length
        : Math.max(0, Math.min(cap, body - 1));
    const rows = [header, ...diff.slice(0, show)];
    if (show < diff.length)
      rows.push({
        text: `  … ${diff.length - show} more lines (${hunk.oldLines.length} removed, ${added.length} added)`,
        token: "floatDim",
      });
    const h = rows.length + 2;
    const y =
      cy === undefined ? area.y : down ? cy + 1 : Math.max(area.y, cy - h);
    return { box: { x: area.x, y, w: width, h }, rows };
  }
}
