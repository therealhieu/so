import { expect, test } from "bun:test";
import { shown } from "../bases/table";
import { sqliteTableModel } from "./table";
import type { SqliteCell } from "./types";
import { cellLines, copyText, gridText, sizeText, tableCell } from "./value";

const text = (t: string, size = t.length): SqliteCell => ({
  t: "text",
  text: t,
  size,
});

test("NULL and empty text look different in the grid", () => {
  expect(shown(tableCell({ t: "null" }))).toEqual({
    text: "NULL",
    empty: true,
  });
  expect(shown(tableCell(text("")))).toEqual({ text: "", empty: true });
  expect(shown(tableCell(text("a")))).toEqual({ text: "a", empty: false });
});

test("the grid shows a value's first line, a BLOB's size, and exact integers", () => {
  expect(gridText(text("one\ntwo"))).toBe("one…");
  expect(gridText({ t: "blob", size: 2400, hex: "" })).toBe("‹blob 2.3 KB›");
  expect(gridText({ t: "int", text: "9223372036854775807" })).toBe(
    "9223372036854775807",
  );
  expect(tableCell({ t: "real", text: "1.5" }).value.type).toBe("number");
});

test("sizes read short", () => {
  expect(sizeText(512)).toBe("512 B");
  expect(sizeText(2400)).toBe("2.3 KB");
  expect(sizeText(5 * 1024 * 1024)).toBe("5.0 MB");
});

test("the cell pane indents JSON and dumps BLOBs as hex", () => {
  expect(cellLines(text('{"a":[1,2]}'))).toEqual({
    head: "JSON, 11 chars",
    lines: ["{", '  "a": [', "    1,", "    2", "  ]", "}"],
  });
  expect(cellLines(text("not {json"))).toEqual({
    head: "text, 9 chars",
    lines: ["not {json"],
  });
  const blob = cellLines({ t: "blob", size: 5000, hex: "48690a00" });
  expect(blob.head).toBe("BLOB, 4.9 KB, first 4.0 KB shown");
  expect(blob.lines).toEqual([`00000000  ${"48 69 0a 00".padEnd(47)}  Hi..`]);
});

test("a cut text says how much of it is shown and is not read as JSON", () => {
  expect(cellLines(text("{", 20000)).head).toBe(
    "text, 20 K chars, first 1 chars shown",
  );
});

test("copying gives the value itself", () => {
  expect(copyText({ t: "null" })).toBe("");
  expect(copyText({ t: "blob", size: 2, hex: "00ff" })).toBe("00ff");
  expect(copyText(text("a\nb"))).toBe("a\nb");
});

test("columns are as wide as their content up to 24, or as resized", () => {
  const m = sqliteTableModel(
    ["id", "note"],
    [[{ t: "int", text: "1" }, text("x".repeat(40))]],
    { id: 10 },
  );
  expect(m.columns.map((c) => c.width)).toEqual([10, 24]);
  expect(m.columns.every((c) => !c.editable)).toBe(true);
  expect(m.total).toBe(1);
});
