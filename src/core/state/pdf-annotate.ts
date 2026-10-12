import {
  annotationAt,
  newAnnotationId,
  type PdfAnnotation,
  parseAnnotations,
  rematch,
  serializeAnnotations,
} from "../features/pdf/annotations";
import { type PdfPageLayout, selectionText } from "../features/pdf/layout";
import type { Binding } from "../kernel/commands/defaults";
import type { Command } from "../kernel/commands/registry";
import type { CommandContext, CommandResult } from "./commands";
import { movedCaret, typed } from "./explorer";
import { pdfWindow, sameStamp, windowBuffer } from "./pdf";
import {
  copySelection,
  pdfLayoutOf,
  type Selected,
  selectedIn,
  withoutSelection,
} from "./pdf-select";
import { yankText } from "./pdf-tools";
import { chain, message, none } from "./result";
import type {
  Action,
  AppState,
  FsOp,
  MouseTarget,
  PdfMenuSubject,
  PromptState,
  Result,
} from "./types";

const NOTES = ".so/annotations/";

const iso = (now: number) => new Date(now).toISOString();

/** The highlights and notes of PDF `pdf`, once read. */
export function annotationsOf(
  s: AppState,
  pdf: string,
): PdfAnnotation[] | undefined {
  const a = s.annotations[pdf];
  return a?.status === "ready" ? a.items : undefined;
}

/** The annotations of `pdf` still found on their pages: the ones drawn and clickable. */
export function shownAnnotations(s: AppState, pdf: string): PdfAnnotation[] {
  const a = s.annotations[pdf];
  if (a?.status !== "ready") return [];
  const gone = new Set(a.detached ?? []);
  return a.items.filter((i) => !gone.has(i.id));
}

/**
 * The annotations of `pdf` to change, or why they cannot be: still being
 * read, or unreadable (a file that failed to parse is never overwritten).
 */
function editable(
  s: AppState,
  pdf: string,
): PdfAnnotation[] | { stop: Result } {
  const a = s.annotations[pdf];
  if (a === undefined || a.status === "loading")
    return { stop: message(s, "reading the annotations…") };
  if (a.status === "failed")
    return {
      stop: message(
        s,
        `annotations of ${pdf} are unreadable (${a.reason}); fix or remove ${NOTES}${pdf}.json`,
        "error",
      ),
    };
  return a.items;
}

/** The action float closes once what it is about is gone. */
function closeStaleMenu(s: AppState): AppState {
  const o = s.overlay;
  if (o.kind !== "pdfMenu") return s;
  const ws = pdfWindow(s, o.window);
  const gone =
    ws === undefined ||
    (o.on.kind === "selection"
      ? ws.select === undefined || o.window !== s.windows.active
      : menuAnnotation(s) === undefined);
  return gone ? { ...s, overlay: { kind: "none" } } : s;
}

/**
 * The PDF shown in the active window has its annotations read once, and
 * the action float closes once what it is about is gone.
 */
export function syncAnnotations(prev: AppState, r: Result): Result {
  if (r.state.overlay.kind === "pdfMenu")
    r = { ...r, state: closeStaleMenu(r.state) };
  const s = r.state;
  if (prev.windows === s.windows && prev.buffers === s.buffers) return r;
  const id = s.windows.active;
  const b = windowBuffer(s, id);
  if (pdfWindow(s, id) === undefined || b === undefined) return r;
  if (s.annotations[b.path] !== undefined) return r;
  return {
    state: {
      ...s,
      annotations: { ...s.annotations, [b.path]: { status: "loading" } },
    },
    effects: [...r.effects, { kind: "readAnnotations", pdf: b.path }],
  };
}

/** The annotations file was read: its items, checked against every page already laid out. */
export function onAnnotationsRead(
  s: AppState,
  a: Extract<Action, { type: "annotationsRead" }>,
): Result {
  if (s.annotations[a.pdf]?.status !== "loading") return none(s);
  const failed = (reason: string) =>
    message(
      {
        ...s,
        annotations: {
          ...s.annotations,
          [a.pdf]: { status: "failed", reason },
        },
      },
      `cannot read annotations of ${a.pdf}: ${reason}`,
      "error",
    );
  if (a.reason !== undefined) return failed(a.reason);
  const parsed = a.text === null ? { items: [] } : parseAnnotations(a.text);
  if ("error" in parsed) return failed(parsed.error);
  const read: AppState = {
    ...s,
    annotations: {
      ...s.annotations,
      [a.pdf]: { status: "ready", items: parsed.items },
    },
  };
  const b = Object.values(s.buffers).find((x) => x.path === a.pdf);
  return Object.entries(b?.pdfLayout ?? {}).reduce<Result>(
    (r, [page, l]) =>
      b !== undefined && l.status === "ready" && sameStamp(l.stamp, b.stamp)
        ? chain(r, (st) => rematchPage(st, a.pdf, Number(page), l.value))
        : r,
    none(read),
  );
}

export const onAnnotationsFailed = (
  s: AppState,
  a: Extract<Action, { type: "annotationsFailed" }>,
): Result =>
  message(s, `cannot save annotations of ${a.pdf}: ${a.reason}`, "error");

/** PDF `pdf`'s annotations set to `items` and written to its annotations file. */
export function setAnnotations(
  s: AppState,
  pdf: string,
  items: PdfAnnotation[],
): Result {
  const cur = s.annotations[pdf];
  const detached = cur?.status === "ready" ? cur.detached : undefined;
  return {
    state: {
      ...s,
      annotations: {
        ...s.annotations,
        [pdf]: {
          status: "ready",
          items,
          ...(detached === undefined || detached.length === 0
            ? {}
            : { detached }),
        },
      },
    },
    effects: [
      {
        kind: "writeAnnotations",
        pdf,
        text: serializeAnnotations(pdf, items),
      },
    ],
  };
}

/**
 * Page `page` of `pdf` was laid out: each annotation on it still over its
 * quote stays, one whose quote moved follows it (and is saved), and one
 * whose quote is gone is detached: kept in the file, not drawn.
 */
export function rematchPage(
  s: AppState,
  pdf: string,
  page: number,
  layout: PdfPageLayout,
): Result {
  const a = s.annotations[pdf];
  if (a?.status !== "ready" || layout.lines.length === 0) return none(s);
  const detached = new Set(a.detached ?? []);
  let moved = false;
  let lost = 0;
  const items = a.items.map((i) => {
    if (i.page !== page) return i;
    const r = rematch(layout, i);
    if (r === "detached") {
      if (!detached.has(i.id)) lost++;
      detached.add(i.id);
      return i;
    }
    detached.delete(i.id);
    if (r === "same") return i;
    moved = true;
    return r;
  });
  const marked: AppState = {
    ...s,
    annotations: {
      ...s.annotations,
      [pdf]: {
        status: "ready",
        items,
        ...(detached.size === 0 ? {} : { detached: [...detached] }),
      },
    },
  };
  const r = moved ? setAnnotations(marked, pdf, items) : none(marked);
  return lost === 0
    ? r
    : chain(r, (st) =>
        message(
          st,
          `${lost} ${lost === 1 ? "annotation no longer matches" : "annotations no longer match"} page ${page}`,
          "error",
        ),
      );
}

/** A page's layout arrived for the PDF's current bytes: its annotations are checked against it. */
export function onPageLaidOut(
  s: AppState,
  a: Extract<Action, { type: "pdfLayout" }>,
): Result {
  const b = Object.values(s.buffers).find((x) => x.path === a.path);
  if (b === undefined || !sameStamp(b.stamp, a.stamp) || a.result.kind !== "ok")
    return none(s);
  return rematchPage(s, a.path, a.page, a.result.layout);
}

const openMenu = (s: AppState, on: PdfMenuSubject): AppState => ({
  ...s,
  overlay: { kind: "pdfMenu", window: s.windows.active, on },
});

/**
 * The left button came up on the active PDF window: with text selected, the
 * action float opens on it; after a plain click on an annotation, on that.
 */
export function releasePdf(s: AppState): Result {
  const id = s.windows.active;
  const ws = pdfWindow(s, id);
  const b = windowBuffer(s, id);
  const sel = ws?.select;
  if (b === undefined || sel === undefined) return none(s);
  const layout = pdfLayoutOf(b, sel.page);
  if (layout?.status !== "ready") return none(s);
  const got = selectedIn(s);
  if (!("stop" in got)) return none(openMenu(s, { kind: "selection" }));
  if (sel.by !== undefined) return none(s);
  const hit = annotationAt(
    layout.value,
    shownAnnotations(s, b.path),
    sel.page,
    sel.anchor,
  );
  return hit === undefined
    ? none(s)
    : none(openMenu(withoutSelection(s), { kind: "annotation", id: hit.id }));
}

/**
 * The pointer rests on `t`: over a note on a PDF page, its text floats there
 * until the pointer leaves it. Any other open float stays.
 */
export function hoverPdf(s: AppState, t: MouseTarget): AppState {
  const o = s.overlay;
  const hovering =
    o.kind === "pdfMenu" && o.on.kind === "annotation" && o.on.hover;
  if (o.kind !== "none" && !hovering) return s;
  const closed: AppState = hovering ? { ...s, overlay: { kind: "none" } } : s;
  if (t.kind !== "window" || t.spot.kind !== "pdf" || t.spot.at === undefined)
    return closed;
  const ws = pdfWindow(s, t.window);
  const b = windowBuffer(s, t.window);
  const layout =
    b === undefined || ws === undefined ? undefined : pdfLayoutOf(b, ws.page);
  if (b === undefined || ws === undefined || layout?.status !== "ready")
    return closed;
  const notes = shownAnnotations(s, b.path).filter((i) => i.kind === "note");
  const hit = annotationAt(layout.value, notes, ws.page, t.spot.at);
  if (hit === undefined) return closed;
  if (
    hovering &&
    o.window === t.window &&
    o.on.kind === "annotation" &&
    o.on.id === hit.id
  )
    return s;
  return {
    ...s,
    overlay: {
      kind: "pdfMenu",
      window: t.window,
      on: { kind: "annotation", id: hit.id, hover: true },
    },
  };
}

/** One action of the float: the key that runs it and its label. */
export type PdfMenuItem = { key: string; label: string };

/**
 * The open float's actions: none while it only shows a note under the
 * pointer; a note can also be edited.
 */
export function pdfMenuItems(s: AppState): PdfMenuItem[] {
  const o = s.overlay;
  if (o.kind !== "pdfMenu") return [];
  if (o.on.kind === "selection")
    return [
      { key: "h", label: "Highlight" },
      { key: "n", label: "Note" },
      { key: "y", label: "Copy" },
    ];
  if (o.on.hover === true) return [];
  const note = menuAnnotation(s)?.item.kind === "note";
  return [
    ...(note ? [{ key: "e", label: "Edit" }] : []),
    { key: "d", label: "Delete" },
    { key: "y", label: "Copy" },
  ];
}

/** The annotation the open float is about, and its PDF. */
export function menuAnnotation(
  s: AppState,
): { pdf: string; item: PdfAnnotation } | undefined {
  const o = s.overlay;
  if (o.kind !== "pdfMenu" || o.on.kind !== "annotation") return undefined;
  const pdf = windowBuffer(s, o.window)?.path;
  const id = o.on.id;
  const item =
    pdf === undefined
      ? undefined
      : annotationsOf(s, pdf)?.find((i) => i.id === id);
  return pdf === undefined || item === undefined ? undefined : { pdf, item };
}

/**
 * A key while the float is open: its actions run, `<Esc>` and `q` close it,
 * and any other key closes it and goes on (undefined) as if it were not open.
 */
export function pdfMenuKey(
  s: AppState,
  key: string,
  now: number,
): Result | undefined {
  const o = s.overlay;
  if (o.kind !== "pdfMenu") return undefined;
  const hover = o.on.kind === "annotation" && o.on.hover === true;
  if ((key === "<Esc>" || key === "q") && !hover)
    return none({ ...s, overlay: { kind: "none" } });
  if (!pdfMenuItems(s).some((i) => i.key === key)) return undefined;
  return runPdfMenu(s, key, now);
}

/** Run the open float's action on `key` (a click on it does the same), closing the float. */
export function runPdfMenu(s: AppState, key: string, now: number): Result {
  const o = s.overlay;
  if (o.kind !== "pdfMenu") return none(s);
  const target = menuAnnotation(s);
  const closed: AppState = { ...s, overlay: { kind: "none" } };
  if (o.on.kind === "selection") {
    if (key === "h") return highlight(closed, now);
    if (key === "n") return note(closed, now);
    if (key === "y") return copySelection(closed);
    return none(closed);
  }
  if (target === undefined) return none(closed);
  if (key === "e" && target.item.kind === "note")
    return askNote(closed, target.pdf, target.item);
  if (key === "d") return removeAnnotation(closed, target.pdf, target.item);
  if (key === "y")
    return yankText(closed, target.item.quote, "copied the annotated text");
  return none(closed);
}

const newItem = (
  got: Selected,
  items: readonly PdfAnnotation[],
  now: number,
  kind: PdfAnnotation["kind"],
): PdfAnnotation => ({
  id: newAnnotationId(now, new Set(items.map((i) => i.id))),
  kind,
  page: got.sel.page,
  anchor: got.sel.anchor,
  head: got.sel.head,
  ...(got.sel.by === undefined ? {} : { by: got.sel.by }),
  quote: selectionText(got.runs),
  created: iso(now),
});

/** The selected text highlighted and the selection ended. */
function highlight(s: AppState, now: number): Result {
  const got = selectedIn(s);
  if ("stop" in got) return got.stop;
  const items = editable(s, got.b.path);
  if ("stop" in items) return items.stop;
  const item = newItem(got, items, now, "highlight");
  return chain(
    setAnnotations(withoutSelection(s), got.b.path, [...items, item]),
    (st) => message(st, "highlighted"),
  );
}

/** A note on the selected text: a prompt asks for it, the selection still shown. */
function note(s: AppState, now: number): Result {
  const got = selectedIn(s);
  if ("stop" in got) return got.stop;
  const items = editable(s, got.b.path);
  if ("stop" in items) return items.stop;
  return askNote(s, got.b.path, newItem(got, items, now, "note"));
}

/** The note prompt for annotation `item` of PDF `pdf`, holding its note. */
const askNote = (s: AppState, pdf: string, item: PdfAnnotation): Result =>
  none({
    ...s,
    overlay: {
      kind: "prompt",
      prompt: {
        kind: "input",
        title: `Note on page ${item.page}`,
        value: item.note ?? "",
        pdfNote: { pdf, item },
      },
    },
  });

/**
 * A key in the note prompt: Enter keeps the note and ends the selection;
 * an empty note adds nothing, and turns a note into a highlight.
 */
export function notePromptKey(
  s: AppState,
  p: Extract<PromptState, { pdfNote: object }>,
  key: string,
  now: number,
): Result {
  if (key === "<Esc>") return none({ ...s, overlay: { kind: "none" } });
  if (key !== "<CR>") {
    const f = typed(p, key);
    if (f === undefined) return none(s);
    if (f.value === p.value) return none(movedCaret(s, f.caret));
    return none({
      ...s,
      overlay: { kind: "prompt", prompt: { ...p, ...f } },
    });
  }
  const closed: AppState = { ...s, overlay: { kind: "none" } };
  const { pdf, item } = p.pdfNote;
  const items = editable(closed, pdf);
  if ("stop" in items) return items.stop;
  const text = p.value.trim();
  const had = items.find((i) => i.id === item.id);
  if (had === undefined && text === "") return none(closed);
  const { note: _, ...base } = had ?? item;
  const next: PdfAnnotation =
    text === ""
      ? { ...base, kind: "highlight", updated: iso(now) }
      : had === undefined
        ? { ...base, kind: "note", note: text }
        : { ...base, kind: "note", note: text, updated: iso(now) };
  const list =
    had === undefined
      ? [...items, next]
      : items.map((i) => (i.id === next.id ? next : i));
  return chain(setAnnotations(withoutSelection(closed), pdf, list), (st) =>
    message(st, had === undefined ? "noted" : "note saved"),
  );
}

function removeAnnotation(
  s: AppState,
  pdf: string,
  item: PdfAnnotation,
): Result {
  const items = editable(s, pdf);
  if ("stop" in items) return items.stop;
  return chain(
    setAnnotations(
      s,
      pdf,
      items.filter((i) => i.id !== item.id),
    ),
    (st) => message(st, `deleted the ${item.kind}`),
  );
}

/** A PDF or folder renamed or moved in the workspace: its annotations move with it, on disk and in memory. */
export function moveAnnotations(s: AppState, op: FsOp): Result {
  const to = op.to;
  if (
    to === undefined ||
    op.outside === true ||
    (op.kind !== "rename" && op.kind !== "move")
  )
    return none(s);
  const dir = op.dir === true;
  if (!dir && !op.from.toLowerCase().endsWith(".pdf")) return none(s);
  const moved = (p: string) =>
    p === op.from
      ? to
      : dir && p.startsWith(`${op.from}/`)
        ? `${to}${p.slice(op.from.length)}`
        : undefined;
  const annotations = Object.fromEntries(
    Object.entries(s.annotations).map(([p, a]) => [moved(p) ?? p, a]),
  );
  return {
    state: { ...s, annotations },
    effects: [{ kind: "moveAnnotations", from: op.from, to, dir }],
  };
}

/** Open the float on the active PDF window's selection. */
function openSelectionMenu(s: AppState): Result {
  const got = selectedIn(s);
  return "stop" in got ? got.stop : none(openMenu(s, { kind: "selection" }));
}

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

export const pdfAnnotateCommands = [
  cmd("pdf.annotate.menu", "Show the actions for the selected text", (c) =>
    openSelectionMenu(c.state),
  ),
  cmd("pdf.annotate.highlight", "Highlight the selected text", (c) =>
    highlight(c.state, c.now),
  ),
  cmd("pdf.annotate.note", "Write a note on the selected text", (c) =>
    note(c.state, c.now),
  ),
];

export const pdfAnnotateBindings: readonly Binding[] = [
  {
    scope: { mode: "normal", filetype: "pdf" },
    seq: "ga",
    id: "pdf.annotate.menu",
  },
];
