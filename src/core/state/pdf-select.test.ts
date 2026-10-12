import { expect, test } from "bun:test";
import {
  fresh,
  stamp,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import type { PdfPageLayout, PdfPoint } from "../features/pdf/layout";
import { splitKeys } from "../kernel/vim/keys";
import { pdfWindow } from "./pdf";
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

const keys = (seq: string): Action[] =>
  splitKeys(seq).map((key) => ({ type: "key", key, now: 0 }));
const PATH = "docs/paper.pdf";

function openPaper(): AppState {
  return run(
    fresh(),
    { type: "fileLoaded", path: PATH, file: textFile("", 1) },
    {
      type: "pdfInfo",
      path: PATH,
      stamp: stamp(1),
      result: { kind: "ok", pages: 3 },
    },
  ).state;
}

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

const laidOut = (page = 1, n = 1, layout = LAYOUT): Action => ({
  type: "pdfLayout",
  path: PATH,
  stamp: stamp(n),
  page,
  result: { kind: "ok", layout },
});

const on = (s: AppState, x: number, y: number) => ({
  kind: "window" as const,
  window: s.windows.active,
  spot: { kind: "pdf" as const, at: { x: x / 100, y: y / 100 } },
});
const press = (
  s: AppState,
  x: number,
  y: number,
  clicks: 1 | 2 | 3 = 1,
): Action => ({
  type: "mouse",
  event: { kind: "press", target: on(s, x, y), clicks, ctrl: false },
  now: 0,
});
const drag = (s: AppState, x: number, y: number): Action => ({
  type: "mouse",
  event: { kind: "drag", target: on(s, x, y) },
  now: 0,
});

const sel = (s: AppState) => pdfWindow(s, s.windows.active)?.select;
const said = (s: AppState) => s.notifications.message?.text;
const yanked = (r: Result) =>
  r.effects.flatMap((e) => (e.kind === "clipboardWrite" ? [e.text] : []));
const pt = (x: number, y: number): PdfPoint => ({ x: x / 100, y: y / 100 });

test("a shown page has its words asked for once, before any press", () => {
  const opened = run(
    fresh(),
    { type: "fileLoaded", path: PATH, file: textFile("", 1) },
    {
      type: "pdfInfo",
      path: PATH,
      stamp: stamp(1),
      result: { kind: "ok", pages: 3 },
    },
  );
  const asked = (r: Result) => r.effects.filter((e) => e.kind === "pdfLayout");
  expect(asked(opened)).toEqual([
    { kind: "pdfLayout", path: PATH, stamp: stamp(1), page: 1 },
  ]);
  const s = opened.state;
  const pressed = run(s, press(s, 5, 5));
  expect(sel(pressed.state)).toEqual({
    page: 1,
    anchor: pt(5, 5),
    head: pt(5, 5),
  });
  expect(asked(pressed)).toEqual([]);
  expect(asked(run(s, ...keys("J")))).toEqual([
    { kind: "pdfLayout", path: PATH, stamp: stamp(1), page: 2 },
  ]);
});

test("a drag then y copies the characters between press and pointer", () => {
  let s = openPaper();
  s = run(s, press(s, 60, 5), laidOut()).state;
  s = run(s, drag(s, 20, 25)).state;
  expect(sel(s)?.head).toEqual(pt(20, 25));
  const out = run(s, ...keys("y"));
  expect(yanked(out)).toEqual(["rave\nne"]);
  expect(out.state.vim.registers.get('"')?.text).toBe("rave\nne");
  expect(said(out.state)).toBe("copied 2 lines");
});

test("a double click copies a word, a triple click a line", () => {
  let s = run(openPaper(), laidOut()).state;
  s = run(s, press(s, 60, 25, 2)).state;
  expect(yanked(run(s, ...keys("y")))).toEqual(["world"]);
  s = run(s, press(s, 60, 25, 3)).state;
  expect(yanked(run(s, ...keys("y")))).toEqual(["new world"]);
});

test("y with nothing selected, before the words arrive, or on a page without text says why", () => {
  let s = openPaper();
  expect(said(run(s, ...keys("y")).state)).toBe("no selection");
  s = run(s, press(s, 5, 5), drag(s, 60, 5)).state;
  expect(said(run(s, ...keys("y")).state)).toBe("reading the page's text…");
  const empty = run(s, laidOut(1, 1, { width: 1, height: 1, lines: [] }));
  expect(said(run(empty.state, ...keys("y")).state)).toBe(
    "no text on this page (scanned?)",
  );
  const pressed = run(s, laidOut(), press(s, 5, 5)).state;
  expect(said(run(pressed, ...keys("y")).state)).toBe("no selection");
});

test("Esc, a press off the page, and turning the page end the selection", () => {
  let s = run(openPaper(), laidOut()).state;
  s = run(s, press(s, 5, 5, 2)).state;
  expect(sel(run(s, ...keys("<Esc>")).state)).toBeUndefined();
  const off: Action = {
    type: "mouse",
    event: {
      kind: "press",
      target: {
        kind: "window",
        window: s.windows.active,
        spot: { kind: "pdf" },
      },
      clicks: 1,
      ctrl: false,
    },
    now: 0,
  };
  expect(sel(run(s, off).state)).toBeUndefined();
  expect(sel(run(s, ...keys("J")).state)).toBeUndefined();
});

test("a layout for older bytes is dropped", () => {
  const s = run(openPaper(), laidOut(1, 2)).state;
  expect(
    Object.values(s.buffers).find((b) => b.path === PATH)?.pdfLayout?.[1],
  ).toMatchObject({ status: "loading", stamp: stamp(1) });
});
