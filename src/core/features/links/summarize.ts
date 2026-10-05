import type { Range } from "../../kernel/text/pos";
import type { DocScan } from "../../lang/markdown/scan";

export type LinkRef = {
  target: string;
  subpath?: string;
  alias?: string;
  line: number;
  col: number;
  kind: "wiki" | "md" | "embed";
  /** Exact source text of the link, for rename planning without reading the file. */
  raw: string;
  range: Range;
  inFrontmatter?: true;
  /** The trimmed source line, cut to `CONTEXT_MAX` characters: the backlink's context in a closed note. */
  context?: string;
};
export type NoteSummary = {
  path: string;
  mtime: number;
  /** Bytes on disk. */
  size: number;
  /** Birth time, else the modification time. */
  ctime: number;
  /** The first H1, or the file name without `.md`. */
  title: string;
  aliases: string[];
  /** Frontmatter and inline tags without `#`, first occurrence first. */
  tags: string[];
  headings: { text: string; level: number; line: number }[];
  blocks: { id: string; line: number }[];
  links: LinkRef[];
  frontmatter: Record<string, unknown>;
};

const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);

/** Longer than any panel or picker row shows, short enough to keep long paragraph lines out of the index. */
export const CONTEXT_MAX = 160;

/** Summarize a scanned note; with `lines`, each link also carries its line as context. */
export function summarize(
  path: string,
  facts: { mtime: number; size: number; ctime: number },
  scan: DocScan,
  lines?: { line(i: number): string },
): NoteSummary {
  const h1 = scan.headings.find((h) => h.level === 1);
  return {
    path,
    mtime: facts.mtime,
    size: facts.size,
    ctime: facts.ctime,
    title: h1?.text ?? basename(path).replace(/\.md$/i, ""),
    aliases: [...(scan.frontmatter?.aliases ?? [])],
    tags: [
      ...new Set([
        ...(scan.frontmatter?.tags ?? []),
        ...scan.tags.map((t) => t.tag),
      ]),
    ],
    headings: scan.headings.map((h) => ({ ...h })),
    blocks: scan.blockIds.map((b) => ({ ...b })),
    links: scan.links.map((l) => ({
      target: l.target,
      ...(l.subpath === undefined ? {} : { subpath: l.subpath }),
      ...(l.alias === undefined ? {} : { alias: l.alias }),
      line: l.range.start.line,
      col: l.range.start.col,
      kind: l.kind,
      raw: l.raw,
      range: l.range,
      ...(l.inFrontmatter === undefined
        ? {}
        : { inFrontmatter: true as const }),
      ...(lines === undefined
        ? {}
        : {
            context: [...lines.line(l.range.start.line).trim()]
              .slice(0, CONTEXT_MAX)
              .join(""),
          }),
    })),
    frontmatter: scan.frontmatter?.data ?? {},
  };
}
