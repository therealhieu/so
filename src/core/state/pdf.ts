import {
  isPdfWindowState,
  type PdfWindowState,
} from "../features/pdf/file-type";
import type { Binding } from "../kernel/commands/defaults";
import type { Command } from "../kernel/commands/registry";
import { activeBuffer, setWindow } from "./buffers";
import type { CommandContext, CommandResult } from "./commands";
import { message, none } from "./result";
import type {
  Action,
  AppState,
  BufferState,
  Effect,
  PdfInfo,
  Result,
  Stamp,
  WindowId,
} from "./types";

export const PDF_MISSING =
  "PDF view needs Poppler (pdftoppm, pdfinfo) — :Open shows it in the system viewer";

export const sameStamp = (a: Stamp | undefined, b: Stamp): boolean =>
  a !== undefined &&
  a.mtimeMs === b.mtimeMs &&
  a.size === b.size &&
  a.hash === b.hash;

export function pdfWindow(
  s: AppState,
  id: WindowId,
): PdfWindowState | undefined {
  const ws = s.windows.byId[id]?.content.kindState;
  return isPdfWindowState(ws) ? ws : undefined;
}

/** Window `id` takes `ws`; a selection on another page than the one shown ends. */
export function setPdfWindow(
  s: AppState,
  id: WindowId,
  ws: PdfWindowState,
): AppState {
  const w = s.windows.byId[id];
  if (w === undefined) return s;
  const { select, ...rest } = ws;
  const kept = select === undefined || select.page !== ws.page ? rest : ws;
  return setWindow(s, { ...w, content: { ...w.content, kindState: kept } });
}

/** The page count of the PDF `b`, once known. */
export const pdfPages = (b: BufferState | undefined): number | undefined =>
  b?.pdf?.status === "ready" ? b.pdf.pages : undefined;

/** The buffer window `id` shows. */
export function windowBuffer(
  s: AppState,
  id: WindowId,
): BufferState | undefined {
  const w = s.windows.byId[id];
  return w === undefined ? undefined : s.buffers[w.content.bufferId];
}

/** Window `id` shows `page` (kept in range) from its top. */
export function showPdfPage(s: AppState, id: WindowId, page: number): AppState {
  const ws = pdfWindow(s, id);
  if (ws === undefined) return s;
  const last = pdfPages(windowBuffer(s, id)) ?? Number.POSITIVE_INFINITY;
  const p = Math.max(1, Math.min(page, last));
  return setPdfWindow(s, id, { ...ws, page: p, scroll: 0 });
}

/**
 * Window `id` shows `page` with the point `y` (a fraction of the page's
 * height) a third of the way down the window, when the page is taller than
 * the window; the last layout's size stands in until the page is drawn.
 */
export function showPdfAt(
  s: AppState,
  id: WindowId,
  page: number,
  y: number,
): AppState {
  const shown = showPdfPage(s, id, page);
  const ws = pdfWindow(shown, id);
  if (ws?.pageRows === undefined || ws.viewRows === undefined) return shown;
  const max = ws.pageRows - ws.viewRows;
  if (max <= 0) return shown;
  const scroll = Math.round(y * ws.pageRows - ws.viewRows / 3);
  return setPdfWindow(shown, id, {
    ...ws,
    scroll: Math.max(0, Math.min(scroll, max)),
  });
}

/**
 * Every PDF buffer on disk knows its page count for its current bytes: one
 * whose count is missing or for older bytes asks again, so opening,
 * restoring, and a change on disk are handled alike.
 */
export function syncPdfInfo(prev: AppState, r: Result): Result {
  if (prev.buffers === r.state.buffers) return r;
  let buffers: AppState["buffers"] | undefined;
  const effects: Effect[] = [];
  for (const b of Object.values(r.state.buffers)) {
    if (b.fileType !== "pdf" || b.disk !== "present") continue;
    if (sameStamp(b.pdf?.stamp, b.stamp)) continue;
    buffers ??= { ...r.state.buffers };
    buffers[b.id] = { ...b, pdf: { status: "loading", stamp: b.stamp } };
    effects.push({ kind: "pdfInfo", path: b.path, stamp: b.stamp });
  }
  return buffers === undefined
    ? r
    : {
        state: { ...r.state, buffers },
        effects: [...r.effects, ...effects],
      };
}

/** A page count answered: stored for its bytes, with every window showing it kept in range. */
export function onPdfInfo(
  s: AppState,
  a: Extract<Action, { type: "pdfInfo" }>,
): Result {
  const b = Object.values(s.buffers).find((x) => x.path === a.path);
  if (b === undefined || !sameStamp(b.stamp, a.stamp)) return none(s);
  const r = a.result;
  const pdf: PdfInfo =
    r.kind === "ok"
      ? { status: "ready", stamp: a.stamp, pages: r.pages }
      : r.kind === "missing"
        ? { status: "missing", stamp: a.stamp }
        : { status: "failed", stamp: a.stamp, reason: r.reason };
  let st: AppState = { ...s, buffers: { ...s.buffers, [b.id]: { ...b, pdf } } };
  if (r.kind === "ok")
    for (const w of Object.values(st.windows.byId)) {
      const ws = pdfWindow(st, w.id);
      if (w.content.bufferId === b.id && ws !== undefined && ws.page > r.pages)
        st = setPdfWindow(st, w.id, { ...ws, page: r.pages, scroll: 0 });
    }
  if (r.kind === "missing") return message(st, PDF_MISSING, "error");
  if (r.kind === "failed")
    return message(st, `cannot show ${b.path}: ${r.reason}`, "error");
  return none(st);
}

/** The view drew a page: remember its layout so moves can cross pages. */
export function onPdfLaidOut(
  s: AppState,
  a: Extract<Action, { type: "pdfLaidOut" }>,
): Result {
  const ws = pdfWindow(s, a.window);
  if (
    ws === undefined ||
    (ws.pageRows === a.pageRows &&
      ws.viewRows === a.viewRows &&
      ws.pageCols === a.pageCols &&
      ws.viewCols === a.viewCols)
  )
    return none(s);
  const scroll = Math.max(0, Math.min(ws.scroll, a.pageRows - a.viewRows));
  const pan = Math.max(0, Math.min(ws.pan ?? 0, a.pageCols - a.viewCols));
  const { pan: _, ...rest } = ws;
  return none(
    setPdfWindow(s, a.window, {
      ...rest,
      pageRows: a.pageRows,
      viewRows: a.viewRows,
      pageCols: a.pageCols,
      viewCols: a.viewCols,
      scroll,
      ...(pan > 0 ? { pan } : {}),
    }),
  );
}

export const PDF_ZOOM = { min: 0.25, max: 4, step: 1.25 } as const;

/**
 * Window `ws` at zoom `z` (`PDF_ZOOM.min` to `PDF_ZOOM.max`, fit width), with the point
 * at the window's centre kept there; the page's size follows from the last
 * layout until the view draws it.
 */
function zoomed(ws: PdfWindowState, z: number): PdfWindowState {
  const to =
    Math.round(Math.max(PDF_ZOOM.min, Math.min(z, PDF_ZOOM.max)) * 100) / 100;
  const from = ws.fit === "width" ? (ws.zoom ?? 1) : 1;
  const ratio = to / from;
  const { zoom: _, pan: __, pageRows, pageCols, ...rest } = ws;
  const viewRows = ws.viewRows ?? 0;
  const viewCols = ws.viewCols ?? 0;
  const rows =
    ws.fit === "width" && pageRows !== undefined
      ? Math.round(pageRows * ratio)
      : undefined;
  const cols =
    viewCols > 0 ? Math.max(1, Math.round(viewCols * to)) : undefined;
  const scroll =
    ws.fit === "width"
      ? Math.round((ws.scroll + viewRows / 2) * ratio - viewRows / 2)
      : 0;
  const pan = Math.round(((ws.pan ?? 0) + viewCols / 2) * ratio - viewCols / 2);
  const out: PdfWindowState = {
    ...rest,
    fit: "width",
    scroll: Math.max(0, Math.min(scroll, (rows ?? 0) - viewRows)),
    ...(rows === undefined ? {} : { pageRows: rows }),
    ...(cols === undefined ? {} : { pageCols: cols }),
  };
  if (to === 1) return out;
  if (to < 1) return { ...out, zoom: to };
  const maxPan = Math.max(0, (cols ?? 0) - viewCols);
  const p = Math.max(0, Math.min(pan, maxPan));
  return { ...out, zoom: to, ...(p > 0 ? { pan: p } : {}) };
}

/** Scroll a zoomed page `n` columns across, within its width. */
function panCols(a: Active, n: number): Result {
  const { ws } = a;
  if (ws.zoom === undefined) return none(a.s);
  const max = Math.max(0, (ws.pageCols ?? 0) - (ws.viewCols ?? 0));
  const pan = Math.max(0, Math.min((ws.pan ?? 0) + n, max));
  const { pan: _, ...rest } = ws;
  return none(setPdfWindow(a.s, a.id, pan > 0 ? { ...rest, pan } : rest));
}

const panStep = (ws: PdfWindowState) =>
  Math.max(2, Math.floor((ws.viewCols ?? 16) / 8));

/** The wheel's sideways scroll: `cols` columns across a zoomed page. */
export function panPdf(s: AppState, cols: number): Result {
  const id = s.windows.active;
  const ws = pdfWindow(s, id);
  return ws === undefined || cols === 0
    ? none(s)
    : panCols({ s, id, ws }, cols);
}

type Active = { s: AppState; id: WindowId; ws: PdfWindowState; pages?: number };

const zoomOf = (ws: PdfWindowState) =>
  ws.fit === "width" ? (ws.zoom ?? 1) : 1;

function unzoomed(ws: PdfWindowState): PdfWindowState {
  const { zoom: _, pan: __, ...rest } = ws;
  return rest;
}

function active(c: CommandContext): Active | undefined {
  const s = c.state;
  const id = s.windows.active;
  const ws = pdfWindow(s, id);
  if (ws === undefined) return undefined;
  const pages = pdfPages(activeBuffer(s));
  return pages === undefined ? { s, id, ws } : { s, id, ws, pages };
}

const withActive =
  (f: (a: Active) => Result) =>
  (c: CommandContext): Result => {
    const a = active(c);
    return a === undefined ? none(c.state) : f(a);
  };

/** Show `page` from its top; past either end stays at the end. */
function goToPage(a: Active, page: number, scroll = 0): Result {
  const last = a.pages ?? Number.POSITIVE_INFINITY;
  const p = Math.max(1, Math.min(page, last));
  return none(setPdfWindow(a.s, a.id, { ...a.ws, page: p, scroll }));
}

/**
 * Scroll by `n` rows through a page taller than the window; past its end
 * the next page shows from its top, and before its start the previous one
 * shows from its bottom. A page that fits turns instead.
 */
function scrollRows(a: Active, n: number): Result {
  const { ws } = a;
  const max = Math.max(0, (ws.pageRows ?? 0) - (ws.viewRows ?? 0));
  if (ws.fit === "page" || max === 0)
    return goToPage(a, ws.page + Math.sign(n));
  const to = ws.scroll + n;
  if (to > max) {
    if (ws.scroll < max) return goToPage(a, ws.page, max);
    return ws.page === a.pages ? none(a.s) : goToPage(a, ws.page + 1);
  }
  if (to < 0) {
    if (ws.scroll > 0) return goToPage(a, ws.page, 0);
    return ws.page === 1 ? none(a.s) : goToPage(a, ws.page - 1, max);
  }
  return goToPage(a, ws.page, to);
}

/** Wheel events closer together than this are one gesture. */
export const WHEEL_GESTURE_MS = 250;

/**
 * Wheel events scroll `rows` rows each, and one gesture turns at most one
 * page: terminals send a burst of events per notch, and a page that fits the
 * window would otherwise turn once per event.
 */
export function wheelPdf(s: AppState, rows: number, now: number): Result {
  const id = s.windows.active;
  const ws = pdfWindow(s, id);
  if (ws === undefined || rows === 0) return none(s);
  const ongoing =
    ws.wheel !== undefined && now - ws.wheel.at < WHEEL_GESTURE_MS;
  const turned = ongoing && ws.wheel?.turned === true;
  const pages = pdfPages(activeBuffer(s));
  const a: Active = pages === undefined ? { s, id, ws } : { s, id, ws, pages };
  const moved = pdfWindow(scrollRows(a, rows).state, id) ?? ws;
  const turns = moved.page !== ws.page;
  const next = turns && turned ? ws : moved;
  return none(
    setPdfWindow(s, id, {
      ...next,
      wheel: { at: now, turned: turned || turns },
    }),
  );
}

const half = (ws: PdfWindowState) =>
  Math.max(1, Math.floor((ws.viewRows ?? 2) / 2));

/** `:Page N` shows page N; `:Page` alone tells where the window is. */
function pageCommand(c: CommandContext): Result {
  const a = active(c);
  if (a === undefined) return none(c.state);
  const total = a.pages === undefined ? "?" : String(a.pages);
  const arg = c.args?.trim() ?? "";
  if (arg === "") return message(a.s, `page ${a.ws.page}/${total}`);
  const n = Number(arg);
  if (!Number.isInteger(n)) return message(a.s, `not a page: ${arg}`, "error");
  if (n < 1 || (a.pages !== undefined && n > a.pages))
    return message(a.s, `no page ${n} (1–${total})`, "error");
  return goToPage(a, n);
}

const PDF = ["pdf"] as const;
const cmd = (
  id: string,
  title: string,
  f: (c: CommandContext) => Result,
): Command<CommandContext, CommandResult> => ({
  id,
  title,
  filetypes: PDF,
  run: f,
});

export const pdfCommands = [
  cmd(
    "pdf.down",
    "Scroll down a row",
    withActive((a) => scrollRows(a, 1)),
  ),
  cmd(
    "pdf.up",
    "Scroll up a row",
    withActive((a) => scrollRows(a, -1)),
  ),
  cmd(
    "pdf.halfDown",
    "Scroll down half a window",
    withActive((a) => scrollRows(a, half(a.ws))),
  ),
  cmd(
    "pdf.halfUp",
    "Scroll up half a window",
    withActive((a) => scrollRows(a, -half(a.ws))),
  ),
  cmd(
    "pdf.nextPage",
    "Show the next page",
    withActive((a) => goToPage(a, a.ws.page + 1)),
  ),
  cmd(
    "pdf.prevPage",
    "Show the previous page",
    withActive((a) => goToPage(a, a.ws.page - 1)),
  ),
  cmd(
    "pdf.first",
    "Show the first page",
    withActive((a) => goToPage(a, 1)),
  ),
  cmd(
    "pdf.last",
    "Show the last page",
    withActive((a) =>
      a.pages === undefined
        ? message(a.s, "page count not known yet")
        : goToPage(a, a.pages),
    ),
  ),
  cmd(
    "pdf.fitWidth",
    "Fit the page to the window's width",
    withActive((a) =>
      none(
        setPdfWindow(a.s, a.id, { ...unzoomed(a.ws), fit: "width", scroll: 0 }),
      ),
    ),
  ),
  cmd(
    "pdf.fitPage",
    "Fit the whole page in the window",
    withActive((a) =>
      none(
        setPdfWindow(a.s, a.id, { ...unzoomed(a.ws), fit: "page", scroll: 0 }),
      ),
    ),
  ),
  cmd(
    "pdf.zoomIn",
    "Zoom in",
    withActive((a) =>
      none(setPdfWindow(a.s, a.id, zoomed(a.ws, zoomOf(a.ws) * PDF_ZOOM.step))),
    ),
  ),
  cmd(
    "pdf.zoomOut",
    "Zoom out",
    withActive((a) =>
      none(setPdfWindow(a.s, a.id, zoomed(a.ws, zoomOf(a.ws) / PDF_ZOOM.step))),
    ),
  ),
  cmd(
    "pdf.zoomReset",
    "Reset the zoom",
    withActive((a) => none(setPdfWindow(a.s, a.id, zoomed(a.ws, 1)))),
  ),
  cmd(
    "pdf.zoomToggle",
    "Toggle zoom (2×)",
    withActive((a) =>
      none(
        setPdfWindow(a.s, a.id, zoomed(a.ws, a.ws.zoom === undefined ? 2 : 1)),
      ),
    ),
  ),
  cmd(
    "pdf.left",
    "Scroll the zoomed page left",
    withActive((a) => panCols(a, -panStep(a.ws))),
  ),
  cmd(
    "pdf.right",
    "Scroll the zoomed page right",
    withActive((a) => panCols(a, panStep(a.ws))),
  ),
  cmd("pdf.page", "Show page N", pageCommand),
];

const KEYS: readonly (readonly [string, string])[] = [
  ["j", "pdf.down"],
  ["<Down>", "pdf.down"],
  ["k", "pdf.up"],
  ["<Up>", "pdf.up"],
  ["<C-d>", "pdf.halfDown"],
  ["<C-u>", "pdf.halfUp"],
  ["J", "pdf.nextPage"],
  ["<PageDown>", "pdf.nextPage"],
  ["K", "pdf.prevPage"],
  ["<PageUp>", "pdf.prevPage"],
  ["gg", "pdf.first"],
  ["G", "pdf.last"],
  ["s", "pdf.fitWidth"],
  ["a", "pdf.fitPage"],
  ["+", "pdf.zoomIn"],
  ["=", "pdf.zoomIn"],
  ["-", "pdf.zoomOut"],
  ["0", "pdf.zoomReset"],
  ["<leader>pz", "pdf.zoomToggle"],
  ["h", "pdf.left"],
  ["<Left>", "pdf.left"],
  ["l", "pdf.right"],
  ["<Right>", "pdf.right"],
];

export const pdfBindings: readonly Binding[] = KEYS.map(([seq, id]) => ({
  scope: { mode: "normal", filetype: "pdf" },
  seq,
  id,
}));
