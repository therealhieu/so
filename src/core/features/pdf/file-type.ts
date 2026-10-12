import type { EditorKindSpec, FileType } from "../../filetypes/registry";
import type { PdfSelection } from "./layout";
import { pageOf } from "./page";

/**
 * What one PDF window remembers: the page shown (1-based), how it fits, and
 * the rows scrolled into a page taller than the window. `pageRows` and
 * `viewRows` are the last layout the view drew, so moves can cross pages.
 * `wheel` is the wheel gesture under way: when its last event came and
 * whether it has turned a page. `search` is the last text search, `pending`
 * until the PDF's text has loaded; `dark` draws the page in theme colours.
 * `zoom` (not 1, fit width only) draws the page that many times the
 * window's width (centred across below 1), `pan` columns scrolled across; `pageCols` and `viewCols`
 * are that layout's widths. `select` is the text selected on the page shown.
 */
export type PdfWindowState = {
  page: number;
  fit: "width" | "page";
  scroll: number;
  pageRows?: number;
  viewRows?: number;
  wheel?: { at: number; turned: boolean };
  search?: { query: string; dir: 1 | -1; pending?: true };
  dark?: true;
  zoom?: number;
  pan?: number;
  pageCols?: number;
  viewCols?: number;
  select?: PdfSelection;
};

export function isPdfWindowState(v: unknown): v is PdfWindowState {
  if (typeof v !== "object" || v === null) return false;
  const w = v as Partial<PdfWindowState>;
  return (
    typeof w.page === "number" &&
    (w.fit === "width" || w.fit === "page") &&
    typeof w.scroll === "number"
  );
}

/** `.pdf` files: drawn page by page by the pdf editor kind, never read as text. */
export const pdfFileType: FileType = {
  id: "pdf",
  match: { extensions: [".pdf"] },
  editor: "pdf",
  readOnly: true,
  binary: true,
  views: [{ id: "pdf", readOnly: true, decorations: [] }],
};

/** A PDF window opens at the page its subpath names (`#page=3`), else page 1. */
export const pdfEditorKind: EditorKindSpec<PdfWindowState> = {
  id: "pdf",
  open: (_path, _text, subpath) => ({
    page: pageOf(subpath),
    fit: "width",
    scroll: 0,
  }),
};
