import { afterEach, expect, test } from "bun:test";
import { stamp } from "../support/state";
import { type Mounted, mountShell } from "../support/ui";

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

const PATH = "data/app.db";

/** `app.db` open with one table read, and its query dialog open. */
async function dialog(): Promise<Mounted> {
  const x = await mountShell({ cols: 80, rows: 30 });
  x.open(PATH, "");
  x.store.dispatch({
    type: "sqliteSchema",
    path: PATH,
    stamp: stamp(1),
    gen: 1,
    result: {
      kind: "ok",
      tables: [
        {
          name: "things",
          kind: "table",
          sql: "CREATE TABLE things (id)",
          columns: [],
          indexes: [],
        },
      ],
    },
  });
  x.keys("s");
  return x;
}

/**
 * The dialog's text rows and the screen row of the first. At 80 columns its
 * box spans columns 2–77, and text runs from column 4 for 72 cells.
 */
async function textRows(x: Mounted): Promise<{ top: number; rows: string[] }> {
  const lines = (await x.frame()).split("\n");
  const top = lines.findIndex((l) => l.includes("╭─ Query · app.db")) + 2;
  const rows: string[] = [];
  for (let y = top; ; y++) {
    const inner = [...(lines[y] ?? "")].slice(4, 76).join("").trimEnd();
    if (inner === "") break;
    rows.push(inner);
  }
  return { top, rows };
}

test("the query dialog wraps a long query at spaces and keeps the caret on it", async () => {
  m = await dialog();
  const sql = `select ${Array.from({ length: 14 }, (_, i) => `column_${i}`).join(", ")} from things`;
  m.store.dispatch({ type: "paste", text: sql });
  const { top, rows } = await textRows(m);
  expect(rows.length).toBeGreaterThan(1);
  expect(rows.join(" ")).toBe(sql);
  for (const r of rows) expect([...r].length).toBeLessThanOrEqual(72);
  await m.frame();
  const end = m.t.renderer.getCursorState();
  expect({ x: end.x - 1, y: end.y - 1 }).toEqual({
    x: 4 + [...(rows.at(-1) ?? "")].length,
    y: top + rows.length - 1,
  });
  m.keys("<Home>");
  await m.frame();
  const home = m.t.renderer.getCursorState();
  expect({ x: home.x - 1, y: home.y - 1 }).toEqual({ x: 4, y: top });
});

test("the query dialog shows each line of a pasted query on its own row", async () => {
  m = await dialog();
  m.store.dispatch({ type: "paste", text: "select id\nfrom things" });
  expect((await textRows(m)).rows).toEqual(["select id", "from things"]);
});
