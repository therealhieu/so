import type { TextBuffer } from "../../../kernel/text/text-buffer";
import type { DecorationProvider } from "../../../kernel/view/decorations";
import { layoutText } from "../../../kernel/view/text-view";
import type { LineRange, Span, TextView } from "../../../kernel/view/types";
import { contentEnd, contentStart, embedLink, wholeBlock } from "../block-text";
import type { Doc } from "../doc";
import {
  type BlockRenderer,
  blocksIn,
  livePreview,
  type PreviewCtx,
} from "../live-preview";

/** What the embed painter draws: a title row, span rows, and a `… N more lines` row when `more > 0`. */
export type EmbedData = {
  title: string;
  rows: Span[][];
  more: number;
  state: "ok" | "loading" | "missing";
};

/** Contexts of embedded layouts: their embeds render as links, so embedding stops at one level. */
const nested = new WeakSet<PreviewCtx>();

const isBlank = (s: string) => s.trim() === "";

/**
 * Source lines `[from, to)` of a section: `#Heading` (the last part of
 * `#H1#H2`) runs to the next heading of the same or a higher level,
 * `#^id` is the block holding that block id, and no section is the whole
 * note after its frontmatter.
 */
export function sectionLines(
  doc: Doc,
  text: TextBuffer,
  section: string | undefined,
): LineRange | undefined {
  if (section === undefined || section === "#") {
    const first = doc.blocks[0];
    const from = first?.kind === "frontmatter" ? first.endLine + 1 : 0;
    let to = text.lineCount;
    while (to - 1 > from && isBlank(text.line(to - 1))) to--;
    return { from, to };
  }
  if (section.startsWith("#^")) {
    const hit = doc.scan.blockIds.find((b) => b.id === section.slice(2));
    const block = hit && blocksIn(doc, { from: hit.line, to: hit.line + 1 })[0];
    return block === undefined
      ? undefined
      : {
          from: contentStart(text, block),
          to: contentEnd(text, block) + 1,
        };
  }
  const name = section.split("#").filter(Boolean).at(-1)?.trim().toLowerCase();
  const headings = doc.scan.headings;
  const i = headings.findIndex((h) => h.text.toLowerCase() === name);
  const heading = headings[i];
  if (heading === undefined) return undefined;
  const next = headings.slice(i + 1).find((h) => h.level <= heading.level);
  let to = next?.line ?? text.lineCount;
  while (to - 1 > heading.line && isBlank(text.line(to - 1))) to--;
  return { from: heading.line + 1, to };
}

/**
 * The section laid out in `reading` view as span rows, at most `max` source
 * lines; nested embeds become links and images their placeholders.
 */
export function embedRows(
  got: { doc: Doc; text: TextBuffer },
  title: string,
  section: string | undefined,
  width: number,
  max: number,
  ctx: PreviewCtx,
): EmbedData {
  const lines = sectionLines(got.doc, got.text, section);
  if (lines === undefined)
    return { title, rows: [], more: 0, state: "missing" };
  const inner: PreviewCtx = {
    ...ctx,
    embed: () => "missing",
    images: "off",
    folds: new Set(),
  };
  nested.add(inner);
  const v: TextView = {
    buf: got.text,
    width,
    topRow: lines.from,
    rows: max,
    cursor: { line: -1, col: 0 },
    folds: new Set(),
    visible: lines,
  };
  const laid = layoutText(v, [livePreview as DecorationProvider], {
    doc: got.doc,
    view: "reading",
    ctx: inner,
  });
  const rows: Span[][] = [];
  for (const row of laid)
    if (row.widget?.type === "text")
      rows.push(...(row.widget.data as Span[][]));
    else rows.push(row.spans);
  const lastShown = laid.at(-1)?.sourceLine ?? lines.from - 1;
  const more = rows.length >= max ? lines.to - 1 - lastShown : 0;
  return { title, rows, more, state: "ok" };
}

/**
 * A note embed as an `embed` widget: the target section capped at
 * `embedMaxRows` source lines unless its block id is toggled in `folds`,
 * three reserved rows while the target loads, and the title alone when it is
 * missing.
 */
export const embedRenderer: BlockRenderer = (block, v, { doc, ctx }) => {
  const { target, section } = embedLink(doc, block, v.buf);
  const range = wholeBlock(v.buf, block);
  const title = `${target}${section ?? ""}`;
  if (nested.has(ctx))
    return [
      {
        kind: "replace",
        range,
        block: true,
        spans: [
          {
            text: title,
            style: ctx.isResolved(target) ? "mdLink" : "linkUnresolved",
            link: target,
          },
        ],
      },
    ];
  const path = ctx.resolve(target);
  const got = path === undefined ? "missing" : ctx.embed(path);
  const max = ctx.folds.has(block.id)
    ? Number.POSITIVE_INFINITY
    : ctx.embedMaxRows;
  const data: EmbedData =
    typeof got === "string"
      ? { title, rows: [], more: 0, state: got }
      : embedRows(got, title, section, Math.max(1, v.width - 2), max, ctx);
  const rows =
    data.state === "loading"
      ? Math.min(ctx.embedMaxRows, 3)
      : 1 + data.rows.length + (data.more > 0 ? 1 : 0);
  return [
    {
      kind: "replace",
      range,
      block: true,
      widget: { type: "embed", data, rows },
    },
  ];
};
