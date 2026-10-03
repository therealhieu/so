import { nameKey, resolvePath } from "./resolve";
import type { LinkRef, NoteSummary } from "./summarize";

export type Backlink = { from: string; link: LinkRef };

export type NoteIndex = {
  readonly summaries: ReadonlyMap<string, NoteSummary>;
  readonly files: ReadonlySet<string>;
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

function addPath(map: Multi<string>, key: string, path: string) {
  const list = map.get(key) ?? [];
  if (list.includes(path)) return;
  map.set(key, [...list, path].sort(compare));
}

function removePath(map: Multi<string>, key: string, path: string) {
  const list = map.get(key);
  if (list === undefined || !list.includes(path)) return;
  const rest = list.filter((p) => p !== path);
  if (rest.length === 0) map.delete(key);
  else map.set(key, rest);
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
  maps: Pick<
    { [K in keyof NoteIndex]: Multi<string> },
    "byAlias" | "byTag" | "linkSources"
  >,
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
): NoteIndex {
  const notes = summaries.filter((s) => isNote(s.path));
  const all = new Set([...files, ...notes.map((s) => s.path)]);
  const byBasename: Multi<string> = new Map();
  for (const f of all) addPath(byBasename, nameKey(f), f);
  const maps = { byAlias: new Map(), byTag: new Map(), linkSources: new Map() };
  for (const s of notes) linkSummary(maps, s, true);
  const ix: NoteIndex = {
    summaries: new Map(notes.map((s) => [s.path, s])),
    files: all,
    byBasename,
    ...maps,
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
 * Remove `remove` (files and their summaries), then add `add` summaries and
 * `files`. Only notes whose links may resolve differently are re-resolved:
 * the changed notes, and notes linking to a name whose files or aliases changed.
 */
function patch(
  ix: NoteIndex,
  remove: readonly string[],
  add: readonly NoteSummary[],
  files: readonly string[],
): NoteIndex {
  const added = add.filter((s) => isNote(s.path));
  const newFiles = [...files, ...added.map((s) => s.path)];
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
  const all = new Set(ix.files);
  const byBasename = new Map(ix.byBasename);
  const maps = {
    byAlias: new Map(ix.byAlias),
    byTag: new Map(ix.byTag),
    linkSources: new Map(ix.linkSources),
  };
  for (const p of removed) {
    const old = summaries.get(p);
    if (old !== undefined) linkSummary(maps, old, false);
    summaries.delete(p);
    all.delete(p);
    removePath(byBasename, nameKey(p), p);
  }
  for (const s of added) {
    const old = summaries.get(s.path);
    if (old !== undefined) linkSummary(maps, old, false);
    linkSummary(maps, s, true);
    summaries.set(s.path, s);
  }
  for (const f of newFiles) {
    all.add(f);
    addPath(byBasename, nameKey(f), f);
  }

  const next: NoteIndex = {
    summaries,
    files: all,
    byBasename,
    ...maps,
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

/** Add or replace note summaries; `files` adds other workspace files. Only `.md` paths have summaries. */
export function applySummaries(
  ix: NoteIndex,
  summaries: readonly NoteSummary[],
  files: readonly string[] = [],
): NoteIndex {
  return patch(ix, [], summaries, files);
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
  for (const [from, to] of mapping) {
    const s = ix.summaries.get(from);
    if (s !== undefined) summaries.push({ ...s, path: to });
    else files.push(to);
  }
  return patch(ix, [...mapping.keys()], summaries, files);
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
