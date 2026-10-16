import {
  activeBuffer,
  bufferForPath,
  buffersUnder,
  defaultView,
  openPath,
  removeBuffer,
  withAnalysis,
} from "./buffers";
import type { CommandContext } from "./commands";
import { markDeleted } from "./disk";
import { indexAfterFsOp } from "./index";
import { editField, type LineField, promptField } from "./line-field";
import {
  awaitsOp,
  beginRewrite,
  dropRewrite,
  followMove,
  pasteMove,
  promptImpact,
  startRename,
  submitRename,
} from "./link-edits";
import { request } from "./lsp";
import { submitNewNote, submitNewRow } from "./note-commands";
import { chain, message, none, toast } from "./result";
import { writeBuffer } from "./save";
import type {
  Action,
  AppState,
  Effect,
  ExplorerPrompt,
  ExplorerState,
  FileClip,
  FsOp,
  MouseTarget,
  PromptState,
  Result,
  Stamp,
} from "./types";
import type { Registries } from "./update";

export const dirname = (path: string): string => {
  const i = path.lastIndexOf("/");
  return i < 0 ? "" : path.slice(0, i);
};

const under = (path: string, root: string) =>
  path === root || path.startsWith(`${root}/`);

/** Whether `path` is, or is below, an entry `x` cut and not yet pasted. */
export const isCutPath = (s: AppState, path: string): boolean => {
  const clip = s.panels.explorer.clip;
  return clip?.op === "cut" && clip.paths.some((p) => under(path, p));
};

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

/** Track the entry under the pointer; anywhere else clears it. */
export function hoverExplorer(s: AppState, t: MouseTarget): AppState {
  const path = t.kind === "explorer" && t.path !== "" ? t.path : undefined;
  const ex = s.panels.explorer;
  if (ex.hover === path) return s;
  const { hover: _, ...rest } = ex;
  return {
    ...s,
    panels: {
      ...s.panels,
      explorer: path === undefined ? rest : { ...rest, hover: path },
    },
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
  const r = fsResultTree(prev, a, reg);
  if (!awaitsOp(prev, op)) return r;
  return a.ok
    ? chain(r, (st) => beginRewrite(st, reg))
    : none(dropRewrite(r.state));
}

function fsResultTree(
  prev: AppState,
  a: Extract<Action, { type: "fsResult" }>,
  reg: Registries,
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
  if (op.kind === "copy" || op.outside === true) {
    const to = op.to ?? op.from;
    const done = message(s, `Pasted ${basename(to)}`).state;
    return relist(setExplorer(done, { cursor: to }), ancestors(to));
  }
  switch (op.kind) {
    case "rename":
    case "move": {
      const to = op.to ?? op.from;
      const ex = s.panels.explorer;
      const expanded = ex.expanded.map((d) => repath(d, op.from, to));
      const repathed = repathBuffers(
        followMove(s, op.from, to),
        op.from,
        to,
        reg,
      );
      const moved = setExplorer(repathed.state, {
        entries: Object.fromEntries(
          Object.entries(ex.entries).filter(([d]) => !under(d, op.from)),
        ),
        expanded,
        cursor: repath(ex.cursor, op.from, to),
      });
      return chain({ state: moved, effects: repathed.effects }, (st) =>
        relist(st, [
          dirname(op.from),
          ...ancestors(to),
          ...expanded.filter((d) => under(d, to)),
        ]),
      );
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

/** A stamp no file has, so the next read of the path reloads the buffer. */
const UNREAD: Stamp = { mtimeMs: 0, size: 0, hash: "" };

/**
 * Buffers follow a rename or move; text, undo, dirty state, and stamp are
 * kept. A new extension that names another file type gives the buffer that
 * type's view, read-only flag, and analysis; when one side is binary the
 * text cannot carry over, so the file is read again.
 */
function repathBuffers(
  s: AppState,
  from: string,
  to: string,
  reg: Registries,
): Result {
  const buffers = { ...s.buffers };
  const effects: Effect[] = [];
  for (const b of buffersUnder(s, from)) {
    const path = repath(b.path, from, to);
    const ft = reg.fileTypes.forPath(path);
    if (ft.id === b.fileType) {
      buffers[b.id] = { ...b, path };
      continue;
    }
    const { readOnly: _, binary, analysis: __, ...rest } = b;
    const reread = (binary === true) !== (ft.binary === true);
    buffers[b.id] = withAnalysis(
      {
        ...rest,
        path,
        fileType: ft.id,
        view: defaultView(ft, s.config),
        ...(ft.readOnly === true ? { readOnly: true as const } : {}),
        ...(ft.binary === true ? { binary: true as const } : {}),
        ...(reread ? { stamp: UNREAD } : {}),
      },
      ft,
    );
    if (reread) effects.push({ kind: "read", path });
  }
  return { state: { ...s, buffers }, effects };
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
  return revealPath(opened, activeBuffer(opened)?.path);
}

/** Whether the explorer's `[explorer] dotfiles` and `gitignored` settings show `path`. */
const isShown = (s: AppState, path: string): boolean =>
  (s.config.explorer.dotfiles || !hasDotSegment(path)) &&
  (s.config.explorer.gitignored || !isIgnoredPath(s, path));

/**
 * Expand the folders above a shown `path`, keeping every other open folder,
 * and select it. Folders the tree needs and has not listed yet are read.
 */
function revealPath(s: AppState, path: string | undefined): Result {
  const ex = s.panels.explorer;
  const shown = path !== undefined && isShown(s, path);
  const dirs = shown ? ancestors(path) : [""];
  const next = shown
    ? setExplorer(s, {
        expanded: [
          ...ex.expanded,
          ...dirs.filter((d) => d !== "" && !ex.expanded.includes(d)),
        ],
        cursor: path,
      })
    : s;
  const effects = dirs
    .filter((d) => ex.entries[d] === undefined)
    .map((d) => listDirEffect(next, d));
  return { state: next, effects };
}

/**
 * The open explorer reveals the active file whenever another file becomes
 * active, unless it has focus: then its cursor is the user's.
 */
export function followActiveFile(prev: AppState, r: Result): Result {
  const ex = r.state.panels.explorer;
  const path = activeBuffer(r.state)?.path;
  if (
    !ex.open ||
    ex.focused ||
    path === undefined ||
    path === activeBuffer(prev)?.path ||
    !isShown(r.state, path)
  )
    return r;
  const revealed = revealPath(r.state, path);
  return {
    state: revealed.state,
    effects: [...r.effects, ...revealed.effects],
  };
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

/**
 * `l`: expand the selected folder, or open the selected file. The file's
 * window takes focus: at once when it is already open, else once it is read.
 */
export function expandOrOpen(s: AppState, now: number): Result {
  const path = s.panels.explorer.cursor;
  const kind = kindOf(s, path);
  if (kind === "dir") return expand(s, path);
  if (kind !== "file") return none(s);
  const r = openPath(s, path, now);
  return bufferForPath(s, path) === undefined
    ? r
    : { ...r, state: setExplorer(r.state, { focused: false }) };
}

/** `Enter`: toggle the selected folder, or open the selected file. */
export function openSelected(s: AppState, now: number): Result {
  const path = s.panels.explorer.cursor;
  if (kindOf(s, path) === "dir" && s.panels.explorer.expanded.includes(path))
    return collapse(s);
  return expandOrOpen(s, now);
}

/** `O`: open the selected entry in the system's default app (`open`, `xdg-open`). */
export function systemOpenSelected(s: AppState): Result {
  const path = s.panels.explorer.cursor;
  const root = s.workspace.root;
  return {
    state: s,
    effects: [{ kind: "openUrl", url: path === "" ? root : `${root}/${path}` }],
  };
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

/** The selection's absolute path, as other programs name it. */
const absPath = (s: AppState, path: string) =>
  path === "" ? s.workspace.root : `${s.workspace.root}/${path}`;

/** The workspace path of an absolute path, or `undefined` outside the workspace. */
function workspacePath(s: AppState, abs: string): string | undefined {
  const root = s.workspace.root;
  if (abs === root) return "";
  return abs.startsWith(`${root}/`) ? abs.slice(root.length + 1) : undefined;
}

/** `y` / `x`: take the selection for a paste, in so and on the system clipboard. */
export const takeSelected = (s: AppState, op: FileClip["op"]): Result =>
  take(s, s.panels.explorer.cursor, op);

/** `<leader>fy` / `<leader>fx`: take the active buffer's file for a paste. */
export function takeActiveFile(s: AppState, op: FileClip["op"]): Result {
  const b = activeBuffer(s);
  return b === undefined
    ? message(s, "E32: No file name", "error")
    : take(s, b.path, op);
}

/** The message comes when the system clipboard answers the write. */
function take(s: AppState, path: string, op: FileClip["op"]): Result {
  if (path === "") return none(s);
  return withEffect(none(setExplorer(s, { clip: { op, paths: [path] } })), {
    kind: "fileClipboardWrite",
    clip: { op, paths: [absPath(s, path)] },
  });
}

/** The system clipboard took the files `y`/`x` gave it, or so kept them alone. */
export function onFileClipboardWritten(
  s: AppState,
  a: Extract<Action, { type: "fileClipboardWritten" }>,
): Result {
  const verb = a.clip.op === "copy" ? "Copied" : "Cut";
  const names = a.clip.paths.map((p) => basename(p)).join(", ");
  return message(
    s,
    `${verb} ${names}${a.system ? " to the system clipboard" : ""}`,
  );
}

/** A long paste's progress on the message line, until its result replaces it. */
export const onCopyProgress = (
  s: AppState,
  a: Extract<Action, { type: "copyProgress" }>,
): Result => message(s, `Copying ${basename(a.to)}… ${a.done}/${a.total}`);

/** `p`: paste into the selected folder, or the selected file's folder. */
export function startPaste(s: AppState): Result {
  const at = s.panels.explorer.cursor;
  return pasteInto(s, kindOf(s, at) === "dir" ? at : dirname(at));
}

/** `<leader>fp`: paste into the active file's folder, or the workspace root. */
export function pasteBesideActiveFile(s: AppState): Result {
  const b = activeBuffer(s);
  return pasteInto(s, b === undefined ? "" : dirname(b.path));
}

const pasteInto = (s: AppState, target: string): Result => ({
  state: s,
  effects: [{ kind: "fileClipboardRead", target }],
});

/**
 * `name`, or the first of "name copy", "name copy 2", … that is not taken;
 * a file keeps its extension last.
 */
export function freeName(
  name: string,
  dir: boolean,
  taken: ReadonlySet<string>,
): string {
  if (!taken.has(name)) return name;
  const ext = dir ? "" : extname(name);
  const stem = name.slice(0, name.length - ext.length);
  for (let n = 1; ; n++) {
    const next = `${stem} copy${n === 1 ? "" : ` ${n}`}${ext}`;
    if (!taken.has(next)) return next;
  }
}

/** Names in `dir` the tree lists or the index holds a path under. */
function namesIn(s: AppState, dir: string): Set<string> {
  const names = new Set(
    (s.panels.explorer.entries[dir] ?? []).map((e) => e.name),
  );
  const prefix = dir === "" ? "" : `${dir}/`;
  for (const f of s.index.ix.files)
    if (f.startsWith(prefix))
      names.add(f.slice(prefix.length).split("/")[0] ?? "");
  return names;
}

function dropClip(s: AppState): AppState {
  const { clip: _, ...explorer } = s.panels.explorer;
  return { ...s, panels: { ...s.panels, explorer } };
}

const samePaths = (a: string[], b: string[]) =>
  a.length === b.length && a.every((p, i) => p === b[i]);

/**
 * The system clipboard answered a paste. Its files win, but when they are the
 * ones `y`/`x` took, the explorer's copy or cut decides (Finder cannot cut);
 * with no files there, what `y`/`x` took is pasted. Entries from the workspace
 * are copied, or moved with their links updated; entries from outside are
 * copied, or moved in when another file manager cut them. A taken name gets
 * " copy"; a cut entry already in the target stays; a folder never goes into
 * itself. A cut pasted once is done.
 */
export function onFileClip(
  s: AppState,
  a: Extract<Action, { type: "fileClip" }>,
): Result {
  const { now } = a;
  const own = s.panels.explorer.clip;
  const ownAbs = own?.paths.map((p) => absPath(s, p));
  const clip: FileClip | undefined =
    a.clip === null
      ? own && ownAbs && { op: own.op, paths: ownAbs }
      : own && ownAbs && samePaths(a.clip.paths, ownAbs)
        ? { op: own.op, paths: a.clip.paths }
        : a.clip;
  if (clip === undefined)
    return a.error === undefined
      ? message(s, "nothing to paste")
      : message(s, `clipboard unavailable: ${a.error}`, "error");
  const target = a.target;
  const taken = namesIn(s, target);
  const ops: FsOp[] = [];
  const moves: { from: string; to: string }[] = [];
  for (const abs of clip.paths) {
    const rel = workspacePath(s, abs);
    if (rel !== undefined && under(target, rel))
      return message(s, "cannot paste a folder into itself", "error");
    if (rel !== undefined && clip.op === "cut" && dirname(rel) === target)
      continue;
    const dir =
      a.dirs.includes(abs) || (rel !== undefined && kindOf(s, rel) === "dir");
    const name = freeName(basename(abs), dir, taken);
    taken.add(name);
    const to = join(target, name);
    const kind = clip.op === "copy" ? "copy" : "move";
    if (rel === undefined)
      ops.push({ kind, from: abs, to, ...(dir ? { dir } : {}), outside: true });
    else if (kind === "copy")
      ops.push({ kind, from: rel, to, ...(dir ? { dir } : {}) });
    else moves.push({ from: rel, to });
  }
  const start = clip.op === "cut" ? dropClip(s) : s;
  const copied = ops.reduce<Result>(
    (r, op) => chain(r, (st) => explorerOp(st, op, now)),
    none(start),
  );
  const [only] = moves;
  if (only !== undefined && moves.length === 1)
    return chain(copied, (st) => pasteMove(st, only.from, only.to, now));
  const moved = moves.reduce<Result>(
    (r, m) => chain(r, (st) => explorerOp(st, { kind: "move", ...m }, now)),
    copied,
  );
  return moves.length > 1
    ? chain(moved, (st) => message(st, "links not updated for several entries"))
    : moved;
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
  return confirmDelete(s, from);
}

/** `<leader>fd`: ask to delete the active buffer's file. */
export function deleteActiveFile(s: AppState): Result {
  const b = activeBuffer(s);
  return b === undefined || b.path === ""
    ? message(s, "E32: No file name", "error")
    : confirmDelete(s, b.path);
}

/** Move to Trash on `y`, or, without a trash, delete once the name is typed. */
function confirmDelete(s: AppState, from: string): Result {
  return s.panels.explorer.trash === "available"
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
  // The settings and keymap pickers and the PDF view handle their own prompts.
  if (
    p.setting !== undefined ||
    p.binding !== undefined ||
    p.pdfNote !== undefined
  )
    return none(s);
  if (p.kind === "confirm")
    return key === "y" ? explorerOp(closed, p.op, now) : none(closed);
  if (key === "<CR>") return submit(closed, p, now);
  const f = typed(p, key);
  if (f === undefined) return none(s);
  if (f.value === p.value) return none(movedCaret(s, f.caret));
  const edited = { ...p, ...f };
  const prompt =
    p.op.kind === "rename" || p.op.kind === "move"
      ? promptImpact(s, edited)
      : edited;
  return none({ ...s, overlay: { kind: "prompt", prompt } });
}

/** A text prompt's field after `key`; `undefined` when the key does not edit it. */
export const typed = (p: PromptState, key: string): LineField | undefined =>
  editField(promptField(p), key);

/** The open prompt with its caret at `caret`, the value unchanged. */
export function movedCaret(s: AppState, caret: number): AppState {
  return s.overlay.kind === "prompt"
    ? {
        ...s,
        overlay: { kind: "prompt", prompt: { ...s.overlay.prompt, caret } },
      }
    : s;
}

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
  const f = typed(p, key);
  if (f === undefined) return none(s);
  if (f.value === p.value) return none(movedCaret(s, f.caret));
  const { value, caret } = f;
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
    caret,
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
    if (invalid !== undefined)
      return none({
        ...s,
        overlay: { kind: "prompt", prompt: { ...p, invalid } },
      });
    const closed: AppState = { ...s, overlay: { kind: "none" } };
    const path = newNotePath(p.value);
    const row = "row" in p ? p.row : undefined;
    return row === undefined
      ? submitNewNote(closed, path, now, reg)
      : submitNewRow(closed, path, row, now);
  }
  const f = typed(p, key);
  if (f === undefined) return none(s);
  if (f.value === p.value) return none(movedCaret(s, f.caret));
  const { invalid: _, ...rest } = p;
  const invalid = newNoteTitleError(f.value);
  const prompt: PromptState =
    invalid === undefined ? { ...rest, ...f } : { ...rest, ...f, invalid };
  return none({ ...s, overlay: { kind: "prompt", prompt } });
}
