import { watch } from "node:fs";
import { lstat } from "node:fs/promises";
import { join } from "node:path";
import type { FileEvent, Stamp } from "../core/state/types";
import { sameStamp, stampOfFile } from "./fs";
import type { ExclusionMatcher } from "./ignore";

/** What `so` itself did on disk, so the watcher can drop the echoes. Paths are workspace-relative. */
export type OwnOps = {
  noteWrite(path: string, stamp: Stamp): void;
  noteMove(from: string, to: string): void;
  noteRemove(path: string): void;
  isOwn(path: string, stamp?: Stamp): boolean;
};

const PATH_WINDOW_MS = 1000;
const DEBOUNCE_MS = 50;

const within = (path: string, prefix: string) =>
  path === prefix || path.startsWith(`${prefix}/`);

/**
 * Own writes match by exact stamp, so a later external edit of the same file
 * is still reported. Own moves and removals match by path prefix for 1 s,
 * which absorbs per-child re-reports and replays.
 */
export function createOwnOps(clock = () => performance.now()): OwnOps {
  const writes = new Map<string, Stamp>();
  let paths: { prefix: string; until: number }[] = [];
  const notePath = (prefix: string) => {
    const now = clock();
    paths = paths.filter((x) => x.until > now);
    paths.push({ prefix, until: now + PATH_WINDOW_MS });
  };
  return {
    noteWrite: (p, s) => writes.set(p, s),
    noteMove: (from, to) => {
      notePath(from);
      notePath(to);
    },
    noteRemove: notePath,
    isOwn: (p, s) =>
      (s !== undefined && sameStamp(writes.get(p), s)) ||
      paths.some((x) => x.until > clock() && within(p, x.prefix)),
  };
}

/**
 * Watch `root` recursively. Events are debounced per path and classified by
 * `lstat` alone (event types are unreliable); symlinks are never followed.
 * Excluded paths and `so`'s own operations are dropped. Returns `stop`.
 */
export function watchWorkspace(
  root: string,
  own: OwnOps,
  matcher: ExclusionMatcher,
  emit: (e: FileEvent) => void,
): () => void {
  const timers = new Map<string, Timer>();
  let stopped = false;

  async function classify(rel: string) {
    timers.delete(rel);
    const abs = join(root, rel);
    const st = await lstat(abs).catch(() => null);
    if (stopped) return;
    if (st === null) {
      if (!own.isOwn(rel)) emit({ kind: "removed", path: rel });
      return;
    }
    const stamp = st.isFile()
      ? await stampOfFile(abs, st).catch(() => undefined)
      : undefined;
    if (stopped || own.isOwn(rel, stamp)) return;
    emit({ kind: "changed", path: rel, isDir: st.isDirectory() });
  }

  const w = watch(root, { recursive: true }, (_type, name) => {
    if (!name || matcher.isExcludedPath(name)) return;
    clearTimeout(timers.get(name));
    timers.set(
      name,
      setTimeout(() => void classify(name), DEBOUNCE_MS),
    );
  });
  return () => {
    stopped = true;
    w.close();
    for (const t of timers.values()) clearTimeout(t);
    timers.clear();
  };
}
