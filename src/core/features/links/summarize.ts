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
};
export type NoteSummary = {
  path: string;
  mtime: number;
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

export function summarize(
  path: string,
  mtime: number,
  scan: DocScan,
): NoteSummary {
  const h1 = scan.headings.find((h) => h.level === 1);
  return {
    path,
    mtime,
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
    })),
    frontmatter: scan.frontmatter?.data ?? {},
  };
}
