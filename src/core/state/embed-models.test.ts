import { expect, test } from "bun:test";
import { indexed, TASK_NOTES } from "../../../test/support/bases";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { isBaseEmbedModel } from "../features/bases/embed";
import { splitKeys } from "../kernel/vim/keys";
import type { PreviewCtx } from "../lang/markdown/live-preview";
import { activeBuffer, activeWindow } from "./buffers";
import { EmbedModelRegistry } from "./embed-models";
import { markdownViewContextFor } from "./markdown-view";
import type { Action, AppState, Effect, Result } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);

const BASE = `views:
  - type: table
    name: All tasks
    order: [file.name, status]
  - type: table
    name: Board
    order: [file.name]
`;
const NOTE = "# Today\n\n![[tasks.base#Board]]\n\n![[data.csv]]\n";

function run(s: AppState, ...actions: Action[]): Result {
  const effects: Effect[] = [];
  for (const a of actions) {
    const r = update(s, a);
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}

const keys = (seq: string): Action[] =>
  splitKeys(seq).map((key) => ({ type: "key", key, now: 0 }));
const load = (path: string, text: string, embed = false): Action => ({
  type: "fileLoaded",
  path,
  file: textFile(text),
  ...(embed ? { embed: true as const } : {}),
});
const host = {
  width: 80,
  rows: 20,
  imageSize: () => undefined,
  cellAspect: 0.5,
};
const ctxOf = (s: AppState) =>
  markdownViewContextFor(reg)(s, s.windows.active, host) as PreviewCtx;

/** The note open with the task notes, the base, and a CSV file indexed. */
const opened = () =>
  run(
    fresh(),
    indexed(TASK_NOTES, ["today.md", "tasks.base", "data.csv"]),
    load("today.md", NOTE),
  );

test("only file types with an embed model are loaded as embeds", () => {
  const { effects } = opened();
  expect(effects.filter((e) => e.kind === "read")).toEqual([
    { kind: "read", path: "tasks.base", embed: true },
  ]);
});

test("an embedded base answers loading, then a model", () => {
  const { state } = opened();
  expect(ctxOf(state).embedModel("tasks.base", "#Board")).toBe("loading");
  expect(ctxOf(state).embedModel("data.csv")).toBe("missing");
  const loaded = run(state, load("tasks.base", BASE, true)).state;
  const model = ctxOf(loaded).embedModel("tasks.base", "#Board");
  expect(isBaseEmbedModel(model)).toBe(true);
  expect(isBaseEmbedModel(model) && model.view).toBe("Board");
  expect(ctxOf(loaded).embedModel("tasks.base", "#Board")).toBe(model);
  expect(activeBuffer(loaded)?.path).toBe("today.md");
});

test("a refused base embed is missing", () => {
  const { state } = opened();
  const refused = run(state, {
    type: "fileRefused",
    path: "tasks.base",
    reason: "io",
    embed: true,
  }).state;
  expect(ctxOf(refused).embedModel("tasks.base", "#Board")).toBe("missing");
});

test("Enter on a base embed opens the base at that view", () => {
  const { state } = opened();
  const loaded = run(state, load("tasks.base", BASE, true)).state;
  const entered = run(loaded, ...keys("jj<CR>")).state;
  expect(activeBuffer(entered)?.path).toBe("tasks.base");
  const w = activeWindow(entered);
  expect(w?.content.editor).toBe("base");
  expect(w?.content.kindState).toMatchObject({ view: "Board" });
  expect(w?.content.subpath).toBeUndefined();
});

test("Enter on a base embed still loading opens the base at that view when it loads", () => {
  const { state } = opened();
  const entered = run(state, ...keys("jj<CR>"));
  expect(entered.effects.filter((e) => e.kind === "read")).toEqual([]);
  const shown = run(entered.state, load("tasks.base", BASE, true)).state;
  expect(activeBuffer(shown)?.path).toBe("tasks.base");
  const w = activeWindow(shown);
  expect(w?.content.kindState).toMatchObject({ view: "Board" });
});

test("an embed model registry builds by file type and refuses a second builder", () => {
  const r = new EmbedModelRegistry();
  r.register("csv", (_s, path, subpath) => `${path}${subpath ?? ""}`);
  expect(r.has("csv")).toBe(true);
  expect(r.has("markdown")).toBe(false);
  expect(r.build("csv", fresh(), "a.csv", "#x", reg)).toBe("a.csv#x");
  expect(r.build("markdown", fresh(), "a.md", undefined, reg)).toBe("missing");
  expect(() => r.register("csv", () => "x")).toThrow();
});
