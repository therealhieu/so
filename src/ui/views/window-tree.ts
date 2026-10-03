import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type { WindowTree as Tree } from "../../core/kernel/editor/windows";
import type { AppState, WindowId } from "../../core/state/types";
import { editorViews } from "../editors/registry";
import type { EditorView, Rect } from "../editors/text-view";
import type { Cursor, LayoutClass, ViewDeps } from "../shell";
import { drawCells, themeOf } from "../theme";
import { EXPLORER_WIDTH, explorerDocked } from "./explorer";

/**
 * Split `r` among the tree's leaves: `row` children side by side with a
 * one-column separator, `column` children stacked. The last child takes
 * the remainder.
 */
function place(
  tree: Tree,
  r: Rect,
  out: Map<WindowId, Rect>,
  seps: Rect[],
): void {
  if (tree.kind === "leaf") {
    out.set(tree.id, r);
    return;
  }
  const n = tree.children.length;
  const row = tree.kind === "row";
  const total = row ? r.w - (n - 1) : r.h;
  const size = Math.floor(total / n);
  let at = row ? r.x : r.y;
  tree.children.forEach((child, i) => {
    const len = i === n - 1 ? (row ? r.x + r.w : r.y + r.h) - at : size;
    const part = row
      ? { x: at, y: r.y, w: len, h: r.h }
      : { x: r.x, y: at, w: r.w, h: len };
    place(child, part, out, seps);
    at += len;
    if (row && i < n - 1) {
      seps.push({ x: at, y: r.y, w: 1, h: r.h });
      at++;
    }
  });
}

/**
 * The body right of a docked explorer: one view per window, made by the
 * view registered for its editor kind, with winbars once there are splits.
 */
export class WindowTree extends Renderable {
  private s: AppState | undefined;
  private readonly views = new Map<WindowId, EditorView>();
  private seps: Rect[] = [];

  constructor(
    ctx: RenderContext,
    private readonly deps: ViewDeps,
  ) {
    super(ctx, { position: "absolute", left: 0, top: 0 });
  }

  update(s: AppState, lc: LayoutClass): void {
    this.s = s;
    this.width = s.terminal.cols;
    this.height = s.terminal.rows;
    const x = explorerDocked(s, lc) ? EXPLORER_WIDTH + 1 : 0;
    const body = {
      x,
      y: 1,
      w: Math.max(0, s.terminal.cols - x),
      h: Math.max(0, s.terminal.rows - 3),
    };
    const rects = new Map<WindowId, Rect>();
    this.seps = [];
    place(s.windows.tree, body, rects, this.seps);
    for (const [id, view] of this.views)
      if (!rects.has(id)) {
        this.remove(view);
        view.destroy();
        this.views.delete(id);
      }
    for (const [id, r] of rects) {
      let view = this.views.get(id);
      if (view === undefined) {
        const kind = s.windows.byId[id]?.content.editor ?? "text";
        const create = editorViews.get(kind) ?? editorViews.get("text");
        if (create === undefined) continue;
        view = create(this.ctx, this.deps);
        this.views.set(id, view);
        this.add(view);
      }
      view.show(s, id, r, rects.size > 1);
    }
  }

  cursor(): Cursor | undefined {
    const s = this.s;
    return s === undefined
      ? undefined
      : this.views.get(s.windows.active)?.cursor();
  }

  protected renderSelf(buf: OptimizedBuffer): void {
    const s = this.s;
    if (s === undefined) return;
    const theme = themeOf(s);
    for (const r of this.seps)
      for (let i = 0; i < r.h; i++)
        drawCells(buf, theme.style("separator"), r.x, r.y + i, "│");
  }
}
