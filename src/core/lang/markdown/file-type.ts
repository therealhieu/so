import type { FileType } from "../../filetypes/registry";
import { lowlightHighlighter } from "../code/highlight";
import { type Doc, parseDoc } from "./doc";

/** Markdown as highlighted source, analyzed into a `Doc`; live and reading views come later. */
export const markdownFileType: FileType<Doc> = {
  id: "markdown",
  match: { extensions: [".md"] },
  editor: "text",
  views: [{ id: "source", decorations: [] }],
  highlighter: lowlightHighlighter("markdown"),
  analyze: parseDoc,
};
