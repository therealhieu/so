import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import type { Pos } from "../kernel/text/pos";
import { splitKeys } from "../kernel/vim/keys";
import { fullText } from "./buffers";
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

const ACCEPTS: LspFeature[] = [
  "completion",
  "completionResolve",
  "executeCommand",
  "signature",
];

/** "fo" typed on a new line 1, answered with `items`. */
function offered(items: CodeCompletionItem[]): AppState {
  const typed = keys(open(ACCEPTS), "ofo").state;
  const asked = run(typed, { type: "timer", id: "completion", now: 200 });
  return run(asked.state, {
    type: "lspResult",
    id: 1,
    result: { kind: "completion", items, incomplete: false },
  }).state;
}

const textOf = (s: AppState) => {
  const b = Object.values(s.buffers).find((x) => x.path === "src/a.ts");
  return b === undefined ? undefined : fullText(b.text);
};
const cursorOf = (s: AppState) =>
  s.windows.byId[s.windows.active]?.content.cursor;
const IMPORT = "import { format } from 'fmt';\n";
const range = (line: number, from: number, to: number) => ({
  start: at(line, from),
  end: at(line, to),
});

test("an auto-import completion is one undo step", () => {
  const s = offered([
    item("format", {
      additional: [{ range: range(0, 0, 0), text: IMPORT }],
    }),
  ]);
  const accepted = keys(s, "<CR>").state;
  expect(accepted.overlay.kind).toBe("none");
  expect(textOf(accepted)).toBe(
    "import { format } from 'fmt';\nconst value = obj\nformat\nlet n = 1;",
  );
  expect(cursorOf(accepted)).toEqual(at(2, 6));
  expect(textOf(keys(accepted, "<Esc>u").state)).toBe(TEXT);
});

test("a resolved item places the cursor at its stop and then runs its command", () => {
  const s = offered([
    item("log", {
      filterText: "fo",
      edit: { range: range(1, 0, 2), text: "console.log()" },
      cursor: 12,
      command: { command: "after" },
    }),
  ]);
  const r = keys(s, "<Tab>");
  expect(textOf(r.state)).toBe("const value = obj\nconsole.log()\nlet n = 1;");
  expect(cursorOf(r.state)).toEqual(at(1, 12));
  const last = r.effects.at(-1);
  expect(last).toMatchObject({
    kind: "lsp",
    key: "a@/ws",
    op: { kind: "executeCommand", command: { command: "after" } },
  });
  const id = last?.kind === "lsp" ? last.id : -1;
  expect(r.state.lsp.pending[id]?.auto).toBe(true);
  expect(r.effects).not.toContainEqual(
    expect.objectContaining({ kind: "startTimer", id: `lsp:${id}` }),
  );
});

test("a slow resolve applies the item once without waiting", () => {
  const unresolved = item("format", { resolved: false, data: { n: 1 } });
  const s = offered([unresolved]);
  const accepted = keys(s, "<CR>");
  expect(accepted.state.overlay.kind).toBe("none");
  expect(textOf(accepted.state)).toBe("const value = obj\nfo\nlet n = 1;");
  expect(lspOps(accepted.effects)).toEqual([
    { kind: "resolveCompletion", item: unresolved },
  ]);
  expect(accepted.effects).toContainEqual({
    kind: "startTimer",
    id: "lspResolve",
    ms: 500,
  });

  const timedOut = run(accepted.state, {
    type: "timer",
    id: "lspResolve",
    now: 700,
  });
  expect(textOf(timedOut.state)).toBe("const value = obj\nformat\nlet n = 1;");
  expect(timedOut.effects).toContainEqual({
    kind: "lspCancel",
    id: 2,
    key: "a@/ws",
  });
  expect(timedOut.state.lsp.accept).toBeUndefined();
  const late = run(timedOut.state, {
    type: "lspResult",
    id: 2,
    result: {
      kind: "completionItem",
      item: {
        ...unresolved,
        resolved: true,
        additional: [{ range: range(0, 0, 0), text: IMPORT }],
      },
    },
  });
  expect(textOf(late.state)).toBe(textOf(timedOut.state));

  const resolved = run(accepted.state, {
    type: "lspResult",
    id: 2,
    result: {
      kind: "completionItem",
      item: {
        ...unresolved,
        resolved: true,
        additional: [{ range: range(0, 0, 0), text: IMPORT }],
      },
    },
  });
  expect(textOf(resolved.state)).toBe(
    "import { format } from 'fmt';\nconst value = obj\nformat\nlet n = 1;",
  );
  expect(resolved.effects).toContainEqual({
    kind: "cancelTimer",
    id: "lspResolve",
  });
  const after = run(resolved.state, {
    type: "timer",
    id: "lspResolve",
    now: 700,
  });
  expect(textOf(after.state)).toBe(textOf(resolved.state));

  const moved = keys(accepted.state, "x").state;
  const stale = run(moved, {
    type: "lspResult",
    id: 2,
    result: { kind: "completionItem", item: { ...unresolved, resolved: true } },
  });
  const expired = run(stale.state, {
    type: "timer",
    id: "lspResolve",
    now: 700,
  });
  expect(textOf(expired.state)).toBe("const value = obj\nfox\nlet n = 1;");
  expect(expired.state.lsp.accept).toBeUndefined();
});

test("a signature trigger character asks for signature help", () => {
  const r = keys(open(ACCEPTS), "A(");
  expect(lspOps(r.effects)).toEqual([{ kind: "signature", pos: at(0, 18) }]);
  expect(r.state.lsp.pending[1]?.auto).toBe(true);
  expect(lspOps(keys(open(["completion"]), "A(").effects)).toEqual([]);
});
