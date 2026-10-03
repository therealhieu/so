import { expect, test } from "bun:test";
import { Registers } from "../editor/registers";
import { UndoHistory } from "../editor/undo";
import type { Pos } from "../text/pos";
import { createTextBuffer } from "../text/text-buffer";
import { handleKey } from "./engine";
import { splitKeys } from "./keys";
import type { VimSession } from "./operators";

function run(text: string, cursor: Pos, keys: string, tabWidth: number) {
  let s: VimSession = {
    text: createTextBuffer(text),
    cursor,
    undo: new UndoHistory(),
    registers: new Registers(),
    vim: { mode: "normal", pending: [], cmdline: "" },
  };
  for (const key of splitKeys(keys))
    s = handleKey(s, key, { topLine: 0, rows: 22, tabWidth }).s;
  return { text: s.text.line(0), cursor: s.cursor };
}

test("tab width 4 moves j by display column and shifts by 4", () => {
  expect(run("\tx\nabcdef", { line: 0, col: 1 }, "j", 4).cursor).toEqual({
    line: 1,
    col: 4,
  });
  expect(run("a", { line: 0, col: 0 }, ">>", 4).text).toBe("\ta");
  expect(run("  a", { line: 0, col: 0 }, ">>", 4).text).toBe("\t  a");
  expect(run("\t\ta", { line: 0, col: 0 }, "<<", 4).text).toBe("\ta");
});

test("tab width 8 keeps the recorded behaviour", () => {
  expect(run("\tx\nabcdef", { line: 0, col: 1 }, "j", 8).cursor).toEqual({
    line: 1,
    col: 5,
  });
  expect(run("a", { line: 0, col: 0 }, ">>", 8).text).toBe("\ta");
  expect(run("\t\ta", { line: 0, col: 0 }, "<<", 8).text).toBe("\ta");
});

test("k back onto a tab keeps the remembered column", () => {
  // From "e" (display 4) up onto "\tx" with tab width 4: the tab ends at 3, x is at 4.
  expect(run("\tx\nabcdef", { line: 1, col: 4 }, "k", 4).cursor).toEqual({
    line: 0,
    col: 1,
  });
});
