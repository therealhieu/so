/** One porcelain v2 status letter: ".", "M", "A", "D", "R", "C", "T", "U", or "?". */
type Code = string;

export type RepoHead =
  | { kind: "branch" | "unborn"; name: string }
  | { kind: "detached"; short: string };

export type FileStatus = {
  index: Code;
  worktree: Code;
  conflict: boolean;
  untracked: boolean;
  submodule: boolean;
  /** The index blob id, when the entry has one stage. */
  hI?: string;
};

/** Workspace-scoped file states and branch info from one status call. */
export type RepoStatus = {
  head: RepoHead;
  op?: "rebasing" | "merging";
  /** Keyed by workspace-relative path. */
  files: Map<string, FileStatus>;
};

export type Marker =
  | "modified"
  | "staged"
  | "untracked"
  | "conflict"
  | "contains";

/** How many space-separated fields come between each record kind and its path. */
const FIELDS = { "1": 7, "2": 8, u: 9, "?": 0 } as const;

/**
 * Parse `git status --porcelain=v2 -z --branch` output, keeping only paths
 * under `prefix` (the workspace's repo-relative folder, "" at the top), with
 * the prefix stripped. A rename's origin under the prefix reads as deleted.
 */
export function parseStatus(z: string, prefix: string): RepoStatus {
  const files = new Map<string, FileStatus>();
  const local = (path: string) =>
    path.startsWith(prefix) ? path.slice(prefix.length) : undefined;
  let oid = "";
  let branch = "";
  const records = z.split("\0");
  for (let r = 0; r < records.length; r++) {
    const rec = records[r] ?? "";
    if (rec.startsWith("# branch.oid ")) oid = rec.slice(13);
    else if (rec.startsWith("# branch.head ")) branch = rec.slice(14);
    const kind = rec.slice(0, 1);
    if (!(kind in FIELDS) || rec[1] !== " ") continue;
    const fields = splitFields(rec, FIELDS[kind as keyof typeof FIELDS]);
    const path = local(fields.path);
    if (kind === "2") {
      const orig = local(records[++r] ?? "");
      if (orig !== undefined && !files.has(orig))
        files.set(orig, {
          index: "D",
          worktree: ".",
          conflict: false,
          untracked: false,
          submodule: false,
        });
    }
    if (path === undefined) continue;
    if (kind === "?") {
      files.set(path, {
        index: "?",
        worktree: "?",
        conflict: false,
        untracked: true,
        submodule: false,
      });
      continue;
    }
    const [xy = "..", sub = "N..."] = fields.head;
    const hI = kind === "u" ? undefined : fields.head[6];
    files.set(path, {
      index: xy.slice(0, 1),
      worktree: xy.slice(1, 2),
      conflict: kind === "u",
      untracked: false,
      submodule: sub.startsWith("S"),
      ...(hI !== undefined && { hI }),
    });
  }
  const head: RepoHead =
    branch === "(detached)"
      ? { kind: "detached", short: oid.slice(0, 7) }
      : { kind: oid === "(initial)" ? "unborn" : "branch", name: branch };
  return { head, files };
}

/** The first `n` fields after the record kind, then the rest as the path. */
function splitFields(rec: string, n: number): { head: string[]; path: string } {
  const head: string[] = [];
  let at = 2;
  for (let i = 0; i < n; i++) {
    const space = rec.indexOf(" ", at);
    if (space < 0) break;
    head.push(rec.slice(at, space));
    at = space + 1;
  }
  return { head, path: rec.slice(at) };
}

const markerCache = new WeakMap<RepoStatus, ReadonlyMap<string, Marker>>();

/**
 * One marker per explorer row: conflict > untracked > modified > staged on
 * files, and `contains` on every folder above a changed path. A deleted file
 * has no row, so it only marks its folders.
 */
export function explorerMarkers(st: RepoStatus): ReadonlyMap<string, Marker> {
  const cached = markerCache.get(st);
  if (cached !== undefined) return cached;
  const own = new Map<string, Marker>();
  const folders = new Set<string>();
  for (const [path, f] of st.files) {
    for (let i = path.indexOf("/"); i >= 0; i = path.indexOf("/", i + 1))
      folders.add(path.slice(0, i));
    const marker = markerOf(f);
    if (marker !== undefined) own.set(path, marker);
  }
  const out = new Map<string, Marker>();
  for (const dir of folders) if (!own.has(dir)) out.set(dir, "contains");
  for (const [path, m] of own) out.set(path, m);
  markerCache.set(st, out);
  return out;
}

function markerOf(f: FileStatus): Marker | undefined {
  if (f.conflict) return "conflict";
  if (f.untracked) return "untracked";
  if (f.index === "D" || f.worktree === "D") return undefined;
  if (f.worktree !== ".") return "modified";
  if (f.index !== ".") return "staged";
  return undefined;
}
