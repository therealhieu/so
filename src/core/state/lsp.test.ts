import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import type { Pos } from "../kernel/text/pos";
import type { Diagnostic } from "../kernel/view/diagnostics";
import { splitKeys } from "../kernel/vim/keys";
import { runCommand } from "./commands";
import { keymapFor } from "./keymap";
import { cursorDiagnostic, request } from "./lsp";
import { lspBindings } from "./lsp-commands";
import type { LspFeature, LspResult, ServerView } from "./lsp-types";
import { openPicker } from "./picker";
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
const pickerOf = (s: AppState) =>
  s.overlay.kind === "picker" ? s.overlay.picker : undefined;
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

test("a request while every server is still starting says so", () => {
  const r = hover(attached([{ ...ready("a", []), state: "starting" }]));
  expect(messageOf(r.state)).toBe("hover: a is starting");
  expect(r.effects).toEqual([]);
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
  const p = pickerOf(r.state);
  expect(p?.source).toBe("lspLocations");
  expect(p?.items.map((i) => i.label)).toEqual([
    "src/a.rs:2:5",
    "src/b.rs:2:5",
    "src/c.rs:2:5",
  ]);
  const opened = keys(r.state, "<C-n><C-n><CR>");
  expect(opened.state.overlay.kind).toBe("none");
  expect(opened.effects).toContainEqual({ kind: "read", path: "src/c.rs" });
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

const diag = (
  line: number,
  col: number,
  severity: Diagnostic["severity"],
  message: string,
  source?: string,
): Diagnostic => ({
  range: { start: at(line, col), end: at(line, col + 6) },
  severity,
  message,
  ...(source === undefined ? {} : { source }),
});
const publish = (
  key: string,
  items: Diagnostic[],
  source: "push" | "pull" = "push",
  path = "src/a.rs",
): Action => ({ type: "lspDiagnostics", key, path, source, items });

test("diagnostics from two servers are both shown", () => {
  const s = attached([ready("a", []), ready("b", [])]);
  const r = run(
    s,
    publish("a@/ws", [diag(1, 4, 1, "mismatched types")]),
    publish("b@/ws", [diag(0, 3, 2, "unused")]),
  );
  expect(r.state.lsp.shown["src/a.rs"]).toHaveLength(2);
  expect(r.effects).toEqual([]);
});

test("one server's pushed and pulled lists are kept apart", () => {
  const s = attached([ready("a", [])]);
  const both = run(
    s,
    publish("a@/ws", [diag(1, 4, 2, "cargo check")]),
    publish("a@/ws", [diag(0, 3, 1, "native")], "pull"),
  ).state;
  expect(both.lsp.shown["src/a.rs"]?.map((d) => d.message)).toEqual([
    "cargo check",
    "native",
  ]);
  const cleared = run(both, publish("a@/ws", [], "pull")).state;
  expect(cleared.lsp.diagnostics["src/a.rs"]).toEqual({
    "a@/ws": { push: [diag(1, 4, 2, "cargo check")] },
  });
  const gone = run(cleared, publish("a@/ws", [])).state;
  expect(gone.lsp.diagnostics).toEqual({});
  expect(gone.lsp.shown).toEqual({});
});

test("diagnostics published in insert mode show after leaving insert mode", () => {
  const s = attached([ready("a", [])]);
  const before = run(s, publish("a@/ws", [diag(1, 4, 1, "old")])).state;
  const typing = keys(before, "i").state;
  const published = run(typing, publish("a@/ws", [diag(1, 4, 1, "new")])).state;
  expect(published.lsp.shown["src/a.rs"]?.map((d) => d.message)).toEqual([
    "old",
  ]);
  const left = keys(published, "<Esc>").state;
  expect(left.lsp.shown["src/a.rs"]?.map((d) => d.message)).toEqual(["new"]);
});

test("diagnostics of another file still show while inserting", () => {
  const typing = keys(attached([ready("a", [])]), "i").state;
  const r = run(
    typing,
    publish("a@/ws", [diag(0, 0, 1, "elsewhere")], "push", "src/b.rs"),
  ).state;
  expect(r.lsp.shown["src/b.rs"]).toHaveLength(1);
});

test("the command line diagnostic is the one under the cursor", () => {
  const s = keys(attached([ready("a", [])]), "j4l").state;
  const r = run(
    s,
    publish("a@/ws", [
      diag(1, 2, 2, "unused", "lint"),
      diag(1, 4, 1, "msg\nmore detail", "srv"),
      diag(0, 0, 1, "other line"),
    ]),
  ).state;
  expect(cursorDiagnostic(r)).toEqual({ severity: 1, text: "srv: msg" });
  const away = keys(r, "j").state;
  expect(cursorDiagnostic(away)).toBeUndefined();
});

test("a diagnostic ending at the start of a line does not cover that line", () => {
  const s = keys(attached([ready("a", [])]), "j").state;
  const range = (sl: number, sc: number, el: number, ec: number) => ({
    range: { start: at(sl, sc), end: at(el, ec) },
    severity: 1 as const,
    message: "m",
  });
  const wholeLine = run(s, publish("a@/ws", [range(0, 0, 1, 0)])).state;
  expect(cursorDiagnostic(wholeLine)).toBeUndefined();
  const empty = run(
    keys(s, "2l").state,
    publish("a@/ws", [range(1, 2, 1, 2)]),
  ).state;
  expect(cursorDiagnostic(empty)).toEqual({ severity: 1, text: "m" });
});

test("hover closes on cursor move and signature help on leaving insert mode", () => {
  const sent = hover(attached([ready("a", ["hover", "signature"])]));
  const shown = run(
    sent.state,
    result(1, { kind: "hover", text: "doc" }),
  ).state;
  expect(shown.lsp.float?.kind).toBe("hover");
  expect(keys(shown, "l").state.lsp.float).toBeUndefined();

  const typing = keys(shown, "i").state;
  const asked = request(
    typing,
    "signature",
    { kind: "signature", pos: at(0, 0) },
    { auto: true },
  );
  const signature = run(
    asked.state,
    result(2, {
      kind: "signature",
      label: "fn helper(a: u8)",
      active: { start: 10, end: 15 },
    }),
  ).state;
  expect(signature.lsp.float).toMatchObject({
    kind: "signature",
    active: { line: 0, start: 10, end: 15 },
  });
  const typed = keys(signature, "x").state;
  expect(typed.lsp.float?.kind).toBe("signature");
  expect(keys(typed, "<Esc>").state.lsp.float).toBeUndefined();
});

test("hover closes when the mode changes", () => {
  const sent = hover(attached([ready("a", ["hover"])]));
  const shown = run(
    sent.state,
    result(1, { kind: "hover", text: "doc" }),
  ).state;
  expect(shown.lsp.float?.kind).toBe("hover");
  expect(keys(shown, "i").state.lsp.float).toBeUndefined();
  expect(keys(shown, "v").state.lsp.float).toBeUndefined();
});

test("<Esc> in normal mode closes a hover float without moving", () => {
  const s = keys(attached([ready("a", ["hover"])]), "j4l").state;
  const sent = hover(s);
  const shown = run(
    sent.state,
    result(1, { kind: "hover", text: "doc" }),
  ).state;
  expect(shown.lsp.float).toBeDefined();
  const r = keys(shown, "<Esc>").state;
  expect(r.lsp.float).toBeUndefined();
  expect(cursorOf(r)).toEqual(cursorOf(shown));
  expect(r.vim.mode).toBe(shown.vim.mode);
});

test("an action that touches neither diagnostics nor floats keeps the language state", () => {
  const s = run(
    attached([ready("a", [])]),
    publish("a@/ws", [diag(1, 4, 1, "msg")]),
  ).state;
  expect(keys(s, "j").state.lsp).toBe(s.lsp);
  expect(run(s, { type: "resize", cols: 120, rows: 40 }).state.lsp).toBe(s.lsp);
});

test("document symbols open a picker indented by depth", () => {
  const sent = request(attached([ready("a", ["symbols"])]), "symbols", {
    kind: "symbols",
  });
  const range = (line: number) => ({ start: at(line, 3), end: at(line, 7) });
  const r = run(
    sent.state,
    result(1, {
      kind: "symbols",
      items: [
        { name: "Server", kind: "struct", range: range(0), depth: 0 },
        { name: "start", kind: "method", range: range(1), depth: 1 },
      ],
    }),
  );
  const p = pickerOf(r.state);
  expect(p?.source).toBe("lspSymbols");
  expect(p?.items.map((i) => [i.label, i.detail])).toEqual([
    ["Server", "struct"],
    ["  start", "method"],
  ]);
  const chosen = keys(r.state, "<C-n><CR>").state;
  expect(chosen.overlay.kind).toBe("none");
  expect(cursorOf(chosen)).toEqual(at(1, 3));
});

test("the server list shows missing binaries and unavailable servers with their reason", () => {
  const s = attached([ready("rust-analyzer", [])]);
  const r = run(
    s,
    {
      type: "lspServer",
      key: "rust-analyzer@/ws",
      view: { ...ready("rust-analyzer", []), state: "missing" },
    },
    {
      type: "lspServer",
      key: "gopls@/ws",
      view: {
        ...ready("gopls", []),
        state: "unavailable",
        reason: "error: component not installed",
      },
    },
    {
      type: "lspServer",
      key: "clangd@",
      view: (({ root: _, ...v }) => v)(ready("clangd", [])),
    },
  );
  const items = pickerOf(
    openPicker({ state: r.state, now: 0, reg }, "lspInfo").state,
  )?.items;
  const row = (name: string) =>
    items?.find((i) => i.label.startsWith(`${name} `));
  expect(row("rust-analyzer")).toMatchObject({
    label: "rust-analyzer · /ws · missing",
    detail: "not on PATH",
  });
  expect(row("gopls")).toMatchObject({
    label: "gopls · /ws · unavailable",
    detail: "unavailable: error: component not installed",
  });
  expect(row("clangd")).toMatchObject({
    label: "clangd · (no project) · ready",
    detail: "clangd",
  });
  expect(row("tsc")?.label).toBe("tsc · not started");
});

test("the diagnostics picker lists every diagnostic by severity, path, and position", () => {
  const s = run(
    attached([ready("a", []), ready("b", [])]),
    publish("a@/ws", [diag(2, 1, 2, "late warning"), diag(0, 3, 1, "error")]),
    publish("b@/ws", [diag(1, 0, 1, "first error")], "push", "src/z.rs"),
    publish("b@/ws", [diag(1, 0, 2, "warning in b")], "push", "src/b.rs"),
  ).state;
  const opened = openPicker({ state: s, now: 0, reg }, "diagnostics").state;
  const p = pickerOf(opened);
  expect(p?.source).toBe("diagnostics");
  expect(p?.items.map((i) => i.label)).toEqual([
    "E src/a.rs:1:4 error",
    "E src/z.rs:2:1 first error",
    "W src/a.rs:3:2 late warning",
    "W src/b.rs:2:1 warning in b",
  ]);
  const chosen = keys(opened, "<C-n><CR>");
  expect(chosen.effects).toContainEqual({ kind: "read", path: "src/z.rs" });
  const loaded = run(chosen.state, {
    type: "fileLoaded",
    path: "src/z.rs",
    file: textFile("one\ntwo\n"),
  }).state;
  expect(activePath(loaded)).toBe("src/z.rs");
  expect(cursorOf(loaded)).toEqual(at(1, 0));
});

test("each language feature command sends its operation", () => {
  const all: LspFeature[] = [
    "hover",
    "definition",
    "implementation",
    "references",
    "symbols",
    "prepareRename",
    "rename",
    "codeActions",
    "signature",
    "completion",
    "format",
  ];
  const s = attached([ready("a", all)]);
  const table: [string, string][] = [
    ["lsp.hover", "hover"],
    ["lsp.definition", "definition"],
    ["lsp.implementation", "implementation"],
    ["lsp.references", "references"],
    ["lsp.symbols", "symbols"],
    ["lsp.rename", "prepareRename"],
    ["lsp.codeAction", "codeActions"],
    ["lsp.signature", "signature"],
    ["lsp.complete", "completion"],
    ["lsp.format", "format"],
  ];
  for (const [id, kind] of table) {
    const sent = lspEffects(runCommand(s, id, 0, reg).effects);
    expect(sent.map((e) => [id, e.op.kind])).toEqual([[id, kind]]);
  }
});

test("rename without prepare support asks for a name starting from the word", () => {
  const s = keys(attached([ready("a", ["rename"])]), "j4l").state;
  const r = runCommand(s, "lsp.rename", 0, reg);
  expect(r.effects).toEqual([]);
  expect(r.state.overlay).toMatchObject({
    kind: "prompt",
    prompt: {
      title: "Rename symbol",
      value: "helper",
      rename: { key: "a@/ws", path: "src/a.rs", pos: at(1, 4) },
    },
  });
});

test("a code action in Visual mode sends the selection and its diagnostics", () => {
  const s = run(
    keys(attached([ready("a", ["codeActions"])]), "jv3l").state,
    publish("a@/ws", [diag(1, 1, 1, "unused"), diag(2, 0, 1, "other")]),
  ).state;
  const r = keys(s, "gra");
  expect(lspEffects(r.effects).map((e) => e.op)).toEqual([
    {
      kind: "codeActions",
      range: { start: at(1, 0), end: at(1, 4) },
      diagnostics: [diag(1, 1, 1, "unused")],
    },
  ]);
  expect(r.state.vim.mode).toBe("normal");
});

test("no language binding exists for notes and gd in a note still follows links", () => {
  expect(lspBindings.every((b) => b.scope.filetype !== "markdown")).toBe(true);
  const km = keymapFor(reg, fresh().config);
  expect(
    km.lookup({ mode: "normal", filetype: "markdown" }, ["g", "d"]),
  ).toEqual({ kind: "command", id: "link.followOrTag" });
  expect(km.lookup({ mode: "normal", filetype: "rust" }, ["g", "d"])).toEqual({
    kind: "command",
    id: "lsp.definition",
  });
  expect(
    km.lookup({ mode: "insert", filetype: "rust" }, ["<C-Space>"]),
  ).toEqual({ kind: "command", id: "lsp.complete" });
  expect(km.lookup({ mode: "insert", filetype: "rust" }, ["<"]).kind).toBe(
    "none",
  );
});

test("K in a code file asks the first server for hover", () => {
  const r = keys(attached([ready("a", ["hover"])]), "K");
  expect(lspEffects(r.effects)).toMatchObject([
    { key: "a@/ws", op: { kind: "hover", pos: at(0, 0) } },
  ]);
});
