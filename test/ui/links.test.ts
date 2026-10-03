import { afterEach, expect, test } from "bun:test";
import { fullText } from "../../src/core/state/buffers";
import { sidePanelRows } from "../../src/core/state/side-panel";
import type { SearchHit } from "../../src/core/state/types";
import {
  answerEdits,
  answerRead,
  answerSearch,
  FILES,
  indexFixture,
  lastEffect,
} from "../support/notes";
import { type Mounted, mountShell } from "../support/ui";

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

/** The fixture indexed (its toast gone), the explorer closed, and `path` open. */
async function opened(path: string): Promise<Mounted> {
  const x = await mountShell({ cols: 120, rows: 36 });
  indexFixture(x);
  x.advance(3000);
  x.keys("<leader>e");
  x.open(path, FILES[path] ?? "");
  return x;
}

const lines = async (x: Mounted) => (await x.frame()).split("\n");
const status = async (x: Mounted) => x.row(-2);
const textOf = (x: Mounted, path: string) => {
  const b = Object.values(x.store.get().buffers).find((b) => b.path === path);
  return b === undefined ? undefined : fullText(b.text);
};

/** In projects/so.md: line 27 is "Next: [[plan#Goals]] and [[plan]].", line 28 the unresolved link. */
const NEXT_LINE = "27j0f[";

const MENTIONS: SearchHit[] = [
  {
    path: "notes/ideas.md",
    line: 2,
    col: 4,
    len: 4,
    text: "The plan is to keep files plain.",
  },
  { path: "todo.md", line: 0, col: 15, len: 4, text: "- [ ] review the plan" },
];

test("completion never covers the cursor row and inserts the heading link", async () => {
  m = await opened("projects/so.md");
  m.keys("Go[[pl");
  let frame = await lines(m);
  const cursorRow = frame.findIndex((l) => /^ +\d+ \[\[pl\s*$/.test(l));
  const top = frame.findIndex((l) => l.includes("╭─ notes & aliases"));
  const bottom = frame.findIndex((l, i) => i > top && l.includes("╰──"));
  expect(cursorRow).toBeGreaterThan(0);
  // Fewer than 10 rows remain below the cursor line: the popup sits above it.
  expect(bottom).toBe(cursorRow - 1);
  expect(frame[top + 1]).toContain("▸ ◇ plan");

  m.keys("#");
  frame = await lines(m);
  const headings = frame.findIndex((l) => l.includes("╭─ headings · plan"));
  expect(headings).toBeGreaterThan(0);
  expect(frame.slice(headings, cursorRow).join("\n")).toContain("## Goals");
  expect(frame[cursorRow]).not.toContain("╰");

  m.keys("<C-n><CR>");
  expect(textOf(m, "projects/so.md")?.split("\n").at(-1)).toBe(
    "[[plan#Goals]]",
  );
  expect((await m.frame()).includes("headings · plan")).toBe(false);
});

test("gd follows to the heading and C-o comes back", async () => {
  m = await opened("projects/so.md");
  m.keys(`${NEXT_LINE}gd`);
  expect(lastEffect(m, "read")?.path).toBe("notes/plan.md");
  answerRead(m);
  expect(await status(m)).toContain("jump 2/2");
  const w = () => m?.store.get().windows.byId[m.store.get().windows.active];
  expect(w()?.content.cursor).toEqual({ line: 4, col: 0 });
  expect(await status(m)).toContain("notes/plan.md");

  m.keys("<C-o>");
  expect(await status(m)).toContain("jump 1/2");
  expect(await status(m)).toContain("projects/so.md");
  expect(w()?.content.cursor).toEqual({ line: 27, col: 6 });
});

test("gd on an unresolved link asks before creating the note", async () => {
  m = await opened("projects/so.md");
  m.keys(`${NEXT_LINE}j0f[gd`);
  expect(await m.frame()).toContain("Create projects/plan.md? [y/N]");
  m.keys("y");
  expect(lastEffect(m, "create")?.op).toEqual({
    kind: "create",
    from: "projects/plan.md",
    dir: false,
  });
});

test("the backlinks panel lists Linked before Unlinked, and l links a mention", async () => {
  m = await opened("notes/plan.md");
  m.keys("<leader>lb");
  answerSearch(m, MENTIONS);
  let frame = await lines(m);
  const linkedHead = frame.findIndex((l) =>
    l.includes("▾ Linked mentions (31)"),
  );
  expect(linkedHead).toBeGreaterThan(0);
  expect(frame.some((l) => l.includes(" BACKLINKS · plan"))).toBe(true);

  // To the first unlinked mention: the list scrolls and the section follows.
  m.keys("j".repeat(31));
  frame = await lines(m);
  const unlinkedHead = frame.findIndex((l) =>
    l.includes("▾ Unlinked mentions (2)"),
  );
  expect(unlinkedHead).toBeGreaterThan(0);
  expect(frame[unlinkedHead - 2]).toMatch(/│ {3}\[\[plan/);
  expect(frame[unlinkedHead + 1]).toContain("◇ notes/ideas:3");

  const from = m.effects.length;
  m.keys("l");
  expect(
    m.effects.slice(from).filter((e) => e.kind === "applyEdits"),
  ).toHaveLength(1);
  answerEdits(m, from);
  const linked = sidePanelRows(m.store.get())
    .filter((r) => r.section === "linked")
    .map((r) => r.path);
  expect(linked).toContain("notes/ideas.md");
  // The selection stays on the mention, now a Linked row with its link.
  frame = await lines(m);
  const moved = frame.findIndex((l) => l.includes("◇ notes/ideas:3"));
  expect(moved).toBeGreaterThan(0);
  expect(frame[moved + 1]).toContain("│   [[plan]]");
  m.keys("j");
  frame = await lines(m);
  const rest = frame.findIndex((l) => l.includes("▾ Unlinked mentions (1)"));
  expect(rest).toBeGreaterThan(moved);
  expect(frame[rest + 1]).toContain("◇ todo:1");
});

test("rename shows the impact before Enter and the update count after", async () => {
  m = await opened("notes/plan.md");
  m.keys("<leader>lr");
  m.keys(`${"<BS>".repeat(7)}roadmap.md`);
  expect(await m.frame()).toContain("31 links in 12 files will be updated");
  expect(m.effects.some((e) => e.kind === "rename")).toBe(false);

  m.keys("<CR>");
  const op = lastEffect(m, "rename")?.op;
  expect(op).toEqual({
    kind: "rename",
    from: "notes/plan.md",
    to: "notes/roadmap.md",
  });
  if (op === undefined) return;
  const from = m.effects.length;
  m.store.dispatch({ type: "fsResult", op, ok: true });
  expect(
    m.effects.slice(from).filter((e) => e.kind === "applyEdits"),
  ).toHaveLength(12);
  answerEdits(m, from);
  expect(await m.frame()).toContain("12 files updated");
});
