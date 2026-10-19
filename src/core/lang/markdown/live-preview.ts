import type { TextBuffer } from "../../kernel/text/text-buffer";
import type {
  Decoration,
  DecorationProvider,
} from "../../kernel/view/decorations";
import type { LineRange, TextView } from "../../kernel/view/types";
import { contentEnd } from "./block-text";
import type { BlockKind } from "./blocks";
import type { Block, Doc } from "./doc";
import { inlineDecorations } from "./inline";
import { renderKey } from "./render-key";
import { reveal } from "./reveal";

/** What the provider and block renderers may know beyond the view; built per window per frame. */
export type PreviewCtx = {
  /** The workspace path a link target resolves to. */
  resolve(target: string): string | undefined;
  isResolved(target: string): boolean;
  /** An open buffer's analysis and text, or why there is none yet. */
  embed(path: string): { doc: Doc; text: TextBuffer } | "loading" | "missing";
  /**
   * A non-note file's model at `subpath`, built by its file type, or why
   * there is none yet; renderers check the model's shape themselves.
   */
  embedModel(path: string, subpath?: string): unknown;
  /** Rows for an image once its size is known. */
  image(ref: string): { rows: number } | "unknown";
  /** Block ids toggled from their default fold in this window. */
  folds: ReadonlySet<number>;
  embedMaxRows: number;
  images: "auto" | "blocks" | "off";
  /** Stretch the wrapped rows of paragraphs, list items, callouts, and quotes to both edges. */
  justify: boolean;
  /** Draw H1/H2 headings larger and math and footnote scripts half size. */
  sizedText: boolean;
};

/** Render keys whose rows are prose that may be justified. */
const PROSE = new Set(["paragraph", "list", "callout", "quote"]);

/** A `justify` line decoration on each visible line of `block`'s content. */
function justified(block: Block, v: TextView): Decoration[] {
  const out: Decoration[] = [];
  const last = Math.min(contentEnd(v.buf, block), v.visible.to - 1);
  for (let l = Math.max(block.startLine, v.visible.from); l <= last; l++)
    out.push({ kind: "line", line: l, justify: true });
  return out;
}
export type MarkdownViewInput = {
  doc: Doc;
  view: "live" | "reading";
  ctx: PreviewCtx;
};
export type BlockRenderer = (
  block: Block,
  v: TextView,
  input: MarkdownViewInput,
) => Decoration[];

const renderers = new Map<string, BlockRenderer>();
const inlineOnly: BlockRenderer = () => [];

/** Render blocks with key `kind` through `r`; a later registration replaces an earlier one. */
export function registerBlockRenderer(
  kind: BlockKind | string,
  r: BlockRenderer,
): void {
  renderers.set(kind, r);
}

/** The blocks with a line in `r`, by binary search. */
export function blocksIn(doc: Doc, r: LineRange): Block[] {
  const { blocks } = doc;
  let lo = 0;
  let hi = blocks.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((blocks[mid] as Block).endLine < r.from) lo = mid + 1;
    else hi = mid;
  }
  const out: Block[] = [];
  for (let i = lo; i < blocks.length; i++) {
    const b = blocks[i] as Block;
    if (b.startLine >= r.to) break;
    out.push(b);
  }
  return out;
}

/** The first and last line a decoration touches. */
function linesOf(d: Decoration): [number, number] {
  switch (d.kind) {
    case "line":
      return [d.line, d.line];
    case "widget":
      return [d.at.line, d.at.line];
    default:
      return [d.range.start.line, d.range.end.line];
  }
}

const sign = (line: number, text: string, style: string): Decoration => ({
  kind: "line",
  line,
  sign: { text, style },
});

/**
 * Live and reading views of a Markdown note. Only blocks intersecting the
 * visible lines are rendered, each by the renderer registered for its render
 * key (the paragraph renderer otherwise). Revealed lines and blocks keep
 * their source and get a `▕` sign; a throwing renderer leaves its block as
 * source with a `⚠` sign on its first line.
 */
export const livePreview: DecorationProvider<MarkdownViewInput> = (
  v,
  input,
) => {
  const shown = reveal(
    input.doc,
    input.view,
    v.cursor,
    v.selection,
    v.buf,
    v.visible,
  );
  const lines = [...shown.lines];
  const lo = Math.min(...lines);
  const hi = Math.max(...lines);
  const keep = (d: Decoration) => {
    const [from, to] = linesOf(d);
    return to < lo || from > hi;
  };
  const revealedRows = new Set(shown.lines);
  const out: Decoration[] = [];
  for (const block of blocksIn(input.doc, v.visible)) {
    if (shown.blocks.has(block.id)) {
      for (let l = block.startLine; l <= contentEnd(v.buf, block); l++)
        revealedRows.add(l);
      continue;
    }
    try {
      const key = renderKey(block, input.doc, v.buf);
      const r = renderers.get(key) ?? renderers.get("paragraph") ?? inlineOnly;
      const own = [
        ...r(block, v, input),
        ...inlineDecorations(block, v, input, shown.lines),
        ...(input.ctx.justify && PROSE.has(key) ? justified(block, v) : []),
      ];
      out.push(...(lines.length === 0 ? own : own.filter(keep)));
    } catch {
      out.push(sign(block.startLine, "⚠", "signError"));
    }
  }
  const last = Math.min(v.visible.to, v.buf.lineCount);
  for (const l of revealedRows)
    if (l >= v.visible.from && l < last && v.buf.line(l).trim() !== "")
      out.unshift(sign(l, "▕", "signReveal"));
  return out;
};
