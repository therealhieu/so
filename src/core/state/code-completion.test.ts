import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import type { Pos } from "../kernel/text/pos";
import { splitKeys } from "../kernel/vim/keys";
import type {
  CodeCompletionItem,
  LspFeature,
  LspResult,
  ServerView,
} from "./lsp-types";
import type { Action, AppState, Effect, Result } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);

const ready = (features: LspFeature[]): ServerView => ({
  name: "a",
  root: "/ws",
  state: "ready",
  features,
  pullDiagnostics: false,
  completionTriggers: ["."],
  signatureTriggers: ["("],
});

/** Dispatch `actions` in order, collecting every effect. */
function run(s: AppState, ...actions: Action[]): Result {
  let r: Result = { state: s, effects: [] };
  for (const a of actions) {
    const next = update(r.state, a);
    r = { state: next.state, effects: [...r.effects, ...next.effects] };
  }
  return r;
}
const keys = (s: AppState, seq: string): Result =>
  run(
    s,
    ...splitKeys(seq).map((key): Action => ({ type: "key", key, now: 5 })),
  );

const at = (line: number, col: number): Pos => ({ line, col });
const TEXT = "const value = obj\nlet n = 1;";

/** `src/a.ts` holding `TEXT`, with completion server `a` attached. */
function open(features: LspFeature[] = ["completion"]): AppState {
  return run(
    fresh(),
    { type: "fileLoaded", path: "src/a.ts", file: textFile(`${TEXT}\n`) },
    { type: "lspServer", key: "a@/ws", view: ready(features) },
    { type: "lspAttached", path: "src/a.ts", keys: ["a@/ws"] },
  ).state;
}

const item = (label: string, o: Partial<CodeCompletionItem> = {}) => ({
  label,
  filterText: label,
  sortText: label,
  additional: [],
  resolved: true,
  data: null,
  ...o,
});
const answer = (id: number, labels: string[], incomplete = false): Action => ({
  type: "lspResult",
  id,
  result: {
    kind: "completion",
    items: labels.map((l) => item(l)),
    incomplete,
  } satisfies LspResult,
});
const lspOps = (effects: Effect[]) =>
  effects.flatMap((e) => (e.kind === "lsp" ? [e.op] : []));
const popup = (s: AppState) =>
  s.overlay.kind === "completion" ? s.overlay.completion : undefined;
const labels = (s: AppState) => popup(s)?.items.map((i) => i.label);
const completionTimers = (effects: Effect[]) =>
  effects.filter(
    (e) =>
      (e.kind === "startTimer" || e.kind === "cancelTimer") &&
      e.id === "completion",
  );

test("a trigger character requests completion and an identifier waits for a pause", () => {
  const dot = keys(open(), "A.");
  expect(lspOps(dot.effects)).toEqual([
    { kind: "completion", pos: at(0, 18), trigger: "." },
  ]);
  expect(dot.effects).not.toContainEqual(
    expect.objectContaining({ kind: "startTimer", id: "lsp:1" }),
  );

  const typed = keys(open(), "o fo");
  expect(lspOps(typed.effects)).toEqual([]);
  expect(typed.effects).toContainEqual({
    kind: "startTimer",
    id: "completion",
    ms: 150,
  });
  const paused = run(typed.state, {
    type: "timer",
    id: "completion",
    now: 200,
  });
  expect(lspOps(paused.effects)).toEqual([
    { kind: "completion", pos: at(1, 1) },
  ]);
  const shown = run(paused.state, answer(1, ["format", "fold", "bar"]));
  expect(popup(shown.state)).toMatchObject({
    mode: "code",
    anchor: at(1, 1),
    query: "fo",
    code: { key: "a@/ws", incomplete: false },
  });
  expect(labels(shown.state)).toEqual(["fold", "format"]);
});

test("typing narrows a complete list without a new request", () => {
  const listed = run(
    keys(open(), "A.").state,
    answer(1, ["map", "max", "filter"]),
  );
  expect(labels(listed.state)).toEqual(["filter", "map", "max"]);
  const narrowed = keys(listed.state, "ma");
  expect(lspOps(narrowed.effects)).toEqual([]);
  expect(completionTimers(narrowed.effects)).toEqual([]);
  expect(labels(narrowed.state)).toEqual(["map", "max"]);
  expect(popup(narrowed.state)?.query).toBe("ma");
  expect(labels(keys(narrowed.state, "<BS><BS>").state)).toEqual([
    "filter",
    "map",
    "max",
  ]);

  const partial = run(keys(open(), "A.").state, answer(1, ["map"], true));
  const again = keys(partial.state, "m");
  expect(lspOps(again.effects)).toEqual([
    { kind: "completion", pos: at(0, 18) },
  ]);
  expect(labels(again.state)).toEqual(["map"]);
  expect(keys(again.state, "a").effects).toContainEqual({
    kind: "lspCancel",
    id: 2,
    key: "a@/ws",
  });
});

test("leaving the word or Insert closes the popup", () => {
  const listed = run(keys(open(), "A.").state, answer(1, ["map"])).state;
  const spaced = keys(listed, " ");
  expect(spaced.state.overlay.kind).toBe("none");
  expect(completionTimers(spaced.effects)).toEqual([
    { kind: "cancelTimer", id: "completion" },
  ]);
  const left = keys(listed, "<Esc>");
  expect(left.state.overlay.kind).toBe("none");
  expect(completionTimers(left.effects)).toEqual([
    { kind: "cancelTimer", id: "completion" },
  ]);
});

test("a stale completion result opens nothing and link completion is unchanged", () => {
  const sent = keys(open(), "A.").state;
  const moved = keys(sent, "x");
  const late = run(moved.state, answer(1, ["map"]));
  expect(late.state.overlay.kind).toBe("none");

  const elsewhere = keys(keys(open(), "o fo").state, "<Esc>").state;
  const fired = run(elsewhere, { type: "timer", id: "completion", now: 200 });
  expect(lspOps(fired.effects)).toEqual([]);

  const note = run(fresh(), {
    type: "fileLoaded",
    path: "n.md",
    file: textFile("# n\n"),
  }).state;
  const linking = keys(note, "o[[");
  expect(popup(linking.state)?.mode).toBe("notes");
  expect(lspOps(linking.effects)).toEqual([]);
  expect(completionTimers(linking.effects)).toEqual([]);
});

test("a manual completion with nothing to offer says so", () => {
  const asked = keys(open(), "A<C-Space>");
  expect(lspOps(asked.effects)).toEqual([
    { kind: "completion", pos: at(0, 17) },
  ]);
  const empty = run(asked.state, answer(1, []));
  expect(empty.state.overlay.kind).toBe("none");
  expect(empty.state.notifications.message?.text).toBe(
    "completion: nothing found",
  );
  const shown = run(asked.state, answer(1, ["object", "obscure"]));
  expect(popup(shown.state)).toMatchObject({ anchor: at(0, 14), query: "obj" });
  expect(labels(shown.state)).toEqual(["object"]);
});
