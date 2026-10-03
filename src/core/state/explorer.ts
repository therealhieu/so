import { buffersUnder, removeBuffer } from "./buffers";
import { markDeleted } from "./disk";
import { chain, message, none, toast } from "./result";
import { writeBuffer } from "./save";
import type {
  Action,
  AppState,
  Effect,
  ExplorerState,
  FsOp,
  Result,
} from "./types";

export const dirname = (path: string): string => {
  const i = path.lastIndexOf("/");
  return i < 0 ? "" : path.slice(0, i);
};

const under = (path: string, root: string) =>
  path === root || path.startsWith(`${root}/`);

/** The root is always listed; other folders while expanded. */
const isListed = (s: AppState, dir: string) =>
  dir === "" || s.panels.explorer.expanded.includes(dir);

/** List again every given folder the explorer shows, once each. */
export function relist(s: AppState, dirs: string[]): Result {
  const effects: Effect[] = [...new Set(dirs)]
    .filter((d) => isListed(s, d))
    .map((dir) => ({ kind: "listDir", dir }));
  return { state: s, effects };
}

/** Forget the listing and expansion of a removed folder and everything below it. */
export function pruneTree(s: AppState, path: string): AppState {
  const ex = s.panels.explorer;
  if (!ex.expanded.some((d) => under(d, path))) return s;
  const entries = Object.fromEntries(
    Object.entries(ex.entries).filter(([d]) => !under(d, path)),
  );
  const expanded = ex.expanded.filter((d) => !under(d, path));
  return {
    ...s,
    panels: { ...s.panels, explorer: { ...ex, entries, expanded } },
  };
}

/** Every folder above `path`, from the root down. */
const ancestors = (path: string): string[] => {
  const parts = path.split("/").slice(0, -1);
  return ["", ...parts.map((_, i) => parts.slice(0, i + 1).join("/"))];
};

const repath = (path: string, from: string, to: string) =>
  under(path, from) ? to + path.slice(from.length) : path;

const extname = (name: string): string => {
  const base = name.slice(name.lastIndexOf("/") + 1);
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot) : "";
};

function setExplorer(s: AppState, patch: Partial<ExplorerState>): AppState {
  return {
    ...s,
    panels: { ...s.panels, explorer: { ...s.panels.explorer, ...patch } },
  };
}

/** `a <name>`: ".md" when the name has no extension; a trailing "/" makes a folder. */
export const createTarget = (name: string): { path: string; dir: boolean } =>
  name.endsWith("/")
    ? { path: name.slice(0, -1), dir: true }
    : { path: extname(name) ? name : `${name}.md`, dir: false };

/**
 * Emit the flush writes of every buffer the operation touches, then the
 * operation itself, as one ordered list for the serial file-system queue.
 */
export function explorerOp(s: AppState, op: FsOp, now: number): Result {
  const flushed =
    op.kind === "create"
      ? none(s)
      : buffersUnder(s, op.from).reduce<Result>(
          (r, b) => chain(r, (st) => writeBuffer(st, b.id, now)),
          none(s),
        );
  return withEffect(flushed, { kind: op.kind, op });
}

const withEffect = (r: Result, e: Effect): Result => ({
  state: r.state,
  effects: [...r.effects, e],
});

export function onFsResult(
  s: AppState,
  a: Extract<Action, { type: "fsResult" }>,
): Result {
  const { op } = a;
  if (!a.ok)
    return op.kind === "trash" && !op.permanent
      ? toast(
          withTrash(s, false),
          "error",
          `Move to Trash failed: ${a.reason ?? "unknown error"}`,
        )
      : message(s, a.reason ?? "operation failed", "error");
  switch (op.kind) {
    case "rename":
    case "move": {
      const to = op.to ?? op.from;
      const ex = s.panels.explorer;
      const expanded = ex.expanded.map((d) => repath(d, op.from, to));
      const moved = setExplorer(repathBuffers(s, op.from, to), {
        entries: Object.fromEntries(
          Object.entries(ex.entries).filter(([d]) => !under(d, op.from)),
        ),
        expanded,
        cursor: repath(ex.cursor, op.from, to),
      });
      return relist(moved, [
        dirname(op.from),
        ...ancestors(to),
        ...expanded.filter((d) => under(d, to)),
      ]);
    }
    case "trash": {
      const closed = buffersUnder(s, op.from).reduce<Result>(
        (r, b) =>
          chain(r, (st) =>
            b.dirty ? markDeleted(st, b.id) : removeBuffer(st, b.id),
          ),
        none(pruneTree(s, op.from)),
      );
      const cursor = under(s.panels.explorer.cursor, op.from)
        ? dirname(op.from)
        : s.panels.explorer.cursor;
      return chain(closed, (st) =>
        relist(setExplorer(st, { cursor }), [dirname(op.from)]),
      );
    }
    case "create": {
      const listed = relist(
        setExplorer(s, { cursor: op.from }),
        ancestors(op.from),
      );
      return op.dir
        ? listed
        : withEffect(listed, { kind: "read", path: op.from });
    }
  }
}

/** Buffers follow a rename or move; text, undo, dirty state, and stamp are kept. */
function repathBuffers(s: AppState, from: string, to: string): AppState {
  const buffers = { ...s.buffers };
  for (const b of buffersUnder(s, from))
    buffers[b.id] = { ...b, path: repath(b.path, from, to) };
  return { ...s, buffers };
}

export function onDirListed(
  s: AppState,
  a: Extract<Action, { type: "dirListed" }>,
): Result {
  if (a.entries === null)
    return message(
      s,
      `cannot list ${a.dir || "."}: ${a.reason ?? "unknown error"}`,
      "error",
    );
  const ex = s.panels.explorer;
  const first = a.entries[0];
  return none(
    setExplorer(s, {
      entries: { ...ex.entries, [a.dir]: a.entries },
      cursor:
        ex.cursor === "" && a.dir === "" && first !== undefined
          ? first.name
          : ex.cursor,
    }),
  );
}

export const withTrash = (s: AppState, available: boolean): AppState =>
  setExplorer(s, { trash: available ? "available" : "unavailable" });

/** `<leader>e`: open and focus the explorer, or close it when it has focus. */
export function toggleExplorer(s: AppState): Result {
  const ex = s.panels.explorer;
  if (ex.open && ex.focused)
    return none(setExplorer(s, { open: false, focused: false }));
  const opened = setExplorer(s, { open: true, focused: true });
  return ex.entries[""] === undefined
    ? { state: opened, effects: [{ kind: "listDir", dir: "" }] }
    : none(opened);
}
