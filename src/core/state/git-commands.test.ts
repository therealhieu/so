import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { gitBindings, gitCommands } from "./git-commands";
import type { Action, AppState } from "./types";
import { createUpdate } from "./update";
import { whichKeyRows } from "./whichkey";

const reg = testRegistries();
const update = createUpdate(reg);

/** The which-key popup open after `<leader>` and `keys`. */
function popupAt(...keys: string[]): AppState {
  let s = update(fresh(), {
    type: "fileLoaded",
    path: "a.md",
    file: textFile("a\n"),
  }).state;
  for (const key of [" ", ...keys])
    s = update(s, { type: "key", key, now: 0 }).state;
  const timer: Action = { type: "timer", id: "whichKey", now: 300 };
  return update(s, timer).state;
}

const rowsText = (s: AppState) =>
  whichKeyRows(s, reg).map((r) => `${r.key} ${r.label}`);

test("which-key lists the git and hunk groups with plain titles", () => {
  expect(rowsText(popupAt())).toContain("g +git");
  expect(rowsText(popupAt("g"))).toEqual([
    "g Lazygit (full screen)",
    "h +hunk",
  ]);
  expect(rowsText(popupAt("g", "h"))).toEqual([
    "b Blame line",
    "p Preview hunk",
    "r Reset hunk",
    "s Stage hunk",
  ]);
});

test("every git binding names a registered git command", () => {
  const ids = new Set(gitCommands.map((c) => c.id));
  expect(gitBindings.filter((b) => !ids.has(b.id))).toEqual([]);
  expect(gitBindings.map((b) => b.seq).sort()).toEqual([
    "<leader>gg",
    "<leader>ghb",
    "<leader>ghp",
    "<leader>ghr",
    "<leader>ghs",
    "[h",
    "]h",
  ]);
});
