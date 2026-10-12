import { afterEach, expect, test } from "bun:test";
import { type Mounted, mountShell } from "../support/ui";

/** A 300-character paragraph of distinct short words separated by single spaces. */
const PARA = Array.from({ length: 60 }, (_, i) => `word${i}`)
  .join(" ")
  .slice(0, 300)
  .trimEnd();
const COLS = 160;
const WIDTH = 60;
const GUTTER = 6; // numbers, a space, the sign cell
/** The gutter and text of a 60-column text centered in 160 columns. */
const GUTTER_X = Math.floor((COLS - GUTTER - WIDTH) / 2);
const TEXT_X = GUTTER_X + GUTTER;

let m: Mounted;
afterEach(() => m.destroy());

async function mount(config: string) {
  m = await mountShell({ cols: COLS, rows: 24, config });
  m.keys("<leader>e");
}

async function lines(): Promise<string[]> {
  return (await m.frame()).split("\n");
}

async function cursorAt() {
  await m.frame();
  const c = m.t.renderer.getCursorState();
  return { x: c.x - 1, y: c.y - 1 };
}

const cursor = () => {
  const s = m.store.get();
  return s.windows.byId[s.windows.active]?.content.cursor;
};

/** The screen rows of buffer line 1, from its numbered row to the next numbered one. */
function rowsOfFirstLine(frame: string[], gutterX: number) {
  const y0 = frame.findIndex(
    (l) => l.slice(gutterX, gutterX + GUTTER) === "   1  ",
  );
  const rows: string[] = [];
  for (let y = y0; y < frame.length; y++) {
    const row = frame[y] ?? "";
    if (y > y0 && row.slice(gutterX, gutterX + GUTTER).trim() !== "") break;
    if (row.trim() === "") break;
    rows.push(row);
  }
  return { y0, rows };
}

test("a note's text is capped at the readable width and centered with its gutter", async () => {
  await mount(`[preview]\nreadableWidth = ${WIDTH}\n`);
  m.open("notes/long.md", `${PARA}\n`);
  const { y0, rows } = rowsOfFirstLine(await lines(), GUTTER_X);
  expect(y0).toBeGreaterThanOrEqual(0);
  expect(rows.length).toBeGreaterThanOrEqual(5);
  for (const row of rows) {
    expect(row.slice(0, GUTTER_X).trim()).toBe("");
    expect(row.slice(TEXT_X + WIDTH).trim()).toBe("");
  }
  const texts = rows.map((r) => r.slice(TEXT_X).trimEnd());
  expect(texts.join(" ")).toBe(PARA);

  m.keys("$");
  const last = texts.length - 1;
  expect(await cursorAt()).toEqual({
    x: TEXT_X + (texts[last]?.length ?? 0) - 1,
    y: y0 + last,
  });
});

test("clicks in the column and in its margins land on the row's text", async () => {
  await mount(`[preview]\nreadableWidth = ${WIDTH}\n`);
  m.open("notes/long.md", `${PARA}\n`);
  const { y0, rows } = rowsOfFirstLine(await lines(), GUTTER_X);
  const texts = rows.map((r) => r.slice(TEXT_X).trimEnd());
  const second = PARA.indexOf(texts[1] ?? "?");

  await m.mouse.click(TEXT_X + 3, y0 + 1);
  expect(cursor()).toEqual({ line: 0, col: second + 3 });

  await m.mouse.click(COLS - 5, y0);
  // Past the row's end: its last cell, the space it wraps after.
  expect(cursor()).toEqual({ line: 0, col: texts[0]?.length ?? -1 });

  await m.mouse.click(4, y0 + 1);
  expect(cursor()).toEqual({ line: 0, col: 0 });
});

test("the source view is centered too, and a code file fills the window", async () => {
  await mount(`[preview]\nreadableWidth = ${WIDTH}\nmode = "source"\n`);
  m.open("notes/long.md", `${PARA}\n`);
  let frame = await lines();
  expect(rowsOfFirstLine(frame, GUTTER_X).y0).toBeGreaterThanOrEqual(0);

  m.open("scripts/long.ts", `const s = "${PARA}";\n`);
  frame = await lines();
  const { rows } = rowsOfFirstLine(frame, 0);
  expect(rows[0]?.startsWith("   1  const s")).toBe(true);
  expect(rows[0]?.trimEnd().length).toBeGreaterThan(TEXT_X + WIDTH);
});
