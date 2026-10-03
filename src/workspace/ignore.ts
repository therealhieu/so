import { join } from "node:path";
import ignore, { type Ignore } from "ignore";

/** Decides which workspace entries the explorer, the watcher, and search skip. */
export type ExclusionMatcher = {
  /** `rel` is workspace-relative; `isDir` enables directory-only patterns. */
  isExcluded(rel: string, isDir: boolean): boolean;
  /** For paths of unknown kind: excluded when any folder above it, or the path as a file, is. */
  isExcludedPath(rel: string): boolean;
};

/** Dot entries and `node_modules` are never shown. */
const ALWAYS_HIDDEN = (name: string): boolean =>
  name.startsWith(".") || name === "node_modules";

/**
 * Hidden names plus nested `.gitignore` files with git precedence: each file
 * tests paths relative to its own folder, scopes apply root first, and a
 * deeper decisive result wins. `read` returns a file's text or null.
 */
export function createExclusionMatcher(
  root: string,
  read: (path: string) => string | null,
): ExclusionMatcher {
  const scopes = new Map<string, Ignore | null>();
  const scope = (dir: string): Ignore | null => {
    const cached = scopes.get(dir);
    if (cached !== undefined) return cached;
    const text = read(join(root, dir, ".gitignore"));
    const loaded = text === null ? null : ignore().add(text);
    scopes.set(dir, loaded);
    return loaded;
  };

  const isExcluded = (rel: string, isDir: boolean): boolean => {
    const parts = rel.split("/");
    if (parts.some(ALWAYS_HIDDEN)) return true;
    let ignored = false;
    for (let i = 0; i < parts.length; i++) {
      const dir = parts.slice(0, i).join("/");
      const sub = parts.slice(i).join("/") + (isDir ? "/" : "");
      const r = scope(dir)?.test(sub);
      if (r?.ignored) ignored = true;
      else if (r?.unignored) ignored = false;
    }
    return ignored;
  };

  return {
    isExcluded,
    isExcludedPath(rel) {
      const parts = rel.split("/");
      for (let i = 1; i < parts.length; i++)
        if (isExcluded(parts.slice(0, i).join("/"), true)) return true;
      return isExcluded(rel, false);
    },
  };
}
