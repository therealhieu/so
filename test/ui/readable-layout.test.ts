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

/**
 * The screen rows of the line numbered `number` (relative numbers: the
 * cursor line shows its own), from its numbered row to the next numbered one.
 */
function rowsOfFirstLine(frame: string[], gutterX: number, number = 1) {
  // The number cells and their space; the sign cell after them may be set.
  const numberOf = (l: string) => l.slice(gutterX, gutterX + GUTTER - 1);
  const label = `${String(number).padStart(4)} `;
  const y0 = frame.findIndex((l) => numberOf(l) === label);
  const rows: string[] = [];
  for (let y = y0; y < frame.length; y++) {
    const row = frame[y] ?? "";
    if (y > y0 && numberOf(row).trim() !== "") break;
    if (row.trim() === "") break;
    rows.push(row);
  }
  return { y0, rows };
}

test("a note's text is capped at the readable width and centered with its gutter", async () => {
  await mount(`[preview]\nreadable = true\nreadableWidth = ${WIDTH}\n`);
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
  await mount(`[preview]\nreadable = true\nreadableWidth = ${WIDTH}\n`);
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
  await mount(
    `[preview]\nreadable = true\nreadableWidth = ${WIDTH}\nmode = "source"\n`,
  );
  m.open("notes/long.md", `${PARA}\n`);
  let frame = await lines();
  expect(rowsOfFirstLine(frame, GUTTER_X).y0).toBeGreaterThanOrEqual(0);

  m.open("scripts/long.ts", `const s = "${PARA}";\n`);
  frame = await lines();
  const { rows } = rowsOfFirstLine(frame, 0);
  expect(rows[0]?.startsWith("   1  const s")).toBe(true);
  expect(rows[0]?.trimEnd().length).toBeGreaterThan(TEXT_X + WIDTH);
});

const JUSTIFY = `[preview]\nreadable = true\nreadableWidth = ${WIDTH}\njustify = true\n`;

/** The column's text of each row, stretched rows keeping their inner spaces. */
const textsOf = (rows: string[]) =>
  rows.map((r) => r.slice(TEXT_X, TEXT_X + WIDTH).trimEnd());

test("justified rows reach the right edge and the last row stays ragged", async () => {
  await mount(JUSTIFY);
  m.open("notes/long.md", `${PARA}\n`);
  const texts = textsOf(rowsOfFirstLine(await lines(), GUTTER_X).rows);
  expect(texts.length).toBeGreaterThanOrEqual(5);
  for (const t of texts.slice(0, -1)) expect(t.length).toBe(WIDTH);
  expect(texts.at(-1)?.length).toBeLessThan(WIDTH);
  expect(texts.join(" ").split(/ +/).join(" ")).toBe(PARA);
});

test("the cursor and clicks land on the words of a stretched row", async () => {
  await mount(JUSTIFY);
  m.open("notes/long.md", `${PARA}\n`);
  const { y0, rows } = rowsOfFirstLine(await lines(), GUTTER_X);
  const row = textsOf(rows)[0] ?? "";
  const cell = (word: string) => row.search(new RegExp(`\\b${word}\\b`));
  expect(cell("word6")).toBeGreaterThan(PARA.indexOf("word6"));

  m.keys("5w");
  expect(cursor()).toEqual({ line: 0, col: PARA.indexOf("word5") });
  expect(await cursorAt()).toEqual({ x: TEXT_X + cell("word5"), y: y0 });

  await m.mouse.click(TEXT_X + cell("word6") + 1, y0);
  expect(cursor()).toEqual({ line: 0, col: PARA.indexOf("word6") + 1 });

  // The cell just before a word is an extra one: it belongs to the space.
  await m.mouse.click(TEXT_X + cell("word7") - 1, y0);
  expect(cursor()).toEqual({ line: 0, col: PARA.indexOf("word7") - 1 });
});

test("in the live view the cursor's revealed line stays ragged", async () => {
  await mount(JUSTIFY);
  m.open("notes/long.md", `${PARA}\n\n${PARA}\n`);
  m.keys("<leader>m");
  const s = m.store.get();
  const w = s.windows.byId[s.windows.active];
  expect(w && s.buffers[w.content.bufferId]?.view).toBe("live");
  const frame = await lines();
  expect(rowsOfFirstLine(frame, GUTTER_X).y0).toBeGreaterThanOrEqual(0);
  const own = textsOf(rowsOfFirstLine(frame, GUTTER_X).rows);
  const other = textsOf(rowsOfFirstLine(frame, GUTTER_X, 2).rows);
  expect(own.slice(0, -1).some((t) => t.length < WIDTH)).toBe(true);
  for (const t of other.slice(0, -1)) expect(t.length).toBe(WIDTH);
});

test("<leader>ur and <leader>uj toggle the column and justify, and save them", async () => {
  await mount(JUSTIFY);
  m.open("notes/long.md", `${PARA}\n`);
  const writes = () =>
    m.effects
      .filter((e) => e.kind === "writeSetting")
      .map((e) => `${e.path.join(".")}=${String(e.value)}`);

  m.keys("<leader>ur");
  let frame = await lines();
  expect(rowsOfFirstLine(frame, 0).y0).toBeGreaterThanOrEqual(0);
  expect(frame.join("\n")).toContain("readable width off");

  m.keys("<leader>ur");
  frame = await lines();
  expect(rowsOfFirstLine(frame, GUTTER_X).y0).toBeGreaterThanOrEqual(0);

  m.keys("<leader>uj");
  const texts = textsOf(rowsOfFirstLine(await lines(), GUTTER_X).rows);
  expect(texts.slice(0, -1).some((t) => t.length < WIDTH)).toBe(true);
  expect(writes()).toEqual([
    "preview.readable=false",
    "preview.readable=true",
    "preview.justify=false",
  ]);
});

test("a justified callout body keeps its bar on every row and reaches the right edge", async () => {
  await mount(JUSTIFY);
  m.open("notes/callout.md", `> [!note] Title\n> ${PARA}\n`);
  const body = textsOf(await lines()).filter((t) => t.startsWith("▎ "));
  expect(body.length).toBeGreaterThanOrEqual(5);
  for (const t of body.slice(0, -1)) expect([...t].length).toBe(WIDTH);
  expect([...(body.at(-1) ?? "")].length).toBeLessThan(WIDTH);
});
