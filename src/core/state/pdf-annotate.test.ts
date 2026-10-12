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
import type { Action, AppState, Effect, MouseTarget, Result } from "./types";
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

/** A 100×100 pt page: "Hello brave" over "new world". */
const LAYOUT: PdfPageLayout = {
  width: 100,
  height: 100,
  lines: [
    [
      { text: "Hello", x0: 0, y0: 0, x1: 40, y1: 10 },
      { text: "brave", x0: 50, y0: 0, x1: 90, y1: 10 },
    ],
    [
      { text: "new", x0: 0, y0: 20, x1: 40, y1: 30 },
      { text: "world", x0: 50, y0: 20, x1: 90, y1: 30 },
    ],
  ],
};

const laidOut = (layout = LAYOUT): Action => ({
  type: "pdfLayout",
  path: PATH,
  stamp: stamp(1),
  page: 1,
  result: { kind: "ok", layout },
});

const read = (text: string | null): Action => ({
  type: "annotationsRead",
  pdf: PATH,
  text,
});

const fileOf = (items: PdfAnnotation[]) =>
  JSON.stringify({ version: 1, file: PATH, items });

const HELLO: PdfAnnotation = {
  id: "h1",
  kind: "highlight",
  page: 1,
  anchor: { x: 0.05, y: 0.05 },
  head: { x: 0.05, y: 0.05 },
  by: "word",
  quote: "Hello",
  created: "2026-10-12T08:00:00.000Z",
};

function openPaper(...more: Action[]): Result {
  return run(
    fresh(),
    { type: "fileLoaded", path: PATH, file: textFile("", 1) },
    {
      type: "pdfInfo",
      path: PATH,
      stamp: stamp(1),
      result: { kind: "ok", pages: 3 },
    },
    ...more,
  );
}

const at = (s: AppState, x: number, y: number): MouseTarget => ({
  kind: "window",
  window: s.windows.active,
  spot: { kind: "pdf", at: { x: x / 100, y: y / 100 } },
});
const mouse = (event: Extract<Action, { type: "mouse" }>["event"]): Action => ({
  type: "mouse",
  event,
  now: NOW,
});
const press = (s: AppState, x: number, y: number, clicks: 1 | 2 | 3 = 1) =>
  mouse({ kind: "press", target: at(s, x, y), clicks, ctrl: false });
const drag = (s: AppState, x: number, y: number) =>
  mouse({ kind: "drag", target: at(s, x, y) });
const release = (s: AppState, x: number, y: number) =>
  mouse({ kind: "release", target: at(s, x, y) });
const move = (s: AppState, x: number, y: number) =>
  mouse({ kind: "move", target: at(s, x, y) });

/** The items of the last annotations file written. */
const written = (r: Result): PdfAnnotation[] | undefined => {
  const w = r.effects.filter((e) => e.kind === "writeAnnotations").at(-1);
  return w === undefined ? undefined : JSON.parse(w.text).items;
};
const said = (s: AppState) => s.notifications.message?.text;
const sel = (s: AppState) => pdfWindow(s, s.windows.active)?.select;

/** A paper with its words and annotations in, "brave" selected by a double click. */
function selected(items: PdfAnnotation[] = []): AppState {
  const s = openPaper(laidOut(), read(fileOf(items))).state;
  return run(s, press(s, 60, 5, 2), release(s, 60, 5)).state;
}

test("a shown PDF has its annotations read once; no file means none", () => {
  const r = openPaper();
  expect(r.effects.filter((e) => e.kind === "readAnnotations")).toEqual([
    { kind: "readAnnotations", pdf: PATH },
  ]);
  expect(r.state.annotations[PATH]).toEqual({ status: "loading" });
  const s = run(r.state, read(null), ...keys("J")).state;
  expect(s.annotations[PATH]).toEqual({ status: "ready", items: [] });
});

test("letting go of a selection opens the action float on it; a plain click does not", () => {
  const s = selected();
  expect(s.overlay).toEqual({
    kind: "pdfMenu",
    window: s.windows.active,
    on: { kind: "selection" },
  });
  const p = openPaper(laidOut(), read(null)).state;
  expect(run(p, press(p, 60, 5), release(p, 60, 5)).state.overlay.kind).toBe(
    "none",
  );
  const dragged = run(p, press(p, 0, 5), drag(p, 95, 5), release(p, 95, 5));
  expect(dragged.state.overlay.kind).toBe("pdfMenu");
});

test("h highlights the selection: saved to the annotations file, selection ended", () => {
  const r = run(selected(), ...keys("h"));
  const items = written(r);
  expect(items).toHaveLength(1);
  expect(items?.[0]).toMatchObject({
    kind: "highlight",
    page: 1,
    by: "word",
    quote: "brave",
    created: "2026-10-12T09:00:00.000Z",
  });
  expect(r.state.overlay.kind).toBe("none");
  expect(sel(r.state)).toBeUndefined();
  expect(said(r.state)).toBe("highlighted");
  expect(r.state.annotations[PATH]).toMatchObject({ status: "ready" });
});

test("a click on a float action runs it", () => {
  const s = selected();
  const click = mouse({
    kind: "press",
    target: { kind: "overlayItem", index: 0 },
    clicks: 1,
    ctrl: false,
  });
  expect(written(run(s, click))?.[0]?.quote).toBe("brave");
});

test("Esc closes the float and keeps the selection; other keys close it and run", () => {
  const s = selected();
  const esc = run(s, ...keys("<Esc>")).state;
  expect(esc.overlay.kind).toBe("none");
  expect(sel(esc)).toBeDefined();
  const turned = run(s, ...keys("J")).state;
  expect(turned.overlay.kind).toBe("none");
  expect(pdfWindow(turned, turned.windows.active)?.page).toBe(2);
});

test("ga opens the float on the selection again", () => {
  const s = run(selected(), ...keys("<Esc>")).state;
  expect(run(s, ...keys("ga")).state.overlay.kind).toBe("pdfMenu");
});

test("a click on a highlight opens its float; d deletes it", () => {
  const s = openPaper(laidOut(), read(fileOf([HELLO]))).state;
  const opened = run(s, press(s, 10, 5), release(s, 10, 5)).state;
  expect(opened.overlay).toMatchObject({
    kind: "pdfMenu",
    on: { kind: "annotation", id: "h1" },
  });
  expect(sel(opened)).toBeUndefined();
  const r = run(opened, ...keys("d"));
  expect(written(r)).toEqual([]);
  expect(said(r.state)).toBe("deleted the highlight");
});

test("n asks for a note in a prompt; Enter saves it and ends the selection", () => {
  const asked = run(selected(), ...keys("n")).state;
  expect(asked.overlay).toMatchObject({
    kind: "prompt",
    prompt: { title: "Note on page 1", value: "", pdfNote: { pdf: PATH } },
  });
  expect(sel(asked)).toBeDefined();
  const r = run(asked, ...keys("why brave?<CR>"));
  expect(written(r)).toEqual([
    expect.objectContaining({
      kind: "note",
      quote: "brave",
      note: "why brave?",
    }),
  ]);
  expect(r.state.overlay.kind).toBe("none");
  expect(sel(r.state)).toBeUndefined();
  expect(said(r.state)).toBe("noted");
});

test("Esc or an empty note adds nothing; the selection stays", () => {
  const asked = run(selected(), ...keys("n")).state;
  for (const seq of ["abc<Esc>", "<CR>"]) {
    const r = run(asked, ...keys(seq));
    expect(written(r)).toBeUndefined();
    expect(r.state.overlay.kind).toBe("none");
    expect(sel(r.state)).toBeDefined();
  }
});

test("e edits a clicked note; emptied, it becomes a highlight", () => {
  const note: PdfAnnotation = { ...HELLO, kind: "note", note: "hi" };
  const s = openPaper(laidOut(), read(fileOf([note]))).state;
  const opened = run(s, press(s, 10, 5), release(s, 10, 5)).state;
  const asked = run(opened, ...keys("e")).state;
  expect(asked.overlay).toMatchObject({ prompt: { value: "hi" } });
  const edited = run(asked, ...keys("!<CR>"));
  expect(written(edited)?.[0]).toMatchObject({
    kind: "note",
    note: "hi!",
    updated: "2026-10-12T09:00:00.000Z",
  });
  const emptied = run(asked, ...keys("<BS><BS><CR>"));
  expect(written(emptied)?.[0]).not.toHaveProperty("note");
  expect(written(emptied)?.[0]?.kind).toBe("highlight");
});

test("resting the pointer on a note shows it; moving off hides it", () => {
  const note: PdfAnnotation = { ...HELLO, kind: "note", note: "hi" };
  const s = openPaper(laidOut(), read(fileOf([note]))).state;
  const over = run(s, move(s, 10, 5)).state;
  expect(over.overlay).toMatchObject({
    kind: "pdfMenu",
    on: { kind: "annotation", id: "h1", hover: true },
  });
  expect(run(over, move(s, 10, 50)).state.overlay.kind).toBe("none");
  expect(run(s, move(s, 60, 5)).state.overlay.kind).toBe("none");
});

test("an unreadable annotations file is never overwritten", () => {
  const s = openPaper(laidOut(), read("{bad")).state;
  expect(s.annotations[PATH]).toMatchObject({ status: "failed" });
  const t = run(s, press(s, 60, 5, 2), release(s, 60, 5)).state;
  const r = run(t, ...keys("h"));
  expect(written(r)).toBeUndefined();
  expect(said(r.state)).toContain("unreadable");
});

test("an annotation whose text moved follows it; one whose text is gone is detached", () => {
  const down = (dy: number) =>
    LAYOUT.lines.map((l) =>
      l.map((w) => ({ ...w, y0: w.y0 + dy, y1: w.y1 + dy })),
    );
  const moved: PdfPageLayout = {
    ...LAYOUT,
    lines: [[{ text: "Intro", x0: 0, y0: 0, x1: 40, y1: 10 }], ...down(40)],
  };
  const lost = { ...HELLO, id: "x", quote: "Goodbye" };
  const r = openPaper(read(fileOf([HELLO, lost])), laidOut(moved));
  expect(written(r)?.map((i) => i.id)).toEqual(["h1", "x"]);
  expect(r.state.annotations[PATH]).toMatchObject({ detached: ["x"] });
  expect(said(r.state)).toBe("1 annotation no longer matches page 1");
  const kept = run(r.state, laidOut(moved));
  expect(written(kept)).toBeUndefined();
});

test("renaming a PDF or its folder moves its annotations", () => {
  const s = openPaper(read(fileOf([HELLO]))).state;
  const r = run(s, {
    type: "fsResult",
    op: { kind: "rename", from: PATH, to: "docs/renamed.pdf" },
    ok: true,
  });
  expect(r.effects).toContainEqual({
    kind: "moveAnnotations",
    from: PATH,
    to: "docs/renamed.pdf",
    dir: false,
  });
  expect(r.state.annotations["docs/renamed.pdf"]).toMatchObject({
    status: "ready",
  });
  const folder = run(s, {
    type: "fsResult",
    op: { kind: "move", from: "docs", to: "papers/docs", dir: true },
    ok: true,
  });
  expect(folder.effects).toContainEqual({
    kind: "moveAnnotations",
    from: "docs",
    to: "papers/docs",
    dir: true,
  });
  const note = run(s, {
    type: "fsResult",
    op: { kind: "rename", from: "a.md", to: "b.md" },
    ok: true,
  });
  expect(note.effects.some((e) => e.kind === "moveAnnotations")).toBe(false);
});
