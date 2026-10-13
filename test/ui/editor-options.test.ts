import { afterEach, expect, test } from "bun:test";
import { type Mounted, mountShell } from "../support/ui";

/** A 300-character paragraph of short words separated by single spaces. */
const PARA = Array.from({ length: 60 }, (_, i) => `word${i}`)
  .join(" ")
  .slice(0, 300)
  .trimEnd();
const TEXT_W = 74; // 80 columns minus the 6-cell gutter (numbers, space, sign)

let m: Mounted;
afterEach(() => m.destroy());

async function mount(config?: string) {
  m = await mountShell(
    config === undefined
      ? { cols: 80, rows: 24 }
      : { cols: 80, rows: 24, config },
  );
  m.keys("<leader>e");
}

async function lines(): Promise<string[]> {
  return (await m.frame()).split("\n");
}

/** The hardware cursor's screen cell. */
async function cursorAt() {
  await m.frame();
  const c = m.t.renderer.getCursorState();
  return { x: c.x - 1, y: c.y - 1 };
}

/** The screen row where buffer line 1 starts. */
const firstRow = (frame: string[]) =>
  frame.findIndex((l) => /^ {3}1 {2}/.test(l));

test("a long paragraph wraps after spaces with a blank continuation gutter", async () => {
  await mount();
  m.open("notes/long.txt", `${PARA}\nnext\n`);
  const frame = await lines();
  const y0 = firstRow(frame);
  expect(y0).toBeGreaterThanOrEqual(0);
  const rows: string[] = [];
  for (let y = y0; !(frame[y] ?? "").startsWith("   1  next"); y++) {
    const row = frame[y] ?? "";
    expect(row.slice(0, 6)).toBe(y === y0 ? "   1  " : "      ");
    rows.push(row.slice(6));
  }
  expect(rows.length).toBeGreaterThanOrEqual(4);
  for (const r of rows.slice(0, -1))
    expect(r.trimEnd().length).toBeLessThan(TEXT_W);
  expect(rows.map((r) => r.trimEnd()).join(" ")).toBe(PARA);

  m.keys("$");
  const last = rows.length - 1;
  const lastText = (rows[last] ?? "").trimEnd();
  expect(await cursorAt()).toEqual({
    x: 6 + lastText.length - 1,
    y: y0 + last,
  });

  m.keys("j");
  const s = m.store.get();
  expect(s.windows.byId[s.windows.active]?.content.cursor).toEqual({
    line: 1,
    col: 3,
  });
  expect(await cursorAt()).toEqual({ x: 9, y: y0 + rows.length });
});

test("wrap off scrolls the row with an overflow marker", async () => {
  await mount("[editor]\nwrap = false\n");
  m.open("notes/long.txt", `${PARA}\nnext\n`);
  let frame = await lines();
  const y0 = firstRow(frame);
  expect(frame[y0]).toBe(`   1  ${PARA.slice(0, TEXT_W - 1)}›`);
  expect(frame[y0 + 1]?.startsWith("   1  next")).toBe(true);

  m.keys("$");
  frame = await lines();
  expect(frame[y0]).toBe(`   1  ${PARA.slice(PARA.length - TEXT_W)}`);
  expect(await cursorAt()).toEqual({ x: 79, y: y0 });

  m.keys("0");
  frame = await lines();
  expect(frame[y0]?.endsWith("›")).toBe(true);
});

test("a line of wide characters wraps at the window edge and places the cursor by cells", async () => {
  await mount();
  // 50 characters of two cells each: 37 fill a 74-cell row, 13 wrap.
  const cjk = "漢字かな".repeat(13).slice(0, 50);
  m.open("notes/cjk.txt", `${cjk}\nnext\n`);
  await m.frame();
  // The captured frame drops wide characters' second cells, so read the
  // cells: ASCII as is, any other cell (either half of a wide one) as `#`.
  const buf = m.t.renderer.currentRenderBuffer;
  const row = (y: number) =>
    [...buf.buffers.char.slice(y * buf.width, (y + 1) * buf.width)]
      .map((c) => (c < 0x80 ? String.fromCharCode(c) : "#"))
      .join("");
  const rows = Array.from({ length: buf.height }, (_, y) => row(y));
  const y0 = rows.findIndex((l) => l.startsWith("   1  #"));
  expect(y0).toBeGreaterThanOrEqual(0);
  expect(rows[y0]).toBe(`   1  ${"#".repeat(74)}`);
  expect(rows[y0 + 1]).toBe(`      ${"#".repeat(26)}${" ".repeat(48)}`);
  expect(rows[y0 + 2]?.startsWith("   1  next")).toBe(true);

  m.keys("$");
  expect(await cursorAt()).toEqual({ x: 6 + 12 * 2, y: y0 + 1 });
  m.keys("0lll");
  expect(await cursorAt()).toEqual({ x: 6 + 3 * 2, y: y0 });
});

test("absolute numbers on every row", async () => {
  await mount("[editor]\nrelativeNumbers = false\n");
  m.open("notes/a.txt", "one\ntwo\nthree\n");
  m.keys("j");
  const frame = await lines();
  const y0 = firstRow(frame);
  expect(frame.slice(y0, y0 + 3).map((l) => l.slice(0, 10))).toEqual([
    "   1  one ",
    "   2  two ",
    "   3  thre",
  ]);
});

test("a wide gutter shows five-digit numbers unclipped", async () => {
  await mount("[editor]\nrelativeNumbers = false\n");
  const text = Array.from({ length: 12000 }, (_, i) => `line ${i + 1}`);
  m.open("notes/big.txt", `${text.join("\n")}\n`);
  m.keys("G");
  const frame = await lines();
  const bottom = frame.findIndex((l) => l.startsWith("12000  line 12000"));
  expect(bottom).toBeGreaterThan(0);
  expect(frame[bottom - 1]?.startsWith("11999  line 11999")).toBe(true);
  expect(await cursorAt()).toEqual({ x: 7, y: bottom });
});

test("relative numbers keep the cursor line absolute in a wide gutter", async () => {
  await mount();
  const text = Array.from({ length: 12000 }, (_, i) => `line ${i + 1}`);
  m.open("notes/big.txt", `${text.join("\n")}\n`);
  m.keys("G");
  const frame = await lines();
  const bottom = frame.findIndex((l) => l.startsWith("12000  line 12000"));
  expect(frame[bottom - 1]?.startsWith("    1  line 11999")).toBe(true);
});

test("tab width 4 paints at column 4", async () => {
  await mount("[editor]\ntabWidth = 4\n");
  m.open("notes/t.txt", "\tx\nabcdef\n");
  const frame = await lines();
  const y0 = firstRow(frame);
  expect(frame[y0]?.slice(0, 11)).toBe("   1      x");
  m.keys("lj");
  const s = m.store.get();
  expect(s.windows.byId[s.windows.active]?.content.cursor).toEqual({
    line: 1,
    col: 4,
  });
  expect(await cursorAt()).toEqual({ x: 10, y: y0 + 1 });
});

test("a line taller than the window shows the rows holding the cursor", async () => {
  await mount();
  const long = Array.from({ length: 400 }, (_, i) => `w${i}`).join(" ");
  m.open("notes/tall.txt", `${long}\n`);
  m.keys("$");
  const frame = await lines();
  const c = await cursorAt();
  const row = frame[c.y] ?? "";
  expect(row.trimEnd().endsWith("w399")).toBe(true);
  expect(c.x).toBe(row.trimEnd().length - 1);
  expect(frame.some((l) => /^ {3}1 {2}/.test(l))).toBe(false);
  m.keys("0");
  const top = await lines();
  expect(top.some((l) => l.startsWith("   1  w0 w1 "))).toBe(true);
});

test("a picker preview wraps the long paragraph", async () => {
  m = await mountShell({ cols: 120, rows: 24 });
  m.store.dispatch({
    type: "indexBatch",
    summaries: [],
    files: ["notes/long.md"],
    done: 1,
    total: 1,
  });
  m.open("notes/long.md", `${PARA}\nnext\n`);
  m.keys("<leader>ff");
  const frame = await lines();
  const head = frame.findIndex((l) => l.includes("│ notes/long.md"));
  expect(head).toBeGreaterThan(0);
  const x = (frame[head] ?? "").indexOf("│ notes/long.md") + 2;
  const pane: string[] = [];
  for (let y = head + 1; y < frame.length; y++) {
    const row = (frame[y] ?? "").slice(x, -1);
    const text = row.slice(0, row.lastIndexOf("│")).trimEnd();
    if (text === "next") break;
    pane.push(text);
  }
  const width = (frame[head] ?? "").slice(x).indexOf("│");
  expect(pane.length).toBeGreaterThanOrEqual(5);
  for (const r of pane) expect(r.length).toBeLessThan(width);
  expect(pane.join(" ")).toBe(PARA);

  m.t.resize(99, 24);
  m.store.dispatch({ type: "resize", cols: 99, rows: 24 });
  // The preview header shares the query row; at 99 columns it is gone.
  const query = (await lines()).find((l) => l.includes("❯")) ?? "";
  expect(query).not.toContain("notes/long.md");
});
