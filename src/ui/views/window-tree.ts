import {
  type OptimizedBuffer,
  Renderable,
  type RenderContext,
} from "@opentui/core";
import type { WindowTree as Tree } from "../../core/kernel/editor/windows";
import { explorerWidth } from "../../core/state/explorer";
import { bodyRows } from "../../core/state/layout";
import type { AppState, MouseTarget, WindowId } from "../../core/state/types";
import { editorViews, type WindowView } from "../editors/registry";
import type { Rect } from "../editors/text-view";
import type { HunkAnchor } from "../overlays/hunk";
import type { Cursor, LayoutClass, ViewDeps } from "../shell";
import { drawCells, themeOf } from "../theme";
import { explorerDocked, explorerSide } from "./explorer";
import { SIDE_WIDTH, sideDocked } from "./side-panel";

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
 * The body between a docked explorer and a docked side panel: one view per window, made by the
 * view registered for its editor kind, with winbars once there are splits.
 */
export class WindowTree extends Renderable {
  private s: AppState | undefined;
  private readonly views = new Map<WindowId, WindowView>();
  /** The editor kind each window's view was created for. */
  private readonly kinds = new Map<WindowId, string>();
  private seps: Rect[] = [];
  /** Each window's rect from the last `update`. */
  private rects = new Map<WindowId, Rect>();

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
    const ex = explorerDocked(s, lc) ? explorerWidth(s) + 1 : 0;
    const side = sideDocked(s, lc) ? SIDE_WIDTH + 1 : 0;
    const [x, right] = explorerSide(s) === "right" ? [side, ex] : [ex, side];
    const body = {
      x,
      y: 1,
      w: Math.max(0, s.terminal.cols - x - right),
      h: bodyRows(s.terminal),
    };
    const rects = new Map<WindowId, Rect>();
    this.seps = [];
    place(s.windows.tree, body, rects, this.seps);
    this.rects = rects;
    const kindOf = (id: WindowId) =>
      s.windows.byId[id]?.content.editor ?? "text";
    // A window whose editor kind changed gets a new view.
    for (const [id, view] of this.views)
      if (!rects.has(id) || this.kinds.get(id) !== kindOf(id)) {
        this.remove(view);
        view.destroy();
        this.views.delete(id);
        this.kinds.delete(id);
      }
    for (const [id, r] of rects) {
      let view = this.views.get(id);
      if (view === undefined) {
        const kind = kindOf(id);
        const create = editorViews.get(kind) ?? editorViews.get("text");
        if (create === undefined) continue;
        view = create(this.ctx, this.deps);
        this.views.set(id, view);
        this.kinds.set(id, kind);
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

  /** The active window's text area and cursor row, while its cursor shows. */
  anchor(): HunkAnchor | undefined {
    const s = this.s;
    const view = s && this.views.get(s.windows.active);
    const text = view?.textArea?.();
    const c = view?.cursor();
    return text === undefined || c === undefined
      ? undefined
      : { text, cursorY: c.y };
  }

  /** The target from the window whose rect holds the cell; separators have none. */
  targetAt(x: number, y: number): MouseTarget | undefined {
    for (const [id, r] of this.rects)
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h)
        return this.views.get(id)?.targetAt(x, y);
    return undefined;
  }

  /** A drag stays with the window it started in. */
  dragAt(x: number, y: number, from: MouseTarget): MouseTarget | undefined {
    return from.kind === "window"
      ? this.views.get(from.window)?.dragAt?.(x, y, from.spot)
      : undefined;
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
