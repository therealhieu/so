import { join } from "node:path";
import ignore, { type Ignore } from "ignore";

/**
 * What the explorer lets through besides plain entries: `dotfiles` dot
 * entries other than `.git`, `gitignored` names a `.gitignore` matches.
 */
export type Shown = { dotfiles?: boolean; gitignored?: boolean };

/** Decides which workspace entries the explorer, the watcher, and search skip. */
export type ExclusionMatcher = {
  /** `rel` is workspace-relative; `isDir` enables directory-only patterns. */
  isExcluded(rel: string, isDir: boolean, shown?: Shown): boolean;
  /** For paths of unknown kind: excluded when any folder above it, or the path as a file, is. */
  isExcludedPath(rel: string, shown?: Shown): boolean;
  /** Whether the `.gitignore` files match `rel`, ignoring the other rules. */
  isIgnored(rel: string, isDir: boolean): boolean;
};

/** Whether any segment of `rel` is one of `names`. */
export const hasNamedSegment = (
  rel: string,
  names: readonly string[],
): boolean => names.length > 0 && rel.split("/").some((p) => names.includes(p));

/** `.git` and `node_modules` are never shown. */
const NEVER_SHOWN = (name: string): boolean =>
  name === ".git" || name === "node_modules";

/** Other dot entries are shown only on request. */
const isDot = (name: string): boolean => name.startsWith(".");

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

  const isIgnored = (rel: string, isDir: boolean) => {
    const parts = rel.split("/");
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

  const isExcluded = (rel: string, isDir: boolean, shown: Shown = {}) => {
    const parts = rel.split("/");
    if (parts.some(NEVER_SHOWN)) return true;
    if (shown.dotfiles !== true && parts.some(isDot)) return true;
    return shown.gitignored !== true && isIgnored(rel, isDir);
  };

  return {
    isExcluded,
    isIgnored,
    isExcludedPath(rel, shown = {}) {
      const parts = rel.split("/");
      for (let i = 1; i < parts.length; i++)
        if (isExcluded(parts.slice(0, i).join("/"), true, shown)) return true;
      return isExcluded(rel, false, shown);
    },
  };
}
