import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type { TextBuffer } from "../../core/kernel/text/text-buffer";
import { createTextBuffer } from "../../core/kernel/text/text-buffer";
import { bufferForPath, splitFile } from "../../core/state/buffers";
import { PREVIEW_MIN_COLS, pickerSources } from "../../core/state/picker";
import type {
  AppState,
  PickerItem,
  PickerState,
  TextFile,
} from "../../core/state/types";
import { paintPreview, type Rect } from "../editors/text-view";
import type { Cursor, LayoutClass, ViewDeps } from "../shell";
import { drawCells, middle, type Theme, themeOf } from "../theme";
import { centered, drawFrame } from "./host";

const REFUSED = {
  binary: "binary file — no preview",
  tooLarge: "file too large — no preview",
  io: "cannot read file — no preview",
};

const cells = (t: string) => [...t].length;

/** The float: 80% × 70% of the terminal, at least 60 × 12 where it fits. */
function boxOf(s: AppState): Rect {
  const { cols, rows } = s.terminal;
  const w = Math.min(cols, Math.max(60, Math.floor(cols * 0.8)));
  const h = Math.min(rows - 2, Math.max(12, Math.floor(rows * 0.7)));
  return centered(s, w, h);
}

const pickerOf = (s: AppState): PickerState | undefined =>
  s.overlay.kind === "picker" ||
  s.overlay.kind === "palette" ||
  s.overlay.kind === "help"
    ? s.overlay.picker
    : undefined;

/**
 * Every list overlay: the query, the ranked rows with matched characters
 * marked and `▸` on the selection, and at 100 columns or wider a preview
 * pane. It paints the core's picker state; keys go to the core.
 */
export class PickerView extends Renderable {
  private s: AppState | undefined;
  private cursorAt: Cursor | undefined;
  private readonly files = new WeakMap<TextFile, TextBuffer>();

  constructor(
    ctx: RenderContext,
    private readonly deps: ViewDeps,
  ) {
    super(ctx, { position: "absolute", left: 0, top: 0 });
  }

  update(s: AppState, _lc: LayoutClass): void {
    this.s = s;
    this.width = s.terminal.cols;
    this.height = s.terminal.rows;
    const p = pickerOf(s);
    this.visible = p !== undefined;
    this.cursorAt = undefined;
    if (p === undefined) return;
    const box = boxOf(s);
    this.cursorAt = {
      x: Math.min(box.x + box.w - 2, box.x + 4 + cells(p.query)),
      y: box.y + 1,
      style: "line",
    };
  }

  cursor(): Cursor | undefined {
    return this.cursorAt;
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    const p = s && pickerOf(s);
    if (s === undefined || p === undefined) return;
    const theme = themeOf(s);
    const source = pickerSources[p.source];
    const box = boxOf(s);
    const inner = box.w - 2;
    const preview = s.terminal.cols >= PREVIEW_MIN_COLS;
    const listW = preview ? Math.floor(inner * 0.6) : inner;
    const accept = s.overlay.kind === "picker" ? "Enter open" : "Enter run";
    drawFrame(buf, theme, box, {
      border: "floatBorder",
      fill: "float",
      title: source?.title ?? p.source,
      footer: `↑↓ move · ${accept} · Esc close`,
    });
    this.paintList(
      buf,
      theme,
      p,
      { x: box.x + 1, y: box.y + 1, w: listW, h: box.h - 2 },
      s,
    );
    if (!preview) return;
    const sepX = box.x + 1 + listW;
    for (let y = box.y + 1; y < box.y + box.h - 1; y++)
      drawCells(buf, theme.style("floatBorder"), sepX, y, "│", 1);
    this.paintPreviewPane(
      buf,
      theme,
      p,
      {
        x: sepX + 1,
        y: box.y + 1,
        w: inner - listW - 1,
        h: box.h - 2,
      },
      s,
    );
  }

  private paintList(
    buf: OptimizedBuffer,
    theme: Theme,
    p: PickerState,
    r: Rect,
    s: AppState,
  ): void {
    const icon = s.overlay.kind === "palette" ? ":" : "❯";
    const count =
      p.source === "grep"
        ? `${p.search?.pending ? "◌ " : ""}${p.search?.capped ? `${p.items.length}+` : p.items.length}`
        : `${p.items.length}/${p.total}`;
    drawCells(buf, theme.style("float"), r.x, r.y, ` ${icon} ${p.query}`, r.w);
    drawCells(
      buf,
      theme.style("floatDim"),
      r.x + r.w - cells(count) - 1,
      r.y,
      count,
      cells(count),
    );
    drawCells(
      buf,
      theme.style("floatDim"),
      r.x,
      r.y + 1,
      ` ${"─".repeat(Math.max(0, r.w - 2))}`,
      r.w,
    );
    const rows = r.h - 2;
    let y = r.y + 2;
    if (p.error !== undefined) {
      drawCells(buf, theme.style("floatError"), r.x, y, ` ✗ ${p.error}`, r.w);
      y++;
    }
    const room = r.y + r.h - y;
    if (p.items.length === 0) {
      const empty =
        p.source === "grep" && p.query === ""
          ? "type to search"
          : p.search?.pending
            ? "searching…"
            : "No matches";
      if (room > 0)
        drawCells(buf, theme.style("floatDim"), r.x, y, `   ${empty}`, r.w);
      return;
    }
    const first = Math.max(
      0,
      Math.min(p.selected - room + 1, p.items.length - room),
    );
    for (let i = 0; i < Math.min(room, rows); i++) {
      const item = p.items[first + i];
      if (item === undefined) break;
      this.paintItem(buf, theme, item, first + i === p.selected, {
        x: r.x,
        y: y + i,
        w: r.w,
        h: 1,
      });
    }
  }

  private paintItem(
    buf: OptimizedBuffer,
    theme: Theme,
    item: PickerItem,
    selected: boolean,
    r: Rect,
  ): void {
    const base = theme.style(selected ? "floatSel" : "float");
    drawCells(buf, base, r.x, r.y, selected ? " ▸ " : "   ", r.w);
    const detail = item.detail ?? "";
    const labelRoom = Math.max(
      1,
      r.w -
        4 -
        (detail === "" ? 0 : Math.min(cells(detail), Math.floor(r.w / 3)) + 2),
    );
    // A path is cut in the middle so the file name stays; matches mark only an uncut label.
    const fits = cells(item.label) <= labelRoom;
    const label = [...(fits ? item.label : middle(item.label, labelRoom))];
    const marked = new Set(fits ? item.matches : []);
    const match = theme.style("floatMatch");
    label.forEach((ch, i) => {
      drawCells(buf, marked.has(i) ? match : base, r.x + 3 + i, r.y, ch, 1);
    });
    if (detail !== "") {
      const w = Math.min(cells(detail), r.w - 5 - label.length);
      if (w > 0)
        drawCells(
          buf,
          theme.style(selected ? "floatSel" : "floatDim"),
          r.x + r.w - w - 1,
          r.y,
          detail,
          w,
        );
    }
  }

  private paintPreviewPane(
    buf: OptimizedBuffer,
    theme: Theme,
    p: PickerState,
    r: Rect,
    s: AppState,
  ): void {
    const item = p.items[p.selected];
    const dim = theme.style("floatDim");
    if (item === undefined) return;
    const target = p.preview;
    if (target === undefined) {
      // Commands and help preview their description as text.
      const lines = [item.label, "", ...(item.detail ?? "").split("  ")];
      lines.forEach((l, i) => {
        if (i < r.h)
          drawCells(
            buf,
            theme.style(i === 0 ? "floatTitle" : "float"),
            r.x,
            r.y + i,
            ` ${l}`,
            r.w,
          );
      });
      return;
    }
    drawCells(
      buf,
      dim,
      r.x,
      r.y,
      ` ${middle(target.path, Math.max(1, r.w - 1))}`,
      r.w,
    );
    const body = { x: r.x + 1, y: r.y + 1, w: r.w - 1, h: r.h - 1 };
    const open = bufferForPath(s, target.path);
    let text: TextBuffer | undefined = open?.text;
    if (text === undefined && target.file !== undefined) {
      text = this.files.get(target.file);
      if (text === undefined) {
        text = createTextBuffer(splitFile(target.file).body);
        this.files.set(target.file, text);
      }
    }
    if (text === undefined) {
      const note =
        target.refused === undefined ? "loading…" : REFUSED[target.refused];
      drawCells(buf, dim, r.x, body.y + 1, ` ${note}`, r.w);
      return;
    }
    const fileType = open
      ? this.deps.reg.fileTypes.get(open.fileType)
      : this.deps.reg.fileTypes.forPath(target.path);
    const mark =
      p.source === "grep" ? markIn(text, target.line, p.query) : undefined;
    const { tabWidth, wrap } = s.config.editor;
    paintPreview(buf, theme, body, {
      text,
      fileType,
      line: target.line,
      ...(mark === undefined ? {} : { mark }),
      ...(open?.analysis === undefined ? {} : { analysis: open.analysis }),
      tabWidth,
      wrap,
    });
  }
}

/** The grep query's first occurrence on `line`, matched as the search does (smart case). */
function markIn(text: TextBuffer, line: number, query: string) {
  if (query === "" || line >= text.lineCount) return undefined;
  const exact = query !== query.toLowerCase();
  const t = text.line(line);
  const col = (exact ? t : t.toLowerCase()).indexOf(
    exact ? query : query.toLowerCase(),
  );
  return col < 0 ? undefined : { col, len: query.length };
}
