import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Action } from "../core/state/types";
import { atomicWrite } from "../workspace/fs";
import { createExclusionMatcher } from "../workspace/ignore";
import { createLogger } from "../workspace/log";
import type { ClipboardProvider } from "../workspace/system";
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
    dispatch: (a) => actions.push(a),
    exit: (code) => exits.push(code),
    logger: createLogger({}, root),
    configPath: join(root, "no-such-config.toml"),
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
