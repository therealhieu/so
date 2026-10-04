import type { FileType, ViewSpec } from "../../filetypes/registry";
import { lowlightHighlighter } from "../code/highlight";
import { type Doc, parseDoc } from "./doc";
import {
  livePreview,
  type MarkdownViewInput,
  type PreviewCtx,
} from "./live-preview";

/** A rendered view: the live-preview provider over the note and its window context. */
const rendered = (
  id: "live" | "reading",
): ViewSpec<Doc, MarkdownViewInput, PreviewCtx> => ({
  id,
  ...(id === "reading" ? { readOnly: true } : {}),
  decorations: [livePreview],
  input: (doc, ctx) => ({ doc, view: id, ctx }),
});

/**
 * Markdown analyzed into a `Doc`: `live` (the default) renders the note and
 * reveals source at the cursor, `source` is highlighted source, and
 * `reading` renders without reveal and refuses edits.
 */
export const markdownFileType: FileType<Doc> = {
  id: "markdown",
  match: { extensions: [".md"] },
  editor: "text",
  // A rendered view's providers read `MarkdownViewInput`, which its `input`
  // hook builds from the `Doc`; `ViewSpec<Doc>` cannot express that pairing.
  views: [
    rendered("live") as unknown as ViewSpec<Doc>,
    { id: "source", decorations: [] },
    rendered("reading") as unknown as ViewSpec<Doc>,
  ],
  highlighter: lowlightHighlighter("markdown"),
  analyze: parseDoc,
};
