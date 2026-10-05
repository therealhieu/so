import type { BlameLine } from "../features/git/blame";
import { diffLines, type Hunk } from "../features/git/diff";
import type { IndexText } from "../features/git/index-text";
import { hunkPatch } from "../features/git/patch";
import { hunkAt, nextHunkLine, prevHunkLine } from "../features/git/signs";
import type { FileStatus, RepoHead } from "../features/git/status";
import type { Range } from "../kernel/text/pos";
import {
  activeBuffer,
  activeWindow,
  applyBufferEdits,
  listedBuffers,
  placeCursor,
  saveText,
  setBuffer,
} from "./buffers";
import type { CommandContext } from "./commands";
import { chain, clearMessage, message, none } from "./result";
import { blocked, writeBuffer } from "./save";
import type { StatusSegments } from "./status";
import type {
  Action,
  AppState,
  BufferId,
  BufferState,
  Effect,
  GitState,
  IndexEntry,
  RepoInfo,
  Result,
  StageReport,
} from "./types";

// Every git notice, in the accepted wording; `tool` is `git.tool[0]`.
const NOT_A_REPO = "not a git repository";
const BUSY = "git: another operation is running";
const NO_HUNK = "no hunk at cursor";
const STALE_INDEX = "index changed; hunks refreshed";
const BUFFER_CHANGED = "buffer changed; try again";
const hasConflicts = (path: string, tool: string) =>
  `${path} has conflicts; resolve them in ${tool}`;
const cannotSave = (path: string) => `cannot save ${path}`;
const notStaged = (path: string) => `not staged: ${path} could not be saved`;
const stagedHunk = ({ n, m, saved }: StageReport, path: string) =>
  saved ? `"${path}" written · staged hunk ${n}/${m}` : `staged hunk ${n}/${m}`;
const resetDone = (n: number, m: number) =>
  `reset hunk ${n}/${m} · buffer changed, autosave pending`;
const toolNotStarted = (path: string) =>
  `git tool not started: ${path} could not be saved`;
const openingTool = (saved: readonly string[], tool: string) =>
  saved.length === 1
    ? `"${saved[0]}" written · opening ${tool}`
    : `${saved.length} files written · opening ${tool}`;
const toolMissing = (tool: string) => `${tool} not found (git.tool)`;
const hunkOf = (n: number, m: number) => `hunk ${n}/${m}`;
const NO_NEXT = "no next hunk";
const NO_PREVIOUS = "no previous hunk";
const NOT_COMMITTED = "not committed yet";
const blameText = (b: Extract<BlameLine, { committed: true }>, now: number) =>
  `${b.author}, ${ago(now / 1000 - b.time)} · ${b.summary} (${b.sha.slice(0, 7)})`;
const firstLine = (text: string) => text.split("\n", 1)[0] ?? "";

/** No repository until discovery answers. */
export const initialGit: GitState = { repo: null, status: null, files: {} };

const tool = (s: AppState): string => s.config.git.tool[0] ?? "";

/** Quiet time before a status read, so a burst of triggers runs one. */
const REFRESH_MS = 200;

const setGit = (s: AppState, patch: Partial<GitState>): AppState => ({
  ...s,
  git: { ...s.git, ...patch },
});

/**
 * The folders whose first-level entries change on commits, checkouts, and
 * index writes: the git dir, the common dir, and the current branch's folder
 * under `refs/heads`.
 */
function watchDirs(repo: RepoInfo): string[] {
  const dirs = [repo.gitDir, repo.commonDir];
  if (repo.head.kind !== "detached") {
    const slash = repo.head.name.lastIndexOf("/");
    const folder = slash < 0 ? "" : `/${repo.head.name.slice(0, slash)}`;
    dirs.push(`${repo.commonDir}/refs/heads${folder}`);
  }
  return [...new Set(dirs)];
}

const readIndex = (repo: RepoInfo, path: string): Effect => ({
  kind: "gitReadIndex",
  repo,
  path,
  repoPath: repo.prefix + path,
});

const headRef = (h: RepoHead): string =>
  h.kind === "detached" ? h.short : h.name;

const sameHead = (a: RepoHead, b: RepoHead): boolean =>
  a.kind === b.kind && headRef(a) === headRef(b);

/** Whether the index side of a path changed between two status reads. */
const indexChanged = (
  a: FileStatus | undefined,
  b: FileStatus | undefined,
): boolean =>
  a === undefined || b === undefined
    ? a !== b
    : a.index !== b.index ||
      a.hI !== b.hI ||
      a.conflict !== b.conflict ||
      a.untracked !== b.untracked;

/** Start (or restart) the coalescing refresh timer; nothing outside a repository. */
export function requestRefresh(s: AppState): Result {
  return s.git.repo === null
    ? none(s)
    : {
        state: s,
        effects: [{ kind: "startTimer", id: "gitRefresh", ms: REFRESH_MS }],
      };
}

/**
 * Discovery answered. A new answer starts over: no status, no files, and no
 * pending operation. The open buffers are read again by `syncGitFiles`.
 */
export function onGitDetected(
  s: AppState,
  a: Extract<Action, { type: "gitDetected" }>,
): Result {
  const st: AppState = { ...s, git: { ...initialGit, repo: a.repo } };
  const noticed =
    a.notice === undefined ? none(st) : message(st, a.notice, "warn");
  if (a.repo === null) return noticed;
  return {
    state: noticed.state,
    effects: [
      { kind: "gitWatch", dirs: watchDirs(a.repo) },
      ...requestRefresh(noticed.state).effects,
    ],
  };
}

export function onGitRefreshTimer(s: AppState): Result {
  const repo = s.git.repo;
  return repo === null
    ? none(s)
    : { state: s, effects: [{ kind: "gitStatus", repo, prefix: repo.prefix }] };
}

/**
 * A status read. The head and operation follow it, a new head moves the
 * watch, and each open file whose index side changed is read again. A result
 * that arrives outside a repository, or a failed read, changes nothing.
 */
export function onGitStatus(
  s: AppState,
  a: Extract<Action, { type: "gitStatus" }>,
): Result {
  const repo = s.git.repo;
  if (repo === null || !a.result.ok) return none(s);
  const status = a.result.status;
  const { op: _, ...rest } = repo;
  const next: RepoInfo = {
    ...rest,
    head: status.head,
    ...(status.op === undefined ? {} : { op: status.op }),
  };
  const effects: Effect[] = [];
  if (!sameHead(repo.head, status.head))
    effects.push({ kind: "gitWatch", dirs: watchDirs(next) });
  const prev = s.git.status;
  if (prev !== null)
    for (const path of Object.keys(s.git.files))
      if (indexChanged(prev.files.get(path), status.files.get(path)))
        effects.push(readIndex(next, path));
  return { state: setGit(s, { repo: next, status }), effects };
}

/** The git tool ended: buffers and git state may have changed on disk. */
export function onToolExited(
  s: AppState,
  a: Extract<Action, { type: "toolExited" }>,
): Result {
  if (a.result.kind === "missing")
    return message(s, toolMissing(a.result.tool), "error");
  // The pre-launch message no longer applies. Reading every buffer back
  // reloads the clean ones a checkout changed; the save gate left none dirty.
  const st = clearMessage(s);
  const repo = st.git.repo;
  return {
    state: st,
    effects: [
      ...requestRefresh(st).effects,
      ...Object.values(st.buffers).map(
        (b): Effect => ({
          kind: "read",
          path: b.path,
        }),
      ),
      ...(repo === null
        ? []
        : Object.keys(st.git.files).map((path) => readIndex(repo, path))),
    ],
  };
}

/** An index read for an open file: keep the entry and diff against it now. */
export function onGitIndexRead(
  s: AppState,
  a: Extract<Action, { type: "gitIndexRead" }>,
): Result {
  const tracked = s.git.files[a.path];
  const b = listedBuffers(s).find((x) => x.path === a.path);
  if (
    s.git.repo === null ||
    a.entry.kind === "failed" ||
    tracked === undefined ||
    b === undefined
  )
    return none(s);
  const index = a.entry;
  return none(
    setGit(s, {
      files: {
        ...s.git.files,
        [a.path]: { index, hunks: hunksFor(index, b) },
      },
    }),
  );
}

/** The quiet period after an edit ended: diff the buffer against its index entry. */
export function onGitDiffTimer(s: AppState, id: BufferId): Result {
  const b = s.buffers[id];
  const f = b && s.git.files[b.path];
  if (s.git.repo === null || b === undefined || f?.index === undefined)
    return none(s);
  return none(
    setGit(s, {
      files: {
        ...s.git.files,
        [b.path]: { ...f, hunks: hunksFor(f.index, b) },
      },
    }),
  );
}

/**
 * Keep `files` to the open listed buffers inside a repository: a buffer that
 * appears (opened, or renamed to a new path) gets an entry and an index
 * read, and one that went away loses its entry in the same transition.
 */
export function syncGitFiles(prev: AppState, r: Result): Result {
  if (prev.buffers === r.state.buffers && prev.git === r.state.git) return r;
  const s = dropClosed(r.state);
  const repo = s.git.repo;
  const open = new Set(
    repo === null ? [] : listedBuffers(s).map((b) => b.path),
  );
  const reads: Effect[] = [];
  let files: GitState["files"] | undefined;
  for (const path of open)
    if (repo !== null && s.git.files[path] === undefined) {
      files ??= { ...s.git.files };
      files[path] = { hunks: [] };
      reads.push(readIndex(repo, path));
    }
  for (const path of Object.keys(s.git.files))
    if (!open.has(path)) {
      files ??= { ...s.git.files };
      delete files[path];
    }
  const state = files === undefined ? s : setGit(s, { files });
  return state === r.state ? r : { state, effects: [...r.effects, ...reads] };
}

/**
 * A closed buffer cancels the pending operation waiting on it and closes
 * the hunk float showing it.
 */
function dropClosed(s: AppState): AppState {
  const gone = (id: BufferId) => s.buffers[id] === undefined;
  const p = s.git.pending;
  const ids =
    p === undefined
      ? []
      : p.op === "stage"
        ? [p.bufferId, ...p.waiting]
        : p.waiting;
  const st = ids.some(gone) ? withoutPending(s) : s;
  return st.overlay.kind === "gitHunk" && gone(st.overlay.bufferId)
    ? { ...st, overlay: { kind: "none" } }
    : st;
}

const withoutPending = (s: AppState): AppState => {
  const { pending: _, ...git } = s.git;
  return { ...s, git };
};

/** The buffer's edits cannot be written: `writeBuffer` would do nothing. */
const unwritable = (s: AppState, b: BufferState): boolean =>
  blocked(s, b) || (b.dirty && b.readOnly === true);

const conflicted = (s: AppState, path: string): boolean => {
  const entry = s.git.files[path]?.index;
  return (
    (entry?.kind === "tracked" && entry.conflicted) ||
    s.git.status?.files.get(path)?.conflict === true
  );
};

/** The buffer's hunks now, not the debounced copy a command could act on stale. */
function currentHunks(s: AppState, b: BufferState): Hunk[] {
  const entry = s.git.files[b.path]?.index;
  return entry === undefined ? [] : hunksFor(entry, b);
}

/** The hunk at `line` and its position among `hunks`. */
function hunkIndexAt(hunks: readonly Hunk[], line: number): number {
  const h = hunkAt(hunks, line);
  return h === undefined ? -1 : hunks.indexOf(h);
}

/** The active editor's buffer and cursor line. */
function atCursor(s: AppState): { b: BufferState; line: number } | undefined {
  const w = activeWindow(s);
  const b = activeBuffer(s);
  return w === undefined || b === undefined
    ? undefined
    : { b, line: w.content.cursor.line };
}

/**
 * `<leader>ghs`: stage the hunk at the cursor. A dirty buffer is saved
 * first, and the hunk is staged from the saved text; a conflicted file is
 * never staged.
 */
export function stageHunk(ctx: CommandContext): Result {
  const s = ctx.state;
  if (s.git.repo === null) return message(s, NOT_A_REPO);
  if (s.git.pending !== undefined) return message(s, BUSY);
  const at = atCursor(s);
  if (at === undefined || hunkIndexAt(currentHunks(s, at.b), at.line) < 0)
    return message(s, NO_HUNK);
  const { b, line } = at;
  if (conflicted(s, b.path))
    return message(s, hasConflicts(b.path, tool(s)), "error");
  if (unwritable(s, b)) return message(s, cannotSave(b.path), "error");
  if (!b.dirty) return stageNow(s, b.id, line, false);
  const waiting = setGit(s, {
    pending: { op: "stage", bufferId: b.id, line, waiting: [b.id] },
  });
  return writeBuffer(waiting, b.id, ctx.now);
}

/** Stage the hunk at `line` of buffer `id` from its current text. */
function stageNow(
  s: AppState,
  id: BufferId,
  line: number,
  saved: boolean,
): Result {
  const repo = s.git.repo;
  const b = s.buffers[id];
  const entry = b && s.git.files[b.path]?.index;
  if (repo === null || b === undefined || entry === undefined) return none(s);
  if (conflicted(s, b.path))
    return message(s, hasConflicts(b.path, tool(s)), "error");
  const hunks = currentHunks(s, b);
  const i = hunkIndexAt(hunks, line);
  const h = hunks[i];
  if (h === undefined) return message(s, NO_HUNK);
  const tracked = entry.kind === "tracked" ? entry : undefined;
  // An untracked file is added with intent-to-add first, as an empty entry.
  const index: IndexText = tracked?.text ?? {
    lines: [],
    finalNewline: false,
    bom: false,
    eol: b.eol,
  };
  const repoPath = repo.prefix + b.path;
  const patch = hunkPatch(repoPath, tracked?.mode ?? "100644", h, index, {
    lines: lines(b),
    finalNewline: b.finalNewline,
    bom: b.bom,
  });
  return {
    state: s,
    effects: [
      {
        kind: "gitStage",
        repo,
        path: b.path,
        repoPath,
        expectedOid: tracked?.oid ?? null,
        patch,
        report: { n: i + 1, m: hunks.length, saved },
      },
    ],
  };
}

/** The stage effect answered: report it, then read the entry back and refresh. */
export function onGitStaged(
  s: AppState,
  a: Extract<Action, { type: "gitStaged" }>,
): Result {
  const repo = s.git.repo;
  if (repo === null) return none(s);
  const r =
    a.result === "ok"
      ? message(s, stagedHunk(a.report, a.path))
      : a.result === "stale"
        ? message(s, STALE_INDEX, "warn")
        : message(s, firstLine(a.result.failed), "error");
  const reads =
    s.git.files[a.path] === undefined ? [] : [readIndex(repo, a.path)];
  return {
    state: r.state,
    effects: [...reads, ...requestRefresh(r.state).effects],
  };
}

/**
 * `<leader>ghr`: put the index lines of the hunk at the cursor back into the
 * buffer as one undo step. No git process runs; the normal save path writes
 * it. The final newline and BOM follow the index when the hunk reaches them;
 * they are not part of undo. An untracked file has nothing to reset to.
 */
export function resetHunk(ctx: CommandContext): Result {
  const s = ctx.state;
  if (s.git.repo === null) return message(s, NOT_A_REPO);
  const at = atCursor(s);
  const entry = at && s.git.files[at.b.path]?.index;
  if (at === undefined || entry?.kind !== "tracked") return message(s, NO_HUNK);
  const { b } = at;
  const hunks = currentHunks(s, b);
  const i = hunkIndexAt(hunks, at.line);
  const h = hunks[i];
  if (h === undefined) return message(s, NO_HUNK);
  const ix = entry.text;
  const r = applyBufferEdits(
    s,
    { path: b.path, edits: [resetEdit(b, h)] },
    ctx.now,
    ctx.reg,
  );
  if (r.stale) return message(s, BUFFER_CHANGED);
  const atEnd =
    h.new.start + h.new.count >= b.text.lineCount ||
    h.old.start + h.old.count >= ix.lines.length;
  const atTop = h.new.start === 0 || h.old.start === 0;
  const flags = {
    ...(atEnd && b.finalNewline !== ix.finalNewline
      ? { finalNewline: ix.finalNewline }
      : {}),
    ...(atTop && b.bom !== ix.bom ? { bom: ix.bom } : {}),
  };
  return chain(
    { state: setBuffer(r.state, b.id, flags), effects: r.effects },
    (st) => message(st, resetDone(i + 1, hunks.length)),
  );
}

/** The span edit that replaces a hunk's buffer lines with its index lines. */
function resetEdit(
  b: BufferState,
  h: Hunk,
): { range: Range; expected: string; text: string } {
  const t = b.text;
  const end = (line: number) => ({ line, col: t.line(line).length });
  const old = h.oldLines.join("\n");
  const first = h.new.start;
  const last = h.new.start + h.new.count - 1;
  const span = (range: Range, text: string) => ({
    range,
    expected: t.slice(range),
    text,
  });
  if (h.new.count === 0)
    return first < t.lineCount
      ? span(
          { start: { line: first, col: 0 }, end: { line: first, col: 0 } },
          `${old}\n`,
        )
      : span(
          { start: end(t.lineCount - 1), end: end(t.lineCount - 1) },
          `\n${old}`,
        );
  if (h.oldLines.length > 0)
    return span({ start: { line: first, col: 0 }, end: end(last) }, old);
  // Added lines go with one line break: the one after them, else the one before.
  if (last + 1 < t.lineCount)
    return span(
      { start: { line: first, col: 0 }, end: { line: last + 1, col: 0 } },
      "",
    );
  return span(
    { start: first > 0 ? end(first - 1) : { line: 0, col: 0 }, end: end(last) },
    "",
  );
}

/**
 * A pending operation's buffer was saved. One that changed again during the
 * write is written again; when none is left waiting, the operation runs.
 */
export function advanceGitPending(
  s: AppState,
  id: BufferId,
  now: number,
): Result {
  const p = s.git.pending;
  if (p === undefined || !p.waiting.includes(id)) return none(s);
  if (s.buffers[id]?.dirty === true) return writeBuffer(s, id, now);
  const waiting = p.waiting.filter((w) => w !== id);
  if (waiting.length > 0)
    return none(setGit(s, { pending: { ...p, waiting } }));
  const st = withoutPending(s);
  return p.op === "stage"
    ? stageNow(st, p.bufferId, p.line, true)
    : runTool(st, p.saved);
}

/** A pending operation's buffer could not be saved: the operation is cancelled. */
export function cancelGitPending(s: AppState, id: BufferId): Result {
  const p = s.git.pending;
  const b = s.buffers[id];
  if (p === undefined || b === undefined || !p.waiting.includes(id))
    return none(s);
  const text = p.op === "stage" ? notStaged(b.path) : toolNotStarted(b.path);
  return message(withoutPending(s), text, "error");
}

/**
 * `<leader>gg`: hand the terminal to `git.tool` at the repository top. Every
 * dirty buffer is saved first; one that cannot be saved stops the launch.
 */
export function openTool(ctx: CommandContext): Result {
  const s = ctx.state;
  if (s.git.repo === null) return message(s, NOT_A_REPO);
  if (s.git.pending !== undefined) return message(s, BUSY);
  const dirty = Object.values(s.buffers).filter((b) => b.dirty);
  const stuck = dirty.find((b) => unwritable(s, b));
  if (stuck !== undefined)
    return message(s, toolNotStarted(stuck.path), "error");
  if (dirty.length === 0) return runTool(s, []);
  const waiting = setGit(s, {
    pending: {
      op: "tool",
      waiting: dirty.map((b) => b.id),
      saved: dirty.map((b) => b.path),
    },
  });
  return dirty.reduce(
    (r, b) => chain(r, (st) => writeBuffer(st, b.id, ctx.now)),
    none(waiting),
  );
}

/** Run the tool; when the gate saved files, say so on the frame before it starts. */
function runTool(s: AppState, saved: readonly string[]): Result {
  const repo = s.git.repo;
  if (repo === null) return none(s);
  const shown =
    saved.length === 0 ? none(s) : message(s, openingTool(saved, tool(s)));
  return {
    state: shown.state,
    effects: [{ kind: "runTool", argv: [...s.config.git.tool], cwd: repo.top }],
  };
}

const lines = (b: BufferState): string[] =>
  Array.from({ length: b.text.lineCount }, (_, i) => b.text.line(i));

/** Marks that make a final-newline or BOM difference show as a changed line. */
const EOF_MARK = "\u0000";
const BOM_MARK = "\u0001";

/**
 * The hunks between an index entry and a buffer. A final-newline difference
 * changes the last line and a BOM difference the first: the side that has
 * the newline (or BOM) gets a mark on that line, so the lines differ. That
 * side always has the line, even against a zero-byte index entry.
 */
function hunksFor(entry: IndexEntry, b: BufferState): Hunk[] {
  const cur = lines(b);
  if (entry.kind === "ignored") return [];
  if (entry.kind === "untracked")
    return diffLines([], cur, { untracked: true });
  const ix = entry.text;
  const old = [...ix.lines];
  let marked = false;
  if (ix.finalNewline !== b.finalNewline) {
    const side = ix.finalNewline ? old : cur;
    side[side.length - 1] = `${side[side.length - 1] ?? ""}${EOF_MARK}`;
    marked = true;
  }
  if (ix.bom !== b.bom) {
    const side = ix.bom ? old : cur;
    side[0] = `${BOM_MARK}${side[0] ?? ""}`;
    marked = true;
  }
  const hunks = diffLines(old, cur);
  return marked
    ? hunks.map((h) => ({
        ...h,
        oldLines: ix.lines.slice(h.old.start, h.old.start + h.old.count),
      }))
    : hunks;
}

/** The first line a hunk marks, where navigation puts the cursor. */
const startOf = (h: Hunk): number | undefined => nextHunkLine([h], -1);

/** `]h` and `[h`: move to the next or previous hunk's first line, stopping at the ends. */
export function gotoHunk(ctx: CommandContext, dir: 1 | -1): Result {
  const s = ctx.state;
  if (s.git.repo === null) return message(s, NOT_A_REPO);
  const at = atCursor(s);
  const hunks = at === undefined ? [] : currentHunks(s, at.b);
  const line = at?.line ?? 0;
  const target =
    dir > 0 ? nextHunkLine(hunks, line) : prevHunkLine(hunks, line);
  if (target === undefined) return message(s, dir > 0 ? NO_NEXT : NO_PREVIOUS);
  const n = hunks.findIndex((h) => startOf(h) === target) + 1;
  return message(
    placeCursor(s, { line: target, col: 0 }),
    hunkOf(n, hunks.length),
  );
}

/** `<leader>ghp`: show the hunk at the cursor in a float, with fresh hunks kept. */
export function previewHunk(ctx: CommandContext): Result {
  const s = ctx.state;
  if (s.git.repo === null) return message(s, NOT_A_REPO);
  const at = atCursor(s);
  const f = at && s.git.files[at.b.path];
  if (at === undefined || f === undefined) return message(s, NO_HUNK);
  const hunks = currentHunks(s, at.b);
  const hunk = hunkAt(hunks, at.line);
  if (hunk === undefined) return message(s, NO_HUNK);
  const st = setGit(s, {
    files: { ...s.git.files, [at.b.path]: { ...f, hunks } },
  });
  return none({ ...st, overlay: { kind: "gitHunk", bufferId: at.b.id, hunk } });
}

/**
 * `<leader>ghb`: who last changed the cursor line, blamed against the
 * unsaved buffer. A file with no commit to blame answers without git.
 */
export function blameLine(ctx: CommandContext): Result {
  const s = ctx.state;
  const repo = s.git.repo;
  if (repo === null) return message(s, NOT_A_REPO);
  const at = atCursor(s);
  if (at === undefined) return message(s, NOT_COMMITTED);
  const entry = s.git.files[at.b.path]?.index;
  if (
    repo.head.kind === "unborn" ||
    entry?.kind === "untracked" ||
    entry?.kind === "ignored" ||
    s.git.status?.files.get(at.b.path)?.index === "A"
  )
    return message(s, NOT_COMMITTED);
  return {
    state: s,
    effects: [
      {
        kind: "gitBlame",
        repo,
        path: at.b.path,
        repoPath: repo.prefix + at.b.path,
        line: at.line,
        contents: saveText(at.b),
      },
    ],
  };
}

export function onGitBlamed(
  s: AppState,
  a: Extract<Action, { type: "gitBlamed" }>,
): Result {
  if (s.git.repo === null) return none(s);
  const r = a.result;
  if ("failed" in r) return message(s, firstLine(r.failed), "error");
  return message(s, r.committed ? blameText(r, a.now) : NOT_COMMITTED);
}

const DAY = 86_400;

/** How long ago, in the accepted buckets: just now, minutes, hours, days, months, years. */
function ago(seconds: number): string {
  const unit = (n: number, name: string) =>
    `${n} ${name}${n === 1 ? "" : "s"} ago`;
  if (seconds < 60) return "just now";
  if (seconds < 3600) return unit(Math.floor(seconds / 60), "minute");
  if (seconds < DAY) return unit(Math.floor(seconds / 3600), "hour");
  const days = Math.floor(seconds / DAY);
  if (days < 30) return unit(days, "day");
  if (days < 365) return unit(Math.floor(days / 30), "month");
  return unit(Math.floor(days / 365), "year");
}

/**
 * The statusline's git fields for the active buffer: the ref, any
 * operation in progress, and gitsigns' summary of its hunks. A file with no
 * index base, untracked or in a repository with no commit yet, counts 0.
 */
export function gitSegment(s: AppState, b: BufferState): StatusSegments["git"] {
  const repo = s.git.repo;
  if (repo === null) return undefined;
  const counts = { added: 0, changed: 0, removed: 0 };
  if (repo.head.kind !== "unborn")
    for (const h of s.git.files[b.path]?.hunks ?? []) {
      if (h.kind === "untracked") continue;
      const same = Math.min(h.old.count, h.new.count);
      counts.changed += same;
      counts.added += h.new.count - same;
      counts.removed += h.old.count - same;
    }
  return {
    ref: headRef(repo.head),
    ...(repo.op === undefined ? {} : { op: repo.op }),
    ...counts,
  };
}
