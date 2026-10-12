import { linkText } from "../features/links/resolve";
import type { PdfOutlineItem } from "../features/pdf/outline";
import { nextHitPage, pdfHits } from "../features/pdf/search";
import type { Binding } from "../kernel/commands/defaults";
import type { Command } from "../kernel/commands/registry";
import type { Key } from "../kernel/vim/keys";
import type { SearchCount } from "../kernel/vim/search";
import type { CommandContext, CommandResult } from "./commands";
import {
  PDF_MISSING,
  pdfWindow,
  sameStamp,
  setPdfWindow,
  showPdfPage,
  windowBuffer,
} from "./pdf";
import { openPicker, refreshPicker } from "./picker";
import { chain, message, none } from "./result";
import type {
  Action,
  AppState,
  BufferState,
  PdfLoad,
  Result,
  WindowId,
} from "./types";
import type { Registries } from "./update";

type Loadable = "pdfText" | "pdfOutline";

/** Ask for `what` of the PDF `b` unless it is loaded, loading, or failed for its current bytes. */
function load(s: AppState, b: BufferState, what: Loadable): Result {
  if (sameStamp(b[what]?.stamp, b.stamp)) return none(s);
  return {
    state: {
      ...s,
      buffers: {
        ...s.buffers,
        [b.id]: { ...b, [what]: { status: "loading", stamp: b.stamp } },
      },
    },
    effects: [{ kind: what, path: b.path, stamp: b.stamp }],
  };
}

/** Store an answer for the bytes it was read from; a stale answer is dropped. */
function store<T>(
  s: AppState,
  a: { path: string; stamp: BufferState["stamp"] },
  what: Loadable,
  result:
    | { kind: "ok"; value: T }
    | { kind: "missing" }
    | { kind: "failed"; reason: string },
): { s: AppState; b: BufferState } | undefined {
  const b = Object.values(s.buffers).find((x) => x.path === a.path);
  if (b === undefined || !sameStamp(b.stamp, a.stamp)) return undefined;
  const value: PdfLoad<T> =
    result.kind === "ok"
      ? { status: "ready", stamp: a.stamp, value: result.value }
      : {
          status: "failed",
          stamp: a.stamp,
          reason:
            result.kind === "missing" ? "Poppler not found" : result.reason,
        };
  const next = { ...b, [what]: value };
  return { s: { ...s, buffers: { ...s.buffers, [b.id]: next } }, b: next };
}

const failure = (r: { kind: string }, s: AppState): Result | undefined =>
  r.kind === "missing" ? message(s, PDF_MISSING, "error") : undefined;

/** The text arrived: searches waiting for it run. */
export function onPdfText(
  s: AppState,
  a: Extract<Action, { type: "pdfText" }>,
): Result {
  const r = a.result;
  const got = store(
    s,
    a,
    "pdfText",
    r.kind === "ok" ? { kind: "ok", value: r.pages } : r,
  );
  if (got === undefined) return none(s);
  let out = none(got.s);
  for (const w of Object.values(got.s.windows.byId)) {
    if (w.content.bufferId !== got.b.id) continue;
    const q = pdfWindow(out.state, w.id)?.search;
    if (q?.pending !== true) continue;
    out = chain(out, (st) => findHit(st, w.id, q.dir, true));
  }
  return failure(r, out.state) ?? out;
}

/** The contents arrived: an open contents picker lists them. */
export function onPdfOutline(
  s: AppState,
  a: Extract<Action, { type: "pdfOutline" }>,
  reg: Registries,
): Result {
  const r = a.result;
  const got = store<PdfOutlineItem[]>(
    s,
    a,
    "pdfOutline",
    r.kind === "ok" ? { kind: "ok", value: r.items } : r,
  );
  if (got === undefined) return none(s);
  const out = refreshPicker(got.s, reg, "pdfOutline");
  return failure(r, out.state) ?? out;
}

type Here = { s: AppState; id: WindowId; b: BufferState };

function here(s: AppState): Here | undefined {
  const id = s.windows.active;
  const b = windowBuffer(s, id);
  return b === undefined || pdfWindow(s, id) === undefined
    ? undefined
    : { s, id, b };
}

const onPdf =
  (f: (h: Here) => Result) =>
  (c: CommandContext): Result => {
    const h = here(c.state);
    return h === undefined ? none(c.state) : f(h);
  };

/**
 * Show the next page with a hit for window `id`'s search, from its page in
 * `dir`; `inclusive` lets the page shown count, as a new search does.
 */
function findHit(
  s: AppState,
  id: WindowId,
  dir: 1 | -1,
  inclusive: boolean,
): Result {
  const ws = pdfWindow(s, id);
  const b = windowBuffer(s, id);
  const q = ws?.search;
  if (ws === undefined || b === undefined || q === undefined) return none(s);
  const text = b.pdfText;
  if (text === undefined || !sameStamp(text.stamp, b.stamp)) {
    const waiting = setPdfWindow(s, id, {
      ...ws,
      search: { ...q, pending: true },
    });
    return chain(load(waiting, b, "pdfText"), (st) =>
      message(st, `searching ${b.path}…`),
    );
  }
  const { pending: _, ...search } = q;
  const st = setPdfWindow(s, id, { ...ws, search });
  if (text.status === "loading")
    return none(
      setPdfWindow(s, id, { ...ws, search: { ...search, pending: true } }),
    );
  if (text.status === "failed")
    return message(st, `cannot search ${b.path}: ${text.reason}`, "error");
  if (text.value.every((p) => p.trim() === ""))
    return message(st, "no text in this PDF (scanned pages?)", "error");
  const hits = pdfHits(text.value, search.query);
  const next = nextHitPage(hits, ws.page, dir, inclusive);
  if (next === undefined)
    return message(st, `not found: ${search.query}`, "error");
  const n = hits[next.page - 1] ?? 0;
  return message(
    showPdfPage(st, id, next.page),
    `"${search.query}": page ${next.page} · ${n} ${n === 1 ? "hit" : "hits"}${next.wrapped ? " · wrapped" : ""}`,
  );
}

/** Where the active PDF window's page is among its search's pages with hits. */
export function pdfSearchCount(s: AppState): SearchCount | undefined {
  const id = s.windows.active;
  const ws = pdfWindow(s, id);
  const b = windowBuffer(s, id);
  const text = b?.pdfText;
  if (ws?.search === undefined || text?.status !== "ready") return undefined;
  const hits = pdfHits(text.value, ws.search.query);
  const pages = hits.flatMap((n, i) => (n > 0 ? [i + 1] : []));
  if (pages.length === 0) return undefined;
  return {
    current: pages.filter((p) => p <= ws.page).length,
    total: pages.length,
    capped: false,
  };
}

const setCmdline = (s: AppState, cmdline: string): AppState => ({
  ...s,
  vim: {
    ...s.vim,
    mode: cmdline === "" ? "normal" : "cmdline",
    cmdline,
    pending: [],
  },
});

/** Whether keys go to a PDF window's `/` or `?` search line. */
export const pdfSearching = (s: AppState): boolean =>
  s.vim.mode === "cmdline" &&
  /^[/?]/.test(s.vim.cmdline) &&
  pdfWindow(s, s.windows.active) !== undefined;

/** A key on the search line: typed text, `<BS>`, `<Esc>`, or `<CR>` to search. */
export function pdfSearchKey(s: AppState, a: { key: Key }): Result {
  const line = s.vim.cmdline;
  switch (a.key) {
    case "<Esc>":
      return none(setCmdline(s, ""));
    case "<BS>": {
      const chars = [...line];
      return none(
        setCmdline(s, chars.length <= 1 ? "" : chars.slice(0, -1).join("")),
      );
    }
    case "<CR>": {
      const id = s.windows.active;
      const ws = pdfWindow(s, id);
      const st = setCmdline(s, "");
      if (ws === undefined) return none(st);
      const dir = line.startsWith("?") ? -1 : 1;
      const typed = line.slice(1);
      const query = typed.trim() === "" ? ws.search?.query : typed;
      if (query === undefined) return none(st);
      return findHit(
        setPdfWindow(st, id, { ...ws, search: { query, dir } }),
        id,
        dir,
        true,
      );
    }
    default:
      return [...a.key].length === 1
        ? none(setCmdline(s, line + a.key))
        : none(s);
  }
}

/** `n` repeats the last search its way; `N` the other way. */
const searchAgain = (reverse: boolean) =>
  onPdf((h) => {
    const q = pdfWindow(h.s, h.id)?.search;
    if (q === undefined) return message(h.s, "no previous search");
    const dir = reverse ? (-q.dir as 1 | -1) : q.dir;
    return findHit(h.s, h.id, dir, false);
  });

/** `text` in the unnamed register and on the clipboard, with `note` shown. */
export function yankText(s: AppState, text: string, note: string): Result {
  const yanked: AppState = {
    ...s,
    vim: {
      ...s.vim,
      registers: s.vim.registers.yank(undefined, { text, linewise: false }),
    },
  };
  return chain(message(yanked, note), (st) => ({
    state: st,
    effects: [{ kind: "clipboardWrite", text }],
  }));
}

/** `![[paper.pdf#page=7]]` on the clipboard and in the unnamed register. */
const copyLink = onPdf(({ s, id, b }) => {
  const page = pdfWindow(s, id)?.page ?? 1;
  const text = `![[${linkText(s.index.ix, "", b.path)}#page=${page}]]`;
  return yankText(s, text, `copied ${text}`);
});

const contents = (c: CommandContext): Result => {
  const h = here(c.state);
  if (h === undefined) return none(c.state);
  return chain(load(h.s, h.b, "pdfOutline"), (st) =>
    openPicker({ ...c, state: st }, "pdfOutline"),
  );
};

const dark = onPdf(({ s, id }) => {
  const ws = pdfWindow(s, id);
  if (ws === undefined) return none(s);
  const { dark: on, ...rest } = ws;
  return none(
    setPdfWindow(s, id, on === true ? rest : { ...rest, dark: true }),
  );
});

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

export const pdfToolCommands = [
  cmd(
    "pdf.search",
    "Search the PDF's text",
    onPdf(({ s }) => none(setCmdline(s, "/"))),
  ),
  cmd(
    "pdf.searchBack",
    "Search the PDF's text backward",
    onPdf(({ s }) => none(setCmdline(s, "?"))),
  ),
  cmd("pdf.searchNext", "Next page with a search hit", searchAgain(false)),
  cmd("pdf.searchPrev", "Previous page with a search hit", searchAgain(true)),
  cmd("pdf.copyLink", "Copy a link to this page", copyLink),
  cmd(
    "pdf.goTo",
    "Go to page",
    onPdf(({ s }) => none(setCmdline(s, ":Page "))),
  ),
  cmd("pdf.contents", "PDF contents", contents),
  cmd("pdf.dark", "Toggle dark page", dark),
];

const KEYS: readonly (readonly [string, string])[] = [
  ["/", "pdf.search"],
  ["?", "pdf.searchBack"],
  ["n", "pdf.searchNext"],
  ["N", "pdf.searchPrev"],
  ["<leader>py", "pdf.copyLink"],
  ["<leader>pi", "pdf.dark"],
  ["<leader>po", "pdf.contents"],
  ["<leader>pg", "pdf.goTo"],
];

export const pdfToolBindings: readonly Binding[] = KEYS.map(([seq, id]) => ({
  scope: { mode: "normal", filetype: "pdf" },
  seq,
  id,
}));

export const pdfGroups = { "<leader>p": "pdf" } as const;
