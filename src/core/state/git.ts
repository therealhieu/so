import { diffLines, type Hunk } from "../features/git/diff";
import type { FileStatus, RepoHead } from "../features/git/status";
import { listedBuffers } from "./buffers";
import { message, none } from "./result";
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
} from "./types";

/** No repository until discovery answers. */
export const initialGit: GitState = { repo: null, status: null, files: {} };

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
  const s = r.state;
  if (prev.buffers === s.buffers && prev.git === s.git) return r;
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
    ? r
    : { state: setGit(s, { files }), effects: [...r.effects, ...reads] };
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
