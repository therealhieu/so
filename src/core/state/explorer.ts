import { buffersUnder, openPath, removeBuffer } from "./buffers";
import type { CommandContext } from "./commands";
import { markDeleted } from "./disk";
import { indexAfterFsOp } from "./index";
import {
  awaitsOp,
  beginRewrite,
  dropRewrite,
  followMove,
  promptImpact,
  startRename,
  submitRename,
} from "./link-edits";
import { request } from "./lsp";
import { submitNewNote } from "./note-commands";
import { chain, message, none, toast } from "./result";
import { writeBuffer } from "./save";
import type {
  Action,
  AppState,
  Effect,
  ExplorerPrompt,
  ExplorerState,
  FsOp,
  PromptState,
  Result,
} from "./types";
import type { Registries } from "./update";

export const dirname = (path: string): string => {
  const i = path.lastIndexOf("/");
  return i < 0 ? "" : path.slice(0, i);
};

const under = (path: string, root: string) =>
  path === root || path.startsWith(`${root}/`);

/** The root is always listed; other folders while expanded. */
export const isListed = (s: AppState, dir: string) =>
  dir === "" || s.panels.explorer.expanded.includes(dir);

/** Whether a path has a dot-prefixed segment, which only the explorer may show. */
const hasDotSegment = (path: string): boolean =>
  path.split("/").some((p) => p.startsWith("."));

/** Whether the tree lists `path`, or a folder above it, as gitignored. */
export function isIgnoredPath(s: AppState, path: string): boolean {
  const parts = path.split("/");
  return parts.some((name, i) =>
    s.panels.explorer.entries[parts.slice(0, i).join("/")]?.some(
      (e) => e.name === name && e.ignored === true,
    ),
  );
}

/**
 * Read one folder for the tree, with dot entries when `[explorer] dotfiles`
 * is on and gitignored ones when `[explorer] gitignored` is.
 */
export const listDirEffect = (s: AppState, dir: string): Effect => {
  const { dotfiles, gitignored } = s.config.explorer;
  return {
    kind: "listDir",
    dir,
    ...(dotfiles ? { dotfiles: true as const } : {}),
    ...(gitignored ? { gitignored: true as const } : {}),
  };
};

/** List again every given folder the explorer shows, once each. */
export function relist(s: AppState, dirs: string[]): Result {
  const effects: Effect[] = [...new Set(dirs)]
    .filter((d) => isListed(s, d))
    .map((dir) => listDirEffect(s, dir));
  return { state: s, effects };
}

/**
 * `[explorer] dotfiles` or `gitignored` changed: list every shown folder
 * again. Hiding entries also collapses the hidden folders and moves a
 * selection inside one to the top.
 */
export function relistShown(s: AppState): Result {
  const ex = s.panels.explorer;
  const { dotfiles, gitignored } = s.config.explorer;
  const hidden = (path: string) =>
    (!dotfiles && hasDotSegment(path)) ||
    (!gitignored && isIgnoredPath(s, path));
  const next = setExplorer(s, {
    expanded: ex.expanded.filter((d) => !hidden(d)),
    cursor: hidden(ex.cursor) ? "" : ex.cursor,
  });
  return relist(next, ["", ...next.panels.explorer.expanded]);
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

/**
 * A file operation reported back. A rename or move with planned link edits
 * starts them only on success; a failure drops them unapplied.
 */
export function onFsResult(
  prev: AppState,
  a: Extract<Action, { type: "fsResult" }>,
  reg: Registries,
): Result {
  const { op } = a;
  const r = fsResultTree(prev, a);
  if (!awaitsOp(prev, op)) return r;
  return a.ok
    ? chain(r, (st) => beginRewrite(st, reg))
    : none(dropRewrite(r.state));
}

function fsResultTree(
  prev: AppState,
  a: Extract<Action, { type: "fsResult" }>,
): Result {
  const { op } = a;
  if (!a.ok)
    return op.kind === "trash" && !op.permanent
      ? toast(
          withTrash(prev, false),
          "error",
          `Move to Trash failed: ${a.reason ?? "unknown error"}`,
        )
      : message(prev, a.reason ?? "operation failed", "error");
  const s = indexAfterFsOp(prev, op);
  switch (op.kind) {
    case "rename":
    case "move": {
      const to = op.to ?? op.from;
      const ex = s.panels.explorer;
      const expanded = ex.expanded.map((d) => repath(d, op.from, to));
      const moved = setExplorer(
        repathBuffers(followMove(s, op.from, to), op.from, to),
        {
          entries: Object.fromEntries(
            Object.entries(ex.entries).filter(([d]) => !under(d, op.from)),
          ),
          expanded,
          cursor: repath(ex.cursor, op.from, to),
        },
      );
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
  const side = { ...s.panels.side, focused: false };
  const opened = setExplorer(
    { ...s, panels: { ...s.panels, side } },
    { open: true, focused: true },
  );
  return ex.entries[""] === undefined
    ? { state: opened, effects: [listDirEffect(opened, "")] }
    : none(opened);
}

/** The narrowest tree, in columns. */
export const EXPLORER_MIN_WIDTH = 15;
/** Columns one `<C-w>>` or `<C-w><` adds or takes away. */
export const EXPLORER_WIDTH_STEP = 5;

/** The tree's columns: the resized or configured width, at most half the terminal. */
export function explorerWidth(s: AppState): number {
  const max = Math.max(EXPLORER_MIN_WIDTH, Math.floor(s.terminal.cols / 2));
  const width = s.panels.explorer.width ?? s.config.explorer.width;
  return Math.min(max, Math.max(EXPLORER_MIN_WIDTH, width));
}

/**
 * Give the tree `width` columns, clamped like `explorerWidth`; `undefined`
 * returns it to `[explorer] width`.
 */
export function resizeExplorer(
  s: AppState,
  width: number | undefined,
): AppState {
  const ex = s.panels.explorer;
  if (width === undefined) {
    if (ex.width === undefined) return s;
    const { width: _, ...rest } = ex;
    return { ...s, panels: { ...s.panels, explorer: rest } };
  }
  const next = explorerWidth(setExplorer(s, { width }));
  return next === ex.width ? s : setExplorer(s, { width: next });
}

const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);
const join = (dir: string, name: string) =>
  dir === "" ? name : `${dir}/${name}`;

const kindOf = (s: AppState, path: string) =>
  s.panels.explorer.entries[dirname(path)]?.find(
    (e) => e.name === basename(path),
  )?.kind;

/** Paths shown in the tree, top to bottom. */
export function visiblePaths(s: AppState, dir = ""): string[] {
  const ex = s.panels.explorer;
  return (ex.entries[dir] ?? []).flatMap((e) => {
    const path = join(dir, e.name);
    return e.kind === "dir" && ex.expanded.includes(path)
      ? [path, ...visiblePaths(s, path)]
      : [path];
  });
}

/** `j` / `k`: move the selection through the visible tree. */
export function moveCursor(s: AppState, delta: number): Result {
  const paths = visiblePaths(s);
  if (paths.length === 0) return none(s);
  const at = paths.indexOf(s.panels.explorer.cursor);
  const next = Math.max(0, Math.min(paths.length - 1, at + delta));
  return none(setExplorer(s, { cursor: paths[next] ?? "" }));
}

function expand(s: AppState, dir: string): Result {
  if (s.panels.explorer.expanded.includes(dir)) return none(s);
  return {
    state: setExplorer(s, { expanded: [...s.panels.explorer.expanded, dir] }),
    effects: [listDirEffect(s, dir)],
  };
}

/** `l`: expand the selected folder, or open the selected file. */
export function expandOrOpen(s: AppState, now: number): Result {
  const path = s.panels.explorer.cursor;
  const kind = kindOf(s, path);
  if (kind === "dir") return expand(s, path);
  return kind === "file" ? openPath(s, path, now) : none(s);
}

/** `Enter`: toggle the selected folder, or open the selected file. */
export function openSelected(s: AppState, now: number): Result {
  const path = s.panels.explorer.cursor;
  if (kindOf(s, path) === "dir" && s.panels.explorer.expanded.includes(path))
    return collapse(s);
  return expandOrOpen(s, now);
}

/** `h`: collapse the selected folder, or select its parent. */
export function collapse(s: AppState): Result {
  const ex = s.panels.explorer;
  if (ex.expanded.includes(ex.cursor))
    return none(
      setExplorer(s, { expanded: ex.expanded.filter((d) => d !== ex.cursor) }),
    );
  const parent = dirname(ex.cursor);
  return parent === "" ? none(s) : none(setExplorer(s, { cursor: parent }));
}

/** `Z`: close every folder and select the top-level entry holding the selection. */
export function collapseAll(s: AppState): Result {
  const top = s.panels.explorer.cursor.split("/")[0] ?? "";
  return none(setExplorer(s, { expanded: [], cursor: top }));
}

const openPrompt = (s: AppState, prompt: PromptState): Result =>
  none({ ...s, overlay: { kind: "prompt", prompt } });

/** `a r m d`: open the prompt for an operation on the selection. */
export function startOp(
  c: CommandContext,
  kind: "create" | "rename" | "move" | "delete",
): Result {
  const s = c.state;
  const ex = s.panels.explorer;
  const from = ex.cursor;
  if (kind === "create") {
    const folder = kindOf(s, from) === "dir" ? from : dirname(from);
    const op: FsOp = { kind: "create", from: folder };
    return openPrompt(s, {
      kind: "input",
      title: "New file or folder",
      value: "",
      op,
    });
  }
  if (from === "") return none(s);
  if (kind === "rename" || kind === "move") return startRename(c, kind, from);
  return ex.trash === "available"
    ? openPrompt(s, {
        kind: "confirm",
        title: "Move to Trash? [y/N]",
        value: "",
        op: { kind: "trash", from },
      })
    : openPrompt(s, {
        kind: "typed",
        title: `Delete permanently? Type ${basename(from)} to confirm`,
        value: "",
        op: { kind: "trash", from, permanent: true },
      });
}

/** A key while a prompt is open: edit the field, submit, or cancel. */
export function promptKey(
  s: AppState,
  key: string,
  now: number,
  reg: Registries,
): Result {
  if (s.overlay.kind !== "prompt") return none(s);
  const p = s.overlay.prompt;
  const closed: AppState = { ...s, overlay: { kind: "none" } };
  if (key === "<Esc>") return none(closed);
  if (p.newNote === true) return newNotePromptKey(s, p, key, now, reg);
  if (p.rename !== undefined) return renamePromptKey(s, p, key);
  if (p.kind === "confirm")
    return key === "y" ? explorerOp(closed, p.op, now) : none(closed);
  if (key === "<CR>") return submit(closed, p, now);
  const value = typed(p.value, key);
  if (value === p.value) return none(s);
  const edited = { ...p, value };
  const prompt =
    p.op.kind === "rename" || p.op.kind === "move"
      ? promptImpact(s, edited)
      : edited;
  return none({ ...s, overlay: { kind: "prompt", prompt } });
}

/** The edited value of a text prompt: `<BS>` drops a character, a printable key adds one. */
const typed = (value: string, key: string): string =>
  key === "<BS>"
    ? value.slice(0, -1)
    : [...key].length === 1
      ? value + key
      : value;

/**
 * Typing edits the new name; it cannot be submitted while empty or equal to
 * the current name. Enter asks the server that prepared the rename.
 */
function renamePromptKey(
  s: AppState,
  p: Extract<PromptState, { rename: object }>,
  key: string,
): Result {
  const { rename } = p;
  if (key === "<CR>")
    return p.invalid !== undefined
      ? none(s)
      : request(
          { ...s, overlay: { kind: "none" } },
          "rename",
          { kind: "rename", pos: rename.pos, newName: p.value },
          { key: rename.key },
        );
  const value = typed(p.value, key);
  if (value === p.value) return none(s);
  const { invalid: _, ...rest } = p;
  const invalid =
    value.trim() === ""
      ? "name is empty"
      : value === rename.name
        ? "type a new name"
        : undefined;
  const prompt = {
    ...rest,
    value,
    ...(invalid === undefined ? {} : { invalid }),
  };
  return none({ ...s, overlay: { kind: "prompt", prompt } });
}

function submit(s: AppState, p: ExplorerPrompt, now: number): Result {
  const value = p.value.trim();
  const { op } = p;
  if (op.kind === "trash")
    return value === basename(op.from)
      ? explorerOp(s, op, now)
      : none({
          ...s,
          overlay: { kind: "prompt", prompt: p },
        });
  if (op.kind === "rename" || op.kind === "move")
    return submitRename(s, p, now);
  if (value === "") return none(s);
  if (op.kind === "create") {
    const t = createTarget(value);
    return explorerOp(
      s,
      { kind: "create", from: join(op.from, t.path), dir: t.dir },
      now,
    );
  }
  return none(s);
}

/**
 * Why a new note's title cannot be used: empty, or a path that would leave
 * the workspace or has an empty, "." or ".." segment or a NUL.
 */
export function newNoteTitleError(value: string): string | undefined {
  const title = value.trim();
  if (title === "") return "title is empty";
  if (title.startsWith("/")) return "outside the workspace";
  if (title.includes("\u0000")) return "invalid character";
  const parts = title.split("/");
  if (parts.includes("..")) return "outside the workspace";
  if (parts.some((p) => p === "" || p === ".")) return "invalid path";
  return undefined;
}

/** The workspace path a valid title names: the title plus ".md", once. */
export const newNotePath = (value: string): string =>
  `${value.trim().replace(/\.md$/i, "")}.md`;

/** Typing edits the title and re-checks it; Enter goes on to the template unless it is invalid. */
function newNotePromptKey(
  s: AppState,
  p: PromptState,
  key: string,
  now: number,
  reg: Registries,
): Result {
  if (key === "<CR>") {
    const invalid = newNoteTitleError(p.value);
    return invalid === undefined
      ? submitNewNote(
          { ...s, overlay: { kind: "none" } },
          newNotePath(p.value),
          now,
          reg,
        )
      : none({ ...s, overlay: { kind: "prompt", prompt: { ...p, invalid } } });
  }
  const value = typed(p.value, key);
  if (value === p.value) return none(s);
  const { invalid: _, ...rest } = p;
  const invalid = newNoteTitleError(value);
  const prompt: PromptState =
    invalid === undefined ? { ...rest, value } : { ...rest, value, invalid };
  return none({ ...s, overlay: { kind: "prompt", prompt } });
}
