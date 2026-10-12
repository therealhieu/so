import { afterEach, expect, test } from "bun:test";
import { MouseButtons } from "@opentui/core/testing";
import { parseConfig } from "../../src/core/config/toml";
import { baseWindow } from "../../src/core/state/base-model";
import { activeBuffer } from "../../src/core/state/buffers";
import { CommandLine } from "../../src/ui/views/cmdline";
import { indexed, TASKS_BASE } from "../support/bases";
import { indexFixture } from "../support/notes";
import { testRegistries } from "../support/state";
import { type Mounted, mountShell } from "../support/ui";

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

const cursorOf = (mounted: Mounted) => {
  const s = mounted.store.get();
  return s.windows.byId[s.windows.active]?.content.cursor;
};

test("mouse reporting follows the mouse setting", async () => {
  m = await mountShell({ cols: 80, rows: 12 });
  await m.frame();
  expect(m.t.renderer.useMouse).toBe(true);
  m.destroy();

  m = await mountShell({ cols: 80, rows: 12, config: "mouse = false\n" });
  m.open("a.md", "alpha\nbravo\ncharlie\n");
  await m.frame();
  expect(m.t.renderer.useMouse).toBe(false);
  await m.mouse.click(10, 3);
  await m.frame();
  expect(cursorOf(m)).toEqual({ line: 0, col: 0 });

  // A reload that turns the mouse on turns reporting on with the next paint.
  m.store.dispatch({
    type: "configLoaded",
    result: parseConfig("mouse = true\n"),
    reload: true,
  });
  expect(m.t.renderer.useMouse).toBe(true);
});

test("the wheel scrolls the split under the pointer", async () => {
  m = await mountShell({ cols: 80, rows: 20 });
  m.keys("<leader>e");
  const text = Array.from({ length: 60 }, (_, i) => `line ${i + 1}`).join("\n");
  m.open("long.md", `${text}\n`);
  m.keys(":vsplit<CR>");
  await m.frame();
  const s = m.store.get();
  const tree = s.windows.tree;
  if (tree.kind !== "row") throw new Error("expected a vertical split");
  const [left, right] = tree.children;
  if (left?.kind !== "leaf" || right?.kind !== "leaf")
    throw new Error("expected two windows");
  const active = s.windows.active;
  const mode = s.vim.mode;

  await m.mouse.scroll(60, 8, "down");
  await m.frame();
  const after = m.store.get();
  expect(after.windows.byId[right.id]?.content.scroll).toBe(3);
  expect(after.windows.byId[left.id]?.content.scroll).toBe(0);
  expect(after.windows.active).toBe(active);
  expect(after.vim.mode).toBe(mode);

  // A click on the right split's text focuses it and puts the cursor there.
  const RIGHT_X = 40;
  const frame = (await m.frame()).split("\n");
  const y = frame.findIndex(
    (r, i) => i > 1 && r.slice(RIGHT_X).includes("line 6 "),
  );
  const x = RIGHT_X + (frame[y] ?? "").slice(RIGHT_X).indexOf("6 ");
  await m.mouse.click(x, y);
  const clicked = m.store.get();
  expect(clicked.windows.active).toBe(right.id);
  expect(clicked.windows.byId[right.id]?.content.cursor).toEqual({
    line: 5,
    col: 5,
  });
  // The winbar row names the window and leaves its cursor where it was.
  await m.mouse.click(10, 1);
  const bar = m.store.get();
  expect(bar.windows.active).toBe(left.id);
  expect(bar.windows.byId[left.id]?.content.cursor).toEqual({
    line: 0,
    col: 0,
  });
});

const LONG =
  "[[target|alias]] aaaa bbbb cccc dddd eeee ffff gggg hhhh iiii jjjj kkkk llll";

test("a click on a wrapped row or the gutter lands on the shown source column", async () => {
  m = await mountShell({ cols: 40, rows: 12 });
  m.keys("<leader>e");
  m.open("wrap.md", `top\n${LONG}\nlast line\n`);
  const frame = (await m.frame()).split("\n");
  // The link shows as its alias while the cursor is on another line.
  const first = frame.findIndex((r) => r.includes("alias aaaa"));
  expect(first).toBeGreaterThan(0);
  const y = frame.findIndex((r, i) => i > first && r.includes("kkkk"));
  expect(y).toBe(first + 1);
  const x = frame[y]?.indexOf("kkkk") ?? -1;
  await m.mouse.click(x + 2, y);
  expect(cursorOf(m)).toEqual({ line: 1, col: LONG.indexOf("kkkk") + 2 });

  // The gutter of a line puts the cursor at its first column. The clicked
  // line now shows its source, so the rows below it moved.
  const lastY = (await m.frame())
    .split("\n")
    .findIndex((r) => r.includes("last line"));
  await m.mouse.click(1, lastY);
  expect(cursorOf(m)).toEqual({ line: 2, col: 0 });
  // Below the text, the click goes to the last line.
  m.keys("gg");
  await m.frame();
  await m.mouse.click(8, 8);
  expect(cursorOf(m)?.line).toBe(2);
});

test("a click right of a word-wrapped row stays on that row", async () => {
  m = await mountShell({ cols: 40, rows: 12 });
  m.keys("<leader>e");
  const first = "the quick brown fox jumps over ";
  m.open("wrap.md", `top\n${first}the lazy dog and keeps running far\n`);
  const frame = (await m.frame()).split("\n");
  const y = frame.findIndex((r) => r.trimEnd().endsWith("jumps over"));
  expect(y).toBeGreaterThan(0);
  expect(frame[y + 1]).toContain("the lazy dog");
  await m.mouse.click(38, y);
  expect(cursorOf(m)).toEqual({ line: 1, col: first.length - 1 });

  // Insert lands on the same character instead of appending past it. A
  // different cell keeps the second click from counting as a double click.
  m.keys("ggi");
  await m.frame();
  await m.mouse.click(37, y);
  expect(m.store.get().vim.mode).toBe("insert");
  expect(cursorOf(m)).toEqual({ line: 1, col: first.length - 1 });
});

test("a drag from the text selects to the pointer and clamps at the window edge", async () => {
  m = await mountShell({ cols: 40, rows: 12 });
  m.keys("<leader>e");
  m.open("drag.md", "alpha one\nbravo two\ncharlie three\n");
  const frame = (await m.frame()).split("\n");
  const y = frame.findIndex((r) => r.includes("alpha one"));
  const x = frame[y]?.indexOf("alpha") ?? -1;
  await m.mouse.drag(x + 2, y, x + 4, y + 1);
  const s = m.store.get();
  expect(s.vim.mode).toBe("visual");
  expect(s.vim.visualAnchor).toEqual({ line: 0, col: 2 });
  expect(cursorOf(m)).toEqual({ line: 1, col: 4 });
  // Dragging over the bufferline clamps to the top text row with an upward
  // edge. The renderer repaints after a drag ends, which puts the mouse layer
  // back in its hit grid.
  await m.frame();
  await m.mouse.drag(x + 6, y + 2, x + 1, 0);
  expect(m.store.get().vim.visualAnchor).toEqual({ line: 2, col: 6 });
  expect(cursorOf(m)).toEqual({ line: 0, col: 1 });
});

test("a drag past the text rows of a long buffer moves one line beyond the window", async () => {
  m = await mountShell({ cols: 40, rows: 12 });
  m.keys("<leader>e");
  const text = Array.from({ length: 60 }, (_, i) => `line ${i + 1}`).join("\n");
  m.open("long.md", `${text}\n`);
  const shownLines = async () => {
    const rows = (await m?.frame())?.split("\n") ?? [];
    const shown = rows.flatMap((r, y) => {
      const n = /line (\d+)\b/.exec(r)?.[1];
      return n === undefined ? [] : [{ line: Number(n) - 1, y }];
    });
    const first = shown[0];
    const last = shown.at(-1);
    if (first === undefined || last === undefined)
      throw new Error("expected visible lines");
    return { first, last };
  };
  /** Press at `from`, drag through the text to `mid`, then drag to `edgeY`. */
  const dragToEdge = async (fromY: number, midY: number, edgeY: number) => {
    const mouse = m?.mouse;
    if (mouse === undefined) throw new Error("expected a mounted shell");
    await mouse.pressDown(3, fromY);
    await mouse.emitMouseEvent("drag", 3, midY);
    const shown = await shownLines();
    await mouse.emitMouseEvent("drag", 3, edgeY);
    await mouse.release(3, edgeY);
    return shown;
  };

  // The cmdline row is below the last text row.
  const start = await shownLines();
  const down = await dragToEdge(start.first.y + 1, start.first.y + 3, 11);
  expect(m.store.get().vim.mode).toBe("visual");
  expect(m.store.get().vim.visualAnchor).toEqual({
    line: start.first.line + 1,
    col: 0,
  });
  expect(cursorOf(m)?.line).toBe(down.last.line + 1);

  // The bufferline is above the first text row.
  m.keys("<Esc>40G");
  const end = await shownLines();
  const up = await dragToEdge(end.last.y, end.last.y - 2, 0);
  expect(up.first.line).toBeGreaterThan(0);
  expect(m.store.get().vim.mode).toBe("visual");
  expect(cursorOf(m)?.line).toBe(up.first.line - 1);
});

/** Screen cell of the first `text` at or below row `from`. */
async function find(x: Mounted, text: string, from = 0) {
  const lines = (await x.frame()).split("\n");
  const y = lines.findIndex((l, i) => i >= from && l.includes(text));
  const line = lines[y] ?? "";
  return { x: [...line.slice(0, line.indexOf(text))].length, y };
}

const BOARD = `filters:
  and:
    - file.inFolder("tasks")
views:
  - type: kanban-test
    name: Board
    order: [file.name]
    groupBy:
      property: status
      direction: ASC
`;

test("clicks on a Base switch views and focus table cells and cards", async () => {
  m = await mountShell({ cols: 120, rows: 16 });
  m.store.dispatch(indexed());
  m.keys("<leader>e");
  m.open("tasks.base", TASKS_BASE);
  const ws = () => {
    const s = m?.store.get();
    return s && baseWindow(s, s.windows.active);
  };
  const tab = await find(m, "2 By status");
  await m.mouse.click(tab.x + 3, tab.y);
  expect(ws()?.view).toBe("By status");
  const back = await find(m, "1 All tasks");
  await m.mouse.click(back.x, back.y);
  expect(ws()?.view).toBe("All tasks");

  const cell = await find(m, "doing");
  await m.mouse.click(cell.x + 2, cell.y);
  expect(ws()?.focus.column).toBe(1);
  expect(ws()?.focus.path).toBe("tasks/review-pr.md");
  await m.frame();
  const c = m.t.renderer.getCursorState();
  expect({ x: c.x - 1, y: c.y - 1 }).toEqual({ x: cell.x, y: cell.y });
  // The separator between cells and the toolbar's title are the base itself.
  await m.mouse.click(cell.x - 2, cell.y);
  expect(ws()?.focus.column).toBe(1);
  m.destroy();

  m = await mountShell({ cols: 120, rows: 20 });
  m.store.dispatch(indexed());
  m.keys("<leader>e");
  m.open("board.base", BOARD);
  const card = await find(m, "write-report", 3);
  expect(ws()?.focus.path).not.toBe("tasks/write-report.md");
  await m.mouse.click(card.x + 1, card.y);
  expect(ws()?.focus.path).toBe("tasks/write-report.md");
});

test("clicks on the bufferline and explorer switch, expand, and open", async () => {
  m = await mountShell({ cols: 120, rows: 16 });
  m.open("a.md", "alpha\n");
  m.open("b.md", "bravo\n");
  const shown = () => {
    const s = m?.store.get();
    return s && activeBuffer(s)?.path;
  };
  expect(shown()).toBe("b.md");
  const tab = await find(m, " a.md ");
  expect(tab.y).toBe(0);
  await m.mouse.click(tab.x + 2, 0);
  expect(shown()).toBe("a.md");
  // The workspace root on the right of the bufferline takes no click.
  const root = await find(m, "~/notes");
  expect(root.y).toBe(0);
  await m.mouse.click(root.x + 2, 0);
  expect(shown()).toBe("a.md");

  const folder = await find(m, "notes", 2);
  await m.mouse.click(folder.x + 1, folder.y);
  expect(m.store.get().panels.explorer.expanded).toContain("notes");
  const file = await find(m, "plan.md", 2);
  const from = m.effects.length;
  await m.mouse.click(file.x + 1, file.y);
  expect(m.effects.slice(from)).toContainEqual({
    kind: "read",
    path: "notes/plan.md",
  });
});

test("the bufferline shows tabs in order with pins, and a middle click closes one", async () => {
  m = await mountShell({ cols: 120, rows: 16 });
  m.open("a.md", "alpha\n");
  m.open("b.md", "bravo\n");
  m.open("c.md", "charlie\n");
  m.keys("<leader>bp");
  const row0 = async () => (await m?.frame())?.split("\n")[0] ?? "";
  expect(await row0()).toContain("▎ \uf435 c.md   a.md │ b.md ");
  const tab = await find(m, " a.md ");
  await m.mouse.click(tab.x + 2, 0, MouseButtons.MIDDLE);
  expect(await row0()).toContain("▎ \uf435 c.md   b.md ");
  expect(
    Object.values(m.store.get().buffers)
      .map((b) => b.path)
      .sort(),
  ).toEqual(["b.md", "c.md"]);
});

test("a click on an outline heading jumps there and the panel title only focuses", async () => {
  m = await mountShell({ cols: 120, rows: 16 });
  m.keys("<leader>e");
  m.open("plan.md", "# Plan\n\ntext\n\n## Goals\n\nmore\n");
  m.keys("<leader>o");
  const goals = await find(m, "Goals", 2);
  // The editor shows the same heading; the panel is on the right.
  const row = (await m.frame()).split("\n")[goals.y] ?? "";
  const x = [...row.slice(0, row.lastIndexOf("Goals"))].length;
  expect(x).toBeGreaterThan(80);
  await m.mouse.click(x, goals.y);
  expect(cursorOf(m)?.line).toBe(4);
  m.keys("gg");
  const title = await find(m, "OUTLINE");
  await m.mouse.click(title.x, title.y);
  const s = m.store.get();
  expect(s.panels.side.focused).toBe(true);
  expect(cursorOf(m)?.line).toBe(0);
});

test("with the explorer on the right, clicks reach the explorer, the left panel, and the window", async () => {
  m = await mountShell({
    cols: 120,
    rows: 16,
    config: '[explorer]\nposition = "right"\n',
  });
  m.open("plan.md", "# Plan\n\ntext\n\n## Goals\n\nmore\n");
  m.keys("<leader>o");
  const goals = await find(m, "Goals", 2);
  expect(goals.x).toBeLessThan(36);
  await m.mouse.click(goals.x + 2, goals.y);
  expect(cursorOf(m)?.line).toBe(4);

  const folder = await find(m, "notes", 2);
  expect(folder.x).toBeGreaterThan(88);
  await m.mouse.click(folder.x + 1, folder.y);
  const s = m.store.get();
  expect(s.panels.explorer.expanded).toContain("notes");
  expect(s.panels.explorer.focused).toBe(true);

  await m.mouse.click(50, 1);
  expect(m.store.get().panels.explorer.focused).toBe(false);
  expect(cursorOf(m)?.line).toBe(0);
});

test("a click on a callout's fold marker flips the fold and leaves the cursor", async () => {
  m = await mountShell({ cols: 80, rows: 14 });
  m.keys("<leader>e");
  m.open(
    "a.md",
    "intro\n\n> [!tip]- Folded tip\n> Hidden body.\n\n> [!note] Plain\n> Body.\n",
  );
  const marker = await find(m, "▸", 1);
  await m.mouse.click(marker.x, marker.y);
  let frame = await m.frame();
  expect(frame).toContain("★ Folded tip ▾");
  expect(frame).toContain("▎ Hidden body.");
  expect(frame).not.toContain("[!tip]");
  expect(cursorOf(m)).toEqual({ line: 0, col: 0 });

  // The space before the marker is part of it.
  const open = await find(m, "▾", 1);
  await m.mouse.click(open.x - 1, open.y);
  frame = await m.frame();
  expect(frame).toContain("★ Folded tip ▸");
  expect(frame).not.toContain("Hidden body.");
  expect(cursorOf(m)).toEqual({ line: 0, col: 0 });

  // The title text places the cursor and shows the source, as before.
  const title = await find(m, "Folded tip", 1);
  await m.mouse.click(title.x + 2, title.y);
  expect(cursorOf(m)?.line).toBe(2);
  expect(await m.frame()).toContain("> [!tip]- Folded tip");
});

test("a callout without a fold sign has no marker to click", async () => {
  m = await mountShell({ cols: 80, rows: 14 });
  m.keys("<leader>e");
  m.open("a.md", "intro\n\n> [!note] Plain\n> Body.\n");
  const title = await find(m, "● Plain", 1);
  await m.mouse.click(title.x + 8, title.y);
  expect(cursorOf(m)?.line).toBe(2);
  expect(
    m.store.get().windows.byId[m.store.get().windows.active]?.content.folds ??
      [],
  ).toEqual([]);
});

test("a double click on a tag lists its notes, even when the first click reveals source", async () => {
  m = await mountShell({ cols: 80, rows: 14 });
  m.keys("<leader>e");
  m.open(
    "a.md",
    "---\ntags: [so, planning]\n---\nintro\n\nsee [[tour]] #so/ui and more words\n",
  );
  const picked = () => {
    const o = m?.store.get().overlay;
    return o?.kind === "picker"
      ? { source: o.picker.source, arg: o.picker.arg }
      : o?.kind;
  };
  // The cursor line shows "[[tour]]", which moves the tag 4 cells right.
  const inline = await find(m, "#so/ui", 1);
  await m.mouse.doubleClick(inline.x + 1, inline.y);
  expect(picked()).toEqual({ source: "tagNotes", arg: "so/ui" });
  expect(await m.frame()).toContain("─ Notes with #so/ui ─");
  m.keys("<Esc>G");

  // A chip: the first click reveals the frontmatter source under the pointer.
  const chip = await find(m, "#planning", 1);
  await m.mouse.doubleClick(chip.x + 2, chip.y);
  expect(picked()).toEqual({ source: "tagNotes", arg: "planning" });
  m.keys("<Esc>");

  const word = await find(m, "words", 1);
  await m.mouse.doubleClick(word.x + 1, word.y);
  expect(m.store.get().vim.mode).toBe("visual");
  expect(picked()).toBe("none");
});

test("a click on a picker row accepts it and clicks under a toast reach the window", async () => {
  m = await mountShell({ cols: 120, rows: 24 });
  indexFixture(m);
  m.keys("<leader>e");
  const lines = Array.from(
    { length: 15 },
    (_, i) => `${String(i).padStart(3, "0")} ${"abcdefghij".repeat(10)}`,
  );
  m.open("long.md", `${lines.join("\n")}\n`);
  m.keys("G");

  // While the picker is open the body gives no target: a press outside closes it.
  m.keys("<leader>ff");
  await m.frame();
  await m.mouse.click(1, 2);
  expect(m.store.get().overlay.kind).toBe("none");
  expect(cursorOf(m)?.line).toBe(14);

  m.keys("<leader>ff");
  const o = m.store.get().overlay;
  const label = o.kind === "picker" ? o.picker.items[2]?.label : undefined;
  if (label === undefined) throw new Error("expected three picker rows");
  const row = await find(m, `   ${label}`);
  const from = m.effects.length;
  await m.mouse.click(row.x + 4, row.y);
  expect(m.store.get().overlay.kind).toBe("none");
  expect(m.effects.slice(from)).toContainEqual({ kind: "read", path: label });

  m.open("long.md", `${lines.join("\n")}\n`);
  m.keys("G");
  m.store.dispatch({
    type: "fsResult",
    op: { kind: "trash", from: "todo.md" },
    ok: false,
    reason: "permission denied",
  });
  const toast = await find(m, "✗ Move to Trash failed");
  expect(toast.y).toBeGreaterThan(0);
  await m.mouse.click(toast.x + 2, toast.y);
  expect(cursorOf(m)?.line).toBe(toast.y - 1);
});

test("a click on a calendar day opens its note and the float's title only stays open", async () => {
  m = await mountShell({ cols: 80, rows: 24 });
  m.store.dispatch({
    type: "indexBatch",
    summaries: [],
    files: ["daily/2026-10-01.md"],
    done: 0,
    total: 0,
  });
  m.store.dispatch({ type: "indexReady" });
  m.keys("<leader>e");
  m.open("notes/standup.md", "# Standup\n");
  // Saturday 2026-10-03 in the local time zone.
  const now = new Date(2026, 9, 3, 9, 5).getTime();
  for (const key of [" ", "n", "p"])
    m.store.dispatch({ type: "key", key, now });
  const title = await find(m, "October 2026");
  await m.mouse.click(title.x, title.y + 1);
  expect(m.store.get().overlay.kind).toBe("calendar");

  const day = await find(m, " 1•");
  const from = m.effects.length;
  await m.mouse.click(day.x + 1, day.y);
  expect(m.store.get().overlay.kind).toBe("none");
  expect(m.effects.slice(from)).toContainEqual({
    kind: "read",
    path: "daily/2026-10-01.md",
  });
});

test("a click on a completion row accepts it and a click in the body closes it", async () => {
  m = await mountShell({ cols: 120, rows: 30 });
  indexFixture(m);
  m.advance(3000);
  m.keys("<leader>e");
  m.open("scratch.md", "alpha\nbravo\n");
  m.keys("Go[[");
  const o = m.store.get().overlay;
  const label = o.kind === "completion" ? o.completion.items[1]?.label : "";
  if (!label) throw new Error("expected two completion rows");
  const row = await find(m, `   ◇ ${label}`);
  await m.mouse.click(row.x + 5, row.y);
  expect(m.store.get().overlay.kind).toBe("none");
  const b = activeBuffer(m.store.get());
  expect(b?.text.line(2)).toStartWith(`[[${label}`);

  m.keys("<Esc>o[[");
  expect(m.store.get().overlay.kind).toBe("completion");
  const alpha = await find(m, "alpha");
  await m.mouse.click(alpha.x + 2, alpha.y);
  expect(m.store.get().overlay.kind).toBe("none");
  expect(cursorOf(m)).toEqual({ line: 0, col: 2 });
});

test("clicks and the wheel inside which-key do nothing and a click outside closes it", async () => {
  m = await mountShell({ cols: 120, rows: 24 });
  m.keys("<leader>e");
  const text = Array.from({ length: 60 }, (_, i) => `line ${i + 1}`).join("\n");
  m.open("long.md", `${text}\n`);
  m.keys(" ");
  m.advance(300);
  expect(m.store.get().overlay.kind).toBe("whichKey");
  const entry = await find(m, "e → ");
  expect(entry.y).toBeGreaterThan(0);
  const before = m.store.get();
  const scroll = () => {
    const s = m?.store.get();
    return s?.windows.byId[s.windows.active]?.content.scroll;
  };

  await m.mouse.click(entry.x + 4, entry.y);
  await m.mouse.scroll(entry.x + 4, entry.y, "down");
  const after = m.store.get();
  expect(after.overlay).toEqual(before.overlay);
  expect(after.vim.pending).toEqual(before.vim.pending);
  expect(after.panels.explorer.open).toBe(before.panels.explorer.open);
  expect(scroll()).toBe(0);
  expect(cursorOf(m)).toEqual({ line: 0, col: 0 });

  await m.mouse.click(10, 3);
  expect(m.store.get().overlay.kind).toBe("none");
  expect(cursorOf(m)).toEqual({ line: 0, col: 0 });
});

test("the wheel over a toast does nothing and a click there reaches the window", async () => {
  m = await mountShell({ cols: 120, rows: 24 });
  m.keys("<leader>e");
  const text = Array.from({ length: 60 }, (_, i) => `line ${i + 1}`).join("\n");
  m.open("long.md", `${text}\n`);
  m.store.dispatch({
    type: "fsResult",
    op: { kind: "trash", from: "todo.md" },
    ok: false,
    reason: "permission denied",
  });
  const toast = await find(m, "✗ Move to Trash failed");
  expect(toast.y).toBeGreaterThan(0);
  const scroll = () => {
    const s = m?.store.get();
    return s?.windows.byId[s.windows.active]?.content.scroll;
  };

  await m.mouse.scroll(toast.x + 2, toast.y, "down");
  expect(scroll()).toBe(0);
  // Beside the toast the wheel still scrolls the window.
  await m.mouse.scroll(10, toast.y, "down");
  expect(scroll()).toBe(3);

  m.keys("gg");
  await m.frame();
  await m.mouse.click(toast.x + 2, toast.y);
  expect(cursorOf(m)?.line).toBe(toast.y - 1);
  expect(scroll()).toBe(0);
});

test("with the command line open its popup, the status row, and its completions take no click", async () => {
  const reg = testRegistries();
  m = await mountShell({ cols: 120, rows: 24, reg });
  m.keys("<leader>e");
  m.open("a.md", "alpha\nbravo\ncharlie\n");
  m.keys(":wr");
  const typing = () => {
    const s = m?.store.get();
    return s && { mode: s.vim.mode, line: s.vim.cmdline };
  };
  const before = typing();
  expect(before?.mode).toBe("cmdline");
  const item = await find(m, ":write");
  expect(item.y).toBeGreaterThan(0);
  expect(item.y).toBeLessThan(20);

  for (const [x, y] of [
    [10, 23],
    [60, 22],
    [item.x + 2, item.y],
  ] as const) {
    await m.mouse.click(x, y);
    expect(typing()).toEqual(before);
  }
  // Ask the view itself: its popup and float are inert, and a cell beside
  // the float is left to the body.
  const line = new CommandLine(m.t.renderer, { reg });
  line.update(m.store.get(), "wide");
  expect(line.targetAt(10, 21)).toEqual({ kind: "inert" });
  expect(line.targetAt(item.x + 2, item.y)).toEqual({ kind: "inert" });
  expect(line.targetAt(119, item.y)).toBeUndefined();
  const bravo = await find(m, "bravo");
  await m.mouse.click(bravo.x + 1, bravo.y);
  expect(typing()?.mode).toBe("normal");
  expect(cursorOf(m)).toEqual({ line: 0, col: 0 });
});

test("a drag after the press that closes the command line selects nothing", async () => {
  m = await mountShell({ cols: 40, rows: 12 });
  m.keys("<leader>e");
  m.open("a.md", "alpha one\nbravo two\ncharlie three\n");
  const at = await find(m, "charlie");
  const vimOf = () => {
    const s = m?.store.get();
    return s && { mode: s.vim.mode, anchor: s.vim.visualAnchor };
  };

  m.keys("j:");
  await m.frame();
  await m.mouse.click(at.x + 6, at.y);
  const clicked = { vim: vimOf(), cursor: cursorOf(m) };
  expect(clicked).toEqual({
    vim: { mode: "normal", anchor: undefined },
    cursor: { line: 1, col: 0 },
  });

  m.keys(":");
  await m.frame();
  await m.mouse.drag(at.x + 6, at.y, at.x + 4, at.y);
  expect({ vim: vimOf(), cursor: cursorOf(m) }).toEqual(clicked);

  // With the command line closed, a drag selects from its press again. It
  // starts on another cell, so it does not count as a third click.
  await m.frame();
  await m.mouse.drag(at.x + 5, at.y, at.x + 3, at.y);
  expect(vimOf()).toEqual({ mode: "visual", anchor: { line: 2, col: 5 } });
  expect(cursorOf(m)).toEqual({ line: 2, col: 3 });
});

test("the bufferline scroll markers take no click", async () => {
  m = await mountShell({ cols: 60, rows: 12 });
  for (let i = 1; i <= 8; i++) m.open(`note-number-${i}.md`, `${i}\n`);
  m.keys(":bp<CR>:bp<CR>:bp<CR>:bp<CR>");
  const shown = () => {
    const s = m?.store.get();
    return s && activeBuffer(s)?.path;
  };
  const active = shown();
  const row = (await m.frame()).split("\n")[0] ?? "";
  expect(row.startsWith("‹")).toBe(true);
  const right = [...row].indexOf("›");
  expect(right).toBeGreaterThan(0);
  await m.mouse.click(0, 0);
  expect(shown()).toBe(active);
  await m.mouse.click(right, 0);
  expect(shown()).toBe(active);
});

test("a side panel hidden on a narrow terminal does not catch clicks", async () => {
  m = await mountShell({ cols: 120, rows: 16 });
  m.keys("<leader>e");
  const line = "x".repeat(90);
  m.open("plan.md", `# Plan\n\n${line}\n${line}\n${line}\n`);
  m.keys("<leader>o");
  expect(m.store.get().panels.side).toMatchObject({
    open: true,
    focused: true,
  });
  // 99 columns is narrow; the panel docked at 120 sat from column 83.
  m.t.resize(99, 16);
  m.store.dispatch({ type: "resize", cols: 99, rows: 16 });
  const first = await find(m, line, 1);
  expect(first.y).toBeGreaterThan(0);
  await m.mouse.click(90, first.y + 1);
  const after = m.store.get();
  expect(after.panels.side).toMatchObject({ open: true, focused: false });
  expect(cursorOf(m)).toEqual({ line: 3, col: 90 - first.x });
});

test("the wheel inside the zoom float scrolls a wide text diagram", async () => {
  m = await mountShell({
    cols: 80,
    rows: 24,
    config: '[preview]\nmode = "reading"\nimages = "off"\n',
  });
  const flow = Array.from({ length: 12 }, (_, i) => `Step${i}`).join(" --> ");
  m.open("flow.md", `\`\`\`mermaid\nflowchart LR\n  ${flow}\n\`\`\`\n`);
  m.keys("j<leader>z");
  await m.frame();
  const col = () => {
    const o = m?.store.get().overlay;
    return o?.kind === "zoom" && o.zoom.kind === "diagram" ? o.zoom.col : -1;
  };
  expect(col()).toBe(0);
  await m.mouse.scroll(40, 12, "down");
  await m.frame();
  expect(col()).toBeGreaterThan(0);
});

test("dragging the explorer's separator resizes it on either edge", async () => {
  const sepAt = async (mounted: Mounted) =>
    [...((await mounted.frame()).split("\n")[5] ?? "")].indexOf("│");
  m = await mountShell({ cols: 120, rows: 24 });
  m.open("a.md", "alpha\n");
  expect(await sepAt(m)).toBe(30);
  await m.mouse.drag(30, 5, 45, 5);
  expect(m.store.get().panels.explorer.width).toBe(45);
  expect(await sepAt(m)).toBe(45);
  // Past half the terminal the separator stops.
  await m.mouse.drag(45, 5, 100, 5);
  expect(await sepAt(m)).toBe(60);
  m.destroy();

  m = await mountShell({
    cols: 120,
    rows: 24,
    config: '[explorer]\nposition = "right"\n',
  });
  m.open("a.md", "alpha\n");
  const row = async () => [...((await m?.frame())?.split("\n")[5] ?? "")];
  expect((await row()).lastIndexOf("│")).toBe(89);
  await m.mouse.drag(89, 5, 79, 5);
  expect(m.store.get().panels.explorer.width).toBe(40);
  expect((await row()).lastIndexOf("│")).toBe(79);
});

test("the shipped config docks the explorer on the right", async () => {
  m = await mountShell({ cols: 120, rows: 24 });
  m.store.dispatch({
    type: "configLoaded",
    result: parseConfig(""),
    reload: false,
  });
  m.open("a.md", "alpha\n");
  const row = [...((await m.frame()).split("\n")[5] ?? "")];
  expect(m.store.get().config.explorer.position).toBe("right");
  expect(row.lastIndexOf("│")).toBe(89);
});

test("hovering a cut name in the explorer shows it whole over the windows", async () => {
  m = await mountShell({
    cols: 120,
    rows: 16,
    config: "[explorer]\nwidth = 16\n",
  });
  const long = "private-non-functional-requirements.md";
  m.store.dispatch({
    type: "dirListed",
    dir: "",
    entries: [{ name: long, kind: "file" }],
  });
  expect(await m.frame()).not.toContain(long);
  const row = await find(m, "private-");
  await m.mouse.moveTo(row.x + 1, row.y);
  expect(m.store.get().panels.explorer.hover).toBe(long);
  expect(await m.row(row.y)).toContain(` ${long} `);
  await m.mouse.scroll(row.x + 1, row.y, "down");
  expect(m.store.get().panels.explorer.hover).toBeUndefined();
  await m.mouse.moveTo(row.x + 1, row.y);
  expect(m.store.get().panels.explorer.hover).toBe(long);
  await m.mouse.moveTo(row.x + 1, row.y + 3);
  expect(m.store.get().panels.explorer.hover).toBeUndefined();
  expect(await m.frame()).not.toContain(long);
});

test("on a right explorer the whole name reaches left over the windows", async () => {
  m = await mountShell({
    cols: 120,
    rows: 16,
    config: '[explorer]\nwidth = 16\nposition = "right"\n',
  });
  const long = "private-non-functional-requirements.md";
  m.store.dispatch({
    type: "dirListed",
    dir: "",
    entries: [{ name: long, kind: "file" }],
  });
  const row = await find(m, "private-");
  await m.mouse.moveTo(row.x + 1, row.y);
  const line = await m.row(row.y);
  expect(line).toContain(` ${long} `);
  expect(line.trimEnd().endsWith(long)).toBe(true);
});

test("a drag on a Base table's header separator resizes the column to its left", async () => {
  m = await mountShell({ cols: 120, rows: 16 });
  m.store.dispatch(indexed());
  m.keys("<leader>e");
  m.open("tasks.base", TASKS_BASE);
  const widths = () => {
    const s = m?.store.get();
    return s && baseWindow(s, s.windows.active)?.widths;
  };
  const header = await find(m, "│ Status");
  await m.mouse.drag(header.x, header.y, header.x + 10, header.y);
  expect(widths()).toEqual({ "file.name": 25 });
  expect((await find(m, "│ Status")).x).toBe(header.x + 10);
  // A double click on the separator returns the column to its own width.
  const moved = await find(m, "│ Status");
  await m.mouse.click(moved.x, moved.y);
  await m.mouse.click(moved.x, moved.y);
  expect(widths()).toBeUndefined();
  expect((await find(m, "│ Status")).x).toBe(header.x);
});
