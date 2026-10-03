/**
 * Window split tree. A `row` split places children side by side (`:vs`);
 * a `column` split stacks them (`:sp`).
 */
export type WindowTree =
  | { kind: "leaf"; id: number }
  | { kind: "row" | "column"; children: readonly WindowTree[] };

/** Split window `target`, placing `newId` before it (Neovim's default). */
export function splitWindow(
  tree: WindowTree,
  target: number,
  dir: "row" | "column",
  newId: number,
): WindowTree {
  if (tree.kind === "leaf") {
    if (tree.id !== target) return tree;
    return { kind: dir, children: [{ kind: "leaf", id: newId }, tree] };
  }
  const children = tree.children.flatMap((child) => {
    if (child.kind === "leaf" && child.id === target && tree.kind === dir)
      return [{ kind: "leaf", id: newId } as const, child];
    return [splitWindow(child, target, dir, newId)];
  });
  return { kind: tree.kind, children };
}

/** Remove window `id`; returns `undefined` when it was the last window. */
export function closeWindow(
  tree: WindowTree,
  id: number,
): WindowTree | undefined {
  if (tree.kind === "leaf") return tree.id === id ? undefined : tree;
  const children = tree.children.flatMap((child) => {
    const next = closeWindow(child, id);
    return next === undefined ? [] : [next];
  });
  if (children.length === 0) return undefined;
  if (children.length === 1) return children[0];
  return { kind: tree.kind, children };
}

type Rect = { x: number; y: number; w: number; h: number };

function layout(tree: WindowTree, r: Rect, out: Map<number, Rect>): void {
  if (tree.kind === "leaf") {
    out.set(tree.id, r);
    return;
  }
  const n = tree.children.length;
  tree.children.forEach((child, i) => {
    const part =
      tree.kind === "row"
        ? { x: r.x + (r.w * i) / n, y: r.y, w: r.w / n, h: r.h }
        : { x: r.x, y: r.y + (r.h * i) / n, w: r.w, h: r.h / n };
    layout(child, part, out);
  });
}

/**
 * The window next to `from` in direction h/j/k/l (`Ctrl-w h/j/k/l`), or
 * `undefined` at an edge. Among adjacent windows, the one beside the
 * middle of `from` wins; on a border, the one that starts there.
 */
export function focusDirection(
  tree: WindowTree,
  from: number,
  dir: "h" | "j" | "k" | "l",
): number | undefined {
  const rects = new Map<number, Rect>();
  layout(tree, { x: 0, y: 0, w: 1, h: 1 }, rects);
  const a = rects.get(from);
  if (a === undefined) return undefined;
  const eps = 1e-9;
  const horizontal = dir === "h" || dir === "l";
  const mid = horizontal ? a.y + a.h / 2 : a.x + a.w / 2;
  for (const [id, b] of rects) {
    if (id === from) continue;
    const adjacent =
      dir === "h"
        ? Math.abs(b.x + b.w - a.x) < eps
        : dir === "l"
          ? Math.abs(a.x + a.w - b.x) < eps
          : dir === "k"
            ? Math.abs(b.y + b.h - a.y) < eps
            : Math.abs(a.y + a.h - b.y) < eps;
    const [lo, hi] = horizontal ? [b.y, b.y + b.h] : [b.x, b.x + b.w];
    if (adjacent && lo - eps <= mid && mid < hi - eps) return id;
  }
  return undefined;
}
