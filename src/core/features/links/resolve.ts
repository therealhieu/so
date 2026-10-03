import type { NoteIndex } from "./note-index";

export type LinkTarget = { path: string; heading?: string[]; block?: string };

const dirname = (path: string) => path.slice(0, path.lastIndexOf("/") + 1);
const depth = (path: string) => path.split("/").length;
const stripMd = (path: string) => path.replace(/\.md$/i, "");

/** The `byBasename` key of a path or link target: the lowercased file name, `.md` dropped. */
export const nameKey = (path: string): string =>
  stripMd(path.slice(path.lastIndexOf("/") + 1)).toLowerCase();

/** True when `path` ends with the folders of `target` ("b/plan" matches "x/b/plan.md"). */
function suffixMatches(path: string, target: string): boolean {
  if (!target.includes("/")) return true;
  const p = stripMd(path).toLowerCase();
  const t = stripMd(target).toLowerCase();
  return p === t || p.endsWith(`/${t}`);
}

/** An exact vault-root path, with or without `.md`. */
function rootPath(ix: NoteIndex, target: string): string | undefined {
  const t = target.startsWith("/") ? target.slice(1) : target;
  const candidates = /\.md$/i.test(t) ? [t] : [`${t}.md`, t];
  return candidates.find((p) => ix.files.has(p));
}

/**
 * Alias and file-name candidates ranked by: same folder as `from`, then alias
 * before file name, then fewest folders, then alphabetical.
 */
function bestCandidate(
  ix: NoteIndex,
  from: string,
  target: string,
): string | undefined {
  const lower = target.toLowerCase();
  const aliases = new Set(
    target.includes("/") ? [] : (ix.byAlias.get(lower) ?? []),
  );
  const names = (ix.byBasename.get(nameKey(target)) ?? []).filter((p) =>
    suffixMatches(p, target),
  );
  const folder = dirname(from);
  const rank = (p: string) =>
    [dirname(p) === folder ? 0 : 1, aliases.has(p) ? 0 : 1, depth(p)] as const;
  let best: string | undefined;
  for (const p of new Set([...aliases, ...names])) {
    if (best === undefined) {
      best = p;
      continue;
    }
    const [a, b] = [rank(p), rank(best)];
    const order = a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
    if (order < 0 || (order === 0 && p < best)) best = p;
  }
  return best;
}

/** The file `target` names from note `from`; an empty target is the note itself. */
export function resolvePath(
  ix: NoteIndex,
  from: string,
  target: string,
): string | undefined {
  if (target === "") return from;
  return rootPath(ix, target) ?? bestCandidate(ix, from, target);
}

function subpathOf(subpath: string | undefined) {
  if (subpath === undefined || subpath === "" || subpath === "#") return {};
  if (subpath.startsWith("#^")) return { block: subpath.slice(2) };
  return {
    heading: subpath
      .split("#")
      .map((h) => h.trim())
      .filter((h) => h !== ""),
  };
}

/** order: exact root path (with/without .md) → alias → basename candidates ranked by same folder as `from`, shortest path, alphabetical. */
export function resolveLink(
  ix: NoteIndex,
  from: string,
  ref: { target: string; subpath?: string },
): LinkTarget | { unresolved: string } {
  const path = resolvePath(ix, from, ref.target);
  return path === undefined
    ? { unresolved: ref.target }
    : { path, ...subpathOf(ref.subpath) };
}
