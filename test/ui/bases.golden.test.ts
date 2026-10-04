import { afterEach, describe, expect, test } from "bun:test";
import { TextAttributes } from "@opentui/core";
import { indexed, TASK_NOTES, TASKS_BASE } from "../support/bases";
import { cellStyle, type Mounted, mountShell } from "../support/ui";

const BOARD = `filters:
  and:
    - file.inFolder("tasks")
formulas:
  late: 'done == false'
views:
  - type: kanban-test
    name: Board
    order: [file.name, due]
    groupBy:
      property: status
      direction: ASC
  - type: kanban-test
    name: By late
    order: [file.name]
    groupBy:
      property: formula.late
      direction: ASC
`;
const NOTHING = `views:
  - type: table
    name: Archived
    filters:
      and:
        - 'status == "archived"'
`;

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

/** The explorer closed and `path` open as `text`; the index has the task notes unless `waiting`. */
async function baseShell(
  o: Parameters<typeof mountShell>[0],
  path: string,
  text: string,
  waiting = false,
): Promise<Mounted> {
  const x = await mountShell(o);
  if (!waiting) x.store.dispatch(indexed());
  x.keys("<leader>e");
  x.open(path, text);
  return x;
}

/** Screen cell of the first occurrence of `text` at or below row `from`. */
async function find(x: Mounted, text: string, from = 0) {
  const lines = (await x.frame()).split("\n");
  const y = lines.findIndex((l, i) => i >= from && l.includes(text));
  const line = lines[y] ?? "";
  return { x: [...line.slice(0, line.indexOf(text))].length, y };
}

const cursorAt = (x: Mounted) => {
  const c = x.t.renderer.getCursorState();
  return { x: c.x - 1, y: c.y - 1, visible: c.visible };
};

const variants = [
  { name: "colour", o: { cols: 80, rows: 24 } },
  { name: "NO_COLOR", o: { cols: 80, rows: 24, color: "nocolor" as const } },
  { name: "light", o: { cols: 80, rows: 24, theme: "light" as const } },
];

describe("base table", () => {
  for (const v of variants)
    test(`matches the ${v.name} golden with a focused cell`, async () => {
      m = await baseShell(v.o, "tasks.base", TASKS_BASE);
      m.keys("jl");
      const frame = await m.frame();
      expect(frame).toContain("▦ tasks.base");
      expect(frame).toContain("1/4 All tasks");
      expect(frame).toContain("due ↑");
      expect(frame).toContain("4 rows");
      expect(frame.split("\n").at(-3)).toMatch(/^ BASE /);
      const cell = await find(m, "doing");
      expect(cursorAt(m)).toEqual({ x: cell.x, y: cell.y, visible: true });
      expect(frame).toMatchSnapshot();
    });

  test("the focused cell is reversed and the frame has no colour under NO_COLOR", async () => {
    m = await baseShell(
      { cols: 80, rows: 24, color: "nocolor" },
      "tasks.base",
      TASKS_BASE,
    );
    m.keys("jl");
    await m.frame();
    const spans = m.t.captureSpans().lines;
    const colours = new Set(
      spans.flatMap((l) => l.spans).flatMap((s) => [s.fg.intent, s.bg.intent]),
    );
    expect([...colours]).toEqual(["default"]);
    const cell = await find(m, "doing");
    const attrs = cellStyle(spans, cell.x, cell.y)?.attrs ?? 0;
    expect(attrs & TextAttributes.INVERSE).toBe(TextAttributes.INVERSE);
    expect((await m.frame()).split("\n")[cell.y]?.startsWith("▌")).toBe(true);
  });

  test("an edited cell shows its text, caret, and inline error", async () => {
    m = await baseShell({ cols: 80, rows: 24 }, "tasks.base", TASKS_BASE);
    m.keys("llix");
    const frame = await m.frame();
    expect(frame).toContain("2026-10-01x");
    expect(frame.split("\n").at(-3)).toMatch(/^ INSERT /);
    m.keys("<CR>");
    const after = await m.frame();
    expect(after).toContain("✗ use YYYY-MM-DD");
    const typed = await find(m, "2026-10-01x");
    expect(cursorAt(m)).toMatchObject({ x: typed.x + 11, y: typed.y });
    expect(after).toMatchSnapshot();
  });
});

describe("base board", () => {
  for (const v of variants)
    test(`matches the ${v.name} golden with a focused card`, async () => {
      m = await baseShell(v.o, "board.base", BOARD);
      m.keys("ll");
      const frame = await m.frame();
      expect(frame).toContain("● doing 1");
      expect(frame).toContain("● todo 1");
      expect(frame).toContain("● None 1");
      expect(frame.split("\n").at(-3)).toMatch(/^ BASE /);
      const card = await find(m, "write-report", 3);
      expect(cursorAt(m)).toEqual({ x: card.x, y: card.y, visible: true });
      expect(frame).toMatchSnapshot();
    });

  test("the focused card is marked without colour", async () => {
    m = await baseShell(
      { cols: 80, rows: 24, color: "nocolor" },
      "board.base",
      BOARD,
    );
    m.keys("ll");
    await m.frame();
    const spans = m.t.captureSpans().lines;
    const card = await find(m, "write-report", 3);
    const attrs = cellStyle(spans, card.x, card.y)?.attrs ?? 0;
    expect(attrs & TextAttributes.INVERSE).toBe(TextAttributes.INVERSE);
  });
});

describe("base states", () => {
  test("waiting and empty states match their goldens", async () => {
    m = await baseShell({ cols: 80, rows: 24 }, "tasks.base", TASKS_BASE, true);
    const waiting = await m.frame();
    expect(waiting).toContain("◌ waiting for index");
    expect(waiting).toMatchSnapshot();
    m.destroy();
    m = await baseShell({ cols: 80, rows: 24 }, "empty.base", NOTHING);
    const empty = await m.frame();
    expect(empty).toContain("No notes match this view's filters");
    expect(empty.split("\n")[1]).toContain('⧩ status == "archived"');
    expect(empty).toMatchSnapshot();
  });

  test("toolbar notices explain disabled moves and the cards fallback", async () => {
    m = await baseShell({ cols: 80, rows: 24 }, "board.base", BOARD);
    m.keys("2");
    const formula = await m.frame();
    expect(formula).toContain("⊘ moves off");
    expect(formula).toMatchSnapshot();
    m.keys("L");
    expect(await m.frame()).toContain("Moves are off: this board groups");
    m.destroy();
    m = await baseShell({ cols: 80, rows: 24 }, "tasks.base", TASKS_BASE);
    m.keys("4");
    const cards = await m.frame();
    expect(cards).toContain("cards view is not supported yet; showing a table");
    expect(cards).toMatchSnapshot();
  });

  test("a wide window shows every view tab", async () => {
    m = await baseShell({ cols: 120, rows: 30 }, "tasks.base", TASKS_BASE);
    const frame = await m.frame();
    expect(frame).toContain("1 All tasks");
    expect(frame).toContain("4 Cards");
    expect(frame).toMatchSnapshot();
  });
});

const LABELS = `views:
  - type: table
    name: Labels
    order: [file.name, status, tags]
`;

describe("base cell editors", () => {
  test("a text cell lists the property's existing values", async () => {
    m = await baseShell({ cols: 80, rows: 24 }, "tasks.base", TASKS_BASE);
    m.keys("li<BS><BS><BS><BS>d");
    const frame = await m.frame();
    // The caret follows the typed "d".
    const typed = { x: cursorAt(m).x - 1, y: cursorAt(m).y };
    const rows = frame.split("\n");
    expect(rows[typed.y]?.slice(typed.x)).toMatch(/^d /);
    expect(rows[typed.y + 1]?.slice(typed.x)).toMatch(/^ doing /);
    expect(rows[typed.y + 2]?.slice(typed.x)).toMatch(/^ done /);
    expect(rows.at(-4)).toContain("Tab complete");
    expect(frame).toMatchSnapshot();
  });

  test("a list cell shows its values as chips", async () => {
    m = await mountShell({ cols: 80, rows: 24 });
    m.store.dispatch(
      indexed({
        ...TASK_NOTES,
        "tasks/inbox.md": "---\ntags: [api, docs]\n---\n# Inbox\n",
      }),
    );
    m.keys("<leader>e");
    m.open("labels.base", LABELS);
    m.keys("lli");
    const frame = await m.frame();
    expect(frame).toContain("#api ×");
    expect(frame).toContain("#docs ×");
    m.keys("ui<CR>");
    expect(await m.frame()).toContain("#ui ×");
    expect(frame.split("\n").at(-4)).toContain("⏎ on empty writes");
    expect(await m.frame()).toMatchSnapshot();
  });
});

/** Styles of the focused cell, focused card, a lane dot, and the moves-off notice. */
async function baseStyles(o: Parameters<typeof mountShell>[0]) {
  const table = await baseShell(o, "tasks.base", TASKS_BASE);
  table.keys("jl");
  await table.frame();
  const cell = await find(table, "doing");
  const focusedCell = cellStyle(table.t.captureSpans().lines, cell.x, cell.y);
  table.destroy();
  const board = await baseShell(o, "board.base", BOARD);
  board.keys("ll");
  await board.frame();
  const card = await find(board, "write-report", 3);
  const dot = await find(board, "● doing");
  let spans = board.t.captureSpans().lines;
  const focusedCard = cellStyle(spans, card.x, card.y);
  const laneDot = cellStyle(spans, dot.x, dot.y);
  board.keys("2");
  await board.frame();
  const off = await find(board, "⊘ moves off");
  spans = board.t.captureSpans().lines;
  const movesOff = cellStyle(spans, off.x, off.y);
  board.destroy();
  return { focusedCell, focusedCard, laneDot, movesOff };
}

describe("base styles", () => {
  for (const v of variants)
    test(`paints the focused cell and card, lane dots, and moves off in the ${v.name} theme`, async () => {
      expect(await baseStyles(v.o)).toMatchSnapshot();
    });

  test("dark and light paint the base differently", async () => {
    const dark = await baseStyles({ cols: 80, rows: 24, theme: "dark" });
    const light = await baseStyles({ cols: 80, rows: 24, theme: "light" });
    expect(dark.focusedCell).not.toEqual(light.focusedCell);
    expect(dark.focusedCard).not.toEqual(light.focusedCard);
    expect(dark.laneDot).not.toEqual(light.laneDot);
    expect(dark.movesOff).not.toEqual(light.movesOff);
  });

  test("the board has no colour under NO_COLOR", async () => {
    m = await baseShell(
      { cols: 80, rows: 24, color: "nocolor" },
      "board.base",
      BOARD,
    );
    m.keys("ll");
    await m.frame();
    const colours = new Set(
      m.t
        .captureSpans()
        .lines.flatMap((l) => l.spans)
        .flatMap((s) => [s.fg.intent, s.bg.intent]),
    );
    expect([...colours]).toEqual(["default"]);
  });
});
