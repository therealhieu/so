import type { Pos, Range } from "../../src/core/kernel/text/pos";
import { createTextBuffer } from "../../src/core/kernel/text/text-buffer";
import type { DecorationProvider } from "../../src/core/kernel/view/decorations";
import { layoutText } from "../../src/core/kernel/view/text-view";
import type {
  LineRange,
  RenderLine,
  TextView,
} from "../../src/core/kernel/view/types";
import { type Doc, parseDoc } from "../../src/core/lang/markdown/doc";
import {
  livePreview,
  type MarkdownViewInput,
  type PreviewCtx,
} from "../../src/core/lang/markdown/live-preview";

/** A context where every link resolves to itself, no embed is open, and no image size is known. */
export function stubCtx(over: Partial<PreviewCtx> = {}): PreviewCtx {
  return {
    resolve: (t) => t,
    isResolved: () => true,
    embed: () => "missing",
    embedModel: () => "missing",
    image: () => "unknown",
    folds: new Set(),
    embedMaxRows: 10,
    images: "auto",
    ...over,
  };
}

export type NoteView = { v: TextView; doc: Doc };

/** A view over `text` showing every line unless `visible` narrows it. */
export function noteView(
  text: string,
  opts: {
    width?: number;
    cursor?: Pos;
    selection?: Range;
    visible?: LineRange;
  } = {},
): NoteView {
  const buf = createTextBuffer(text);
  const visible = opts.visible ?? { from: 0, to: buf.lineCount };
  const v: TextView = {
    buf,
    width: opts.width ?? 80,
    topRow: visible.from,
    rows: 10_000,
    cursor: opts.cursor ?? { line: 0, col: 0 },
    folds: new Set(),
    visible,
    ...(opts.selection === undefined ? {} : { selection: opts.selection }),
  };
  return { v, doc: parseDoc(buf) };
}

/** `layoutText` with only the live-preview provider. */
export function layoutNote(
  { v, doc }: NoteView,
  view: MarkdownViewInput["view"] = "live",
  ctx: PreviewCtx = stubCtx(),
): RenderLine[] {
  const input: MarkdownViewInput = { doc, view, ctx };
  return layoutText(v, [livePreview as DecorationProvider], input);
}

/** The text of a row's spans. */
export const rowText = (row: RenderLine | undefined): string =>
  (row?.spans ?? []).map((s) => s.text).join("");
