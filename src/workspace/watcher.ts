import { watch } from "node:fs";
import { lstat } from "node:fs/promises";
import { join } from "node:path";
import type { FileEvent, Stamp } from "../core/state/types";
import { sameStamp, stampOfFile } from "./fs";

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
 * is still reported; a move carries those stamps to the new paths, so an echo
 * that arrives late is still silent. Own moves and removals match by path prefix for 1 s,
 * which absorbs per-child re-reports and replays. A move also covers the
 * folders above its target by exact path, since it may have created them.
 */
export function createOwnOps(clock = () => performance.now()): OwnOps {
  const writes = new Map<string, Stamp>();
  let paths: { path: string; exact: boolean; until: number }[] = [];
  const notePath = (path: string, exact = false) => {
    const now = clock();
    paths = paths.filter((x) => x.until > now);
    paths.push({ path, exact, until: now + PATH_WINDOW_MS });
  };
  return {
    noteWrite: (p, s) => writes.set(p, s),
    noteMove: (from, to) => {
      for (const [p, s] of [...writes])
        if (within(p, from)) {
          writes.delete(p);
          writes.set(to + p.slice(from.length), s);
        }
      notePath(from);
      notePath(to);
      const parts = to.split("/");
      for (let i = 1; i < parts.length; i++)
        notePath(parts.slice(0, i).join("/"), true);
    },
    noteRemove: (p) => notePath(p),
    isOwn: (p, s) =>
      (s !== undefined && sameStamp(writes.get(p), s)) ||
      paths.some(
        (x) =>
          x.until > clock() && (x.exact ? p === x.path : within(p, x.path)),
      ),
  };
}

/**
 * Watch `root` recursively. Events are debounced per path and classified by
 * `lstat` alone (event types are unreliable); symlinks are never followed.
 * Paths `isExcluded` rejects, asked per event, and `so`'s own operations are
 * dropped. Returns `stop`.
 */
export function watchWorkspace(
  root: string,
  own: OwnOps,
  isExcluded: (rel: string) => boolean,
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
    if (!name || isExcluded(name)) return;
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
