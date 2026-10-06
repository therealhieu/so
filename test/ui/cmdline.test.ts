import { afterAll, beforeAll, expect, test } from "bun:test";
import { type Mounted, mountShell } from "../support/ui";

let m: Mounted;

beforeAll(async () => {
  m = await mountShell({ cols: 120, rows: 36, kittyKeyboard: true });
  m.keys("<leader>e");
  m.open("notes/ideas.md", "# Ideas\n\nA terminal editor for notes.\n");
});
afterAll(() => m.destroy());

/** Press keys through the terminal input path (kitty protocol). */
async function press(...keys: string[]) {
  for (const k of keys)
    if (k === "<Esc>") m.t.mockInput.pressEscape();
    else if (k === "<CR>") m.t.mockInput.pressEnter();
    else if (k === "<Tab>") m.t.mockInput.pressTab();
    else m.t.mockInput.pressKey(k);
  await m.t.flush();
}

const badge = async () => (await m.status()).trim().split(/\s+/)[0];

test("the mode badge follows Insert, Normal, Visual, V-line, and Command modes", async () => {
  const seen: (string | undefined)[] = [];
  await press("i");
  seen.push(await badge());
  expect(m.t.renderer.getCursorState().style).toBe("line");
  await press("h", "i", "<Esc>");
  seen.push(await badge());
  expect(m.t.renderer.getCursorState().style).toBe("block");
  await press("v", "j");
  seen.push(await badge());
  await press("<Esc>", "V");
  seen.push(await badge());
  await press("<Esc>", ":");
  seen.push(await badge());
  await press("<Esc>");
  expect(seen).toEqual(["INSERT", "NORMAL", "VISUAL", "V-LINE", "COMMAND"]);
});

test("an unknown ex command reports E492 at the right end of the row above the statusline", async () => {
  await press(":", "f", "o", "o", "<CR>");
  expect((await m.message()).trim()).toBe("E492: Not an editor command: foo");
  expect(await m.row(-2)).toEndWith("E492: Not an editor command: foo ");
  await press("j");
  expect(await m.row(-2)).not.toContain("E492");
});

test("the command-line popup shows only while typing, just above the statusline", async () => {
  expect((await m.frame()).includes("Cmdline")).toBe(false);
  await press(":", "s");
  expect(await m.row(-4)).toStartWith("╭─ Cmdline ─");
  expect(await m.cmdline()).toBe(":s");
  expect(await m.row(-2)).toStartWith("╰─");
  expect(await m.status()).toContain("COMMAND");
  await press("<Esc>", "/");
  expect(await m.row(-4)).toStartWith("╭─ Search ─");
  await press("<Esc>");
  expect((await m.frame()).includes("Search")).toBe(false);
});

test("pending keys show at the right of the statusline, before the position", async () => {
  await press("2", "d");
  expect((await m.status()).trimEnd()).toMatch(/ 2d +\d+:\d+$/);
  await press("<Esc>");
  expect(await m.status()).not.toMatch(/ 2d /);
});

test("Tab completes vs to vsplit and lists it first", async () => {
  await press(":", "v", "s", "<Tab>");
  const frame = (await m.frame()).split("\n");
  expect(await m.cmdline()).toBe(":vsplit");
  expect(m.t.renderer.getCursorState()).toMatchObject({
    x: 10,
    y: 34,
    style: "line",
  });
  const first = frame.find((l) => l.includes("│ :"));
  expect(first).toContain(":vsplit");
  await press("<Esc>");
});
