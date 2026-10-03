import { expect, test } from "bun:test";
import { Registers } from "../../src/core/kernel/editor/registers";
import { UndoHistory } from "../../src/core/kernel/editor/undo";
import { createTextBuffer } from "../../src/core/kernel/text/text-buffer";
import { handleKey } from "../../src/core/kernel/vim/engine";
import { splitKeys } from "../../src/core/kernel/vim/keys";
import type { VimSession } from "../../src/core/kernel/vim/operators";
import { searchError } from "../../src/core/kernel/vim/search";
import type { VimEffect, VimEnv } from "../../src/core/kernel/vim/types";
import type { AppState } from "../../src/core/state/types";
import { createUpdate } from "../../src/core/state/update";
import { fresh, testRegistries, textFile } from "../support/state";
import { cases, type VimCase } from "./cases";

type Recorded = VimCase & {
  after: {
    lines: string[];
    cursor: [number, number];
    mode: string;
    regs: Record<string, { text: string; type: string }>;
  };
};

const recording: { nvim: string; cases: Recorded[] } = await Bun.file(
  "test/vim/expected.json",
).json();

// Headless Neovim: 24 lines minus statusline and command line.
const ENV: VimEnv = { topLine: 0, rows: 22, tabWidth: 8 };
const MODES: Record<string, string> = {
  n: "normal",
  i: "insert",
  v: "visual",
  V: "visualLine",
  c: "cmdline",
};

function session(c: VimCase): VimSession {
  return {
    text: createTextBuffer(c.before.lines.join("\n")),
    cursor: c.before.cursor,
    undo: new UndoHistory(),
    registers: new Registers(),
    vim: { mode: "normal", pending: [], cmdline: "" },
  };
}

const update = createUpdate(testRegistries());

/** The case's text open in a 24-row terminal (22 text rows), cursor placed. */
function caseState(c: VimCase): AppState {
  const s = update(fresh(), {
    type: "fileLoaded",
    path: "case.txt",
    file: textFile(`${c.before.lines.join("\n")}\n`),
  }).state;
  const w = s.windows.byId[s.windows.active];
  if (w === undefined) throw new Error("no window");
  return {
    ...s,
    windows: {
      ...s.windows,
      byId: {
        ...s.windows.byId,
        [w.id]: { ...w, content: { ...w.content, cursor: c.before.cursor } },
      },
    },
  };
}

/** Replay the case's keys through the reducer, as the shell dispatches them. */
function replay(c: VimCase) {
  let s = caseState(c);
  for (const key of splitKeys(c.keys))
    s = update(s, { type: "key", key, now: 0 }).state;
  const w = s.windows.byId[s.windows.active];
  const b = w && s.buffers[w.content.bufferId];
  if (b === undefined) throw new Error("no buffer");
  expect(s.notifications.toasts).toEqual([]);
  return {
    lines: Array.from({ length: b.text.lineCount }, (_, i) => b.text.line(i)),
    cursor: w?.content.cursor,
    mode: s.vim.mode,
    regs: Object.fromEntries(s.vim.registers.entries()),
  };
}

// Neovim reports 1-based lines and 1-based byte columns; the cases are ASCII,
// so byte columns equal UTF-16 columns.
const kernelView = (after: Recorded["after"]) => ({
  lines: after.lines,
  cursor: { line: after.cursor[0] - 1, col: after.cursor[1] - 1 },
  mode: MODES[after.mode] ?? after.mode,
  regs: Object.fromEntries(
    Object.entries(after.regs).map(([name, r]) => [
      name,
      { text: r.text, linewise: r.type === "V" },
    ]),
  ),
});

test("recording metadata matches cases", () => {
  expect(recording.nvim.startsWith("0.11.")).toBe(true);
  expect(recording.cases.map((c) => c.id)).toEqual(cases.map((c) => c.id));
});

for (const c of recording.cases)
  test(`matches Neovim: ${c.id}`, () => {
    expect(replay(c)).toEqual(kernelView(c.after));
  });

// The engine emits the search; core/state shows `searchError` in the message line.
test("a failed search reports E486 for its pattern", () => {
  const before = { lines: ["the cat sat"], cursor: { line: 0, col: 0 } };
  const run = (keys: string) => {
    let s = session({ id: keys, before, keys });
    const effects: VimEffect[] = [];
    for (const key of splitKeys(keys)) {
      const r = handleKey(s, key, ENV);
      s = r.s;
      effects.push(...r.effects);
    }
    const search = effects.find((e) => e.kind === "search");
    if (search?.kind !== "search") throw new Error(`no search for ${keys}`);
    return { cursor: s.cursor, message: searchError(s.text, search.pattern) };
  };
  expect(run("/dog<CR>")).toEqual({
    cursor: before.cursor,
    message: "E486: Pattern not found: dog",
  });
  expect(run("/\\(<CR>")).toEqual({
    cursor: before.cursor,
    message: "E486: Pattern not found: \\(",
  });
  expect(run("/cat<CR>")).toEqual({
    cursor: { line: 0, col: 4 },
    message: undefined,
  });
});
