import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { scanDoc } from "../../lang/markdown/scan";
import { buildIndex } from "../links/note-index";
import { summarize } from "../links/summarize";
import { candidatesFrom } from "./candidates";
import { evaluateBase } from "./evaluator";
import { parseBase } from "./parser";
import { tableModel } from "./table";
import type { BaseCandidate, BaseUi } from "./types";

const fixtures = new URL("../../../../test/fixtures/", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, fixtures), "utf8");

/** The tasks fixture notes as candidates. */
function tasks(): BaseCandidate[] {
  const names = readdirSync(new URL("workspace/tasks/", fixtures)).sort();
  const summaries = names.map((n, i) =>
    summarize(
      `tasks/${n}`,
      { mtime: 1000 * (i + 1), size: 10, ctime: 1000 },
      scanDoc(read(`workspace/tasks/${n}`)),
    ),
  );
  return candidatesFrom(
    buildIndex(
      summaries,
      summaries.map((s) => s.path),
    ),
    new Map(),
  );
}

const base = (rel: string) => {
  const r = parseBase(read(rel));
  if (!r.ok) throw new Error(r.diagnostic.message);
  return r.base;
};

const model = (rel: string, view?: string, ui: BaseUi = {}) =>
  tableModel(
    evaluateBase({
      base: base(rel),
      candidates: tasks(),
      ...(view === undefined ? {} : { view }),
      ui,
    }),
    ui,
    {},
  );

test("table columns follow the view order with the sort shown on its column", () => {
  const m = model("workspace/tasks.base");
  expect(m.columns.map((c) => [c.id, c.label, c.editable])).toEqual([
    ["file.name", "name", false],
    ["status", "Status", true],
    ["due", "due", true],
    ["done", "done", true],
  ]);
  expect(m.columns.map((c) => c.sort)).toEqual([
    undefined,
    undefined,
    "ASC",
    undefined,
  ]);
  expect(m.columns.map((c) => c.type)).toEqual([
    "text",
    "text",
    "date",
    "checkbox",
  ]);
  expect(m.rows.map((r) => r.path)).toEqual([
    "tasks/ship-release.md",
    "tasks/review-pr.md",
    "tasks/write-report.md",
    "tasks/inbox.md",
  ]);
  expect(m.rows[0]?.cells.map((c) => c.text)).toEqual([
    "ship-release.md",
    "done",
    "2026-10-01",
    "true",
  ]);
  expect(m.groups).toEqual([]);
  expect(m.total).toBe(4);
});

test("summaries use the view's default summary names", () => {
  const m = model("workspace/tasks.base");
  expect(m.summaries.map((s) => s && [s.name, s.text])).toEqual([
    undefined,
    undefined,
    ["Earliest", "2026-10-01"],
    ["Checked", "1"],
  ]);
  expect(m.diagnostics).toEqual([]);
});

test("a custom summary leaves an empty cell and a diagnostic", () => {
  const r = parseBase(
    "summaries:\n  odd: 'values.length'\nviews:\n  - type: table\n    name: T\n    order: [file.name, due]\n    summaries:\n      due: odd\n",
  );
  if (!r.ok) throw new Error();
  const e = evaluateBase({ base: r.base, candidates: tasks() });
  const m = tableModel(e, {}, {});
  expect(m.summaries[1]).toEqual({ name: "odd", text: "" });
  expect(m.diagnostics.map((d) => d.code)).toEqual(["summary_unsupported"]);
});

test("the window's sort override moves the arrow and the rows", () => {
  const m = model("workspace/tasks.base", "All tasks", {
    sort: { property: "status", direction: "DESC" },
  });
  expect(m.columns.map((c) => c.sort)).toEqual([
    undefined,
    "DESC",
    undefined,
    undefined,
  ]);
  expect(m.rows[0]?.path).toBe("tasks/write-report.md");
});

test("groups without groupOrder follow the direction with None last", () => {
  const m = model("workspace/tasks.base", "By status");
  expect(m.groups.map((g) => [g.label, g.key, g.start, g.count])).toEqual([
    ["doing", "doing", 0, 1],
    ["done", "done", 1, 1],
    ["todo", "todo", 2, 1],
    ["None", null, 3, 1],
  ]);
  expect(m.rows.map((r) => r.path)).toEqual([
    "tasks/review-pr.md",
    "tasks/ship-release.md",
    "tasks/write-report.md",
    "tasks/inbox.md",
  ]);
  expect(
    model("workspace/tasks.base", "By status", { grouped: false }).groups,
  ).toEqual([]);
});

test("groups follow groupOrder exactly with None last and hidden values absent", () => {
  const candidates = [
    ...tasks(),
    ...["blocked", "doing"].map((status, i) => ({
      ...(tasks()[0] as BaseCandidate),
      path: `extra/${i}.md`,
      name: `${i}.md`,
      properties: { status },
    })),
  ];
  const m = tableModel(
    evaluateBase({ base: base("bases/group-order.base"), candidates }),
    {},
    {},
  );
  expect(m.groups.map((g) => [g.label, g.count])).toEqual([
    ["todo", 1],
    ["doing", 2],
    ["done", 1],
    ["None", 1],
  ]);
  expect(m.rows.map((r) => r.path)).not.toContain("extra/0.md");
  expect(m.rows).toHaveLength(5);
});

test("numeric groups sort by number, not by text", () => {
  const r = parseBase(
    "views:\n  - type: table\n    name: T\n    groupBy:\n      property: estimate\n      direction: DESC\n",
  );
  if (!r.ok) throw new Error();
  const candidates = [10, 9, 2, 100].map((estimate, i) => ({
    ...(tasks()[0] as BaseCandidate),
    path: `n/${i}.md`,
    name: `${i}.md`,
    properties: { estimate },
  }));
  const m = tableModel(evaluateBase({ base: r.base, candidates }), {}, {});
  expect(m.groups.map((g) => g.key)).toEqual([100, 10, 9, 2]);
});

test("total and summaries count only the rows the groups show", () => {
  const r = parseBase(
    "views:\n  - type: table\n    name: T\n    order: [file.name, n]\n    groupBy:\n      property: status\n      direction: ASC\n    groupOrder: [todo]\n    summaries:\n      n: Sum\n",
  );
  if (!r.ok) throw new Error();
  const candidates = [
    ["todo", 1],
    ["done", 100],
  ].map(([status, n], i) => ({
    ...(tasks()[0] as BaseCandidate),
    path: `s/${i}.md`,
    name: `${i}.md`,
    properties: { status, n },
  }));
  const m = tableModel(evaluateBase({ base: r.base, candidates }), {}, {});
  expect(m.rows.map((row) => row.path)).toEqual(["s/0.md"]);
  expect(m.total).toBe(1);
  expect(m.summaries[1]?.text).toBe("1");
});

test("an empty listed group is kept", () => {
  const r = parseBase(
    "views:\n  - type: table\n    name: T\n    groupBy:\n      property: status\n      direction: ASC\n    groupOrder: [waiting, todo]\n",
  );
  if (!r.ok) throw new Error();
  const m = tableModel(
    evaluateBase({ base: r.base, candidates: tasks() }),
    {},
    {},
  );
  expect(m.groups.map((g) => [g.label, g.start, g.count])).toEqual([
    ["waiting", 0, 0],
    ["todo", 0, 1],
  ]);
});

test("file times show as local dates and times", () => {
  const r = parseBase(
    "views:\n  - type: table\n    name: T\n    order: [file.name, file.mtime]\n",
  );
  if (!r.ok) throw new Error();
  const e = evaluateBase({ base: r.base, candidates: tasks() });
  const ms = (e.rows[0]?.cells["file.mtime"]?.value ?? 0) as number;
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  expect(tableModel(e, {}, {}).rows[0]?.cells[1]?.text).toBe(
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
  );
});

test("dates written different ways sort by time and show alike; a missing created_at is the file's", () => {
  const notes: Record<string, string> = {
    "a.md": "---\ncreated_at: 2026-04-13 08:20:00\n---\n",
    "b.md": "---\ncreated_at: 2026-04-13T08:19:00\n---\n",
    "c.md": "---\ncreated_at: 2026-07-20T23:21:03.655Z\n---\n",
    "d.md": "",
  };
  const ctime = new Date(2026, 9, 11, 11, 55, 7).getTime();
  const summaries = Object.entries(notes).map(([p, t]) =>
    summarize(p, { mtime: ctime, size: 1, ctime }, scanDoc(t)),
  );
  const r = parseBase(
    "views:\n  - type: table\n    name: T\n    order: [file.name, created_at]\n    sort:\n      - property: created_at\n        direction: DESC\n",
  );
  if (!r.ok) throw new Error();
  const candidates = candidatesFrom(
    buildIndex(
      summaries,
      summaries.map((s) => s.path),
    ),
    new Map(),
  );
  const m = tableModel(evaluateBase({ base: r.base, candidates }), {}, {});
  expect(m.rows.map((row) => row.path)).toEqual([
    "d.md",
    "c.md",
    "a.md",
    "b.md",
  ]);
  const texts = m.rows.map((row) => row.cells[1]?.text ?? "");
  expect(texts[0]).toBe("2026-10-11 11:55:07");
  expect(texts.slice(2)).toEqual([
    "2026-04-13 08:20:00",
    "2026-04-13 08:19:00",
  ]);
  for (const t of texts)
    expect(t).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
});

test("columns are as wide as their widest header or cell, at most 24", () => {
  const m = model("workspace/tasks.base");
  // "ship-release.md" (15), "Status" vs "doing", "due ↑" vs "2026-10-01", "done" vs a box.
  expect(m.columns.map((c) => c.width)).toEqual([15, 6, 10, 4]);
});

test("the view's columnSize sets widths in cells, prefixed keys included", () => {
  const text = read("workspace/tasks.base").replace(
    "    sort:\n      - property: due",
    "    columnSize:\n      file.name: 200\n      note.status: 4\n    sort:\n      - property: due",
  );
  const r = parseBase(text);
  if (!r.ok) throw new Error(r.diagnostic.message);
  const ui: BaseUi = { widths: { "file.name": 40 } };
  const sized = (u: BaseUi) =>
    tableModel(
      evaluateBase({ base: r.base, candidates: tasks(), ui: u }),
      u,
      {},
    ).columns.map((c) => c.width);
  // 200 px is 25 cells; 4 px is under the 3-cell floor.
  expect(sized({})).toEqual([25, 3, 10, 4]);
  // The window's width replaces the view's.
  expect(sized(ui)).toEqual([40, 3, 10, 4]);
});
