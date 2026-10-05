import { type FSWatcher, watch } from "node:fs";
import type { Logger } from "./log";

/** Watches the first level of a set of folders; `retarget` swaps the set. */
export type GitWatcher = {
  retarget(dirs: string[]): void;
  stop(): void;
};

/** Names Git writes on every command without changing a ref or the index. */
export const IGNORED_NAME =
  /(^|\/)(index\.lock|.*\.lock|\.watchman-cookie.*|COMMIT_EDITMSG)$/;

/**
 * Watch the first-level entries of each folder in `dirs`, without recursion,
 * and call `onChange` once per event that is not a lock, cookie, or commit
 * message. A folder that cannot be watched is logged and skipped. There is no
 * debounce: callers coalesce.
 */
export function watchGitDirs(
  dirs: string[],
  onChange: () => void,
  logger: Logger,
  watchFn: typeof watch = watch,
): GitWatcher {
  const open = new Map<string, FSWatcher>();

  const close = (dir: string) => {
    open.get(dir)?.close();
    open.delete(dir);
  };

  const start = (dir: string) => {
    try {
      const w = watchFn(dir, { recursive: false }, (_type, name) => {
        if (open.get(dir) !== w || IGNORED_NAME.test(name ?? "")) return;
        onChange();
      });
      w.on("error", (x) => {
        logger.error("git.watch.fail", { dir, reason: String(x) });
        if (open.get(dir) === w) close(dir);
      });
      open.set(dir, w);
    } catch (x) {
      logger.error("git.watch.fail", { dir, reason: String(x) });
    }
  };

  const retarget = (next: string[]) => {
    const want = new Set(next);
    for (const dir of [...open.keys()]) if (!want.has(dir)) close(dir);
    for (const dir of want) if (!open.has(dir)) start(dir);
  };

  retarget(dirs);
  return {
    retarget,
    stop: () => {
      for (const dir of [...open.keys()]) close(dir);
    },
  };
}
