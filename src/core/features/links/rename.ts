import type { Range } from "../../kernel/text/pos";
import type { DocScan } from "../../lang/markdown/scan";
import { parseMarkdownLink } from "../../lang/markdown/syntax";
import { movePaths, type NoteIndex } from "./note-index";
import { linkText, nameKey, resolvePath } from "./resolve";

export type PathMove = { from: string; to: string };
export type SpanEdit = { range: Range; expected: string; text: string };
export type FileEdit = { path: string; edits: SpanEdit[] };

type Link = {
  kind: "wiki" | "embed" | "md";
  target: string;
  raw: string;
  range: Range;
};

/** Where `path` lives after `moves` (a file or anything below a moved folder). */
function imageOf(moves: readonly PathMove[]) {
  return (path: string): string => {
    for (const { from, to } of moves) {
      if (path === from) return to;
      if (path.startsWith(`${from}/`)) return to + path.slice(from.length);
    }
    return path;
  };
}

/** A wikilink or embed with a new target; the subpath and alias are kept as written. */
function rewriteWiki(link: Link, target: string): string {
  const open = link.kind === "embed" ? "![[" : "[[";
  const inner = link.raw.slice(open.length, -2);
  const bar = inner.search(/\\?\|/);
  const targetPart = bar === -1 ? inner : inner.slice(0, bar);
  const hash = targetPart.indexOf("#");
  const subpath = hash === -1 ? "" : targetPart.slice(hash);
  return `${open}${target}${subpath}${bar === -1 ? "" : inner.slice(bar)}]]`;
}

/**
 * A Markdown link pointing at the vault-root `path`, the form other Markdown
 * tools resolve. The destination is URL-encoded when the source was.
 */
function rewriteMarkdown(link: Link, path: string): string {
  const md = parseMarkdownLink(link.raw, 0);
  if (md === undefined) return link.raw;
  const dest = link.raw.slice(md.destStart, md.destEnd);
  const hash = dest.indexOf("#");
  const subpath = hash === -1 ? "" : dest.slice(hash);
  const written = md.angle
    ? path
    : dest.includes("%")
      ? path.split("/").map(encodeURIComponent).join("/")
      : path.replace(/[ <>()]/g, (c) => encodeURIComponent(c));
  return (
    link.raw.slice(0, md.destStart) +
    written +
    subpath +
    link.raw.slice(md.destEnd)
  );
}

/**
 * Edits that keep every resolved link pointing at its file after `moves`. Link spans come from
 * `open` (live scans of open buffers, by current path) and from summaries for every other note.
 * Edit paths are post-move paths.
 */
export function planRename(
  ix: NoteIndex,
  moves: readonly PathMove[],
  open: ReadonlyMap<string, DocScan>,
): FileEdit[] {
  const image = imageOf(moves);
  const after = movePaths(ix, moves);
  // Notes whose links may change: links to a moved file, links inside a moved
  // note, links naming a moved file's new name or a moved note's alias (the
  // moved file may capture them), and open notes.
  const sources = new Set(open.keys());
  const addNamed = (name: string) => {
    for (const p of ix.linkSources.get(nameKey(name)) ?? []) sources.add(p);
  };
  for (const f of ix.files) {
    if (image(f) === f) continue;
    for (const b of ix.backlinks.get(f) ?? []) sources.add(b.from);
    addNamed(image(f));
    const summary = ix.summaries.get(f);
    if (summary === undefined) continue;
    sources.add(f);
    for (const alias of summary.aliases) addNamed(alias);
  }
  const plan: FileEdit[] = [];
  for (const source of [...sources].sort()) {
    const links: readonly Link[] =
      open.get(source)?.links ?? ix.summaries.get(source)?.links ?? [];
    const movedSource = image(source);
    const edits: SpanEdit[] = [];
    for (const link of links) {
      if (link.target === "") continue;
      const before = resolvePath(ix, source, link.target);
      if (before === undefined) continue;
      const target = image(before);
      if (resolvePath(after, movedSource, link.target) === target) continue;
      edits.push({
        range: link.range,
        expected: link.raw,
        text:
          link.kind === "md"
            ? rewriteMarkdown(link, target)
            : rewriteWiki(link, linkText(after, movedSource, target)),
      });
    }
    if (edits.length > 0) plan.push({ path: movedSource, edits });
  }
  return plan;
}

/** The counts for "31 links in 12 files". */
export function renameImpact(plan: readonly FileEdit[]): {
  links: number;
  files: number;
} {
  return {
    links: plan.reduce((n, f) => n + f.edits.length, 0),
    files: plan.length,
  };
}
