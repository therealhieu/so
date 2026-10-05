import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { summarize } from "../features/links/summarize";
import { splitKeys } from "../kernel/vim/keys";
import { scanDoc } from "../lang/markdown/scan";
import { runCommand } from "./commands";
import { GREP_LIMIT, PREVIEW_MIN_COLS, SEARCH_DEBOUNCE_MS } from "./picker";
import type { Action, AppState, Effect, PickerState, SearchHit } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);
const FILES = ["notes/plan.md", "notes/ideas.md", "projects/so-roadmap.md"];

function indexed(cols = 120, files = FILES): AppState {
  let s: AppState = {
    ...fresh(),
    terminal: { ...fresh().terminal, cols },
  };
  s = update(s, {
    type: "indexBatch",
    summaries: [],
    files,
    done: files.length,
    total: files.length,
  }).state;
  return update(s, { type: "indexReady" }).state;
}
function keys(s: AppState, seq: string) {
  const effects: Effect[] = [];
  for (const key of splitKeys(seq)) {
    const r = update(s, { type: "key", key, now: 0 });
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}
const run = (s: AppState, id: string) => runCommand(s, id, 0, reg);
const picker = (s: AppState): PickerState => {
  if (
    s.overlay.kind !== "picker" &&
    s.overlay.kind !== "palette" &&
    s.overlay.kind !== "help"
  )
    throw new Error(`no picker: ${s.overlay.kind}`);
  return s.overlay.picker;
};
const SEARCH_TIMER: Action = { type: "timer", id: "search", now: 100 };
const searches = (effects: Effect[]) =>
  effects.filter((e) => e.kind === "search");
const hit = (path: string, line: number): SearchHit => ({
  path,
  line,
  col: 0,
  len: 1,
  text: "a line",
});

test("files rank by fuzzy score and accept opens the file with a jump", () => {
  let s = run(indexed(), "file.find").state;
  expect(s.overlay.kind).toBe("picker");
  s = keys(s, "srd").state;
  expect(picker(s).items[0]?.label).toBe("projects/so-roadmap.md");
  expect(picker(s).total).toBe(3);
  const r = keys(s, "<CR>");
  expect(r.state.overlay.kind).toBe("none");
  expect(r.effects).toContainEqual({
    kind: "read",
    path: "projects/so-roadmap.md",
  });
});

test("grep searches once per settled query with the newest id", () => {
  let s = run(indexed(), "search.grep").state;
  const typed = keys(s, "a");
  expect(typed.effects).toContainEqual({
    kind: "startTimer",
    id: "search",
    ms: SEARCH_DEBOUNCE_MS,
  });
  expect(searches(typed.effects)).toEqual([]);
  s = keys(typed.state, "b").state;
  const r = update(s, SEARCH_TIMER);
  expect(searches(r.effects)).toEqual([
    {
      kind: "search",
      id: s.index.searchSeq + 1,
      query: "ab",
      limit: GREP_LIMIT,
    },
  ]);
  expect(picker(r.state).search).toEqual({
    id: s.index.searchSeq + 1,
    pending: true,
    capped: false,
  });
});

test("results for an old search are dropped and large results are capped", () => {
  let s = keys(run(indexed(), "search.grep").state, "a").state;
  s = update(s, SEARCH_TIMER).state;
  const first = picker(s).search?.id ?? -1;
  s = keys(s, "b").state;
  s = update(s, SEARCH_TIMER).state;
  const newest = picker(s).search?.id ?? -1;
  expect(newest).toBeGreaterThan(first);

  const stale = update(s, {
    type: "searchResults",
    id: first,
    hits: [hit("notes/plan.md", 0)],
    capped: false,
  }).state;
  expect(picker(stale).items).toEqual([]);

  const hits = Array.from({ length: GREP_LIMIT }, (_, i) =>
    hit("notes/plan.md", i),
  );
  const done = update(s, {
    type: "searchResults",
    id: newest,
    hits,
    capped: true,
  }).state;
  expect(picker(done).items).toHaveLength(GREP_LIMIT);
  expect(picker(done).search).toEqual({
    id: newest,
    pending: false,
    capped: true,
  });
  expect(picker(done).items[0]).toMatchObject({
    label: "notes/plan.md:1  a line",
    matches: [17],
    path: "notes/plan.md",
    line: 0,
  });
});

test("an empty query searches nothing", () => {
  let s = keys(run(indexed(), "search.grep").state, "a").state;
  s = keys(s, "<BS>").state;
  const r = update(s, SEARCH_TIMER);
  expect(searches(r.effects)).toEqual([]);
  expect(picker(r.state).items).toEqual([]);
});

test("preview loads only at 100 columns or wider", () => {
  const narrow = run(indexed(PREVIEW_MIN_COLS - 1), "file.find");
  expect(narrow.effects.some((e) => e.kind === "readPreview")).toBe(false);
  expect(picker(narrow.state).preview).toBeUndefined();

  const wide = run(indexed(120), "file.find");
  const read = wide.effects.find((e) => e.kind === "readPreview");
  expect(read).toEqual({
    kind: "readPreview",
    id: picker(wide.state).preview?.id ?? -1,
    path: "notes/ideas.md",
  });

  // Moving the selection makes the earlier read stale.
  const moved = keys(wide.state, "<C-n>").state;
  const late = update(moved, {
    type: "previewLoaded",
    id: picker(wide.state).preview?.id ?? -1,
    path: "notes/ideas.md",
    result: textFile("# Ideas\n"),
  }).state;
  expect(picker(late).preview?.file).toBeUndefined();
  const fresh = update(moved, {
    type: "previewLoaded",
    id: picker(moved).preview?.id ?? -1,
    path: picker(moved).preview?.path ?? "",
    result: { refused: "binary" },
  }).state;
  expect(picker(fresh).preview?.refused).toBe("binary");
});

test("a resize across 100 columns shows or drops the open picker's preview", () => {
  const narrow = run(indexed(PREVIEW_MIN_COLS - 1), "file.find").state;
  const resize = (s: AppState, cols: number) =>
    update(s, { type: "resize", cols, rows: 36 });

  const widened = resize(narrow, 120);
  expect(widened.effects.filter((e) => e.kind === "readPreview")).toEqual([
    {
      kind: "readPreview",
      id: picker(widened.state).preview?.id ?? -1,
      path: "notes/ideas.md",
    },
  ]);
  expect(resize(widened.state, 130).effects).toEqual([]);

  const narrowed = resize(widened.state, PREVIEW_MIN_COLS - 1);
  expect(narrowed.effects).toEqual([]);
  expect(picker(narrowed.state).preview).toBeUndefined();
});

test("the backlinks picker lists linking notes, then unlinked mentions", () => {
  const notes: Record<string, string> = {
    "plan.md": "# Plan\n",
    "a.md": "see [[plan]]\n",
    "b.md": "the plan is late\n",
  };
  const files = Object.keys(notes);
  let s: AppState = { ...fresh(), terminal: { ...fresh().terminal, cols: 80 } };
  for (const a of [
    {
      type: "indexBatch",
      summaries: files.map((p) =>
        summarize(p, { mtime: 1, size: 0, ctime: 1 }, scanDoc(notes[p] ?? "")),
      ),
      files,
      done: files.length,
      total: files.length,
    },
    { type: "indexReady" },
    { type: "fileLoaded", path: "plan.md", file: textFile("# Plan\n") },
  ] satisfies Action[])
    s = update(s, a).state;

  for (const [cols, id] of [
    [80, "link.backlinks"],
    [120, "search.backlinks"],
  ] as const) {
    const opened = run({ ...s, terminal: { ...s.terminal, cols } }, id);
    expect(picker(opened.state)).toMatchObject({
      source: "backlinks",
      arg: "plan.md",
    });
    expect(picker(opened.state).items.map((i) => i.label)).toEqual(["a.md:1"]);
    const asked = opened.effects.find(
      (e): e is Extract<Effect, { kind: "search" }> => e.kind === "search",
    );
    expect(asked).toMatchObject({ mode: "mentions", exclude: "plan.md" });

    const answered = update(opened.state, {
      type: "searchResults",
      id: asked?.id ?? -1,
      hits: [
        { path: "b.md", line: 0, col: 4, len: 4, text: "the plan is late" },
        { path: "a.md", line: 0, col: 6, len: 4, text: "see [[plan]]" },
      ],
      capped: false,
    }).state;
    const p = picker(answered);
    expect(p.items.map((i) => [i.label, i.detail])).toEqual([
      ["a.md:1", undefined],
      ["b.md:1", "unlinked mention"],
    ]);
    expect(p.total).toBe(2);
  }
});

test("recent hides removed files", () => {
  let s = indexed(120, ["a.md", "b.md"]);
  s = { ...s, recent: ["gone.md", "b.md", "a.md"] };
  s = run(s, "file.recent").state;
  expect(picker(s).items.map((i) => i.label)).toEqual(["b.md", "a.md"]);
});

test("the palette ranks commands by title for the active file type", () => {
  let s = update(indexed(), {
    type: "fileLoaded",
    path: "notes/plan.md",
    file: textFile("# Plan\n"),
  }).state;
  s = keys(run(s, "command.palette").state, "jump").state;
  expect(s.overlay.kind).toBe("palette");
  expect(
    picker(s)
      .items.map((i) => i.label)
      .slice(0, 3),
  ).toEqual(["Jump list", "Jump to newer position", "Jump to older position"]);
  const r = keys(s, "<Esc>");
  expect(r.state.overlay.kind).toBe("none");
});

test("help lists bindings with their commands", () => {
  const s = run(indexed(), "help.keymap").state;
  expect(s.overlay.kind).toBe("help");
  expect(picker(s).items.map((i) => i.label)).toContainEqual(
    "<leader>ff  Find file",
  );
});

test("an unavailable index shows the error row", () => {
  const s = update(indexed(), {
    type: "indexFailed",
    final: true,
    reason: "crash",
  }).state;
  expect(picker(run(s, "search.grep").state).error).toBe("index unavailable");
});

test("C-j and C-k move the selection like C-n and C-p", () => {
  const s = run(indexed(120), "file.find").state;
  const ctrl = keys(s, "<C-j><C-j><C-k>").state;
  expect(picker(ctrl).selected).toBe(1);
  expect(ctrl).toEqual(keys(s, "<C-n><C-n><C-p>").state);
});

function tagged(): AppState {
  const notes: Record<string, string> = {
    "a.md": "#so first\n",
    "b.md": "---\ntags: [so/ui]\n---\n",
    "c.md": "#daily\n",
  };
  let s = indexed(120, Object.keys(notes));
  s = update(s, {
    type: "indexBatch",
    summaries: Object.keys(notes).map((p) =>
      summarize(p, { mtime: 1, size: 0, ctime: 1 }, scanDoc(notes[p] ?? "")),
    ),
    files: Object.keys(notes),
    done: 3,
    total: 3,
  }).state;
  return update(s, { type: "indexReady" }).state;
}

test("C-l moves into a tag's notes, C-j/C-k move there, and Enter opens one", () => {
  const s = keys(run(tagged(), "search.tags").state, "so").state;
  expect(picker(s).items[picker(s).selected]?.key).toBe("so");
  const into = keys(s, "<C-l>").state;
  expect(picker(into).browse).toBe(0);
  // Two notes: moving stops at the last one and at the first one.
  const moved = keys(into, "<C-j><C-j><C-j>").state;
  expect(picker(moved).browse).toBe(1);
  expect(picker(moved).selected).toBe(picker(s).selected);
  expect(picker(keys(moved, "<C-k><C-k>").state).browse).toBe(0);
  const opened = keys(keys(into, "<C-j>").state, "<CR>");
  expect(opened.state.overlay.kind).toBe("none");
  expect(opened.effects).toContainEqual({ kind: "read", path: "b.md" });
});

test("C-h, backspace, or typing give the keys back to the tag list", () => {
  const into = keys(
    keys(run(tagged(), "search.tags").state, "so").state,
    "<C-l>",
  ).state;
  expect(picker(keys(into, "<C-h>").state).browse).toBeUndefined();
  const bs = keys(into, "<BS>").state;
  expect(picker(bs).browse).toBeUndefined();
  expect(picker(bs).query).toBe("so");
  const typed = keys(into, "/").state;
  expect(picker(typed).browse).toBeUndefined();
  expect(picker(typed).query).toBe("so/");
  expect(keys(into, "<Esc>").state.overlay.kind).toBe("none");
});

test("C-l does nothing in a picker without a notes list", () => {
  const s = run(indexed(120), "file.find").state;
  expect(keys(s, "<C-l>").state).toEqual(s);
});
