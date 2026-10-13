import { expect, test } from "bun:test";
import {
  fresh,
  openBuffer,
  stamp,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import { parseConfig } from "../config/toml";
import { splitKeys } from "../kernel/vim/keys";
import { setBuffer } from "./buffers";
import {
  createTarget,
  explorerOp,
  explorerWidth,
  freeName,
  resizeExplorer,
  toggleExplorer,
} from "./explorer";
import { scheduleAutosave } from "./save";
import { SAVE_STATE_MS } from "./session";
import type { Action, AppState, Effect, FsOp, Result } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);

const dirtyA = (): AppState => {
  const s = openBuffer(fresh(), "a.md", "hello");
  const b = s.buffers[1];
  if (b === undefined) throw new Error("no buffer");
  const text = b.text.apply({
    range: { start: { line: 0, col: 0 }, end: { line: 0, col: 0 } },
    text: "x",
  }).buffer;
  return setBuffer(s, 1, { text, dirty: true }, reg);
};

/** Type "x" at the start of buffer 1 at time `now`, as an Insert key would. */
function typeX(s: AppState, now: number): Result {
  const b = s.buffers[1];
  if (b === undefined) throw new Error("no buffer");
  const text = b.text.apply({
    range: { start: { line: 0, col: 0 }, end: { line: 0, col: 0 } },
    text: "x",
  }).buffer;
  return scheduleAutosave(setBuffer(s, 1, { text, dirty: true }, reg), 1, now);
}

const ops = (effects: Effect[]) =>
  effects.filter((e) => e.kind !== "cancelTimer" && e.kind !== "listDir");

test("rename flushes a dirty buffer first, then follows it to the new path", () => {
  const op: FsOp = { kind: "rename", from: "a.md", to: "c.md" };
  const r = explorerOp(dirtyA(), op, 0);
  expect(ops(r.effects)).toEqual([
    { kind: "write", path: "a.md", text: "xhello\n", expected: stamp(1) },
    { kind: "rename", op },
  ]);
  const undoBefore = r.state.buffers[1]?.undo;
  const done = update(r.state, { type: "fsResult", op, ok: true });
  expect(done.state.buffers[1]).toMatchObject({ path: "c.md", dirty: true });
  expect(done.state.buffers[1]?.undo).toBe(undoBefore);
  expect(done.effects).toEqual([
    { kind: "listDir", dir: "", gitignored: true },
    { kind: "startTimer", id: "saveState", ms: 2000 },
  ]);
});

test("a rename during a write, after typing during it, autosaves the newest text to the new path", () => {
  const disk: Effect[] = [];
  const step = (r: Result): AppState => {
    disk.push(
      ...r.effects.filter((e) => e.kind === "write" || e.kind === "rename"),
    );
    return r.state;
  };
  const act = (s: AppState, a: Action) => step(update(s, a));
  const keys = (s: AppState, seq: string, now: number) =>
    splitKeys(seq).reduce((st, key) => act(st, { type: "key", key, now }), s);

  let s = openBuffer(fresh(), "a.md", "hello");
  s = { ...s, index: { ...s.index, status: "ready" } };
  s = act(s, {
    type: "dirListed",
    dir: "",
    entries: [{ name: "a.md", kind: "file" }],
  });
  expect(s.panels.explorer).toMatchObject({ focused: true, cursor: "a.md" });
  s = step(typeX(s, 0));
  s = act(s, { type: "timer", id: "autosave:1", now: 1000 });
  expect(s.buffers[1]?.save.kind).toBe("writing");
  s = step(typeX(s, 1100));

  s = keys(s, "r<BS><BS><BS><BS>c.md<CR>", 1200);
  const op: FsOp = { kind: "rename", from: "a.md", to: "c.md" };
  s = act(s, { type: "saved", path: "a.md", stamp: stamp(2) });
  expect(s.buffers[1]).toMatchObject({
    dirty: true,
    save: { kind: "scheduled" },
  });

  s = act(s, { type: "fsResult", op, ok: true });
  expect(s.buffers[1]).toMatchObject({ path: "c.md", dirty: true });
  expect(s.buffers[1]?.save.kind).not.toBe("writing");

  s = act(s, { type: "timer", id: "autosave:1", now: 2200 });
  s = keys(s, ":q<CR>", 2300);
  expect(s.terminal.quit).toEqual({ code: 0, waiting: [1] });
  const exit = update(s, { type: "saved", path: "c.md", stamp: stamp(3) });
  expect(exit.effects).toEqual([{ kind: "exit", code: 0 }]);
  expect(exit.state.buffers[1]).toMatchObject({ dirty: false });

  expect(disk).toEqual([
    { kind: "write", path: "a.md", text: "xhello\n", expected: stamp(1) },
    { kind: "rename", op },
    { kind: "write", path: "c.md", text: "xxhello\n", expected: stamp(2) },
  ]);
});

test("moving a folder re-paths every buffer below it", () => {
  let s = openBuffer(fresh(), "notes/a.md", "a");
  s = openBuffer(s, "notes/sub/b.md", "b");
  s = openBuffer(s, "notesx.md", "c");
  s = {
    ...s,
    panels: {
      ...s.panels,
      explorer: { ...s.panels.explorer, expanded: ["notes", "archive"] },
    },
  };
  const op: FsOp = { kind: "move", from: "notes", to: "archive/notes" };
  const done = update(s, { type: "fsResult", op, ok: true });
  expect(Object.values(done.state.buffers).map((b) => b.path)).toEqual([
    "archive/notes/a.md",
    "archive/notes/sub/b.md",
    "notesx.md",
  ]);
  expect(done.state.panels.explorer.expanded).toEqual([
    "archive/notes",
    "archive",
  ]);
  expect(done.effects).toEqual([
    { kind: "listDir", dir: "", gitignored: true },
    { kind: "listDir", dir: "archive", gitignored: true },
    { kind: "listDir", dir: "archive/notes", gitignored: true },
    // The open buffers' paths are part of the saved session.
    { kind: "startTimer", id: "saveState", ms: SAVE_STATE_MS },
  ]);
});

test("renaming an open file to another extension takes that file type", () => {
  const load = (s: AppState, path: string, text: string) =>
    update(s, { type: "fileLoaded", path, file: textFile(text) }).state;
  const rename = (s: AppState, from: string, to: string) =>
    update(s, { type: "fsResult", op: { kind: "rename", from, to }, ok: true });
  const editorOf = (s: AppState) =>
    s.windows.byId[s.windows.active]?.content.editor;

  const code = rename(load(fresh(), "a.md", "const x = 1;\n"), "a.md", "a.ts");
  expect(code.state.buffers[1]).toMatchObject({
    path: "a.ts",
    fileType: reg.fileTypes.forPath("a.ts").id,
    view: "source",
  });
  expect(code.effects).not.toContainEqual({ kind: "read", path: "a.ts" });

  const base = load(fresh(), "t.base", "views: []\n");
  expect(base.buffers[1]?.readOnly).toBe(true);
  expect(editorOf(base)).toBe("base");
  const note = rename(base, "t.base", "t.md");
  expect(note.state.buffers[1]?.readOnly).toBeUndefined();
  expect(note.state.buffers[1]?.fileType).toBe("markdown");
  expect(editorOf(note.state)).toBe("text");

  // The text cannot become a PDF's body: the file is read again.
  const pdf = rename(load(fresh(), "a.md", "x\n"), "a.md", "a.pdf");
  expect(pdf.state.buffers[1]).toMatchObject({ binary: true, readOnly: true });
  expect(pdf.effects).toContainEqual({ kind: "read", path: "a.pdf" });
  const reread = update(pdf.state, {
    type: "fileLoaded",
    path: "a.pdf",
    file: textFile("", 2),
  });
  expect(reread.state.buffers[1]?.stamp).toEqual(stamp(2));
  expect(reread.state.buffers[1]?.text.lineCount).toBe(1);
  expect(reread.state.buffers[1]?.text.line(0)).toBe("");
});

test("trash flushes a dirty buffer, then closes it or keeps it if the flush failed", () => {
  const op: FsOp = { kind: "trash", from: "a.md" };
  const r = explorerOp(dirtyA(), op, 0);
  expect(ops(r.effects).map((e) => e.kind)).toEqual(["write", "trash"]);

  const saved = update(r.state, {
    type: "saved",
    path: "a.md",
    stamp: stamp(2),
  });
  const closed = update(saved.state, { type: "fsResult", op, ok: true });
  expect(closed.state.buffers[1]).toBeUndefined();

  const failed = update(r.state, {
    type: "saveFailed",
    path: "a.md",
    reason: "EACCES",
  });
  const kept = update(failed.state, { type: "fsResult", op, ok: true });
  expect(kept.state.buffers[1]).toMatchObject({ dirty: true, disk: "deleted" });
  expect(
    update(kept.state, { type: "timer", id: "retry:1", now: 9e9 }).effects,
  ).toEqual([]);
});

test("create adds .md only without an extension; a trailing slash makes a folder", () => {
  expect(createTarget("draft")).toEqual({ path: "draft.md", dir: false });
  expect(createTarget("sync.ts")).toEqual({ path: "sync.ts", dir: false });
  expect(createTarget("ideas/")).toEqual({ path: "ideas", dir: true });
  expect(createTarget("projects/new/idea")).toEqual({
    path: "projects/new/idea.md",
    dir: false,
  });
  expect(createTarget("v1.2/notes")).toEqual({
    path: "v1.2/notes.md",
    dir: false,
  });

  const op: FsOp = { kind: "create", from: "projects/new/idea.md", dir: false };
  expect(explorerOp(fresh(), op, 0).effects).toEqual([{ kind: "create", op }]);
  const created = update(fresh(), { type: "fsResult", op, ok: true });
  expect(created.effects).toEqual([
    { kind: "listDir", dir: "", gitignored: true },
    { kind: "read", path: "projects/new/idea.md" },
  ]);
  const folder: FsOp = { kind: "create", from: "ideas", dir: true };
  expect(
    update(fresh(), { type: "fsResult", op: folder, ok: true }).effects,
  ).toEqual([{ kind: "listDir", dir: "", gitignored: true }]);
});

test("a failed operation reports its reason; a failed trash turns trash off", () => {
  const exists = update(fresh(), {
    type: "fsResult",
    op: { kind: "rename", from: "a.md", to: "b.md" },
    ok: false,
    reason: "E13: File exists (b.md)",
  });
  expect(exists.state.notifications.message).toEqual({
    text: "E13: File exists (b.md)",
    level: "error",
  });

  const s = update(fresh(), { type: "trashAvailable", available: true }).state;
  expect(s.panels.explorer.trash).toBe("available");
  const trash = update(s, {
    type: "fsResult",
    op: { kind: "trash", from: "a.md" },
    ok: false,
    reason: "EXDEV",
  });
  expect(trash.state.panels.explorer.trash).toBe("unavailable");
  expect(trash.state.notifications.toasts).toEqual([
    { id: 1, level: "error", text: "Move to Trash failed: EXDEV" },
  ]);
});

test("listings fill the tree; a failed listing says why", () => {
  const entries = [
    { name: "notes", kind: "dir" as const },
    { name: "a.md", kind: "file" as const },
  ];
  const listed = update(fresh(), { type: "dirListed", dir: "", entries });
  expect(listed.state.panels.explorer.entries[""]).toEqual(entries);
  expect(listed.state.panels.explorer.cursor).toBe("notes");

  const failed = update(fresh(), {
    type: "dirListed",
    dir: "notes",
    entries: null,
    reason: "EACCES",
  });
  expect(failed.state.notifications.message).toEqual({
    text: "cannot list notes: EACCES",
    level: "error",
  });
});

test("toggle opens and focuses the explorer, then closes it", () => {
  const closed = toggleExplorer(fresh()).state.panels.explorer;
  expect(closed).toMatchObject({ open: false, focused: false });
  const reopened = toggleExplorer({
    ...fresh(),
    panels: { ...fresh().panels, explorer: closed },
  });
  expect(reopened.state.panels.explorer).toMatchObject({
    open: true,
    focused: true,
  });
  expect(reopened.effects).toEqual([
    { kind: "listDir", dir: "", gitignored: true },
  ]);
});

const pressKeys = (s: AppState, seq: string): Result => {
  let r: Result = { state: s, effects: [] };
  for (const key of splitKeys(seq))
    r = update(r.state, { type: "key", key, now: 0 });
  return r;
};
const resizedTo = (s: AppState, seq: string) =>
  explorerWidth(pressKeys(s, seq).state);

test("<C-w>> and <C-w>< resize the focused explorer by five columns", () => {
  const s = fresh();
  expect(s.panels.explorer.focused).toBe(true);
  expect(explorerWidth(s)).toBe(30);
  expect(resizedTo(s, "<C-w>>")).toBe(35);
  expect(resizedTo(s, "<C-w>><C-w>>")).toBe(40);
  expect(resizedTo(s, "<C-w><lt>")).toBe(25);
  expect(resizedTo(s, "<C-w>><C-w>=")).toBe(30);
  expect(pressKeys(s, "<C-w>><C-w>=").state.panels.explorer.width).toBe(
    undefined,
  );
});

test("the explorer stays between 15 columns and half the terminal", () => {
  const s = fresh();
  expect(s.terminal.cols).toBe(100);
  expect(resizedTo(s, "<C-w>>".repeat(10))).toBe(50);
  // Widening past the limit stores the limit, so one step back narrows at once.
  expect(resizedTo(s, `${"<C-w>>".repeat(10)}<C-w><lt>`)).toBe(45);
  expect(resizedTo(s, "<C-w><lt>".repeat(10))).toBe(15);
  expect(explorerWidth(resizeExplorer(s, 3))).toBe(15);
  // A smaller terminal narrows a wide explorer without forgetting its width.
  const wide = resizeExplorer(s, 50);
  const small = { ...wide, terminal: { ...wide.terminal, cols: 60 } };
  expect(explorerWidth(small)).toBe(30);
  expect(small.panels.explorer.width).toBe(50);
});

test("[explorer] width sets the width until the explorer is resized", () => {
  const s = fresh();
  const configured = {
    ...s,
    config: { ...s.config, explorer: { ...s.config.explorer, width: 22 } },
  };
  expect(explorerWidth(configured)).toBe(22);
  expect(resizedTo(configured, "<C-w>>")).toBe(27);
});

const pressInExplorer = (s: AppState, seq: string): Result => {
  const effects: Effect[] = [];
  for (const key of splitKeys(seq)) {
    const r = update(s, { type: "key", key, now: 0 });
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
};

test("H shows dot entries in every listed folder and saves the choice", () => {
  const s = update(fresh(), {
    type: "dirListed",
    dir: "",
    entries: [{ name: "notes", kind: "dir" }],
  }).state;
  const expanded = pressInExplorer(s, "l").state;
  const r = pressInExplorer(expanded, "H");
  expect(r.state.config.explorer.dotfiles).toBe(true);
  expect(r.effects).toEqual([
    {
      kind: "writeSetting",
      path: ["explorer", "dotfiles"],
      value: true,
      previous: false,
    },
    { kind: "listDir", dir: "", dotfiles: true, gitignored: true },
    { kind: "listDir", dir: "notes", dotfiles: true, gitignored: true },
  ]);
  expect(r.state.notifications.message?.text).toBe("dot entries shown");
});

test("hiding dot entries collapses dot folders and moves a selection inside one to the top", () => {
  let s = pressInExplorer(fresh(), "H").state;
  s = update(s, {
    type: "dirListed",
    dir: "",
    entries: [
      { name: ".s1mple", kind: "dir" },
      { name: "notes", kind: "dir" },
    ],
  }).state;
  s = pressInExplorer(s, "l").state;
  s = update(s, {
    type: "dirListed",
    dir: ".s1mple",
    entries: [{ name: "S1MPLE.md", kind: "file" }],
  }).state;
  s = pressInExplorer(s, "j").state;
  expect(s.panels.explorer.cursor).toBe(".s1mple/S1MPLE.md");
  const r = pressInExplorer(s, "H");
  expect(r.state.panels.explorer.expanded).toEqual([]);
  expect(r.state.panels.explorer.cursor).toBe("");
  expect(r.effects).toContainEqual({
    kind: "listDir",
    dir: "",
    gitignored: true,
  });
  const relisted = update(r.state, {
    type: "dirListed",
    dir: "",
    entries: [{ name: "notes", kind: "dir" }],
  }).state;
  expect(relisted.panels.explorer.cursor).toBe("notes");
});

test("I hides gitignored entries, collapses gitignored folders, and moves a selection inside one to the top", () => {
  let s = update(fresh(), {
    type: "dirListed",
    dir: "",
    entries: [
      { name: "build", kind: "dir", ignored: true },
      { name: "notes", kind: "dir" },
    ],
  }).state;
  s = pressInExplorer(s, "l").state;
  s = update(s, {
    type: "dirListed",
    dir: "build",
    entries: [{ name: "out", kind: "dir", ignored: true }],
  }).state;
  s = pressInExplorer(s, "jl").state;
  s = update(s, {
    type: "dirListed",
    dir: "build/out",
    entries: [{ name: "a.md", kind: "file", ignored: true }],
  }).state;
  s = pressInExplorer(s, "jjlk").state;
  expect(s.panels.explorer.expanded).toEqual(["build", "build/out", "notes"]);
  expect(s.panels.explorer.cursor).toBe("build/out/a.md");
  const r = pressInExplorer(s, "I");
  expect(r.state.config.explorer.gitignored).toBe(false);
  expect(r.state.panels.explorer.expanded).toEqual(["notes"]);
  expect(r.state.panels.explorer.cursor).toBe("");
  expect(r.effects).toEqual([
    {
      kind: "writeSetting",
      path: ["explorer", "gitignored"],
      value: false,
      previous: true,
    },
    { kind: "listDir", dir: "" },
    { kind: "listDir", dir: "notes" },
  ]);
  expect(r.state.notifications.message?.text).toBe("gitignored entries hidden");
  const back = pressInExplorer(r.state, "I");
  expect(back.effects).toContainEqual({
    kind: "listDir",
    dir: "",
    gitignored: true,
  });
});

test("a reloaded config.toml that turns gitignored off lists the tree again", () => {
  const s = update(fresh(), {
    type: "dirListed",
    dir: "",
    entries: [{ name: "a.md", kind: "file" }],
  }).state;
  const result = parseConfig("[explorer]\ngitignored = false\n");
  const r = update(s, { type: "configLoaded", result, reload: true });
  expect(r.effects).toEqual([{ kind: "listDir", dir: "" }]);
});

test("a reloaded config.toml that turns dotfiles on lists the tree again", () => {
  const s = update(fresh(), {
    type: "dirListed",
    dir: "",
    entries: [{ name: "a.md", kind: "file" }],
  }).state;
  const result = parseConfig("[explorer]\ndotfiles = true\n");
  const r = update(s, { type: "configLoaded", result, reload: true });
  expect(r.effects).toEqual([
    { kind: "listDir", dir: "", dotfiles: true, gitignored: true },
  ]);
  const same = update(r.state, { type: "configLoaded", result, reload: true });
  expect(same.effects).toEqual([]);
});

test("Z closes every folder and selects the top-level entry holding the selection", () => {
  const listed = (
    s: AppState,
    dir: string,
    entries: [string, "dir" | "file"][],
  ) =>
    update(s, {
      type: "dirListed",
      dir,
      entries: entries.map(([name, kind]) => ({ name, kind })),
    }).state;
  let s = listed(fresh(), "", [
    ["notes", "dir"],
    ["todo.md", "file"],
  ]);
  s = listed(pressInExplorer(s, "l").state, "notes", [["deep", "dir"]]);
  s = listed(pressInExplorer(s, "jl").state, "notes/deep", [["a.md", "file"]]);
  s = pressInExplorer(s, "j").state;
  expect(s.panels.explorer.cursor).toBe("notes/deep/a.md");
  expect(s.panels.explorer.expanded).toEqual(["notes", "notes/deep"]);
  const r = pressInExplorer(s, "Z");
  expect(r.state.panels.explorer.expanded).toEqual([]);
  expect(r.state.panels.explorer.cursor).toBe("notes");
  expect(r.effects).toEqual([]);
});

const withA = (): AppState => {
  const s = openBuffer(fresh(), "a.md", "hello");
  const listed = update(s, {
    type: "dirListed",
    dir: "",
    entries: [{ name: "a.md", kind: "file" }],
  }).state;
  return {
    ...listed,
    panels: {
      ...listed.panels,
      explorer: { ...listed.panels.explorer, open: true, focused: true },
    },
  };
};

test("<C-w> toward the windows leaves the explorer, and toward its edge enters it again", () => {
  const s = withA();
  expect(pressInExplorer(s, "<C-w>h").state.panels.explorer.focused).toBe(true);
  const left = pressInExplorer(s, "<C-w>l").state;
  expect(left.panels.explorer.focused).toBe(false);
  expect(left.panels.explorer.open).toBe(true);
  expect(pressInExplorer(left, "<C-w>l").state.panels.explorer.focused).toBe(
    false,
  );
  expect(pressInExplorer(left, "<C-w>h").state.panels.explorer.focused).toBe(
    true,
  );
});

test("<C-w> mirrors with the explorer on the right", () => {
  const s = withA();
  const right = {
    ...s,
    config: {
      ...s.config,
      explorer: { ...s.config.explorer, position: "right" as const },
    },
  };
  const left = pressInExplorer(right, "<C-w>h").state;
  expect(left.panels.explorer.focused).toBe(false);
  expect(pressInExplorer(left, "<C-w>l").state.panels.explorer.focused).toBe(
    true,
  );
});

test("Enter on a note that is already open focuses its window", () => {
  const r = pressInExplorer(withA(), "<CR>");
  expect(r.state.panels.explorer.focused).toBe(false);
  expect(r.state.panels.explorer.open).toBe(true);
  expect(r.effects).not.toContainEqual(
    expect.objectContaining({ kind: "read" }),
  );
});

test("<leader>fo opens the current file in the system's default app", () => {
  const s = openBuffer(fresh(), "page.html", "<p>hi</p>");
  const opened = pressKeys(s, `${s.config.leader}fo`);
  expect(opened.effects).toEqual([
    { kind: "openUrl", url: `${s.workspace.root}/page.html` },
  ]);
  expect(opened.state.buffers).toEqual(s.buffers);
  expect(
    pressKeys(fresh(), `${s.config.leader}fo`).state.notifications.message
      ?.text,
  ).toBe("E32: No file name");
});

test("O opens the selected entry in the system's default app", () => {
  const entries = [
    { name: "notes", kind: "dir" as const },
    { name: "page.html", kind: "file" as const },
  ];
  const listed = update(fresh(), { type: "dirListed", dir: "", entries });
  const root = listed.state.workspace.root;
  const opened = pressKeys(listed.state, "jO");
  expect(opened.effects).toEqual([
    { kind: "openUrl", url: `${root}/page.html` },
  ]);
  expect(opened.state.buffers).toEqual(listed.state.buffers);
  expect(pressKeys(listed.state, "O").effects).toEqual([
    { kind: "openUrl", url: `${root}/notes` },
  ]);
  const failed = update(opened.state, {
    type: "openUrlFailed",
    url: `${root}/page.html`,
    reason: "xdg-open failed",
  });
  expect(failed.state.notifications.toasts.at(-1)).toMatchObject({
    level: "error",
    text: `could not open ${root}/page.html`,
  });
});

test("a taken name gets copy, then a number, before a file's extension", () => {
  const taken = new Set(["a.md", "a copy.md", "dir", "v1.2", ".env"]);
  expect(freeName("new.md", false, taken)).toBe("new.md");
  expect(freeName("a.md", false, taken)).toBe("a copy 2.md");
  expect(freeName("dir", true, taken)).toBe("dir copy");
  expect(freeName("v1.2", true, taken)).toBe("v1.2 copy");
  expect(freeName(".env", false, taken)).toBe(".env copy");
});

const clipTree = (): AppState =>
  update(
    update(fresh(), {
      type: "dirListed",
      dir: "",
      entries: [
        { name: "notes", kind: "dir" },
        { name: "a.md", kind: "file" },
        { name: "b.png", kind: "file" },
      ],
    }).state,
    {
      type: "dirListed",
      dir: "notes",
      entries: [{ name: "one.md", kind: "file" }],
    },
  ).state;

const select = (s: AppState, cursor: string): AppState => ({
  ...s,
  panels: {
    ...s.panels,
    explorer: { ...s.panels.explorer, focused: true, cursor },
  },
});

const inWindow = (s: AppState): AppState => ({
  ...s,
  panels: { ...s.panels, explorer: { ...s.panels.explorer, focused: false } },
});

const pasted = (
  s: AppState,
  target: string,
  clip: { op: "copy" | "cut"; paths: string[] } | null,
  dirs: string[] = [],
) => update(s, { type: "fileClip", target, clip, dirs, now: 7 });

const fsOps = (effects: Effect[]) =>
  effects.flatMap((e) =>
    e.kind === "copy" || e.kind === "move" ? [e.op] : [],
  );

test("y and x take the selection here and on the system clipboard", () => {
  const s = select(clipTree(), "a.md");
  const copied = pressKeys(s, "y");
  expect(copied.state.panels.explorer.clip).toEqual({
    op: "copy",
    paths: ["a.md"],
  });
  expect(copied.effects).toEqual([
    { kind: "fileClipboardWrite", clip: { op: "copy", paths: ["/ws/a.md"] } },
  ]);
  expect(copied.state.notifications.message).toBeUndefined();
  const cut = pressKeys(select(s, "notes"), "x");
  expect(cut.state.panels.explorer.clip).toEqual({
    op: "cut",
    paths: ["notes"],
  });
});

test("the copy is confirmed once the clipboard takes it", () => {
  const written = (op: "copy" | "cut", system: boolean) =>
    update(clipTree(), {
      type: "fileClipboardWritten",
      clip: { op, paths: ["/ws/a.md"] },
      system,
    }).state.notifications.message?.text;
  expect(written("copy", true)).toBe("Copied a.md to the system clipboard");
  expect(written("cut", true)).toBe("Cut a.md to the system clipboard");
  expect(written("copy", false)).toBe("Copied a.md");
});

test("<leader>fy, fx, and fp take the active file and paste beside it", () => {
  const s = inWindow(openBuffer(clipTree(), "notes/one.md", "one"));
  const leader = s.config.leader;
  const copied = pressKeys(s, `${leader}fy`);
  expect(copied.state.panels.explorer.clip).toEqual({
    op: "copy",
    paths: ["notes/one.md"],
  });
  expect(copied.effects).toEqual([
    {
      kind: "fileClipboardWrite",
      clip: { op: "copy", paths: ["/ws/notes/one.md"] },
    },
  ]);
  expect(pressKeys(s, `${leader}fx`).state.panels.explorer.clip?.op).toBe(
    "cut",
  );
  expect(pressKeys(s, `${leader}fp`).effects).toEqual([
    { kind: "fileClipboardRead", target: "notes" },
  ]);
});

test("in the explorer, <leader>fy, fx, and fp work on the selection like y, x, and p", () => {
  const s = select(clipTree(), "b.png");
  const leader = s.config.leader;
  const copied = pressKeys(s, `${leader}fy`);
  expect(copied.state.panels.explorer.clip).toEqual({
    op: "copy",
    paths: ["b.png"],
  });
  expect(copied.effects).toEqual([
    { kind: "fileClipboardWrite", clip: { op: "copy", paths: ["/ws/b.png"] } },
  ]);
  expect(pressKeys(s, `${leader}fx`).state.panels.explorer.clip?.op).toBe(
    "cut",
  );
  expect(pressKeys(select(s, "notes"), `${leader}fp`).effects).toEqual([
    { kind: "fileClipboardRead", target: "notes" },
  ]);
});

test("<leader>fy without a file says so, and <leader>fp pastes at the root", () => {
  const s = inWindow(fresh());
  const leader = s.config.leader;
  expect(pressKeys(s, `${leader}fy`).state.notifications.message?.text).toBe(
    "E32: No file name",
  );
  expect(pressKeys(s, `${leader}fp`).effects).toEqual([
    { kind: "fileClipboardRead", target: "" },
  ]);
});

test("p reads the clipboard for the selected folder, or the selected file's folder", () => {
  const s = clipTree();
  expect(pressKeys(select(s, "notes"), "p").effects).toEqual([
    { kind: "fileClipboardRead", target: "notes" },
  ]);
  expect(pressKeys(select(s, "notes/one.md"), "p").effects).toEqual([
    { kind: "fileClipboardRead", target: "notes" },
  ]);
  expect(pressKeys(select(s, "a.md"), "p").effects).toEqual([
    { kind: "fileClipboardRead", target: "" },
  ]);
});

test("files copied in another program are copied in, a taken name getting copy", () => {
  const r = pasted(
    clipTree(),
    "",
    {
      op: "copy",
      paths: ["/Users/u/Downloads/a.md", "/Users/u/Downloads/pics"],
    },
    ["/Users/u/Downloads/pics"],
  );
  expect(fsOps(r.effects)).toEqual([
    {
      kind: "copy",
      from: "/Users/u/Downloads/a.md",
      to: "a copy.md",
      outside: true,
    },
    {
      kind: "copy",
      from: "/Users/u/Downloads/pics",
      to: "pics",
      dir: true,
      outside: true,
    },
  ]);
  const done = update(r.state, {
    type: "fsResult",
    op: { kind: "copy", from: "/x/a.md", to: "a copy.md", outside: true },
    ok: true,
  });
  expect(done.state.panels.explorer.cursor).toBe("a copy.md");
  expect(done.effects).toContainEqual({
    kind: "listDir",
    dir: "",
    gitignored: true,
  });
});

test("a cut from another file manager moves the files in", () => {
  const r = pasted(clipTree(), "notes", {
    op: "cut",
    paths: ["/home/u/x.md"],
  });
  expect(fsOps(r.effects)).toEqual([
    { kind: "move", from: "/home/u/x.md", to: "notes/x.md", outside: true },
  ]);
});

test("the explorer's cut decides when the clipboard holds what x took", () => {
  const tree = clipTree();
  const indexed = {
    ...tree,
    index: { ...tree.index, status: "ready" as const },
  };
  const s = pressKeys(select(indexed, "a.md"), "x").state;
  const own = pasted(s, "notes", { op: "copy", paths: ["/ws/a.md"] });
  expect(fsOps(own.effects)).toEqual([
    { kind: "move", from: "a.md", to: "notes/a.md" },
  ]);
  expect(own.state.panels.explorer.clip).toBeUndefined();
  const other = pasted(s, "notes", { op: "copy", paths: ["/ws/b.png"] });
  expect(fsOps(other.effects)).toEqual([
    { kind: "copy", from: "b.png", to: "notes/b.png" },
  ]);
  expect(other.state.panels.explorer.clip).toEqual({
    op: "cut",
    paths: ["a.md"],
  });
});

test("without files on the clipboard, what y took is pasted", () => {
  const s = pressKeys(select(clipTree(), "a.md"), "y").state;
  const r = pasted(s, "", null);
  expect(fsOps(r.effects)).toEqual([
    { kind: "copy", from: "a.md", to: "a copy.md" },
  ]);
  expect(r.state.panels.explorer.clip).toEqual({ op: "copy", paths: ["a.md"] });
  const empty = pasted(clipTree(), "", null);
  expect(empty.effects).toEqual([]);
  expect(empty.state.notifications.message?.text).toBe("nothing to paste");
  const failed = update(clipTree(), {
    type: "fileClip",
    target: "",
    clip: null,
    dirs: [],
    now: 7,
    error: "osascript failed",
  });
  expect(failed.state.notifications.message).toMatchObject({
    text: "clipboard unavailable: osascript failed",
    level: "error",
  });
});

test("a folder never goes into itself, and a cut entry already in place stays", () => {
  const s = clipTree();
  const into = pasted(s, "notes", { op: "copy", paths: ["/ws/notes"] });
  expect(fsOps(into.effects)).toEqual([]);
  expect(into.state.notifications.message).toMatchObject({
    text: "cannot paste a folder into itself",
    level: "error",
  });
  const inPlace = pasted(s, "notes", {
    op: "cut",
    paths: ["/ws/notes/one.md"],
  });
  expect(fsOps(inPlace.effects)).toEqual([]);
});

test("a copy flushes the source's unsaved text first", () => {
  const s = select(dirtyA(), "a.md");
  const r = pasted(s, "notes", { op: "copy", paths: ["/ws/a.md"] });
  expect(ops(r.effects)).toEqual([
    { kind: "write", path: "a.md", text: "xhello\n", expected: stamp(1) },
    { kind: "copy", op: { kind: "copy", from: "a.md", to: "notes/a.md" } },
  ]);
});

test("a long paste shows its progress, then what was pasted", () => {
  const going = update(clipTree(), {
    type: "copyProgress",
    to: "notes/pics",
    done: 120,
    total: 3400,
  });
  expect(going.state.notifications.message?.text).toBe(
    "Copying pics… 120/3400",
  );
  const done = update(going.state, {
    type: "fsResult",
    op: { kind: "copy", from: "/x/pics", to: "notes/pics", outside: true },
    ok: true,
  });
  expect(done.state.notifications.message?.text).toBe("Pasted pics");
});
