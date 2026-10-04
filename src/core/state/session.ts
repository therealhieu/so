import { z } from "zod";
import type { WindowTree } from "../kernel/editor/windows";
import { leaves, listedBuffers, placeAfterOpen } from "./buffers";
import { JUMP_LIMIT } from "./jumps";
import { RECENT_LIMIT } from "./recent";
import { chain, none, toast } from "./result";
import type {
  Action,
  AppState,
  BufferId,
  PersistedState,
  Result,
  WindowId,
  WindowState,
} from "./types";
import type { Registries } from "./update";

/** The debounce between a session change and its save. */
export const SAVE_STATE_MS = 2000;

/** A workspace-relative path: not absolute, no `.`/`..` segments. */
const relPath = z
  .string()
  .refine(
    (p) =>
      p !== "" &&
      !p.startsWith("/") &&
      p.split("/").every((x) => x !== "" && x !== "." && x !== ".."),
  );
const count = z.number().int().nonnegative();
const pos = z.object({ line: count, col: count });
const tree: z.ZodType<WindowTree> = z.lazy(() =>
  z.union([
    z.object({ kind: z.literal("leaf"), id: count }),
    z.object({ kind: z.enum(["row", "column"]), children: z.array(tree) }),
  ]),
);
const persisted = z.object({
  version: z.literal(1),
  recent: z.array(relPath).max(RECENT_LIMIT),
  jumps: z
    .object({
      entries: z
        .array(z.object({ path: relPath, line: count, col: count }))
        .max(JUMP_LIMIT),
      at: count,
    })
    .refine((j) => j.at <= j.entries.length),
  buffers: z.array(z.object({ path: relPath, view: z.string() })),
  layout: z.object({
    tree,
    active: count,
    windows: z.array(
      z.object({ id: count, path: relPath, cursor: pos, scroll: count }),
    ),
  }),
});

/** The parsed state file; a wrong version or shape is no state at all. */
export function parsePersisted(json: unknown): PersistedState | undefined {
  const r = persisted.safeParse(json);
  return r.success ? r.data : undefined;
}

const pathOf = (s: AppState, w: WindowState) =>
  s.buffers[w.content.bufferId]?.path;

/** What the state file keeps of `s`: recents, jumps, open buffers, and the layout. */
export function snapshotSession(s: AppState): PersistedState {
  const windows: PersistedState["layout"]["windows"] = [];
  const pending = s.windows.restore?.pending ?? {};
  for (const id of leaves(s.windows.tree)) {
    const w = s.windows.byId[id];
    const path = w && pathOf(s, w);
    if (w !== undefined && path !== undefined)
      windows.push({
        id,
        path,
        cursor: w.content.cursor,
        scroll: w.content.scroll,
      });
    else if (pending[id] !== undefined) {
      const { path, cursor, scroll } = pending[id];
      windows.push({ id, path, cursor, scroll });
    }
  }
  return {
    version: 1,
    recent: s.recent,
    jumps: s.jumps,
    buffers: listedBuffers(s)
      .sort((a, b) => a.id - b.id)
      .map((b) => ({ path: b.path, view: b.view })),
    layout: { tree: s.windows.tree, active: s.windows.active, windows },
  };
}

const sameList = <T>(
  a: readonly T[],
  b: readonly T[],
  eq: (x: T, y: T) => boolean,
) => a.length === b.length && a.every((x, i) => eq(x, b[i] as T));

/** Each window's file, in tree order; `undefined` for an empty window. */
const shownPaths = (s: AppState) =>
  leaves(s.windows.tree).map((id) => {
    const w = s.windows.byId[id];
    return w && pathOf(s, w);
  });

/**
 * Whether a persisted part changed: recents, jumps, the window tree, or the
 * file a window shows. Cursor and scroll moves alone are saved with the next
 * change or on exit.
 */
export function sessionChanged(prev: AppState, next: AppState): boolean {
  if (
    prev.recent !== next.recent &&
    !sameList(prev.recent, next.recent, (a, b) => a === b)
  )
    return true;
  if (
    prev.jumps !== next.jumps &&
    (prev.jumps.at !== next.jumps.at ||
      !sameList(
        prev.jumps.entries,
        next.jumps.entries,
        (a, b) => a.path === b.path && a.line === b.line && a.col === b.col,
      ))
  )
    return true;
  if (prev.windows.tree !== next.windows.tree) return true;
  if (prev.windows.byId === next.windows.byId && prev.buffers === next.buffers)
    return false;
  return !sameList(shownPaths(prev), shownPaths(next), (a, b) => a === b);
}

/** A layout whose windows and active window are leaves of its tree. */
function usable(layout: PersistedState["layout"]): boolean {
  const ids = leaves(layout.tree);
  return (
    new Set(ids).size === ids.length &&
    ids.includes(layout.active) &&
    layout.windows.length > 0 &&
    layout.windows.every((w) => ids.includes(w.id))
  );
}

/**
 * The state file was read. Recents and jumps always load; a start on a
 * folder also rebuilds the layout and reads each window's file once.
 */
export function onStateLoaded(
  s: AppState,
  a: Extract<Action, { type: "stateLoaded" }>,
): Result {
  if (a.state === undefined) return none(s);
  const { recent, jumps, layout } = a.state;
  const loaded: AppState = { ...s, recent, jumps };
  if (!a.restore || !usable(layout)) return none(loaded);
  const pending: NonNullable<AppState["windows"]["restore"]>["pending"] = {};
  for (const w of layout.windows)
    pending[w.id] = { path: w.path, cursor: w.cursor, scroll: w.scroll };
  const paths = [...new Set(layout.windows.map((w) => w.path))];
  return {
    state: {
      ...loaded,
      windows: {
        tree: layout.tree,
        byId: {},
        active: layout.active,
        nextWindowId: Math.max(...leaves(layout.tree)) + 1,
        restore: { pending, missing: 0 },
      },
    },
    effects: paths.map((path) => ({ kind: "read", path })),
  };
}

/** Whether a window is waiting for `path` to load. */
export const awaitsRestore = (s: AppState, path: string): boolean =>
  Object.values(s.windows.restore?.pending ?? {}).some((p) => p.path === path);

/**
 * `path` loaded as `bufferId`: every window waiting for it shows it at its
 * saved position. The active window's `after`, when it waited with one, then
 * places its cursor.
 */
export function fillRestored(
  s: AppState,
  path: string,
  bufferId: BufferId,
  reg: Registries,
): Result {
  const restore = s.windows.restore;
  const b = s.buffers[bufferId];
  if (restore === undefined || b === undefined) return none(s);
  const byId = { ...s.windows.byId };
  const pending = { ...restore.pending };
  for (const [key, p] of Object.entries(restore.pending)) {
    if (p.path !== path) continue;
    const id: WindowId = Number(key);
    const line = Math.min(p.cursor.line, b.text.lineCount - 1);
    const col = Math.max(
      0,
      Math.min(p.cursor.col, b.text.line(line).length - 1),
    );
    byId[id] = {
      id,
      content: {
        editor: "text",
        bufferId,
        cursor: { line, col },
        scroll: Math.min(p.scroll, line),
      },
    };
    delete pending[id];
  }
  const active = restore.pending[s.windows.active];
  const after = active?.path === path ? active.after : undefined;
  const filled = finish(
    { ...s, windows: { ...s.windows, byId } },
    pending,
    restore.missing,
  );
  return after === undefined
    ? filled
    : chain(filled, (st) => none(placeAfterOpen(st, after, reg)));
}

/** Whether a jump or link follow is waiting for `path` to load. */
export const awaitsNavigation = (s: AppState, path: string): boolean =>
  Object.values(s.windows.restore?.pending ?? {}).some(
    (p) => p.path === path && p.navigated === true,
  );

/**
 * `path` could not be opened: its waiting windows stay empty. It counts as
 * missing from the last session only when a restored window waited for it.
 */
export function dropRestored(s: AppState, path: string): Result {
  const restore = s.windows.restore;
  if (restore === undefined) return none(s);
  const waiting = Object.values(restore.pending).filter((p) => p.path === path);
  const pending = Object.fromEntries(
    Object.entries(restore.pending).filter(([, p]) => p.path !== path),
  );
  const missed = waiting.some((p) => p.navigated !== true) ? 1 : 0;
  return finish(s, pending, restore.missing + missed);
}

function finish(
  s: AppState,
  pending: NonNullable<AppState["windows"]["restore"]>["pending"],
  missing: number,
): Result {
  if (Object.keys(pending).length > 0)
    return none({
      ...s,
      windows: { ...s.windows, restore: { pending, missing } },
    });
  const { restore: _, ...windows } = s.windows;
  const done: AppState = { ...s, windows };
  return missing > 0
    ? toast(
        done,
        "info",
        `${missing} files from the last session were not found`,
      )
    : none(done);
}
