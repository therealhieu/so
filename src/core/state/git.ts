import { diffLines, type Hunk } from "../features/git/diff";
import type { IndexText } from "../features/git/index-text";
import { hunkPatch } from "../features/git/patch";
import { hunkAt } from "../features/git/signs";
import type { FileStatus, RepoHead } from "../features/git/status";
import type { Range } from "../kernel/text/pos";
import {
  activeBuffer,
  activeWindow,
  applyBufferEdits,
  listedBuffers,
  setBuffer,
} from "./buffers";
import type { CommandContext } from "./commands";
import { chain, message, none } from "./result";
import { blocked, writeBuffer } from "./save";
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
  _a: Extract<Action, { type: "toolExited" }>,
): Result {
  return requestRefresh(s);
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
  const s = dropClosedPending(r.state);
  const repo = s.git.repo;
  if (repo === null)
    return Object.keys(s.git.files).length === 0
      ? r
      : { ...r, state: setGit(s, { files: {} }) };
  const open = new Set(listedBuffers(s).map((b) => b.path));
  const reads: Effect[] = [];
  let files: GitState["files"] | undefined;
  for (const path of open)
    if (s.git.files[path] === undefined) {
      files ??= { ...s.git.files };
      files[path] = { hunks: [] };
      reads.push(readIndex(repo, path));
    }
  for (const path of Object.keys(s.git.files))
    if (!open.has(path)) {
      files ??= { ...s.git.files };
      delete files[path];
    }
  return files === undefined
    ? s === r.state
      ? r
      : { ...r, state: s }
    : { state: setGit(s, { files }), effects: [...r.effects, ...reads] };
}

/** A pending operation waiting on a buffer that was closed is cancelled. */
function dropClosedPending(s: AppState): AppState {
  const p = s.git.pending;
  if (p === undefined) return s;
  const ids = p.op === "stage" ? [p.bufferId, ...p.waiting] : p.waiting;
  if (ids.every((id) => s.buffers[id] !== undefined)) return s;
  const { pending: _, ...git } = s.git;
  return { ...s, git };
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
  return p.op === "stage" ? stageNow(st, p.bufferId, p.line, true) : none(st);
}

/** A pending operation's buffer could not be saved: the operation is cancelled. */
export function cancelGitPending(s: AppState, id: BufferId): Result {
  const p = s.git.pending;
  const b = s.buffers[id];
  if (p === undefined || b === undefined || !p.waiting.includes(id))
    return none(s);
  return message(withoutPending(s), notStaged(b.path), "error");
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
