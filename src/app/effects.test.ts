import { afterAll, beforeAll, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Action, Effect, FileEvent, RepoInfo } from "../core/state/types";
import { localDateTime } from "../core/time/local";
import { atomicWrite } from "../workspace/fs";
import type { Git } from "../workspace/git";
import type { GitWatcher } from "../workspace/git-watcher";
import { createExclusionMatcher } from "../workspace/ignore";
import { createLogger } from "../workspace/log";
import { type ClipboardProvider, noFileClipboard } from "../workspace/system";
import type { Trash } from "../workspace/trash";
import { createOwnOps } from "../workspace/watcher";
import { createEffectRunner, type RunnerDeps } from "./effects";

let root = "";

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "so-effects-"));
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

const noTrash: Trash = {
  available: false,
  move: () => Promise.reject(new Error("no trash here")),
};
const memoryClipboard: ClipboardProvider = {
  name: "memory",
  copy: async () => {},
  paste: async () => "from clipboard",
};

const unused = () => Promise.reject(new Error("git is not used here"));
const noGit: Git = {
  detect: async () => ({ repo: null }),
  status: unused,
  readIndex: unused,
  stage: unused,
  blame: unused,
};

/** A runner over `root` that records every dispatched action. */
function runner(patch: Partial<RunnerDeps> = {}) {
  const actions: Action[] = [];
  const exits: number[] = [];
  const deps: RunnerDeps = {
    root,
    matcher: createExclusionMatcher(root, () => null),
    ownOps: createOwnOps(),
    trash: noTrash,
    clipboard: memoryClipboard,
    fileClipboard: noFileClipboard,
    dispatch: (a) => actions.push(a),
    exit: (code) => exits.push(code),
    logger: createLogger({}, root),
    configPath: join(root, "no-such-config.toml"),
    preview: { start: () => {}, stop: async () => {} },
    openUrl: async () => {},
    git: noGit,
    watchGit: () => ({ retarget() {}, stop() {} }),
    tool: { run: () => Promise.reject(new Error("no tool here")) },
    ...patch,
  };
  return { ...createEffectRunner(deps), deps, actions, exits };
}

async function waitFor(pred: () => boolean, ms = 3000): Promise<void> {
  const until = performance.now() + ms;
  while (!pred()) {
    if (performance.now() > until) throw new Error("timed out waiting");
    await Bun.sleep(5);
  }
}

test("a clipboard copy failure is reported exactly once", async () => {
  const r = runner({
    clipboard: {
      name: "broken",
      copy: () => Promise.reject(new Error("pbcopy failed")),
    },
  });
  r.run({ kind: "clipboardWrite", text: "x" });
  await waitFor(() => r.actions.length > 0);
  await Bun.sleep(20);
  expect(r.actions).toEqual([
    { type: "clipboardText", text: "", error: "pbcopy failed" },
  ]);
});

test("a clipboard read answers with the text, empty text, or the error", async () => {
  const ok = runner();
  ok.run({ kind: "clipboardRead" });
  const copyOnly = runner({
    clipboard: { name: "osc52", copy: async () => {} },
  });
  copyOnly.run({ kind: "clipboardRead" });
  const failing = runner({
    clipboard: {
      name: "broken",
      copy: async () => {},
      paste: () => Promise.reject(new Error("no display")),
    },
  });
  failing.run({ kind: "clipboardRead" });
  await waitFor(
    () =>
      ok.actions.length + copyOnly.actions.length + failing.actions.length ===
      3,
  );
  expect(ok.actions).toEqual([
    { type: "clipboardText", text: "from clipboard" },
  ]);
  expect(copyOnly.actions).toEqual([{ type: "clipboardText", text: "" }]);
  expect(failing.actions).toEqual([
    { type: "clipboardText", text: "", error: "no display" },
  ]);
});

test("mutating effects run one at a time in the order they were emitted", async () => {
  const r = runner();
  const big = "x".repeat(4 * 1024 * 1024);
  r.run({ kind: "write", path: "a.md", text: big });
  r.run({ kind: "rename", op: { kind: "rename", from: "a.md", to: "c.md" } });
  r.run({ kind: "write", path: "c.md", text: "last\n" });
  await waitFor(() => r.actions.length === 3);
  expect(r.actions.map((a) => a.type)).toEqual(["saved", "fsResult", "saved"]);
  expect(r.actions[1]).toEqual({
    type: "fsResult",
    op: { kind: "rename", from: "a.md", to: "c.md" },
    ok: true,
  });
  expect(await readFile(join(root, "c.md"), "utf8")).toBe("last\n");
  expect(await Bun.file(join(root, "a.md")).exists()).toBe(false);
  expect(r.deps.ownOps.isOwn("a.md")).toBe(true);
  expect(r.deps.ownOps.isOwn("c.md")).toBe(true);
});

test("a write over an unseen disk version fails with the conflict reason", async () => {
  const seen = await atomicWrite(join(root, "seen.md"), "one\n");
  await writeFile(join(root, "seen.md"), "external\n");
  const r = runner();
  r.run({ kind: "write", path: "seen.md", text: "mine\n", expected: seen });
  await waitFor(() => r.actions.length > 0);
  expect(r.actions).toEqual([
    { type: "saveFailed", path: "seen.md", reason: "conflict" },
  ]);
  expect(await readFile(join(root, "seen.md"), "utf8")).toBe("external\n");
});

test("each file operation answers once with its result", async () => {
  await writeFile(join(root, "keep.md"), "keep\n");
  await writeFile(join(root, "other.md"), "other\n");
  await mkdir(join(root, "old"));
  const r = runner();
  r.run({
    kind: "rename",
    op: { kind: "rename", from: "other.md", to: "keep.md" },
  });
  r.run({ kind: "create", op: { kind: "create", from: "keep.md" } });
  r.run({ kind: "create", op: { kind: "create", from: "dir/new", dir: true } });
  r.run({ kind: "trash", op: { kind: "trash", from: "other.md" } });
  r.run({
    kind: "trash",
    op: { kind: "trash", from: "old", permanent: true },
  });
  await waitFor(() => r.actions.length === 5);
  expect(r.actions).toEqual([
    {
      type: "fsResult",
      op: { kind: "rename", from: "other.md", to: "keep.md" },
      ok: false,
      reason: "E13: File exists (keep.md)",
    },
    {
      type: "fsResult",
      op: { kind: "create", from: "keep.md" },
      ok: false,
      reason: "E13: File exists (keep.md)",
    },
    {
      type: "fsResult",
      op: { kind: "create", from: "dir/new", dir: true },
      ok: true,
    },
    {
      type: "fsResult",
      op: { kind: "trash", from: "other.md" },
      ok: false,
      reason: "no trash here",
    },
    {
      type: "fsResult",
      op: { kind: "trash", from: "old", permanent: true },
      ok: true,
    },
  ]);
  expect(await readFile(join(root, "keep.md"), "utf8")).toBe("keep\n");
  expect(await Bun.file(join(root, "other.md")).exists()).toBe(true);
  expect(r.deps.ownOps.isOwn("old")).toBe(true);
});

test("a created file is sent to the index; a failed create or a folder is not", async () => {
  const events: unknown[] = [];
  const r = runner({
    index: { search: () => {}, notify: (e) => events.push(e), moved: () => {} },
  });
  r.run({ kind: "create", op: { kind: "create", from: "made.csv" } });
  r.run({ kind: "create", op: { kind: "create", from: "made.csv" } });
  r.run({ kind: "create", op: { kind: "create", from: "made", dir: true } });
  await waitFor(() => r.actions.length === 3);
  expect(r.actions.map((a) => a.type === "fsResult" && a.ok)).toEqual([
    true,
    false,
    true,
  ]);
  expect(events).toEqual([{ kind: "changed", path: "made.csv", isDir: false }]);
});

test("a new note with frontmatter is written with it once, indexed, and answered with its text", async () => {
  await mkdir(join(root, "rows"), { recursive: true });
  const events: unknown[] = [];
  const r = runner({
    index: { search: () => {}, notify: (e) => events.push(e), moved: () => {} },
  });
  const note = {
    kind: "createNote" as const,
    path: "rows/new.md",
    vars: { title: "new", at: localDateTime(0) },
    frontmatter: { status: "todo", tags: ["reading"] },
    after: "insert" as const,
    reason: "row" as const,
  };
  r.run(note);
  r.run({ ...note, frontmatter: { status: "other" } });
  await waitFor(() => r.actions.length === 2);
  const text = "---\nstatus: todo\ntags:\n  - reading\n---\n";
  expect(await readFile(join(root, "rows/new.md"), "utf8")).toBe(text);
  expect(r.actions[0]).toMatchObject({
    type: "noteCreated",
    path: "rows/new.md",
    outcome: "created",
    reason: "row",
    text,
  });
  expect(r.actions[1]).toMatchObject({ outcome: "exists" });
  expect(r.actions[1]).not.toHaveProperty("text");
  expect(events).toEqual([
    { kind: "changed", path: "rows/new.md", isDir: false },
  ]);
  await rm(join(root, "rows"), { recursive: true, force: true });
});

test("a finished rename or move moves the index paths; a finished trash removes them", async () => {
  await writeFile(join(root, "from.md"), "x\n");
  await writeFile(join(root, "gone.md"), "x\n");
  const sent: unknown[] = [];
  const r = runner({
    index: {
      search: () => {},
      notify: (e) => sent.push(e),
      moved: (from, to) => sent.push({ from, to }),
    },
  });
  r.run({
    kind: "rename",
    op: { kind: "rename", from: "from.md", to: "to.md" },
  });
  r.run({
    kind: "rename",
    op: { kind: "rename", from: "absent.md", to: "x.md" },
  });
  r.run({
    kind: "trash",
    op: { kind: "trash", from: "gone.md", permanent: true },
  });
  await waitFor(() => r.actions.length === 3);
  expect(sent).toEqual([
    { from: "from.md", to: "to.md" },
    { kind: "removed", path: "gone.md" },
  ]);
  await rm(join(root, "to.md"), { force: true });
});

test("language servers hear of each file a finished move or trash touches", async () => {
  await mkdir(join(root, "src/deep"), { recursive: true });
  await mkdir(join(root, "src/.cache"), { recursive: true });
  await writeFile(join(root, "src/a.ts"), "x\n");
  await writeFile(join(root, "src/deep/b.ts"), "x\n");
  await writeFile(join(root, "src/.cache/c.ts"), "x\n");
  await writeFile(join(root, "drop.ts"), "x\n");
  const sent: unknown[] = [];
  const r = runner({
    lsp: { run: () => {}, notify: (e) => sent.push(e) },
  });
  r.run({ kind: "move", op: { kind: "move", from: "src", to: "lib" } });
  r.run({
    kind: "trash",
    op: { kind: "trash", from: "drop.ts", permanent: true },
  });
  r.run({
    kind: "rename",
    op: { kind: "rename", from: "absent.ts", to: "x.ts" },
  });
  await waitFor(() => r.actions.length === 3);
  expect(sent).toEqual([
    { kind: "removed", path: "src/a.ts" },
    { kind: "changed", path: "lib/a.ts", isDir: false },
    { kind: "removed", path: "src/deep/b.ts" },
    { kind: "changed", path: "lib/deep/b.ts", isDir: false },
    { kind: "removed", path: "drop.ts" },
  ]);
  await rm(join(root, "lib"), { recursive: true, force: true });
});

test("reads and listings answer with their result or refusal", async () => {
  await writeFile(join(root, "read.md"), "hello\n");
  const r = runner();
  r.run({ kind: "read", path: "read.md" });
  r.run({ kind: "read", path: "absent.md" });
  r.run({ kind: "listDir", dir: "absent" });
  await waitFor(() => r.actions.length === 3);
  expect(r.actions).toContainEqual(
    expect.objectContaining({ type: "fileLoaded", path: "read.md" }),
  );
  expect(r.actions).toContainEqual({
    type: "fileRefused",
    path: "absent.md",
    reason: "io",
  });
  expect(r.actions).toContainEqual(
    expect.objectContaining({
      type: "dirListed",
      dir: "absent",
      entries: null,
    }),
  );
});

test("listings asked for while a folder is read become one more, with the latest options", async () => {
  await mkdir(join(root, "burst"), { recursive: true });
  await writeFile(join(root, "burst/.hidden"), "x\n");
  const r = runner();
  r.run({ kind: "listDir", dir: "burst" });
  for (let i = 0; i < 50; i++) r.run({ kind: "listDir", dir: "burst" });
  r.run({ kind: "listDir", dir: "burst", dotfiles: true });
  await waitFor(() => r.actions.length === 2);
  await Bun.sleep(50);
  expect(r.actions).toEqual([
    { type: "dirListed", dir: "burst", entries: [] },
    {
      type: "dirListed",
      dir: "burst",
      entries: [{ name: ".hidden", kind: "file" }],
    },
  ]);
});

test("a timer fires once, never before its delay on the runner's clock", async () => {
  // A clock running at half speed: the real timeout elapses before the
  // clock reaches the due time, so the runner must wait for the rest.
  const t0 = performance.now();
  const now = () => 1_000_000 + (performance.now() - t0) / 2;
  const r = runner({ now });
  const started = now();
  r.run({ kind: "startTimer", id: "autosave:1", ms: 40 });
  await waitFor(() => r.actions.length > 0);
  await Bun.sleep(60);
  expect(r.actions).toHaveLength(1);
  const fired = r.actions[0];
  expect(fired?.type).toBe("timer");
  if (fired?.type === "timer") {
    expect(fired.id).toBe("autosave:1");
    expect(fired.now).toBeGreaterThanOrEqual(started + 40);
  }
});

test("a restarted timer fires once and a cancelled timer never fires", async () => {
  const r = runner();
  r.run({ kind: "startTimer", id: "autosave:1", ms: 20 });
  r.run({ kind: "startTimer", id: "autosave:1", ms: 30 });
  r.run({ kind: "startTimer", id: "retry:2", ms: 20 });
  r.run({ kind: "cancelTimer", id: "retry:2" });
  await Bun.sleep(100);
  expect(r.actions.map((a) => a.type === "timer" && a.id)).toEqual([
    "autosave:1",
  ]);
});

test("exit calls the exit handler bound after the runner was built", () => {
  const r = runner();
  r.deps.exit = (code) => r.exits.push(code + 100);
  r.run({ kind: "exit", code: 0 });
  expect(r.exits).toEqual([100]);
});

test("flush writes through the same queue as other file operations", async () => {
  const r = runner();
  r.run({ kind: "write", path: "f.md", text: "queued\n" });
  await r.flush([{ kind: "write", path: "f.md", text: "flushed\n" }]);
  expect(await readFile(join(root, "f.md"), "utf8")).toBe("flushed\n");
  expect(r.actions.map((a) => a.type)).toEqual(["saved"]);
});

test("a flush behind an in-flight autosave of the same file writes the newest text", async () => {
  const s0 = await atomicWrite(join(root, "typing.md"), "v0\n");
  const r = runner();
  r.run({ kind: "write", path: "typing.md", text: "v1\n", expected: s0 });
  await r.flush([
    { kind: "write", path: "typing.md", text: "v2\n", expected: s0 },
  ]);
  expect(await readFile(join(root, "typing.md"), "utf8")).toBe("v2\n");
  expect(r.actions.map((a) => a.type)).toEqual(["saved"]);
});

test("a flush still refuses a file changed on disk after so's own write", async () => {
  const s0 = await atomicWrite(join(root, "raced.md"), "v0\n");
  const r = runner();
  r.run({ kind: "write", path: "raced.md", text: "v1\n", expected: s0 });
  await waitFor(() => r.actions.length > 0);
  await writeFile(join(root, "raced.md"), "external edit\n");
  const flushed = r.flush([
    { kind: "write", path: "raced.md", text: "v2\n", expected: s0 },
  ]);
  await expect(flushed).rejects.toThrow("conflict");
  expect(await readFile(join(root, "raced.md"), "utf8")).toBe(
    "external edit\n",
  );
});

test("a save over the version a closed-file edit replaced conflicts instead of overwriting it", async () => {
  const s0 = await atomicWrite(join(root, "linked.md"), "see [[plan]]\n");
  const r = runner();
  r.run({
    kind: "applyEdits",
    batch: 1,
    edit: {
      path: "linked.md",
      edits: [
        {
          range: { start: { line: 0, col: 6 }, end: { line: 0, col: 10 } },
          text: "goal",
        },
      ],
    },
  });
  await waitFor(() => r.actions.length > 0);
  expect(r.actions[0]).toMatchObject({ type: "editsApplied", ok: true });
  // A buffer that loaded the file before the edit landed saves over s0.
  r.run({ kind: "write", path: "linked.md", text: "typed\n", expected: s0 });
  await waitFor(() => r.actions.length > 1);
  expect(r.actions[1]).toMatchObject({ type: "saveFailed", path: "linked.md" });
  expect(await readFile(join(root, "linked.md"), "utf8")).toBe(
    "see [[goal]]\n",
  );
});

test("writes queued behind a move, a removal, or a failed rename follow its outcome", async () => {
  await mkdir(join(root, "box"), { recursive: true });
  await writeFile(join(root, "box/m.md"), "m\n");
  await writeFile(join(root, "gone.md"), "g\n");
  await writeFile(join(root, "stay.md"), "s\n");
  await writeFile(join(root, "taken.md"), "t\n");
  const r = runner();
  r.run({ kind: "move", op: { kind: "move", from: "box", to: "moved/box" } });
  r.run({
    kind: "trash",
    op: { kind: "trash", from: "gone.md", permanent: true },
  });
  r.run({
    kind: "rename",
    op: { kind: "rename", from: "stay.md", to: "taken.md" },
  });
  r.run({ kind: "write", path: "gone.md", text: "g1\n" });
  await r.flush([
    { kind: "write", path: "box/m.md", text: "m2\n" },
    { kind: "write", path: "gone.md", text: "g2\n" },
    { kind: "write", path: "stay.md", text: "s2\n" },
  ]);
  expect(r.actions.filter((a) => a.type !== "fsResult")).toEqual([
    {
      type: "saveFailed",
      path: "gone.md",
      reason: "deleted on disk — :w to recreate",
    },
  ]);
  expect(await readFile(join(root, "moved/box/m.md"), "utf8")).toBe("m2\n");
  expect(await Bun.file(join(root, "box/m.md")).exists()).toBe(false);
  expect(await Bun.file(join(root, "gone.md")).exists()).toBe(false);
  expect(await readFile(join(root, "stay.md"), "utf8")).toBe("s2\n");
  expect(await readFile(join(root, "taken.md"), "utf8")).toBe("t\n");
});

test("loadConfig answers with one configLoaded for a file, no file, or a read error", async () => {
  const file = join(root, "config.toml");
  await writeFile(file, 'theme = "light"\n');
  const results = [];
  for (const configPath of [file, join(root, "missing.toml"), root]) {
    const r = runner({ configPath });
    r.run({ kind: "loadConfig" });
    await waitFor(() => r.actions.length > 0);
    await Bun.sleep(20);
    expect(r.actions).toHaveLength(1);
    const [a] = r.actions;
    if (a?.type !== "configLoaded") throw new Error("expected configLoaded");
    expect(a.reload).toBe(true);
    results.push(a.result.ok ? a.result.config.theme : a.result.errors);
  }
  expect(results[0]).toBe("light");
  expect(results[1]).toBe("dark");
  expect(results[2]).toEqual([{ line: 1, message: expect.any(String) }]);
});

test("writeSetting edits config.toml in order, creating it and its folder", async () => {
  const configPath = join(root, "settings", "so", "config.toml");
  const r = runner({ configPath });
  r.run({
    kind: "writeSetting",
    path: ["explorer", "position"],
    value: "left",
    previous: "right",
  });
  r.run({
    kind: "writeSetting",
    path: ["theme"],
    value: "light",
    previous: "dark",
  });
  r.run({
    kind: "writeSetting",
    path: ["explorer", "position"],
    value: "right",
    previous: "left",
  });
  const until = performance.now() + 3000;
  let text = "";
  while (performance.now() < until) {
    text = await readFile(configPath, "utf8").catch(() => "");
    if (text.includes("theme") && text.includes('"right"')) break;
    await Bun.sleep(5);
  }
  expect(text).toBe('theme = "light"\n\n[explorer]\nposition = "right"\n');
  expect(r.actions).toEqual([]);
});

test("writeBindings applies every edit in one write; a failure reports the previous keymaps", async () => {
  const configPath = join(root, "keys", "config.toml");
  await mkdir(join(root, "keys"), { recursive: true });
  await writeFile(configPath, '[keys.insert]\nkj = "<Esc>"\n');
  const r = runner({ configPath });
  r.run({
    kind: "writeBindings",
    edits: [
      { path: ["keys", "insert", "kj"] },
      { path: ["keys", "insert", "jj"], id: "<Esc>" },
      { path: ["keys", "normal", "<leader>ff"], id: "" },
    ],
    previous: { keys: {}, filetypes: {} },
  });
  const until = performance.now() + 3000;
  let text = "";
  while (performance.now() < until) {
    text = await readFile(configPath, "utf8");
    if (text.includes("<leader>ff")) break;
    await Bun.sleep(5);
  }
  expect(text).toBe(
    '[keys.insert]\njj = "<Esc>"\n\n[keys.normal]\n"<leader>ff" = ""\n',
  );

  await writeFile(configPath, '[explorer]\nposition = "up"\n');
  const previous = { keys: { insert: { jj: "<Esc>" } }, filetypes: {} };
  r.run({
    kind: "writeBindings",
    edits: [{ path: ["keys", "insert", "kk"], id: "<Esc>" }],
    previous,
  });
  await waitFor(() => r.actions.length > 0);
  expect(r.actions).toEqual([
    {
      type: "bindingsFailed",
      previous,
      reason: "config.toml:2 has an error; fix it before changing settings",
    },
  ]);
});

test("writeSetting leaves a broken config.toml alone and reports why", async () => {
  const configPath = join(root, "broken.toml");
  await writeFile(configPath, '[explorer]\nposition = "up"\n');
  const r = runner({ configPath });
  r.run({
    kind: "writeSetting",
    path: ["theme"],
    value: "light",
    previous: "dark",
  });
  await waitFor(() => r.actions.length > 0);
  expect(r.actions).toEqual([
    {
      type: "settingFailed",
      path: ["theme"],
      previous: "dark",
      reason: "config.toml:2 has an error; fix it before changing settings",
    },
  ]);
  expect(await readFile(configPath, "utf8")).toBe(
    '[explorer]\nposition = "up"\n',
  );
});

test("an embed read's answer says it was for an embed", async () => {
  await writeFile(join(root, "target.md"), "body\n");
  const r = runner();
  r.run({ kind: "read", path: "target.md", embed: true });
  r.run({ kind: "read", path: "gone.md", embed: true });
  await waitFor(() => r.actions.length === 2);
  expect(r.actions).toContainEqual(
    expect.objectContaining({
      type: "fileLoaded",
      path: "target.md",
      embed: true,
    }),
  );
  expect(r.actions).toContainEqual({
    type: "fileRefused",
    path: "gone.md",
    reason: "io",
    embed: true,
  });
});

test("property types are read from the workspace and reported", async () => {
  await mkdir(join(root, ".obsidian"), { recursive: true });
  await writeFile(
    join(root, ".obsidian/types.json"),
    '{ "types": { "Due": "date" } }',
  );
  const r = runner();
  r.run({ kind: "readPropertyTypes" });
  await waitFor(() => r.actions.length > 0);
  expect(r.actions).toEqual([
    { type: "propertyTypesLoaded", types: { due: "date" } },
  ]);
  await rm(join(root, ".obsidian"), { recursive: true, force: true });
});

test("a frontmatter patch is written only while the property still holds the shown value", async () => {
  const note = "---\nstatus: todo # next up\ndue: 2026-10-05\n---\n# Task\n";
  await writeFile(join(root, "task.md"), note);
  const notified: string[] = [];
  const r = runner({
    index: {
      search: () => {},
      notify: (e) => notified.push(e.path),
      moved: () => {},
    },
  });
  r.run({
    kind: "patchFrontmatter",
    path: "task.md",
    patch: { set: "status", value: "doing" },
    expected: "todo",
  });
  await waitFor(() => r.actions.length === 1);
  const written = await readFile(join(root, "task.md"), "utf8");
  expect(written).toBe(note.replace("todo", "doing"));
  expect(r.actions[0]).toMatchObject({
    type: "frontmatterPatched",
    path: "task.md",
    ok: true,
    text: written,
    removed: ["status: todo # next up"],
    added: ["status: doing # next up"],
  });
  expect(notified).toEqual(["task.md"]);

  r.run({
    kind: "patchFrontmatter",
    path: "task.md",
    patch: { remove: "status" },
    expected: "todo",
  });
  await waitFor(() => r.actions.length === 2);
  expect(r.actions[1]).toEqual({
    type: "frontmatterPatched",
    path: "task.md",
    ok: false,
    removed: [],
    added: [],
    reason: "changed on disk",
  });
  expect(await readFile(join(root, "task.md"), "utf8")).toBe(written);
});

const REPO: RepoInfo = {
  top: "/repo",
  gitDir: "/repo/.git",
  commonDir: "/repo/.git",
  prefix: "notes/",
  head: { kind: "branch", name: "main" },
};

test("a stage waits for the write queued before it", async () => {
  await writeFile(join(root, "held.md"), "h\n");
  let release = () => {};
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const order: string[] = [];
  const r = runner({
    trash: { available: true, move: () => gate },
    dispatch: (a) => order.push(a.type),
    git: {
      ...noGit,
      stage: async (repo, e) => {
        order.push(`stage ${repo.top} ${e.repoPath} ${e.expectedOid}`);
        return "ok";
      },
    },
  });
  const report = { n: 1, m: 2, saved: true };
  r.run({
    kind: "trash",
    op: { kind: "trash", from: "held.md" },
  });
  r.run({ kind: "write", path: "staged.md", text: "typed\n" });
  r.run({
    kind: "gitStage",
    repo: REPO,
    path: "staged.md",
    repoPath: "notes/staged.md",
    expectedOid: "abc",
    patch: "diff",
    report,
  });
  await Bun.sleep(30);
  expect(order).toEqual([]);
  release();
  await waitFor(() => order.length === 4);
  expect(order).toEqual([
    "fsResult",
    "saved",
    "stage /repo notes/staged.md abc",
    "gitStaged",
  ]);

  const staged: Action[] = [];
  const failing = runner({
    dispatch: (a) => staged.push(a),
    git: { ...noGit, stage: () => Promise.reject(new Error("patch failed")) },
  });
  failing.run({
    kind: "gitStage",
    repo: REPO,
    path: "staged.md",
    repoPath: "notes/staged.md",
    expectedOid: null,
    patch: "diff",
    report,
  });
  await waitFor(() => staged.length > 0);
  expect(staged).toEqual([
    {
      type: "gitStaged",
      path: "staged.md",
      result: { failed: "patch failed" },
      report,
    },
  ]);
});

test("status, index, and blame reads answer once each, failures included", async () => {
  const status = { head: REPO.head, files: new Map() };
  const blamed = { committed: false } as const;
  const ok = runner({
    now: () => 1234,
    git: {
      ...noGit,
      status: async (repo) => (repo === REPO ? status : Promise.reject()),
      readIndex: async (_repo, repoPath) =>
        repoPath === "notes/a.md" ? { kind: "untracked" } : { kind: "ignored" },
      blame: async (_repo, repoPath, line, contents) =>
        repoPath === "notes/a.md" && line === 2 && contents === "x\n"
          ? blamed
          : Promise.reject(new Error("wrong call")),
    },
  });
  const reads: Effect[] = [
    { kind: "gitStatus", repo: REPO, prefix: "notes/" },
    { kind: "gitReadIndex", repo: REPO, path: "a.md", repoPath: "notes/a.md" },
    {
      kind: "gitBlame",
      repo: REPO,
      path: "a.md",
      repoPath: "notes/a.md",
      line: 2,
      contents: "x\n",
    },
  ];
  for (const e of reads) ok.run(e);
  await waitFor(() => ok.actions.length === 3);
  await Bun.sleep(20);
  expect(ok.actions).toContainEqual({
    type: "gitStatus",
    result: { ok: true, status },
  });
  expect(ok.actions).toContainEqual({
    type: "gitIndexRead",
    path: "a.md",
    entry: { kind: "untracked" },
  });
  expect(ok.actions).toContainEqual({
    type: "gitBlamed",
    path: "a.md",
    line: 2,
    result: blamed,
    now: 1234,
  });
  expect(ok.actions).toHaveLength(3);

  const down = new Error("fatal: not a git repository");
  const bad = runner({
    now: () => 99,
    git: {
      ...noGit,
      status: () => Promise.reject(down),
      readIndex: () => Promise.reject(down),
      blame: () => Promise.reject(down),
    },
  });
  for (const e of reads) bad.run(e);
  await waitFor(() => bad.actions.length === 3);
  await Bun.sleep(20);
  const reason = "fatal: not a git repository";
  expect(bad.actions).toContainEqual({
    type: "gitStatus",
    result: { ok: false, reason },
  });
  expect(bad.actions).toContainEqual({
    type: "gitIndexRead",
    path: "a.md",
    entry: { kind: "failed", reason },
  });
  expect(bad.actions).toContainEqual({
    type: "gitBlamed",
    path: "a.md",
    line: 2,
    result: { failed: reason },
    now: 99,
  });
  expect(bad.actions).toHaveLength(3);
});

test("git-dir watching reuses one watcher and retargets it", () => {
  const made: { dirs: string[]; onChange: () => void }[] = [];
  const retargets: string[][] = [];
  const watcher: GitWatcher = {
    retarget: (dirs) => retargets.push(dirs),
    stop() {},
  };
  const r = runner({
    watchGit: (dirs, onChange) => {
      made.push({ dirs, onChange });
      return watcher;
    },
  });
  r.run({ kind: "gitWatch", dirs: ["/repo/.git"] });
  r.run({ kind: "gitWatch", dirs: ["/repo/.git", "/repo/.git/refs/heads/f"] });
  expect(made.map((m) => m.dirs)).toEqual([["/repo/.git"]]);
  expect(retargets).toEqual([
    ["/repo/.git"],
    ["/repo/.git", "/repo/.git/refs/heads/f"],
  ]);
  made[0]?.onChange();
  expect(r.actions).toEqual([{ type: "gitDirChanged" }]);
});

test("running the tool dispatches its result once", async () => {
  const runs: { argv: string[]; cwd: string }[] = [];
  const r = runner({
    tool: {
      run: async (argv, cwd) => {
        runs.push({ argv, cwd });
        return { kind: "exited", code: 0 };
      },
    },
  });
  r.run({ kind: "runTool", argv: ["lazygit", "-p", "x"], cwd: "/repo" });
  await waitFor(() => r.actions.length > 0);
  expect(runs).toEqual([{ argv: ["lazygit", "-p", "x"], cwd: "/repo" }]);
  expect(r.actions).toEqual([
    { type: "toolExited", result: { kind: "exited", code: 0 } },
  ]);

  const broken = runner();
  broken.run({ kind: "runTool", argv: ["lazygit"], cwd: "/repo" });
  await waitFor(() => broken.actions.length > 0);
  await Bun.sleep(10);
  expect(broken.actions).toEqual([
    { type: "toolExited", result: { kind: "failed", reason: "no tool here" } },
  ]);
});

test("a copy runs on the queue and the index learns of the new entry", async () => {
  const outside = await mkdtemp(join(tmpdir(), "so-effects-outside-"));
  const told: FileEvent[] = [];
  const moved: string[] = [];
  const r = runner({
    index: {
      search: () => {},
      notify: (e) => told.push(e),
      moved: (from, to) => moved.push(`${from}>${to}`),
    },
  });
  try {
    await writeFile(join(root, "src.md"), "src\n");
    await writeFile(join(outside, "in.md"), "in\n");
    r.run({ kind: "copy", op: { kind: "copy", from: "src.md", to: "dup.md" } });
    const inOp = {
      kind: "move" as const,
      from: join(outside, "in.md"),
      to: "in.md",
      outside: true as const,
    };
    r.run({ kind: "move", op: inOp });
    await waitFor(() => r.actions.length === 2);
    expect(r.actions).toEqual([
      {
        type: "fsResult",
        op: { kind: "copy", from: "src.md", to: "dup.md" },
        ok: true,
      },
      { type: "fsResult", op: inOp, ok: true },
    ]);
    expect(await readFile(join(root, "dup.md"), "utf8")).toBe("src\n");
    expect(await readFile(join(root, "in.md"), "utf8")).toBe("in\n");
    expect(await Bun.file(join(outside, "in.md")).exists()).toBe(false);
    expect(told).toEqual([
      { kind: "changed", path: "dup.md", isDir: false },
      { kind: "changed", path: "in.md", isDir: false },
    ]);
    expect(moved).toEqual([]);
  } finally {
    await rm(outside, { recursive: true });
  }
});

test("a clipboard paste names workspace files from its root, even through a link", async () => {
  const real = await realpath(
    await mkdtemp(join(tmpdir(), "so-effects-real-")),
  );
  const linked = `${real}-link`;
  await symlink(real, linked);
  try {
    await mkdir(join(real, "notes"));
    const r = runner({
      root: linked,
      fileClipboard: {
        name: "fake",
        write: async () => {},
        read: async () => ({
          op: "copy",
          paths: [join(real, "notes"), "/elsewhere/x.md"],
        }),
      },
      now: () => 42,
    });
    r.run({ kind: "fileClipboardRead", target: "" });
    await waitFor(() => r.actions.length === 1);
    expect(r.actions).toEqual([
      {
        type: "fileClip",
        target: "",
        clip: {
          op: "copy",
          paths: [join(linked, "notes"), "/elsewhere/x.md"],
        },
        dirs: [join(linked, "notes")],
        now: 42,
      },
    ]);
  } finally {
    await rm(linked);
    await rm(real, { recursive: true });
  }
});

test("a clipboard write is confirmed, as system-wide only with a real clipboard", async () => {
  const clip = { op: "copy" as const, paths: ["/ws/a.md"] };
  for (const [name, system] of [
    ["osascript", true],
    ["none", false],
  ] as const) {
    const r = runner({
      fileClipboard: { name, write: async () => {}, read: async () => null },
    });
    r.run({ kind: "fileClipboardWrite", clip });
    await waitFor(() => r.actions.length === 1);
    expect(r.actions).toEqual([{ type: "fileClipboardWritten", clip, system }]);
  }
});

test("clipboard failures are reported: a read as no files, a write once", async () => {
  const r = runner({
    fileClipboard: {
      name: "broken",
      write: () => Promise.reject(new Error("osascript failed")),
      read: () => Promise.reject(new Error("osascript failed")),
    },
    now: () => 1,
  });
  r.run({ kind: "fileClipboardRead", target: "notes" });
  r.run({
    kind: "fileClipboardWrite",
    clip: { op: "copy", paths: ["/ws/a.md"] },
  });
  await waitFor(() => r.actions.length === 2);
  await Bun.sleep(20);
  expect(r.actions).toContainEqual({
    type: "fileClip",
    target: "notes",
    clip: null,
    dirs: [],
    now: 1,
    error: "osascript failed",
  });
  expect(r.actions).toContainEqual({
    type: "fileClipboardFailed",
    reason: "osascript failed",
  });
  expect(r.actions.length).toBe(2);
});

test("a long copy reports progress after a quiet start, a quick one none", async () => {
  await mkdir(join(root, "many"), { recursive: true });
  for (const n of ["a", "b", "c"]) await writeFile(join(root, "many", n), n);
  let t = 0;
  const slow = runner({ now: () => (t += 150) });
  slow.run({ kind: "copy", op: { kind: "copy", from: "many", to: "many2" } });
  await waitFor(() => slow.actions.some((a) => a.type === "fsResult"));
  const progress = slow.actions.filter((a) => a.type === "copyProgress");
  expect(progress.length).toBeGreaterThan(0);
  expect(progress.at(-1)).toEqual({
    type: "copyProgress",
    to: "many2",
    done: 4,
    total: 4,
  });
  expect(slow.actions.at(-1)?.type).toBe("fsResult");
  const quick = runner({ now: () => 0 });
  quick.run({ kind: "copy", op: { kind: "copy", from: "many", to: "many3" } });
  await waitFor(() => quick.actions.length > 0);
  expect(quick.actions.map((a) => a.type)).toEqual(["fsResult"]);
});

test("a PDF's annotations are read from, written to, and moved under .so/annotations", async () => {
  const r = runner();
  r.run({ kind: "readAnnotations", pdf: "papers/a.pdf" });
  await waitFor(() => r.actions.length === 1);
  expect(r.actions).toEqual([
    { type: "annotationsRead", pdf: "papers/a.pdf", text: null },
  ]);
  r.run({ kind: "writeAnnotations", pdf: "papers/a.pdf", text: "one\n" });
  await r.flush([
    { kind: "writeAnnotations", pdf: "papers/a.pdf", text: "two\n" },
  ]);
  const file = join(root, ".so/annotations/papers/a.pdf.json");
  expect(await readFile(file, "utf8")).toBe("two\n");
  r.run({
    kind: "moveAnnotations",
    from: "papers",
    to: "old/papers",
    dir: true,
  });
  r.run({
    kind: "moveAnnotations",
    from: "missing.pdf",
    to: "gone.pdf",
    dir: false,
  });
  const moved = join(root, ".so/annotations/old/papers/a.pdf.json");
  await waitFor(() => existsSync(moved));
  expect(await readFile(moved, "utf8")).toBe("two\n");
  r.run({ kind: "readAnnotations", pdf: "old/papers/a.pdf" });
  await waitFor(() => r.actions.length === 2);
  expect(r.actions[1]).toEqual({
    type: "annotationsRead",
    pdf: "old/papers/a.pdf",
    text: "two\n",
  });
});
