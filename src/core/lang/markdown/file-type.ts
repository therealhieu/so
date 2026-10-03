import type { FileType } from "../../filetypes/registry";
import { lowlightHighlighter } from "../code/highlight";

/** Markdown as highlighted source; live and reading views come later. */
export const markdownFileType: FileType = {
  id: "markdown",
  match: { extensions: [".md"] },
  editor: "text",
  views: [{ id: "source", decorations: [] }],
  highlighter: lowlightHighlighter("markdown"),
};
