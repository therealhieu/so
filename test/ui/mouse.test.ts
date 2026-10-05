import { afterEach, expect, test } from "bun:test";
import { parseConfig } from "../../src/core/config/toml";
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
