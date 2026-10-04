import { expect, test } from "bun:test";
import { KANBAN_TYPE } from "./types";
import { BaseLayoutRegistry, boardLayout, tableLayout } from "./views";

const registry = () => {
  const reg = new BaseLayoutRegistry(tableLayout);
  if (KANBAN_TYPE !== undefined) reg.register(KANBAN_TYPE, boardLayout);
  return reg;
};

test("a table view resolves to the table without a notice", () => {
  expect(registry().resolve("table")).toEqual({ layout: tableLayout });
});

test("unsupported view types fall back to a table with a notice", () => {
  const reg = registry();
  expect(reg.resolve("cards")).toEqual({
    layout: tableLayout,
    notice: "cards view is not supported yet; showing a table",
  });
  expect(reg.resolve("kanban")).toEqual({
    layout: tableLayout,
    notice: "kanban view is not supported yet; showing a table",
  });
});

test("a registered board type resolves to the board", () => {
  const reg = registry();
  reg.register("kanban-test", boardLayout);
  expect(reg.resolve("kanban-test")).toEqual({ layout: boardLayout });
  expect(boardLayout.id).toBe("board");
  expect(tableLayout.id).toBe("table");
});
