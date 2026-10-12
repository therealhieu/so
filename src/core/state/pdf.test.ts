import { expect, test } from "bun:test";
import {
  fresh,
  stamp,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import { activeBuffer, activeWindow } from "./buffers";
import { PDF_MISSING, pdfWindow, WHEEL_GESTURE_MS } from "./pdf";
import { statusSegments } from "./status";
import type { Action, AppState, Effect, PdfInfoResult, Result } from "./types";
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
const ex = (line: string): Action[] => keys(`:${line}<CR>`);
const loaded = (path: string, n = 1): Action => ({
  type: "fileLoaded",
  path,
  file: textFile("", n),
});
const info = (result: PdfInfoResult, n = 1): Action => ({
  type: "pdfInfo",
  path: "docs/paper.pdf",
  stamp: stamp(n),
  result,
});
const laidOut = (
  s: AppState,
  pageRows: number,
  viewRows: number,
  pageCols = 40,
  viewCols = 40,
): Action => ({
  type: "pdfLaidOut",
  window: s.windows.active,
  pageRows,
  viewRows,
  pageCols,
  viewCols,
});

/** `paper.pdf` open with `pages` pages, drawn 30 rows tall in a 10-row window. */
function openPaper(pages = 3): AppState {
  const opened = run(
    fresh(),
    loaded("docs/paper.pdf"),
    info({ kind: "ok", pages }),
  );
  return run(opened.state, laidOut(opened.state, 30, 10)).state;
}

const page = (s: AppState) => pdfWindow(s, s.windows.active);

test("a PDF opens read-only in the pdf editor kind and asks for its page count", () => {
  const r = run(fresh(), loaded("docs/paper.pdf"));
  const b = activeBuffer(r.state);
  expect(b).toMatchObject({ fileType: "pdf", readOnly: true, binary: true });
  expect(b?.pdf).toEqual({ status: "loading", stamp: stamp(1) });
  expect(activeWindow(r.state)?.content.editor).toBe("pdf");
  expect(page(r.state)).toEqual({ page: 1, fit: "width", scroll: 0 });
  expect(r.effects).toContainEqual({
    kind: "pdfInfo",
    path: "docs/paper.pdf",
    stamp: stamp(1),
  });
});

test("the page count is asked once per file version, and a stale answer is dropped", () => {
  const opened = run(fresh(), loaded("docs/paper.pdf"));
  const again = run(opened.state, ...keys("j"));
  expect(again.effects.filter((e) => e.kind === "pdfInfo")).toEqual([]);
  const changed = run(opened.state, loaded("docs/paper.pdf", 2));
  expect(changed.effects).toContainEqual({
    kind: "pdfInfo",
    path: "docs/paper.pdf",
    stamp: stamp(2),
  });
  const stale = run(changed.state, info({ kind: "ok", pages: 9 }, 1));
  expect(activeBuffer(stale.state)?.pdf?.status).toBe("loading");
  const fresh2 = run(stale.state, info({ kind: "ok", pages: 4 }, 2));
  expect(activeBuffer(fresh2.state)?.pdf).toEqual({
    status: "ready",
    stamp: stamp(2),
    pages: 4,
  });
});

test("a PDF opened at a page subpath starts there, kept within its pages", () => {
  const s = fresh();
  const pending: AppState = {
    ...s,
    windows: {
      ...s.windows,
      restore: {
        pending: {
          [s.windows.active]: {
            path: "docs/paper.pdf",
            cursor: { line: 0, col: 0 },
            scroll: 0,
            navigated: true as const,
            subpath: "#page=4",
          },
        },
        missing: 0,
      },
    },
  };
  const r = run(pending, loaded("docs/paper.pdf"));
  expect(page(r.state)?.page).toBe(4);
  const counted = run(r.state, info({ kind: "ok", pages: 2 }));
  expect(page(counted.state)?.page).toBe(2);
});

test("j and k scroll through a tall page and cross into the next and previous", () => {
  let s = openPaper();
  s = run(s, ...keys("<C-d><C-d><C-d><C-d>")).state;
  expect(page(s)).toMatchObject({ page: 1, scroll: 20 });
  s = run(s, ...keys("j")).state;
  expect(page(s)).toMatchObject({ page: 2, scroll: 0 });
  s = run(s, ...keys("k")).state;
  expect(page(s)).toMatchObject({ page: 1, scroll: 20 });
});

test("J, K, gg, G, and :Page move between pages within range", () => {
  let s = openPaper(3);
  s = run(s, ...keys("JJJ")).state;
  expect(page(s)?.page).toBe(3);
  s = run(s, ...keys("gg")).state;
  expect(page(s)?.page).toBe(1);
  s = run(s, ...keys("G")).state;
  expect(page(s)?.page).toBe(3);
  s = run(s, ...keys("K")).state;
  expect(page(s)?.page).toBe(2);
  s = run(s, ...ex("Page 1")).state;
  expect(page(s)?.page).toBe(1);
  const out = run(s, ...ex("Page 7"));
  expect(out.state.notifications.message?.text).toBe("no page 7 (1–3)");
  expect(page(out.state)?.page).toBe(1);
  expect(run(s, ...ex("Page")).state.notifications.message?.text).toBe(
    "page 1/3",
  );
});

const notch = (
  s: AppState,
  dy: 1 | -1 | 0,
  now: number,
  dx: 1 | -1 | 0 = 0,
): Action => ({
  type: "mouse",
  event: {
    kind: "wheel",
    target: { kind: "window", window: s.windows.active, spot: { kind: "pdf" } },
    dx,
    dy,
  },
  now,
});

/** One notch as a terminal sends it: three wheel events at once. */
function scrollOnce(s: AppState, dy: 1 | -1, now: number): AppState {
  for (let i = 0; i < 3; i++) s = run(s, notch(s, dy, now)).state;
  return s;
}

test("the wheel scrolls three rows an event and crosses one page edge a gesture", () => {
  let s = run(openPaper(12), ...keys("<C-d><C-d><C-d>")).state;
  s = run(s, notch(s, 1, 0)).state;
  expect(page(s)).toMatchObject({ page: 1, scroll: 18 });
  s = scrollOnce(s, 1, 1000);
  expect(page(s)).toMatchObject({ page: 2, scroll: 3 });
  s = scrollOnce(s, -1, 2000);
  expect(page(s)).toMatchObject({ page: 1, scroll: 17 });
});

test("on a page that fits the window each wheel gesture turns one page", () => {
  let s = run(openPaper(12), laidOut(openPaper(12), 48, 50)).state;
  s = scrollOnce(s, 1, 0);
  expect(page(s)?.page).toBe(2);
  s = scrollOnce(s, 1, 100);
  expect(page(s)?.page).toBe(2);
  s = scrollOnce(s, 1, 100 + WHEEL_GESTURE_MS);
  expect(page(s)?.page).toBe(3);
  s = scrollOnce(s, -1, 1000);
  expect(page(s)?.page).toBe(2);
});

test("zoom grows the page in the window around its centre, and h and l pan it", () => {
  let s = run(openPaper(3), ...keys("+")).state;
  expect(page(s)).toMatchObject({
    fit: "width",
    zoom: 1.25,
    pan: 5,
    pageCols: 50,
    pageRows: 38,
    scroll: 1,
  });
  expect(statusSegments(s).page).toBe("1/3 125%");
  s = run(s, laidOut(s, 38, 10, 50, 40), ...keys("0<leader>pz")).state;
  expect(page(s)).toMatchObject({ zoom: 2, pan: 20, pageCols: 80 });
  s = run(s, laidOut(s, 60, 10, 80, 40), ...keys("l")).state;
  expect(page(s)?.pan).toBe(25);
  s = run(s, ...keys("llllllllh")).state;
  expect(page(s)?.pan).toBe(35);
  s = run(s, ...keys("J")).state;
  expect(page(s)).toMatchObject({ page: 2, scroll: 0, zoom: 2, pan: 35 });
  s = run(s, notch(s, 1, 0, -1)).state;
  expect(page(s)?.pan).toBe(29);
  const out = run(s, ...keys("<leader>pz")).state;
  expect(page(out)?.zoom).toBeUndefined();
  expect(page(out)?.pan).toBeUndefined();
  expect(statusSegments(out).page).toBe("2/3");
  expect(page(run(s, ...keys("a")).state)).toMatchObject({ fit: "page" });
  expect(page(run(s, ...keys("a")).state)?.zoom).toBeUndefined();
  expect(page(run(openPaper(3), ...keys("+++++++++")).state)?.zoom).toBe(4);
});

test("zoom out shrinks the page below the window's width, down to a quarter", () => {
  let s = run(openPaper(3), ...keys("-")).state;
  expect(page(s)).toMatchObject({ fit: "width", zoom: 0.8, pageCols: 32 });
  expect(page(s)?.pan).toBeUndefined();
  expect(statusSegments(s).page).toBe("1/3 80%");
  expect(page(run(s, ...keys("h")).state)?.pan).toBeUndefined();
  expect(page(run(s, ...keys("+")).state)?.zoom).toBeUndefined();
  s = run(s, ...keys("---------")).state;
  expect(page(s)?.zoom).toBe(0.25);
  expect(page(s)?.pageCols).toBe(10);
});

test("fit page turns pages with j and k", () => {
  let s = openPaper(3);
  s = run(s, ...keys("a")).state;
  expect(page(s)?.fit).toBe("page");
  s = run(s, ...keys("j")).state;
  expect(page(s)).toMatchObject({ page: 2, scroll: 0 });
  s = run(s, ...keys("s")).state;
  expect(page(s)?.fit).toBe("width");
});

test("without Poppler the PDF still opens and says how to view it", () => {
  const r = run(fresh(), loaded("docs/paper.pdf"), info({ kind: "missing" }));
  expect(activeBuffer(r.state)?.pdf?.status).toBe("missing");
  expect(r.state.notifications.message).toMatchObject({
    text: PDF_MISSING,
    level: "error",
  });
});

test("a PDF is never written", () => {
  const r = run(fresh(), loaded("docs/paper.pdf"), ...ex("w"));
  expect(r.effects.filter((e) => e.kind === "write")).toEqual([]);
  expect(r.state.notifications.message?.text).toBe("read-only file");
});

test("leaving a PDF and coming back keeps its page", () => {
  const note = run(fresh(), {
    type: "fileLoaded",
    path: "notes/a.md",
    file: textFile("# A\n"),
  }).state;
  let s = run(note, ...ex("e docs/paper.pdf"), loaded("docs/paper.pdf")).state;
  s = run(s, info({ kind: "ok", pages: 3 }), ...keys("J")).state;
  expect(page(s)?.page).toBe(2);
  s = run(s, ...keys("<C-^>")).state;
  expect(activeBuffer(s)?.path).toBe("notes/a.md");
  expect(activeWindow(s)?.content.editor).toBe("text");
  s = run(s, ...keys("<C-^>")).state;
  expect(activeBuffer(s)?.path).toBe("docs/paper.pdf");
  expect(page(s)?.page).toBe(2);
});
