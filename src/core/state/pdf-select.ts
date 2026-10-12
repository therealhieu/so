import {
  type PdfPageLayout,
  type PdfPoint,
  type PdfSelection,
  type PdfWord,
  selectedWords,
  selectionText,
} from "../features/pdf/layout";
import type { Binding } from "../kernel/commands/defaults";
import type { Command } from "../kernel/commands/registry";
import type { CommandContext, CommandResult } from "./commands";
import {
  PDF_MISSING,
  pdfWindow,
  sameStamp,
  setPdfWindow,
  windowBuffer,
} from "./pdf";
import { yankText } from "./pdf-tools";
import { message, none } from "./result";
import type {
  Action,
  AppState,
  BufferState,
  PdfLoad,
  Result,
  WindowId,
} from "./types";

/** Page `page`'s layout for the PDF's current bytes, if asked for. */
export function pdfLayoutOf(
  b: BufferState,
  page: number,
): PdfLoad<PdfPageLayout> | undefined {
  const l = b.pdfLayout?.[page];
  return l !== undefined && sameStamp(l.stamp, b.stamp) ? l : undefined;
}

/** Ask for page `page`'s layout unless it is loaded, loading, or failed for the current bytes. */
function loadLayout(s: AppState, b: BufferState, page: number): Result {
  if (pdfLayoutOf(b, page) !== undefined) return none(s);
  const pdfLayout = {
    ...b.pdfLayout,
    [page]: { status: "loading", stamp: b.stamp } as const,
  };
  return {
    state: { ...s, buffers: { ...s.buffers, [b.id]: { ...b, pdfLayout } } },
    effects: [{ kind: "pdfLayout", path: b.path, stamp: b.stamp, page }],
  };
}

/**
 * The active PDF window's page has its words asked for as soon as it shows,
 * so a press on it selects at once instead of waiting for Poppler.
 */
export function syncPdfLayout(prev: AppState, r: Result): Result {
  const s = r.state;
  if (prev.windows === s.windows && prev.buffers === s.buffers) return r;
  const id = s.windows.active;
  const ws = pdfWindow(s, id);
  const b = windowBuffer(s, id);
  if (ws === undefined || b === undefined || b.pdf?.status !== "ready")
    return r;
  if (!sameStamp(b.pdf.stamp, b.stamp) || pdfLayoutOf(b, ws.page) !== undefined)
    return r;
  const loaded = loadLayout(s, b, ws.page);
  return { state: loaded.state, effects: [...r.effects, ...loaded.effects] };
}

/** A page's layout arrived: stored for the bytes it was read from; a stale answer is dropped. */
export function onPdfLayout(
  s: AppState,
  a: Extract<Action, { type: "pdfLayout" }>,
): Result {
  const b = Object.values(s.buffers).find((x) => x.path === a.path);
  if (b === undefined || !sameStamp(b.stamp, a.stamp)) return none(s);
  const r = a.result;
  const value: PdfLoad<PdfPageLayout> =
    r.kind === "ok"
      ? { status: "ready", stamp: a.stamp, value: r.layout }
      : {
          status: "failed",
          stamp: a.stamp,
          reason: r.kind === "missing" ? "Poppler not found" : r.reason,
        };
  // Pages read from older bytes go.
  const kept = Object.entries(b.pdfLayout ?? {}).filter(([, l]) =>
    sameStamp(l.stamp, b.stamp),
  );
  const pdfLayout = { ...Object.fromEntries(kept), [a.page]: value };
  const st = { ...s, buffers: { ...s.buffers, [b.id]: { ...b, pdfLayout } } };
  return r.kind === "missing" ? message(st, PDF_MISSING, "error") : none(st);
}

/**
 * A press at `at` on the page in the active PDF window: one click starts a
 * selection there (selecting nothing until a drag), two select the word
 * under it, three its line; off the page, the selection ends. The page's
 * layout is asked for on the first press.
 */
export function pressPdf(
  s: AppState,
  at: PdfPoint | undefined,
  clicks: 1 | 2 | 3,
): Result {
  const id = s.windows.active;
  const ws = pdfWindow(s, id);
  const b = windowBuffer(s, id);
  if (ws === undefined || b === undefined) return none(s);
  if (at === undefined) return none(clearSelection(s, id));
  const by: PdfSelection["by"] =
    clicks === 2 ? "word" : clicks === 3 ? "line" : undefined;
  const select: PdfSelection = {
    page: ws.page,
    anchor: at,
    head: at,
    ...(by === undefined ? {} : { by }),
  };
  return loadLayout(setPdfWindow(s, id, { ...ws, select }), b, ws.page);
}

/** A drag from a press on the page: the selection's end follows the pointer. */
export function dragPdf(s: AppState, at: PdfPoint): Result {
  const id = s.windows.active;
  const ws = pdfWindow(s, id);
  if (ws?.select === undefined || ws.select.page !== ws.page) return none(s);
  return none(
    setPdfWindow(s, id, { ...ws, select: { ...ws.select, head: at } }),
  );
}

function clearSelection(s: AppState, id: WindowId): AppState {
  const ws = pdfWindow(s, id);
  if (ws?.select === undefined) return s;
  const { select: _, ...rest } = ws;
  return setPdfWindow(s, id, rest);
}

/** What the active PDF window has selected: its PDF, the selection, and the words in it. */
export type Selected = {
  b: BufferState;
  sel: PdfSelection;
  runs: PdfWord[][];
};

/** The active PDF window's selected words, or the result that says why there are none. */
export function selectedIn(s: AppState): Selected | { stop: Result } {
  const id = s.windows.active;
  const ws = pdfWindow(s, id);
  const b = windowBuffer(s, id);
  if (ws === undefined || b === undefined) return { stop: none(s) };
  const sel = ws.select;
  if (sel === undefined) return { stop: message(s, "no selection") };
  const layout = pdfLayoutOf(b, sel.page);
  if (layout === undefined) return { stop: loadLayout(s, b, sel.page) };
  if (layout.status === "loading")
    return { stop: message(s, "reading the page's text…") };
  if (layout.status === "failed")
    return {
      stop: message(
        s,
        `cannot read text on page ${sel.page}: ${layout.reason}`,
        "error",
      ),
    };
  if (layout.value.lines.length === 0)
    return {
      stop: message(s, "no text on this page (scanned?)", "error"),
    };
  const runs = selectedWords(layout.value, sel);
  if (runs.length === 0) return { stop: message(s, "no selection") };
  return { b, sel, runs };
}

/** The selected text in the unnamed register and on the clipboard. */
export function copySelection(s: AppState): Result {
  const got = selectedIn(s);
  if ("stop" in got) return got.stop;
  const n = got.runs.length;
  return yankText(
    s,
    selectionText(got.runs),
    `copied ${n} ${n === 1 ? "line" : "lines"}`,
  );
}

/** The active PDF window without its selection. */
export const withoutSelection = (s: AppState): AppState =>
  clearSelection(s, s.windows.active);

const cmd = (
  id: string,
  title: string,
  run: (c: CommandContext) => Result,
): Command<CommandContext, CommandResult> => ({
  id,
  title,
  filetypes: ["pdf"],
  run,
});

export const pdfSelectCommands = [
  cmd("pdf.copySelection", "Copy the selected text", (c) =>
    copySelection(c.state),
  ),
  cmd("pdf.clearSelection", "Clear the selection", (c) =>
    none(clearSelection(c.state, c.state.windows.active)),
  ),
];

export const pdfSelectBindings: readonly Binding[] = [
  ["y", "pdf.copySelection"],
  ["<Esc>", "pdf.clearSelection"],
].map(([seq = "", id = ""]) => ({
  scope: { mode: "normal", filetype: "pdf" },
  seq,
  id,
}));
