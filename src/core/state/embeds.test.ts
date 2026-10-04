import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import { markdownViewContext } from "./markdown-view";
import { snapshotSession } from "./session";
import type { Action, AppState, Effect, Result } from "./types";
import { createUpdate } from "./update";

const update = createUpdate(testRegistries());
const FILES = ["a.md", "b.md", "c.md", "d.md", "e.md"];

function indexed(): AppState {
  return update(fresh(), {
    type: "indexBatch",
    summaries: [],
    files: FILES,
    done: 0,
    total: 0,
  }).state;
}

const reads = (effects: Effect[]) =>
  effects.flatMap((e) => (e.kind === "read" ? [e.path] : []));

/** Run actions in order, collecting every effect. */
function run(s: AppState, ...actions: Action[]): Result {
  const effects: Effect[] = [];
  for (const a of actions) {
    const r = update(s, a);
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}

const load = (path: string, text: string): Action => ({
  type: "fileLoaded",
  path,
  file: textFile(text),
});
/** The answer to the `read` of `path` among `effects`, as the runner reports it. */
function answer(effects: Effect[], path: string, text: string): Action {
  const read = effects.find((e) => e.kind === "read" && e.path === path);
  if (read?.kind !== "read") throw new Error(`no read of ${path}`);
  return {
    type: "fileLoaded",
    path,
    file: textFile(text),
    ...(read.embed === true ? { embed: true as const } : {}),
  };
}
const keys = (seq: string): Action[] =>
  splitKeys(seq).map((key) => ({ type: "key", key, now: 0 }));

const buffer = (s: AppState, path: string) =>
  Object.values(s.buffers).find((b) => b.path === path);
const shownPath = (s: AppState) => {
  const w = s.windows.byId[s.windows.active];
  return w && s.buffers[w.content.bufferId]?.path;
};

const A = "# A\n\n![[b]]\n\n![[c]]\n\n![[c#Part]]\n";

test("each embed target is read once and opens unlisted", () => {
  const opened = run(indexed(), load("a.md", A));
  expect(reads(opened.effects)).toEqual(["b.md", "c.md"]);
  expect(buffer(opened.state, "a.md")?.embeds).toEqual({
    requested: ["b.md", "c.md"],
    refused: [],
  });
  const typed = run(opened.state, ...keys("j"));
  expect(reads(typed.effects)).toEqual([]);
  const loaded = run(typed.state, load("b.md", "# B\nbody\n"));
  const b = buffer(loaded.state, "b.md");
  expect(b?.listed).toBe(false);
  expect(shownPath(loaded.state)).toBe("a.md");
  expect(buffer(loaded.state, "a.md")?.embeds?.requested).toEqual(["c.md"]);
  expect(loaded.state.recent).toEqual(typed.state.recent);
  expect(reads(loaded.effects)).toEqual([]);
});

test("closing the embedding note evicts its unlisted targets and keeps them out of the session", () => {
  const s = run(indexed(), load("a.md", A), load("b.md", "# B\n")).state;
  expect(snapshotSession(s).buffers).toEqual([{ path: "a.md", view: "live" }]);
  expect(JSON.stringify(snapshotSession(s))).not.toContain("embeds");

  const closed = run(s, ...keys(":bd<CR>")).state;
  expect(buffer(closed, "b.md")).toBeUndefined();
  expect(shownPath(closed)).toBeUndefined();
  expect(snapshotSession(closed).buffers).toEqual([]);

  const opened = run(s, ...keys(":e b.md<CR>")).state;
  expect(shownPath(opened)).toBe("b.md");
  expect(buffer(opened, "b.md")?.listed).toBeUndefined();
  const kept = run(opened, ...keys(":bn<CR>:bd<CR>")).state;
  expect(buffer(kept, "a.md")).toBeUndefined();
  expect(buffer(kept, "b.md")?.listed).toBeUndefined();
  expect(snapshotSession(kept).buffers).toEqual([
    { path: "b.md", view: "live" },
  ]);
});

test("a refused embed is not requested again and shows no error", () => {
  const both = run(
    indexed(),
    load("a.md", "![[d]]\n"),
    load("e.md", "# E\n\n![[d]]\n"),
  );
  expect(reads(both.effects)).toEqual(["d.md"]);
  expect(buffer(both.state, "a.md")?.embeds?.requested).toEqual(["d.md"]);
  expect(buffer(both.state, "e.md")?.embeds?.requested).toEqual(["d.md"]);

  const refused = run(both.state, {
    type: "fileRefused",
    path: "d.md",
    reason: "io",
  }).state;
  for (const p of ["a.md", "e.md"])
    expect(buffer(refused, p)?.embeds).toEqual({
      requested: [],
      refused: ["d.md"],
    });
  expect(refused.notifications.toasts).toEqual([]);
  expect(refused.notifications.message).toBeUndefined();

  const inA = run(refused, ...keys(":bp<CR>"));
  expect(shownPath(inA.state)).toBe("a.md");
  const typed = run(inA.state, ...keys("j"));
  expect(reads([...inA.effects, ...typed.effects])).toEqual([]);
  const host = {
    width: 80,
    rows: 20,
    imageSize: () => undefined,
    cellAspect: 0.5,
  };
  const ctx = markdownViewContext(
    typed.state,
    typed.state.windows.active,
    host,
  );
  expect((ctx as { embed(p: string): unknown }).embed("d.md")).toBe("missing");

  const removed = run(typed.state, ...keys("dd")).state;
  expect(buffer(removed, "a.md")?.embeds).toEqual({
    requested: [],
    refused: [],
  });
  expect(buffer(removed, "e.md")?.embeds?.refused).toEqual(["d.md"]);
  expect(Object.keys(removed).sort()).toEqual(Object.keys(fresh()).sort());
});

test("opening an embed target while it loads shows it when the read answers", () => {
  const s = run(indexed(), load("a.md", A)).state;
  const opening = run(s, ...keys(":e b.md<CR>"));
  expect(reads(opening.effects)).toEqual([]);
  const shown = run(opening.state, load("b.md", "# B\n")).state;
  expect(shownPath(shown)).toBe("b.md");
  expect(buffer(shown, "b.md")?.listed).toBeUndefined();
  expect(buffer(shown, "a.md")?.embeds?.requested).toEqual(["c.md"]);
});

const viewHost = {
  width: 80,
  rows: 20,
  imageSize: () => undefined,
  cellAspect: 0.5,
};

test("an embed target reads as loading until its read answers", () => {
  const s = run(indexed(), load("a.md", A)).state;
  const ctx = markdownViewContext(s, s.windows.active, viewHost) as {
    embed(p: string): unknown;
  };
  expect(ctx.embed("b.md")).toBe("loading");
});

test("a read that answers after its embed was deleted opens nothing", () => {
  const opened = run(indexed(), load("a.md", "# A\n\n![[b]]\n"));
  const removed = run(opened.state, ...keys("Gdd"));
  expect(buffer(removed.state, "a.md")?.text.lineCount).toBe(2);
  const loaded = run(
    removed.state,
    answer(opened.effects, "b.md", "# B\n"),
  ).state;
  expect(shownPath(loaded)).toBe("a.md");
  expect(buffer(loaded, "b.md")).toBeUndefined();
  expect(loaded.recent).toEqual(removed.state.recent);
});

test("a read that answers after its note was closed opens nothing", () => {
  const opened = run(indexed(), load("a.md", "# A\n\n![[b]]\n"));
  const closed = run(opened.state, ...keys(":bd<CR>"));
  expect(shownPath(closed.state)).toBeUndefined();
  const loaded = run(
    closed.state,
    answer(opened.effects, "b.md", "# B\n"),
  ).state;
  expect(shownPath(loaded)).toBeUndefined();
  expect(
    Object.values(loaded.buffers).filter((b) => b.listed !== false),
  ).toEqual([]);
  expect(loaded.notifications.message).toBeUndefined();
});

test("a refused read of a closed note's embed shows no error", () => {
  const opened = run(indexed(), load("a.md", "![[d]]\n"));
  const closed = run(opened.state, ...keys(":bd<CR>")).state;
  const refused = run(closed, {
    type: "fileRefused",
    path: "d.md",
    reason: "io",
    embed: true,
  }).state;
  expect(refused.notifications.message).toBeUndefined();
  expect(refused.notifications.toasts).toEqual([]);
});

test("re-embedding a target whose read is outstanding sends no second read", () => {
  const opened = run(indexed(), load("a.md", "# A\n\n![[b]]\n"));
  expect(reads(opened.effects)).toEqual(["b.md"]);
  const removed = run(opened.state, ...keys("Gdd"));
  const other = run(removed.state, load("e.md", "# E\n\n![[b]]\n"));
  const undone = run(other.state, ...keys(":bp<CR>u"));
  expect(
    reads([...removed.effects, ...other.effects, ...undone.effects]),
  ).toEqual([]);
  const loaded = run(
    undone.state,
    answer(opened.effects, "b.md", "# B\n"),
  ).state;
  expect(buffer(loaded, "b.md")?.listed).toBe(false);
  for (const p of ["a.md", "e.md"])
    expect(buffer(loaded, p)?.embeds?.requested).toEqual([]);
});
