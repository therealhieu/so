import { expect, test } from "bun:test";
import {
  fresh,
  stamp,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import { pdfWindow } from "./pdf";
import { statusSegments } from "./status";
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

/** `paper.pdf` open with `pages` pages counted and listed in the index. */
function openPaper(pages = 4): AppState {
  return run(
    fresh(),
    {
      type: "indexBatch",
      summaries: [],
      files: ["notes/a.md", PATH],
      done: 0,
      total: 0,
    },
    { type: "fileLoaded", path: PATH, file: textFile("", 1) },
    {
      type: "pdfInfo",
      path: PATH,
      stamp: stamp(1),
      result: { kind: "ok", pages },
    },
  ).state;
}

const page = (s: AppState) => pdfWindow(s, s.windows.active);
const said = (s: AppState) => s.notifications.message?.text;
const text = (pages: string[], n = 1): Action => ({
  type: "pdfText",
  path: PATH,
  stamp: stamp(n),
  result: { kind: "ok", pages },
});

test("<leader>py copies a link to the page to the clipboard and the unnamed register", () => {
  const r = run(openPaper(), ...keys("J<leader>py"));
  const link = "![[paper.pdf#page=2]]";
  expect(r.state.vim.registers.get('"')).toEqual({
    text: link,
    linewise: false,
  });
  expect(r.effects).toContainEqual({ kind: "clipboardWrite", text: link });
  expect(said(r.state)).toBe(`copied ${link}`);
});

test("<leader>po lists the contents once read and jumps to the chosen page", () => {
  const opened = run(openPaper(), ...keys("<leader>po"));
  expect(opened.effects).toContainEqual({
    kind: "pdfOutline",
    path: PATH,
    stamp: stamp(1),
  });
  const o = opened.state.overlay;
  expect(o.kind === "picker" && o.picker.source).toBe("pdfOutline");
  const stale = run(opened.state, {
    type: "pdfOutline",
    path: PATH,
    stamp: stamp(2),
    result: { kind: "ok", items: [{ title: "Old", page: 1, depth: 0 }] },
  }).state;
  const listed = run(stale, {
    type: "pdfOutline",
    path: PATH,
    stamp: stamp(1),
    result: {
      kind: "ok",
      items: [
        { title: "Introduction", page: 1, depth: 0 },
        { title: "Methods", page: 3, depth: 0 },
        { title: "Data", page: 4, depth: 1 },
      ],
    },
  }).state;
  const p =
    listed.overlay.kind === "picker" ? listed.overlay.picker : undefined;
  expect(p?.items.map((i) => [i.label, i.detail])).toEqual([
    ["Introduction", "p. 1"],
    ["Methods", "p. 3"],
    ["  Data", "p. 4"],
  ]);
  const chosen = run(listed, ...keys("meth<CR>")).state;
  expect(chosen.overlay.kind).toBe("none");
  expect(page(chosen)).toMatchObject({ page: 3, scroll: 0 });
  const again = run(chosen, ...keys("<leader>po"));
  expect(again.effects.filter((e) => e.kind === "pdfOutline")).toEqual([]);
});

test("<leader>pi turns the page dark and back, and stays dark across pages", () => {
  const dark = run(openPaper(), ...keys("<leader>pi")).state;
  expect(page(dark)?.dark).toBe(true);
  expect(page(run(dark, ...keys("J<leader>pi")).state)).toMatchObject({
    page: 2,
  });
  expect(page(run(dark, ...keys("<leader>pi")).state)?.dark).toBeUndefined();
});

test("/ reads the text once, then shows the next page with a hit; n and N move between them", () => {
  const typed = run(openPaper(), ...keys("/attention"));
  expect(typed.state.vim).toMatchObject({
    mode: "cmdline",
    cmdline: "/attention",
  });
  const asked = run(typed.state, ...keys("<CR>"));
  expect(asked.effects).toContainEqual({
    kind: "pdfText",
    path: PATH,
    stamp: stamp(1),
  });
  expect(asked.state.vim.mode).toBe("normal");
  let s = run(
    asked.state,
    text([
      "intro",
      "Attention is all\nyou need",
      "none",
      "attention attention",
    ]),
  ).state;
  expect(page(s)?.page).toBe(2);
  expect(said(s)).toBe('"attention": page 2 · 1 hit');
  expect(statusSegments(s).search).toEqual({
    current: 1,
    total: 2,
    capped: false,
  });
  s = run(s, ...keys("n")).state;
  expect(page(s)?.page).toBe(4);
  expect(said(s)).toBe('"attention": page 4 · 2 hits');
  s = run(s, ...keys("n")).state;
  expect(page(s)?.page).toBe(2);
  expect(said(s)).toBe('"attention": page 2 · 1 hit · wrapped');
  s = run(s, ...keys("N")).state;
  expect(page(s)?.page).toBe(4);
  const again = run(s, ...keys("/all you<CR>"));
  expect(again.effects.filter((e) => e.kind === "pdfText")).toEqual([]);
  expect(page(again.state)?.page).toBe(2);
});

test("? searches backward, and a search that finds nothing says so", () => {
  let s = run(openPaper(), text(["x", "y", "x", "z"])).state;
  s = run(s, ...keys("J?x<CR>")).state;
  expect(page(s)?.page).toBe(1);
  s = run(s, ...keys("n")).state;
  expect(page(s)?.page).toBe(3);
  const missing = run(s, ...keys("/nowhere<CR>")).state;
  expect(page(missing)?.page).toBe(3);
  expect(said(missing)).toBe("not found: nowhere");
  expect(statusSegments(missing).search).toBeUndefined();
});

test("a PDF of pictures has no text to search, and <Esc> leaves the search line", () => {
  const scanned = run(openPaper(), text(["", " \n", ""]), ...keys("/word<CR>"));
  expect(said(scanned.state)).toBe("no text in this PDF (scanned pages?)");
  const left = run(openPaper(), ...keys("/wo<BS><BS><BS>")).state;
  expect(left.vim).toMatchObject({ mode: "normal", cmdline: "" });
  const cancelled = run(openPaper(), ...keys("/word<Esc>")).state;
  expect(cancelled.vim.mode).toBe("normal");
  expect(page(cancelled)?.search).toBeUndefined();
  expect(said(run(openPaper(), ...keys("n")).state)).toBe("no previous search");
});

test("<leader>pg goes to a typed page; the markdown leader keys do nothing in a PDF", () => {
  const typed = run(openPaper(), ...keys("<leader>pg"));
  expect(typed.state.vim).toMatchObject({ mode: "cmdline", cmdline: ":Page " });
  expect(page(run(typed.state, ...keys("3<CR>")).state)?.page).toBe(3);
  for (const seq of ["<leader>o", "<leader>sh<Esc>", "<leader>z"]) {
    const s = run(openPaper(), ...keys(seq)).state;
    expect(s.overlay.kind === "picker" || s.overlay.kind === "zoom").toBe(
      false,
    );
    expect(page(s)?.zoom).toBeUndefined();
  }
});
