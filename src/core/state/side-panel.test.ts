import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { CONTEXT_MAX, summarize } from "../features/links/summarize";
import { splitKeys } from "../kernel/vim/keys";
import { linesOf, scanDoc } from "../lang/markdown/scan";
import { fullText } from "./buffers";
import { runCommand } from "./commands";
import { sidePanelRows } from "./side-panel";
import type { Action, AppState, Effect, SearchHit } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);

const NOTES: Record<string, string> = {
  "plan.md": "---\naliases: [roadmap]\n---\n# Plan\n",
  "a.md": "see [[plan]]\n",
  "b.md": "the plan is late\n",
  "c.md": "our roadmap\n",
};

function run(s: AppState, ...actions: Action[]) {
  const effects: Effect[] = [];
  for (const a of actions) {
    const r = update(s, a);
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}
const keys = (s: AppState, seq: string) =>
  run(
    s,
    ...splitKeys(seq).map((key): Action => ({ type: "key", key, now: 0 })),
  );

function opened(cols = 120, path = "plan.md"): AppState {
  const files = Object.keys(NOTES);
  const base: AppState = {
    ...fresh(),
    terminal: { ...fresh().terminal, cols },
  };
  return run(
    base,
    {
      type: "indexBatch",
      summaries: files.map((p) => {
        const text = NOTES[p] ?? "";
        return summarize(
          p,
          { mtime: 1, size: 0, ctime: 1 },
          scanDoc(text),
          linesOf(text),
        );
      }),
      files,
      done: files.length,
      total: files.length,
    },
    { type: "indexReady" },
    { type: "fileLoaded", path, file: textFile(NOTES[path] ?? "") },
  ).state;
}
const hit = (
  path: string,
  col: number,
  len: number,
  text: string,
): SearchHit => ({
  path,
  line: 0,
  col,
  len,
  text,
});
const mentionsSearch = (effects: Effect[]) =>
  effects.find(
    (e): e is Extract<Effect, { kind: "search" }> =>
      e.kind === "search" && e.mode === "mentions",
  );

test("backlinks dock and take focus at 100 columns, else open the picker", () => {
  const r = runCommand(opened(), "link.backlinks", 0, reg);
  expect(r.state.panels.side).toMatchObject({
    kind: "backlinks",
    open: true,
    focused: true,
    cursor: 0,
  });
  expect(r.state.panels.explorer.focused).toBe(false);
  expect(mentionsSearch(r.effects)).toMatchObject({
    names: ["plan", "roadmap"],
    exclude: "plan.md",
  });

  const narrow = runCommand(opened(80), "link.backlinks", 0, reg);
  expect(narrow.state.panels.side.open).toBe(false);
  expect(narrow.state.overlay).toMatchObject({
    kind: "picker",
    picker: { source: "backlinks", arg: "plan.md" },
  });
  const outline = runCommand(opened(80), "view.outline", 0, reg);
  expect(outline.state.overlay).toMatchObject({
    picker: { source: "headings" },
  });
});

test("linked rows come before unlinked rows from the newest search", () => {
  const r = runCommand(opened(), "link.backlinks", 0, reg);
  const id = mentionsSearch(r.effects)?.id ?? -1;
  const stale = run(r.state, {
    type: "searchResults",
    id: id - 1,
    hits: [hit("b.md", 4, 4, "the plan is late")],
    capped: false,
  }).state;
  expect(sidePanelRows(stale).map((x) => x.section)).toEqual(["linked"]);
  const s = run(r.state, {
    type: "searchResults",
    id,
    hits: [
      hit("b.md", 4, 4, "the plan is late"),
      hit("c.md", 4, 7, "our roadmap"),
    ],
    capped: false,
  }).state;
  expect(
    sidePanelRows(s).map((x) => [x.section, x.path, x.line, x.text]),
  ).toEqual([
    ["linked", "a.md", 0, "see [[plan]]"],
    ["unlinked", "b.md", 0, "the plan is late"],
    ["unlinked", "c.md", 0, "our roadmap"],
  ]);
  expect(sidePanelRows(s)[2]?.hit).toEqual({
    path: "c.md",
    range: { start: { line: 0, col: 4 }, end: { line: 0, col: 11 } },
    text: "roadmap",
  });
});

test("a linked row in a closed note shows its source line", () => {
  const s = runCommand(opened(), "link.backlinks", 0, reg).state;
  expect(Object.values(s.buffers).map((b) => b.path)).toEqual(["plan.md"]);
  expect(sidePanelRows(s)[0]).toMatchObject({
    section: "linked",
    path: "a.md",
    text: "see [[plan]]",
  });
});

test("a link's context is its trimmed line, cut for long lines", () => {
  const long = `  ${"word ".repeat(60)}[[plan]] end`;
  const [link] = summarize(
    "d.md",
    { mtime: 1, size: 0, ctime: 1 },
    scanDoc(long),
    linesOf(long),
  ).links;
  expect(link?.context).toBe(long.trim().slice(0, CONTEXT_MAX));
  expect(
    summarize("d.md", { mtime: 1, size: 0, ctime: 1 }, scanDoc(long)).links[0]
      ?.context,
  ).toBeUndefined();
});

test("panel keys move, open the row, and leave", () => {
  const r = runCommand(opened(), "link.backlinks", 0, reg);
  const id = mentionsSearch(r.effects)?.id ?? -1;
  let s = run(r.state, {
    type: "searchResults",
    id,
    hits: [hit("b.md", 4, 4, "the plan is late")],
    capped: false,
  }).state;
  s = keys(s, "j").state;
  expect(s.panels.side.cursor).toBe(1);
  s = keys(s, "k").state;
  expect(s.panels.side.cursor).toBe(0);
  const open = keys(s, "<CR>");
  expect(open.effects).toContainEqual({ kind: "read", path: "a.md" });
  expect(open.state.panels.side).toMatchObject({ open: true, focused: false });
  expect(open.state.jumps.entries).toHaveLength(1);

  expect(keys(s, "<C-w>h").state.panels.side.focused).toBe(false);
  expect(keys(s, "q").state.panels.side).toMatchObject({
    open: false,
    focused: false,
  });
});

test("l links a mention in an open buffer in memory, or says it changed", () => {
  let s = run(opened(120, "b.md"), {
    type: "fileLoaded",
    path: "plan.md",
    file: textFile(NOTES["plan.md"] ?? ""),
  }).state;
  const r = runCommand(s, "link.backlinks", 0, reg);
  const id = mentionsSearch(r.effects)?.id ?? -1;
  s = run(r.state, {
    type: "searchResults",
    id,
    hits: [hit("b.md", 4, 4, "the plan is late")],
    capped: false,
  }).state;
  const linked = keys(s, "jl");
  const b = Object.values(linked.state.buffers).find((x) => x.path === "b.md");
  expect(b && fullText(b.text)).toBe("the [[plan]] is late");
  expect(b?.dirty).toBe(true);
  expect(linked.effects.some((e) => e.kind === "applyEdits")).toBe(false);
  // The linked mention leaves the unlinked rows at once.
  expect(sidePanelRows(linked.state).map((x) => x.section)).toEqual(["linked"]);

  const changed = {
    ...s,
    panels: {
      ...s.panels,
      side: {
        ...s.panels.side,
        mentions: {
          id,
          pending: false,
          hits: [hit("b.md", 4, 4, "the PLAN is late")],
        },
      },
    },
  };
  const refused = keys(changed, "jl");
  expect(refused.state.notifications.toasts.map((t) => t.text)).toContain(
    "mention changed — not linked",
  );
});

test("l links a mention in a closed file through one applyEdits", () => {
  const r = runCommand(opened(), "link.backlinks", 0, reg);
  const id = mentionsSearch(r.effects)?.id ?? -1;
  const s = run(r.state, {
    type: "searchResults",
    id,
    hits: [hit("c.md", 4, 7, "our roadmap")],
    capped: false,
  }).state;
  const linked = keys(s, "jl");
  expect(linked.effects.filter((e) => e.kind === "applyEdits")).toEqual([
    {
      kind: "applyEdits",
      batch: linked.state.index.rewrite?.batch ?? -1,
      edit: {
        path: "c.md",
        edits: [
          {
            range: { start: { line: 0, col: 4 }, end: { line: 0, col: 11 } },
            expected: "roadmap",
            text: "[[plan|roadmap]]",
          },
        ],
      },
    },
  ]);
});

test("an undocked panel takes no keys and no focus", () => {
  const r = runCommand(opened(), "link.backlinks", 0, reg);
  const narrow = run(r.state, { type: "resize", cols: 80, rows: 24 }).state;
  const typed = keys(narrow, "j");
  expect(typed.state.panels.side.cursor).toBe(0);
  const w = typed.state.windows.byId[typed.state.windows.active];
  expect(w?.content.cursor.line).toBe(1);
  const left = keys(r.state, "<C-w>h").state;
  const small = run(left, { type: "resize", cols: 80, rows: 24 }).state;
  expect(keys(small, "<C-w>l").state.panels.side.focused).toBe(false);
  expect(keys(left, "<C-w>l").state.panels.side.focused).toBe(true);
});

test("with the explorer on the right, the panel docks left: C-w h enters, C-w l leaves", () => {
  const base = opened();
  const s = {
    ...base,
    config: { ...base.config, explorer: { position: "right" as const } },
  };
  const r = runCommand(s, "link.backlinks", 0, reg);
  expect(r.state.panels.side.focused).toBe(true);
  expect(keys(r.state, "<C-w>h").state.panels.side.focused).toBe(true);
  const left = keys(r.state, "<C-w>l").state;
  expect(left.panels.side.focused).toBe(false);
  expect(keys(left, "<C-w>l").state.panels.side.focused).toBe(false);
  expect(keys(left, "<C-w>h").state.panels.side.focused).toBe(true);
});
