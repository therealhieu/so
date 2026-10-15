import type { EditorKindSpec, FileType } from "../../filetypes/registry";
import { lowlightHighlighter } from "../../lang/code/highlight";
import type { RawKey } from "./keys";

/** A point in the page as fractions of the frame's width and height (0..1). */
export type PagePoint = { x: number; y: number };

/** The window's size in device pixels and a terminal row's height in them. */
export type PagePixels = { width: number; height: number; cellHeight: number };

/**
 * A page's layout viewport in CSS pixels, and the terminal's device pixels
 * per CSS pixel at zoom 1: Chrome draws frames at that density whatever the
 * zoom, which changes only the viewport.
 */
export type PageSize = { width: number; height: number; dpr: number };

/** What a page is told: a pointer event, a wheel turn in lines, or a key. */
export type PageInput =
  | {
      kind: "mouse";
      type: "press" | "release" | "move";
      at: PagePoint;
      clicks?: number;
      /** A move with the button held, as in a drag. */
      held?: boolean;
    }
  | { kind: "wheel"; at: PagePoint; dx: number; dy: number }
  | { kind: "key"; key: RawKey };

/**
 * Where a browser window's page is: Chrome starting, the page shown, or
 * why there is none. `missing` is no Chrome found (`configured` the
 * configured path that does not exist); `failed` Chrome would not start;
 * `crashed` it stopped while showing the page.
 */
export type BrowserStatus =
  | { kind: "starting" }
  | { kind: "ready" }
  | { kind: "missing"; configured?: string }
  | { kind: "failed"; reason: string }
  | { kind: "crashed" };

/**
 * What one browser window remembers. `mode` is `browse` while keys go to the
 * page, and `prefix` is set after `<C-\>` there. `zoom` scales the page like
 * a browser's zoom. `px` is the size the view last drew, and the page opens
 * once it is known. `url`, `title`, and `loading` are what the page reports.
 */
export type BrowserWindowState = {
  mode: "normal" | "browse";
  prefix?: true;
  zoom: number;
  px?: PagePixels;
  status: BrowserStatus;
  url?: string;
  title?: string;
  loading?: boolean;
};

export function isBrowserWindowState(v: unknown): v is BrowserWindowState {
  if (typeof v !== "object" || v === null) return false;
  const w = v as Partial<BrowserWindowState>;
  return (
    (w.mode === "normal" || w.mode === "browse") &&
    typeof w.zoom === "number" &&
    typeof w.status === "object"
  );
}

/** About one terminal row per line of 16 px text. */
const CSS_LINE_PX = 18;

/**
 * The page's CSS viewport for a window: device pixels per CSS pixel follow
 * the terminal row height (1–3), so page text is about as tall as the
 * terminal's, and the zoom shrinks or grows the viewport like a browser's.
 */
export function pageSize(px: PagePixels, zoom: number): PageSize {
  const base = Math.min(3, Math.max(1, px.cellHeight / CSS_LINE_PX));
  const dpr = Math.round(base * 4) / 4;
  return {
    width: Math.max(1, Math.round(px.width / (dpr * zoom))),
    height: Math.max(1, Math.round(px.height / (dpr * zoom))),
    dpr,
  };
}

/** HTML pages: shown by a headless browser, their source edited as text. */
export const htmlFileType: FileType = {
  id: "html",
  match: { extensions: [".html", ".htm"] },
  editor: "browser",
  views: [{ id: "source", decorations: [] }],
  highlighter: lowlightHighlighter("xml"),
};

export const browserEditorKind: EditorKindSpec<BrowserWindowState> = {
  id: "browser",
  open: () => ({ mode: "normal", zoom: 1, status: { kind: "starting" } }),
};
