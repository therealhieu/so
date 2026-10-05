import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import type { Pos } from "../kernel/text/pos";
import { splitKeys } from "../kernel/vim/keys";
import { request } from "./lsp";
import type { LspFeature, LspResult, ServerView } from "./lsp-types";
import type { Action, AppState, Effect, Result } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);

const ready = (name: string, features: LspFeature[]): ServerView => ({
  name,
  root: "/ws",
  state: "ready",
  features,
  pullDiagnostics: false,
  completionTriggers: [],
  signatureTriggers: [],
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

/** Keys in Vim notation; every key's effects are collected. */
const keys = (s: AppState, seq: string): Result =>
  run(
    s,
    ...splitKeys(seq).map((key): Action => ({ type: "key", key, now: 5 })),
  );

const TEXT = "fn main() {\n    helper();\n}\n";

/** `src/a.rs` open in the active window with `servers` attached to it in order. */
function attached(servers: ServerView[], path = "src/a.rs"): AppState {
  return run(
    fresh(),
    { type: "fileLoaded", path, file: textFile(TEXT) },
    ...servers.map(
      (view): Action => ({
        type: "lspServer",
        key: `${view.name}@/ws`,
        view,
      }),
    ),
    {
      type: "lspAttached",
      path,
      keys: servers.map((v) => `${v.name}@/ws`),
    },
  ).state;
}

const at = (line: number, col: number): Pos => ({ line, col });
const result = (id: number, r: LspResult): Action => ({
  type: "lspResult",
  id,
  result: r,
});
const hover = (s: AppState): Result =>
  request(s, "hover", { kind: "hover", pos: at(1, 4) });
const messageOf = (s: AppState) => s.notifications.message?.text;
const activePath = (s: AppState) => {
  const w = s.windows.byId[s.windows.active];
  return w && s.buffers[w.content.bufferId]?.path;
};
const cursorOf = (s: AppState) =>
  s.windows.byId[s.windows.active]?.content.cursor;
const lspEffects = (effects: Effect[]) =>
  effects.filter((e) => e.kind === "lsp");

test("a request goes to the first attached server that supports the feature", () => {
  const s = attached([ready("a", ["definition"]), ready("b", ["hover"])]);
  const r = hover(s);
  expect(r.effects).toEqual([
    { kind: "startTimer", id: "lsp:1", ms: 5000 },
    {
      kind: "lsp",
      id: 1,
      key: "b@/ws",
      path: "src/a.rs",
      op: { kind: "hover", pos: at(1, 4) },
    },
  ]);
  expect(r.state.lsp.pending[1]).toMatchObject({
    feature: "hover",
    key: "b@/ws",
    path: "src/a.rs",
    auto: false,
  });
  expect(r.state.lsp.nextId).toBe(2);
});

test("a server that is still starting is passed over", () => {
  const s = attached([
    { ...ready("a", ["hover"]), state: "starting" },
    ready("b", ["hover"]),
  ]);
  expect(lspEffects(hover(s).effects)).toMatchObject([{ key: "b@/ws" }]);
});

test("a feature no attached server supports explains why", () => {
  const r = hover(attached([ready("a", ["definition"])]));
  expect(messageOf(r.state)).toBe("hover: not supported by a");
  expect(r.effects).toEqual([]);
  expect(r.state.lsp.pending).toEqual({});
});

test("a file without an attached server says so", () => {
  const r = hover(attached([]));
  expect(messageOf(r.state)).toBe("no language server for rust");
  expect(r.effects).toEqual([]);
});

test("a hover result shows a float at the requested position", () => {
  const sent = hover(attached([ready("a", ["hover"])]));
  const r = run(
    sent.state,
    result(1, { kind: "hover", text: "fn helper()\n\nDocs" }),
  );
  expect(r.state.lsp.float).toEqual({
    kind: "hover",
    window: sent.state.windows.active,
    at: at(1, 4),
    lines: ["fn helper()", "", "Docs"],
  });
  expect(r.state.lsp.pending).toEqual({});
  expect(r.effects).toContainEqual({ kind: "cancelTimer", id: "lsp:1" });
});

test("a newer hover replaces and cancels the older one", () => {
  const first = hover(attached([ready("a", ["hover"])]));
  const second = request(
    first.state,
    "hover",
    { kind: "hover", pos: at(0, 3) },
    { replace: true },
  );
  expect(second.effects).toContainEqual({
    kind: "lspCancel",
    id: 1,
    key: "a@/ws",
  });
  expect(Object.keys(second.state.lsp.pending)).toEqual(["2"]);
});

test("a result for an older buffer version changes nothing", () => {
  const sent = hover(attached([ready("a", ["hover"])]));
  const edited = keys(sent.state, "x").state;
  const r = run(edited, result(1, { kind: "hover", text: "fn helper()" }));
  expect(r.state.lsp.float).toBeUndefined();
  expect(r.state.lsp.pending).toEqual({});
  expect(messageOf(r.state)).toBeUndefined();
});

test("a result nobody waits for changes nothing", () => {
  const s = attached([ready("a", ["hover"])]);
  const r = run(s, result(7, { kind: "hover", text: "late" }));
  expect(r.state).toBe(s);
  expect(r.effects).toEqual([]);
});

test("quiet errors show nothing", () => {
  const sent = hover(attached([ready("a", ["hover"])]));
  const r = run(
    sent.state,
    result(1, { kind: "error", message: "content modified", quiet: true }),
  );
  expect(messageOf(r.state)).toBeUndefined();
  expect(r.state.lsp.pending[1]).toBeUndefined();
});

test("an error for a user request is shown with its feature", () => {
  const sent = hover(attached([ready("a", ["hover"])]));
  const r = run(sent.state, result(1, { kind: "error", message: "boom" }));
  expect(r.state.notifications.message).toEqual({
    text: "hover: boom",
    level: "error",
  });
});

test("an automatic request has no timeout and fails silently", () => {
  const sent = request(
    attached([ready("a", ["signature"])]),
    "signature",
    { kind: "signature", pos: at(1, 10) },
    { auto: true },
  );
  expect(sent.effects.map((e) => e.kind)).toEqual(["lsp"]);
  const r = run(sent.state, result(1, { kind: "error", message: "boom" }));
  expect(messageOf(r.state)).toBeUndefined();
  expect(r.state.lsp.pending).toEqual({});
});

test("a pinned request goes to its server even when another comes first", () => {
  const s = attached([
    ready("a", ["executeCommand"]),
    ready("b", ["executeCommand"]),
  ]);
  const r = request(
    s,
    "executeCommand",
    { kind: "executeCommand", command: { id: "x" } },
    { key: "b@/ws", auto: true },
  );
  expect(lspEffects(r.effects)).toMatchObject([{ key: "b@/ws" }]);
});

test("one definition jumps and <C-o> returns", () => {
  const s = keys(attached([ready("a", ["definition"])]), "j4l").state;
  expect(cursorOf(s)).toEqual(at(1, 4));
  const sent = request(s, "definition", {
    kind: "definition",
    pos: at(1, 4),
  });
  const target = { start: at(2, 0), end: at(2, 6) };
  const jumped = run(
    sent.state,
    result(1, {
      kind: "locations",
      items: [{ path: "src/b.rs", range: target }],
      outside: 0,
    }),
  );
  expect(jumped.effects).toContainEqual({ kind: "read", path: "src/b.rs" });
  const loaded = run(jumped.state, {
    type: "fileLoaded",
    path: "src/b.rs",
    file: textFile("a\nb\nfn helper() {}\n"),
  }).state;
  expect(activePath(loaded)).toBe("src/b.rs");
  expect(cursorOf(loaded)).toEqual(at(2, 0));
  const back = keys(loaded, "<C-o>").state;
  expect(activePath(back)).toBe("src/a.rs");
  expect(cursorOf(back)).toEqual(at(1, 4));
});

test("a definition only outside the workspace is reported, not opened", () => {
  const sent = request(attached([ready("a", ["definition"])]), "definition", {
    kind: "definition",
    pos: at(1, 4),
  });
  const r = run(
    sent.state,
    result(1, { kind: "locations", items: [], outside: 1 }),
  );
  expect(messageOf(r.state)).toBe("definition is outside the workspace");
  expect(r.effects.filter((e) => e.kind === "read")).toEqual([]);
});

test("several locations open a picker and outside ones are counted", () => {
  const sent = request(attached([ready("a", ["references"])]), "references", {
    kind: "references",
    pos: at(1, 4),
  });
  const range = { start: at(1, 4), end: at(1, 10) };
  const items = ["src/a.rs", "src/b.rs", "src/c.rs"].map((path) => ({
    path,
    range,
  }));
  const r = run(
    sent.state,
    result(1, { kind: "locations", items, outside: 2 }),
  );
  expect(r.state.lsp.list).toEqual({ title: "References", items });
  expect(messageOf(r.state)).toContain("2 outside the workspace");
});

test("a failed server toasts once and an unavailable one never", () => {
  const s = attached([ready("a", ["hover"])]);
  const failed: ServerView = {
    ...ready("a", ["hover"]),
    state: "failed",
    reason: "exit code 1",
  };
  const r = run(
    s,
    { type: "lspServer", key: "a@/ws", view: failed },
    { type: "lspServer", key: "a@/ws", view: failed },
    {
      type: "lspServer",
      key: "b@/ws",
      view: { ...ready("b", []), state: "unavailable", reason: "no component" },
    },
    {
      type: "lspServer",
      key: "c@/ws",
      view: { ...ready("c", []), state: "missing" },
    },
  );
  expect(r.state.notifications.toasts.map((t) => t.text)).toEqual([
    "a stopped: exit code 1",
  ]);
  expect(r.state.lsp.attached["src/a.rs"]).toBeUndefined();
  expect(r.state.lsp.servers["b@/ws"]?.state).toBe("unavailable");
});

test("a stopped server is forgotten with its attachments and diagnostics", () => {
  const s = attached([ready("a", ["hover"]), ready("b", ["hover"])]);
  const r = run(s, { type: "lspServer", key: "a@/ws", view: undefined });
  expect(r.state.lsp.servers["a@/ws"]).toBeUndefined();
  expect(r.state.lsp.attached["src/a.rs"]).toEqual(["b@/ws"]);
});

test("server messages become toasts", () => {
  const s = attached([ready("a", [])]);
  const r = run(
    s,
    { type: "lspMessage", key: "a@/ws", level: "error", text: "bad config" },
    { type: "lspMessage", key: "a@/ws", level: "warning", text: "slow" },
  );
  expect(
    r.state.notifications.toasts.map(({ level, text }) => ({ level, text })),
  ).toEqual([
    { level: "error", text: "a: bad config" },
    { level: "info", text: "a: slow" },
  ]);
});

test("a user request that times out reports it and cancels", () => {
  const sent = hover(attached([ready("a", ["hover"])]));
  const r = run(sent.state, { type: "timer", id: "lsp:1", now: 5000 });
  expect(messageOf(r.state)).toBe("hover: timed out");
  expect(r.effects).toEqual([{ kind: "lspCancel", id: 1, key: "a@/ws" }]);
  expect(r.state.lsp.pending).toEqual({});
  const late = run(r.state, result(1, { kind: "hover", text: "late" }));
  expect(late.state.lsp.float).toBeUndefined();
});
