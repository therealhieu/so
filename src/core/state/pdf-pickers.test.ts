import { expect, test } from "bun:test";
import {
  fresh,
  stamp,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import type { PdfAnnotation } from "../features/pdf/annotations";
import type { PdfPageLayout } from "../features/pdf/layout";
import { splitKeys } from "../kernel/vim/keys";
import { pdfWindow } from "./pdf";
import { pdfPickerSources } from "./pdf-pickers";
import type { Action, AppState, Effect, Result } from "./types";
import { createUpdate } from "./update";

const update = createUpdate(testRegistries());

function run(s: AppState, ...actions: Action[]): Result {
  const effects: Effect[] = [];
  for (const a of actions) {
    const r = update(s, a);
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}

const NOW = Date.UTC(2026, 9, 12, 9);
const keys = (seq: string): Action[] =>
  splitKeys(seq).map((key) => ({ type: "key", key, now: NOW }));
const PATH = "docs/paper.pdf";

/** A 100×100 pt page holding "Hello brave". */
const LAYOUT: PdfPageLayout = {
  width: 100,
  height: 100,
  lines: [
    [
      { text: "Hello", x0: 0, y0: 0, x1: 40, y1: 10 },
      { text: "brave", x0: 50, y0: 0, x1: 90, y1: 10 },
    ],
  ],
};

const item = (over: Partial<PdfAnnotation>): PdfAnnotation => ({
  id: "x",
  kind: "highlight",
  page: 1,
  anchor: { x: 0.05, y: 0.05 },
  head: { x: 0.05, y: 0.05 },
  by: "word",
  quote: "Hello",
  created: "2026-10-12T08:00:00.000Z",
  ...over,
});

const ITEMS: PdfAnnotation[] = [
  item({
    id: "late",
    page: 3,
    quote: "closing words",
    anchor: { x: 0, y: 0.1 },
    head: { x: 0.2, y: 0.1 },
  }),
  item({
    id: "note",
    kind: "note",
    page: 2,
    quote: "Attention matters",
    note: "compare RNN",
    anchor: { x: 0, y: 0.5 },
    head: { x: 0.3, y: 0.5 },
  }),
  item({ id: "gone", quote: "no longer here" }),
  item({ id: "hello" }),
];

/** The paper open on page 2 with its annotations read and page 1 laid out (one detached). */
function paper(items = ITEMS): AppState {
  const s = run(
    fresh(),
    { type: "fileLoaded", path: PATH, file: textFile("", 1) },
    {
      type: "pdfInfo",
      path: PATH,
      stamp: stamp(1),
      result: { kind: "ok", pages: 3 },
    },
    {
      type: "pdfLayout",
      path: PATH,
      stamp: stamp(1),
      page: 1,
      result: { kind: "ok", layout: LAYOUT },
    },
    {
      type: "annotationsRead",
      pdf: PATH,
      text: JSON.stringify({ version: 1, file: PATH, items }),
    },
  ).state;
  return run(
    s,
    {
      type: "pdfLaidOut",
      window: s.windows.active,
      pageRows: 30,
      viewRows: 10,
      pageCols: 40,
      viewCols: 40,
    },
    ...keys(":Page 2<CR>"),
  ).state;
}

const picker = (s: AppState) =>
  s.overlay.kind === "picker" ? s.overlay.picker : undefined;
const ids = (s: AppState) => picker(s)?.items.map((i) => i.key);
const selected = (s: AppState) => {
  const p = picker(s);
  return p?.items[p.selected]?.key;
};
const said = (s: AppState) => s.notifications.message?.text;

test("<leader>pa opens the highlights and notes in reading order, detached last, at the shown page", () => {
  const s = run(paper(), ...keys(" pa")).state;
  expect(picker(s)).toMatchObject({ source: "pdfAnnotations", total: 4 });
  expect(ids(s)).toEqual(["hello", "note", "late", "gone"]);
  expect(selected(s)).toBe("note");
  expect(picker(s)?.items.map((i) => [i.label, i.detail])).toEqual([
    ["▍ Hello", "p. 1"],
    ["✎ Attention matters — compare RNN", "p. 2"],
    ["▍ closing words", "p. 3"],
    ["▍ no longer here", "p. 1 · detached"],
  ]);
});

test("the opening row falls back to the last annotation before the shown page", () => {
  const items = ITEMS.filter((i) => i.id !== "late");
  const s = run(paper(items), ...keys(":Page 3<CR> pa")).state;
  expect(selected(s)).toBe("note");
});

test("typing filters on the quote and the note", () => {
  const s = run(paper(), ...keys(" parnn")).state;
  expect(ids(s)).toEqual(["note"]);
});

test("Enter goes to the annotation's page with it in view and closes the picker", () => {
  const s = run(paper(), ...keys(" pa<C-p>")).state;
  expect(selected(s)).toBe("hello");
  const first = run(s, ...keys("<CR>")).state;
  expect(first.overlay.kind).toBe("none");
  expect(pdfWindow(first, first.windows.active)).toMatchObject({
    page: 1,
    scroll: 0,
  });
  const back = run(paper(), ...keys(" pa<CR>")).state;
  expect(pdfWindow(back, back.windows.active)).toMatchObject({
    page: 2,
    scroll: 12,
  });
});

test("a detached annotation only reaches its page, with a warning", () => {
  const s = run(paper(), ...keys(" pa<C-n><C-n><CR>")).state;
  expect(pdfWindow(s, s.windows.active)?.page).toBe(1);
  expect(said(s)).toBe("its text is no longer on page 1");
});

test("C-x deletes the selected annotation and lists the rest, C-y copies its quote", () => {
  const s = run(paper(), ...keys(" pa")).state;
  const copied = run(s, ...keys("<C-y>"));
  expect(copied.effects).toContainEqual({
    kind: "clipboardWrite",
    text: "Attention matters",
  });
  expect(picker(copied.state)?.source).toBe("pdfAnnotations");
  const deleted = run(s, ...keys("<C-x>"));
  const w = deleted.effects.find((e) => e.kind === "writeAnnotations");
  expect(
    w === undefined
      ? undefined
      : JSON.parse(w.text).items.map((i: PdfAnnotation) => i.id),
  ).toEqual(["gone", "hello", "late"]);
  expect(ids(deleted.state)).toEqual(["hello", "late", "gone"]);
  expect(said(deleted.state)).toBe("deleted the note");
});

test("C-e edits a note, or writes one on a highlight", () => {
  const s = run(paper(), ...keys(" pa")).state;
  expect(run(s, ...keys("<C-e>")).state.overlay).toMatchObject({
    kind: "prompt",
    prompt: { title: "Note on page 2", value: "compare RNN" },
  });
  const added = run(s, ...keys("<C-p><C-e>new<CR>"));
  const w = added.effects.find((e) => e.kind === "writeAnnotations");
  const hello =
    w === undefined
      ? undefined
      : JSON.parse(w.text).items.find((i: PdfAnnotation) => i.id === "hello");
  expect(hello).toMatchObject({ kind: "note", note: "new" });
});

test("the preview shows the page, the whole quote, and the whole note", () => {
  const s = run(paper(), ...keys(" pa")).state;
  const describe = pdfPickerSources.pdfAnnotations?.describe;
  const lines = (key: string) =>
    describe?.(s, { key, label: "", matches: [] }).map((l) => l.text);
  expect(lines("note")).toEqual([
    "Note · page 2",
    "",
    "Attention matters",
    "",
    "→ compare RNN",
  ]);
  expect(lines("gone")).toEqual([
    "Highlight · page 1",
    "its text is no longer on page 1",
    "",
    "no longer here",
  ]);
});
