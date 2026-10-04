import { nameKey, resolvePath } from "./resolve";
import type { LinkRef, NoteSummary } from "./summarize";

export type Backlink = { from: string; link: LinkRef };

/** Size and times of a workspace file that is not a note; times are epoch milliseconds. */
export type FileFacts = {
  path: string;
  size: number;
  mtime: number;
  ctime: number;
};

export type NoteIndex = {
  readonly summaries: ReadonlyMap<string, NoteSummary>;
  readonly files: ReadonlySet<string>;
  /** Facts of files without a summary; never a Markdown path. */
  readonly facts: ReadonlyMap<string, FileFacts>;
  /** lowercased name ("plan" for plan.md; "photo.png") → paths */
  readonly byBasename: ReadonlyMap<string, readonly string[]>;
  /** lowercased alias → notes */
  readonly byAlias: ReadonlyMap<string, readonly string[]>;
  /** lowercased tag → notes; nested tags also index their parents */
  readonly byTag: ReadonlyMap<string, readonly string[]>;
  /** link name (`nameKey` of a link target) → notes with such a link, so a new name finds the links it captures */
  readonly linkSources: ReadonlyMap<string, readonly string[]>;
  /** resolved target → links to it, by source path then position */
  readonly backlinks: ReadonlyMap<string, readonly Backlink[]>;
};

type Multi<V> = Map<string, readonly V[]>;

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const byPosition = (a: Backlink, b: Backlink) =>
  compare(a.from, b.from) ||
  a.link.line - b.link.line ||
  a.link.col - b.link.col;

const isNote = (path: string) => /\.md$/i.test(path);

/** Where `path` is, or would be inserted, in the sorted `list`. */
function sortedIndex(list: readonly string[], path: string): number {
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (compare(list[mid] as string, path) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Sorted path lists under edit. The map is a copy; a list it shares with the
 * previous index is copied once, on its first change, and edited in place
 * after that, so a batch costs its own size rather than the lists' sizes.
 */
type Lists = { map: Multi<string>; own: Set<readonly string[]> };

const editLists = (base: ReadonlyMap<string, readonly string[]>): Lists => ({
  map: new Map(base),
  own: new Set(),
});

function writable(l: Lists, key: string): string[] {
  const list = l.map.get(key) ?? [];
  if (l.own.has(list)) return list as string[];
  const copy = [...list];
  l.own.add(copy);
  l.map.set(key, copy);
  return copy;
}

function addPath(l: Lists, key: string, path: string) {
  const list = l.map.get(key) ?? [];
  const i = sortedIndex(list, path);
  if (list[i] !== path) writable(l, key).splice(i, 0, path);
}

function removePath(l: Lists, key: string, path: string) {
  const list = l.map.get(key);
  if (list === undefined) return;
  const i = sortedIndex(list, path);
  if (list[i] !== path) return;
  if (list.length === 1) l.map.delete(key);
  else writable(l, key).splice(i, 1);
}

/** Every tag with its parents: "a/b/c" → "a", "a/b", "a/b/c". */
function tagKeys(tags: readonly string[]): Set<string> {
  const keys = new Set<string>();
  for (const tag of tags) {
    const parts = tag.toLowerCase().split("/");
    for (let i = 1; i <= parts.length; i++)
      keys.add(parts.slice(0, i).join("/"));
  }
  return keys;
}

const aliasKeys = (s: NoteSummary) =>
  new Set(s.aliases.map((a) => a.toLowerCase()));
const linkKeys = (s: NoteSummary) =>
  new Set(s.links.filter((l) => l.target !== "").map((l) => nameKey(l.target)));

function linkSummary(
  maps: Record<"byAlias" | "byTag" | "linkSources", Lists>,
  s: NoteSummary,
  add: boolean,
) {
  const apply = add ? addPath : removePath;
  for (const key of aliasKeys(s)) apply(maps.byAlias, key, s.path);
  for (const key of tagKeys(s.tags)) apply(maps.byTag, key, s.path);
  for (const key of linkKeys(s)) apply(maps.linkSources, key, s.path);
}

/** The backlinks a note's links contribute, resolved against `ix`. */
function outgoing(ix: NoteIndex, s: NoteSummary): [string, Backlink][] {
  const out: [string, Backlink][] = [];
  for (const link of s.links) {
    if (link.target === "") continue;
    const path = resolvePath(ix, s.path, link.target);
    if (path !== undefined) out.push([path, { from: s.path, link }]);
  }
  return out;
}

/** A full build from scratch; incremental updates always equal it. */
export function buildIndex(
  summaries: readonly NoteSummary[],
  files: readonly string[],
  facts: readonly FileFacts[] = [],
): NoteIndex {
  const notes = summaries.filter((s) => isNote(s.path));
  const other = facts.filter((f) => !isNote(f.path));
  const all = new Set([
    ...files,
    ...notes.map((s) => s.path),
    ...other.map((f) => f.path),
  ]);
  const byBasename = editLists(new Map());
  for (const f of all) addPath(byBasename, nameKey(f), f);
  const maps = {
    byAlias: editLists(new Map()),
    byTag: editLists(new Map()),
    linkSources: editLists(new Map()),
  };
  for (const s of notes) linkSummary(maps, s, true);
  const ix: NoteIndex = {
    summaries: new Map(notes.map((s) => [s.path, s])),
    files: all,
    facts: new Map(other.map((f) => [f.path, f])),
    byBasename: byBasename.map,
    byAlias: maps.byAlias.map,
    byTag: maps.byTag.map,
    linkSources: maps.linkSources.map,
    backlinks: new Map(),
  };
  const backlinks = new Map<string, Backlink[]>();
  for (const s of ix.summaries.values())
    for (const [path, b] of outgoing(ix, s))
      backlinks.set(path, [...(backlinks.get(path) ?? []), b]);
  for (const list of backlinks.values()) list.sort(byPosition);
  return { ...ix, backlinks };
}

export const emptyIndex = (): NoteIndex => buildIndex([], []);

/**
 * Remove `remove` (files with their summaries and facts), then add `add`
 * summaries, `files`, and `facts`. Only notes whose links may resolve
 * differently are re-resolved: the changed notes, and notes linking to a name
 * whose files or aliases changed.
 */
function patch(
  ix: NoteIndex,
  remove: readonly string[],
  add: readonly NoteSummary[],
  files: readonly string[],
  facts: readonly FileFacts[] = [],
): NoteIndex {
  const added = add.filter((s) => isNote(s.path));
  const addedFacts = facts.filter((f) => !isNote(f.path));
  const newFiles = [
    ...files,
    ...added.map((s) => s.path),
    ...addedFacts.map((f) => f.path),
  ];
  const removed = remove.filter((p) => ix.files.has(p));
  const changedNotes = new Set([
    ...removed.filter((p) => ix.summaries.has(p)),
    ...added.map((s) => s.path),
  ]);

  const names = new Set<string>();
  for (const f of removed) names.add(nameKey(f));
  for (const f of newFiles) if (!ix.files.has(f)) names.add(nameKey(f));
  for (const p of changedNotes) {
    const old = ix.summaries.get(p);
    if (old !== undefined) for (const a of old.aliases) names.add(nameKey(a));
  }
  for (const s of added) for (const a of s.aliases) names.add(nameKey(a));

  const relink = new Set(changedNotes);
  for (const name of names)
    for (const p of ix.linkSources.get(name) ?? []) relink.add(p);

  const backlinks = new Map(ix.backlinks) as Multi<Backlink>;
  const dropFrom = (path: string, from: ReadonlySet<string>) => {
    const rest = (backlinks.get(path) ?? []).filter((b) => !from.has(b.from));
    if (rest.length === 0) backlinks.delete(path);
    else backlinks.set(path, rest);
  };
  const stale = new Set<string>();
  for (const p of relink) {
    const s = ix.summaries.get(p);
    if (s !== undefined) for (const [path] of outgoing(ix, s)) stale.add(path);
  }
  for (const path of stale) dropFrom(path, relink);

  const summaries = new Map(ix.summaries);
  const nextFacts = new Map(ix.facts);
  const all = new Set(ix.files);
  const byBasename = editLists(ix.byBasename);
  const maps = {
    byAlias: editLists(ix.byAlias),
    byTag: editLists(ix.byTag),
    linkSources: editLists(ix.linkSources),
  };
  for (const p of removed) {
    const old = summaries.get(p);
    if (old !== undefined) linkSummary(maps, old, false);
    summaries.delete(p);
    nextFacts.delete(p);
    all.delete(p);
    removePath(byBasename, nameKey(p), p);
  }
  for (const s of added) {
    const old = summaries.get(s.path);
    if (old !== undefined) linkSummary(maps, old, false);
    linkSummary(maps, s, true);
    summaries.set(s.path, s);
  }
  for (const f of addedFacts) nextFacts.set(f.path, f);
  for (const f of newFiles) {
    all.add(f);
    addPath(byBasename, nameKey(f), f);
  }

  const next: NoteIndex = {
    summaries,
    files: all,
    facts: nextFacts,
    byBasename: byBasename.map,
    byAlias: maps.byAlias.map,
    byTag: maps.byTag.map,
    linkSources: maps.linkSources.map,
    backlinks,
  };
  for (const p of relink) {
    const s = summaries.get(p);
    if (s === undefined) continue;
    for (const [path, b] of outgoing(next, s))
      backlinks.set(path, [...(backlinks.get(path) ?? []), b].sort(byPosition));
  }
  return next;
}

/**
 * Add or replace note summaries; `files` adds other workspace files and
 * `facts` adds or replaces their facts. Only `.md` paths have summaries, and
 * only other paths have facts.
 */
export function applySummaries(
  ix: NoteIndex,
  summaries: readonly NoteSummary[],
  files: readonly string[] = [],
  facts: readonly FileFacts[] = [],
): NoteIndex {
  return patch(ix, [], summaries, files, facts);
}

/** Paths at or below `root` (a file, or a folder without a trailing "/"). */
const under = (ix: NoteIndex, root: string) =>
  [...ix.files].filter((f) => f === root || f.startsWith(`${root}/`));

/** Remove files, or whole folders, with their summaries. */
export function removePaths(
  ix: NoteIndex,
  paths: readonly string[],
): NoteIndex {
  return patch(ix, [...new Set(paths.flatMap((p) => under(ix, p)))], [], []);
}

/** Rename or move files or folders; summaries follow their notes. */
export function movePaths(
  ix: NoteIndex,
  moves: readonly { from: string; to: string }[],
): NoteIndex {
  const mapping = new Map<string, string>();
  for (const { from, to } of moves)
    for (const f of under(ix, from)) mapping.set(f, to + f.slice(from.length));
  const summaries: NoteSummary[] = [];
  const files: string[] = [];
  const facts: FileFacts[] = [];
  for (const [from, to] of mapping) {
    const s = ix.summaries.get(from);
    const f = ix.facts.get(from);
    if (s !== undefined) summaries.push({ ...s, path: to });
    else if (f !== undefined && !isNote(to)) facts.push({ ...f, path: to });
    else files.push(to);
  }
  return patch(ix, [...mapping.keys()], summaries, files, facts);
}

/** Add workspace files that have no summary yet. */
export function addFiles(ix: NoteIndex, paths: readonly string[]): NoteIndex {
  return patch(ix, [], [], paths);
}

export function backlinksOf(ix: NoteIndex, path: string): readonly Backlink[] {
  return ix.backlinks.get(path) ?? [];
}

/** Every tag (parents included) with its note count, alphabetical. */
export function tagCounts(ix: NoteIndex): { tag: string; count: number }[] {
  return [...ix.byTag.entries()]
    .map(([tag, paths]) => ({ tag, count: paths.length }))
    .sort((a, b) => compare(a.tag, b.tag));
}

export function notesWithTag(ix: NoteIndex, tag: string): readonly string[] {
  return ix.byTag.get(tag.replace(/^#/, "").toLowerCase()) ?? [];
}
