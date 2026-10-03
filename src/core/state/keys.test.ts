import { expect, test } from "bun:test";
import {
  fresh,
  stamp,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import { fullText } from "./buffers";
import { runCommand } from "./commands";
import { cmdlineCompletions } from "./keys";
import type { Action, AppState, Effect } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);

function open(path: string, text: string, s = fresh()): AppState {
  return update(s, { type: "fileLoaded", path, file: textFile(text) }).state;
}

/** Feed keys at time `now`; returns the last state and every effect. */
function keys(s: AppState, seq: string, now = 0, u = update) {
  const effects: Effect[] = [];
  for (const key of splitKeys(seq)) {
    const r = u(s, { type: "key", key, now });
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}

const textOf = (s: AppState, id = 1) => {
  const b = s.buffers[id];
  if (b === undefined) throw new Error("no buffer");
  return fullText(b.text);
};
const cursorOf = (s: AppState) =>
  s.windows.byId[s.windows.active]?.content.cursor;

test("a bound key sequence runs its command and never reaches the vim engine", () => {
  const s = open("a.md", "hello world\n");
  const prefix = keys(s, " ");
  expect(prefix.state.vim.pending).toEqual([" "]);
  expect(cursorOf(prefix.state)).toEqual({ line: 0, col: 0 });
  const toggled = keys(prefix.state, "e");
  expect(toggled.state.panels.explorer).toMatchObject({
    open: true,
    focused: true,
  });
  expect(toggled.state.vim.pending).toEqual([]);
  expect(cursorOf(toggled.state)).toEqual({ line: 0, col: 0 });

  const split = keys(s, "<C-w>v");
  expect(split.state.windows.tree).toEqual({
    kind: "row",
    children: [
      { kind: "leaf", id: 2 },
      { kind: "leaf", id: 1 },
    ],
  });
  expect(split.state.windows.active).toBe(2);
  expect(textOf(split.state)).toBe("hello world");
});

test("explorer keys resolve in explorer mode and never edit the buffer", () => {
  let s = open("a.md", "hello\n");
  s = update(s, {
    type: "dirListed",
    dir: "",
    entries: [
      { name: "a.md", kind: "file" },
      { name: "b.md", kind: "file" },
    ],
  }).state;
  s = keys(s, " e").state;
  expect(s.panels.explorer.cursor).toBe("a.md");
  const moved = keys(s, "jx");
  expect(moved.state.panels.explorer.cursor).toBe("b.md");
  expect(textOf(moved.state)).toBe("hello");
  expect(moved.effects).toEqual([]);
  expect(keys(moved.state, "<CR>").effects).toContainEqual({
    kind: "read",
    path: "b.md",
  });
});

test("a filetype binding wins over the global binding for the same keys", () => {
  const base = testRegistries();
  const bindings = [...base.bindings];
  for (const [id, scope] of [
    ["test.global", { mode: "normal" }],
    ["test.markdown", { mode: "normal", filetype: "markdown" }],
  ] as const) {
    base.commands.register({
      id,
      title: id,
      run: (ctx) => ({
        state: {
          ...ctx.state,
          notifications: { toasts: [], message: { text: id, level: "info" } },
        },
        effects: [],
      }),
    });
    bindings.push({ scope, seq: "gx", id });
  }
  const u = createUpdate({ ...base, bindings });
  const md = keys(open("a.md", "x\n"), "gx", 0, u);
  expect(md.state.notifications.message?.text).toBe("test.markdown");
  const ts = keys(open("a.ts", "x\n"), "gx", 0, u);
  expect(ts.state.notifications.message?.text).toBe("test.global");
});

test('"+ copies to the clipboard and reports a clipboard failure', () => {
  const yank = keys(open("a.md", "hello\n"), '"+yy');
  expect(yank.effects).toContainEqual({
    kind: "clipboardWrite",
    text: "hello\n",
  });
  const failed = update(yank.state, {
    type: "clipboardText",
    text: "",
    error: "no clipboard provider",
  });
  expect(failed.state.notifications.message).toEqual({
    text: "clipboard unavailable",
    level: "error",
  });
  expect(textOf(failed.state)).toBe("hello");
});

test('"+p pastes the clipboard text, or registers["+"] when the clipboard fails', () => {
  const yanked = keys(open("a.md", "one\ntwo\n"), '"+yyj');
  const paste = keys(yanked.state, '"+p');
  expect(paste.effects).toEqual([{ kind: "clipboardRead" }]);
  expect(paste.state.vim.pendingPaste).toEqual({ bufferId: 1, before: false });

  const fallback = update(paste.state, {
    type: "clipboardText",
    text: "",
    error: "xclip failed",
  });
  expect(textOf(fallback.state)).toBe("one\ntwo\none");
  expect(cursorOf(fallback.state)).toEqual({ line: 2, col: 0 });
  expect(fallback.state.vim.pendingPaste).toBeUndefined();
  expect(fallback.state.vim.registers.get('"')).toEqual(
    paste.state.vim.registers.get('"'),
  );
  expect(fallback.state.notifications.message?.text).toBe(
    "clipboard unavailable",
  );
  expect(fallback.effects).toContainEqual({
    kind: "startTimer",
    id: "autosave:1",
    ms: 1000,
  });

  const fromClipboard = update(paste.state, {
    type: "clipboardText",
    text: "abc",
  });
  expect(textOf(fromClipboard.state)).toBe("one\ntabcwo");
  expect(fromClipboard.state.notifications.message).toBeUndefined();
});

test("a search with no match shows E486 on the message line", () => {
  const r = keys(open("a.md", "the cat sat\n"), "/dog<CR>");
  expect(r.state.notifications.message).toEqual({
    text: "E486: Pattern not found: dog",
    level: "error",
  });
  expect(cursorOf(r.state)).toEqual({ line: 0, col: 0 });
  const found = keys(open("a.md", "the cat sat\n"), "/cat<CR>");
  expect(found.state.notifications.message).toBeUndefined();
  expect(cursorOf(found.state)).toEqual({ line: 0, col: 4 });
});

test("typing autosaves after the delay and leaving Insert saves at once", () => {
  const typed = keys(open("a.md", "hello\n"), "ix", 100);
  expect(typed.state.buffers[1]?.dirty).toBe(true);
  expect(typed.effects).toContainEqual({
    kind: "startTimer",
    id: "autosave:1",
    ms: 1000,
  });
  const left = keys(typed.state, "<Esc>", 200);
  expect(left.effects).toContainEqual({
    kind: "write",
    path: "a.md",
    text: "xhello\n",
    expected: stamp(1),
  });
});

test("ex commands run through the same command path as their ids", () => {
  const s = keys(open("a.md", "hello\n"), "x").state;
  const ex = keys(s, ":w<CR>", 5);
  expect(ex.effects).toEqual(runCommand(s, "buffer.write", 5, reg).effects);
  expect(ex.effects).toContainEqual({
    kind: "write",
    path: "a.md",
    text: "ello\n",
    expected: stamp(1),
  });
  expect(ex.state.vim.mode).toBe("normal");
  expect(ex.state.vim.cmdline).toBe("");
});

test("an unknown ex command shows E492", () => {
  const r = keys(open("a.md", "x\n"), ":frobnicate<CR>");
  expect(r.state.notifications.message).toEqual({
    text: "E492: Not an editor command: frobnicate",
    level: "error",
  });
  expect(r.effects).toEqual([]);
});

test(":e opens a path relative to the workspace root, even with nothing open", () => {
  const cases: [string, string][] = [
    ["notes/a.md", "notes/a.md"],
    ["./notes/../b.md", "b.md"],
    ["/ws/c.md", "c.md"],
  ];
  for (const [arg, path] of cases)
    expect(keys(fresh(), `:e ${arg}<CR>`).effects).toEqual([
      { kind: "read", path },
    ]);
  expect(
    keys(fresh(), ":e /etc/passwd<CR>").state.notifications.message?.text,
  ).toBe("outside the workspace: /etc/passwd");
  expect(keys(fresh(), ":e<CR>").state.notifications.message?.text).toBe(
    "E32: No file name",
  );
});

test("Tab completes an ex name, then a command id", () => {
  expect(keys(fresh(), ":wr<Tab>").state.vim.cmdline).toBe(":write");
  expect(keys(fresh(), ":explorer.t<Tab>").state.vim.cmdline).toBe(
    ":explorer.toggle",
  );
});

test("Tab completes an abbreviation to its full ex name, listed first", () => {
  expect(keys(fresh(), ":vs<Tab>").state.vim.cmdline).toBe(":vsplit");
  const typed = keys(fresh(), ":vs").state;
  expect(cmdlineCompletions(typed, reg)).toEqual(["vsplit"]);
  expect(cmdlineCompletions(keys(fresh(), ":e").state, reg)[0]).toBe("edit");
});

test("conflict keys keep, take, or diff", () => {
  let s = keys(open("a.md", "hello\n"), "x").state;
  s = update(s, {
    type: "fileLoaded",
    path: "a.md",
    file: textFile("theirs\n", 2),
  }).state;
  expect(s.overlay.kind).toBe("conflict");
  expect(keys(s, "d").state.overlay).toMatchObject({ showDiff: true });
  expect(keys(s, "dq").state.overlay).toMatchObject({ showDiff: false });
  expect(keys(s, "q").state.overlay).toMatchObject({ showDiff: false });
  expect(textOf(keys(s, "t").state)).toBe("theirs");
  expect(keys(s, "k").effects).toContainEqual({
    kind: "write",
    path: "a.md",
    text: "ello\n",
    expected: stamp(2),
  });
});

test("explorer prompts create, rename, move, and delete", () => {
  let s: AppState = update(fresh(), {
    type: "dirListed",
    dir: "",
    entries: [
      { name: "notes", kind: "dir" },
      { name: "a.md", kind: "file" },
    ],
  }).state;
  const created = keys(s, "adraft<CR>");
  expect(created.effects).toEqual([
    {
      kind: "create",
      op: { kind: "create", from: "notes/draft.md", dir: false },
    },
  ]);
  expect(created.state.overlay).toEqual({ kind: "none" });

  s = keys(s, "j").state;
  expect(s.panels.explorer.cursor).toBe("a.md");
  expect(keys(s, "r<BS><BS>txt<CR>").effects).toEqual([
    { kind: "rename", op: { kind: "rename", from: "a.md", to: "a.txt" } },
  ]);
  expect(keys(s, "m<BS><BS><BS><BS>notes/a.md<CR>").effects).toEqual([
    { kind: "move", op: { kind: "move", from: "a.md", to: "notes/a.md" } },
  ]);
  expect(keys(s, "r<Esc>").state.overlay).toEqual({ kind: "none" });

  const withTrash = update(s, { type: "trashAvailable", available: true });
  expect(keys(withTrash.state, "dy").effects).toEqual([
    { kind: "trash", op: { kind: "trash", from: "a.md" } },
  ]);
  expect(keys(withTrash.state, "dn").effects).toEqual([]);

  const typed = keys(s, "da.m<CR>");
  expect(typed.effects).toEqual([]);
  expect(typed.state.overlay.kind).toBe("prompt");
  expect(keys(typed.state, "d<CR>").effects).toEqual([
    { kind: "trash", op: { kind: "trash", from: "a.md", permanent: true } },
  ]);
});

test("buffers cycle with :bn and :bp", () => {
  let s = open("a.md", "a\n");
  s = open("b.md", "b\n", s);
  const id = (st: AppState) =>
    st.windows.byId[st.windows.active]?.content.bufferId;
  expect(id(s)).toBe(2);
  expect(id(keys(s, ":bn<CR>").state)).toBe(1);
  expect(id(keys(s, ":bp<CR>").state)).toBe(1);
  const action: Action = { type: "key", key: "x", now: 0 };
  expect(update(keys(s, ":bn<CR>").state, action).state.buffers[1]?.dirty).toBe(
    true,
  );
});
