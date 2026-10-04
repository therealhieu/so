import { expect, test } from "bun:test";
import { evaluateBase } from "./evaluator";
import { kanbanModel } from "./kanban";
import { parseBase } from "./parser";
import type { BaseCandidate } from "./types";

const card = (
  path: string,
  properties: Record<string, unknown>,
  folder = "",
): BaseCandidate => ({
  path,
  name: path.slice(path.lastIndexOf("/") + 1),
  basename: path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/, ""),
  folder,
  ext: "md",
  size: 1,
  mtime: 1,
  ctime: 1,
  properties,
  tags: [],
  links: [],
  embeds: [],
});

const board = (yaml: string, candidates: BaseCandidate[]) => {
  const r = parseBase(yaml);
  if (!r.ok) throw new Error(r.diagnostic.message);
  return kanbanModel(evaluateBase({ base: r.base, candidates }), {});
};

const notes = [
  card("a.md", { status: "todo", due: "2026-10-05" }),
  card("b.md", { status: "doing" }),
  card("c.md", { status: "todo" }),
  card("d.md", {}),
];

const view = (extra: string) =>
  `views:\n  - type: kanban-test\n    name: Board\n    order: [file.name, status, due]\n    groupBy:\n      property: status\n      direction: DESC\n${extra}`;

test("lanes without groupOrder are distinct values in direction order plus None", () => {
  const m = board(view(""), notes);
  expect(m.property).toBe("status");
  expect(m.movable).toBe(true);
  expect(m.why).toBeUndefined();
  expect(
    m.lanes.map((l) => [l.key, l.label, l.cards.map((c) => c.path)]),
  ).toEqual([
    ["todo", "todo", ["a.md", "c.md"]],
    ["doing", "doing", ["b.md"]],
    [null, "None", ["d.md"]],
  ]);
  expect(m.lanes[0]?.cards[0]).toEqual({
    path: "a.md",
    title: "a",
    fields: ["2026-10-05"],
  });
});

test("lanes with groupOrder are exactly its values, empty lanes included", () => {
  const m = board(view("    groupOrder: [done, doing, todo]\n"), notes);
  expect(m.lanes.map((l) => [l.key, l.cards.length])).toEqual([
    ["done", 0],
    ["doing", 1],
    ["todo", 2],
  ]);
});

test("numeric lanes keep typed keys so moves write numbers", () => {
  const m = board(
    "views:\n  - type: kanban-test\n    name: B\n    groupBy:\n      property: priority\n      direction: ASC\n",
    [card("a.md", { priority: 3 }), card("b.md", { priority: 1 })],
  );
  expect(m.lanes.map((l) => l.key)).toEqual([1, 3, null]);
  expect(
    board(
      "views:\n  - type: kanban-test\n    name: B\n    groupBy:\n      property: priority\n      direction: ASC\n    groupOrder: [3, 1]\n",
      [card("a.md", { priority: 3 })],
    ).lanes.map((l) => l.key),
  ).toEqual([3, 1]);
});

test("boards grouped by a formula or file field cannot move cards", () => {
  const formula = board(
    "formulas:\n  late: 'status == \"todo\"'\nviews:\n  - type: kanban-test\n    name: B\n    groupBy:\n      property: formula.late\n      direction: ASC\n",
    notes,
  );
  expect([formula.movable, formula.why]).toEqual([false, "formula"]);
  expect(formula.lanes.map((l) => l.key)).toEqual([false, true, null]);
  const folder = board(
    "views:\n  - type: kanban-test\n    name: B\n    groupBy:\n      property: file.folder\n      direction: ASC\n",
    [card("x/a.md", {}, "x"), card("y/b.md", {}, "y")],
  );
  expect([folder.movable, folder.why]).toEqual([false, "file"]);
});
