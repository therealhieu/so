import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import type { Pos } from "../kernel/text/pos";
import type { Diagnostic } from "../kernel/view/diagnostics";
import { splitKeys } from "../kernel/vim/keys";
import { executeEx, runCommand } from "./commands";
import { formattingOptions } from "./lsp-commands";
import type { LspFeature, ServerView } from "./lsp-types";
import type { Action, AppState, BufferState, Result } from "./types";
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
const diag = (line: number, col: number, message: string): Diagnostic => ({
  range: { start: at(line, col), end: at(line, col + 3) },
  severity: 1,
  message,
});

const TEXT = "fn a() {}\nfn b() {}\nfn c() {}\nfn d() {}\n";

/** `src/a.rs` with server `a` attached and `items` pushed for it. */
function withDiagnostics(items: Diagnostic[], text = TEXT): AppState {
  return run(
    fresh(),
    { type: "fileLoaded", path: "src/a.rs", file: textFile(text) },
    { type: "lspServer", key: "a@/ws", view: ready("a", []) },
    { type: "lspAttached", path: "src/a.rs", keys: ["a@/ws"] },
    {
      type: "lspDiagnostics",
      key: "a@/ws",
      path: "src/a.rs",
      source: "push",
      items,
    },
  ).state;
}
const cursorOf = (s: AppState) =>
  s.windows.byId[s.windows.active]?.content.cursor;

test("]d after the last diagnostic wraps to the first", () => {
  const s = withDiagnostics([diag(1, 3, "b"), diag(3, 0, "d")]);
  const first = keys(s, "]d").state;
  expect(cursorOf(first)).toEqual(at(1, 3));
  const second = keys(first, "]d").state;
  expect(cursorOf(second)).toEqual(at(3, 0));
  expect(cursorOf(keys(second, "]d").state)).toEqual(at(1, 3));
});

test("[d before the first diagnostic wraps to the last", () => {
  const s = keys(
    withDiagnostics([diag(1, 3, "b"), diag(2, 0, "c")]),
    "j",
  ).state;
  expect(cursorOf(keys(s, "[d").state)).toEqual(at(2, 0));
});

test("]d without diagnostics says so", () => {
  const r = keys(withDiagnostics([]), "]d").state;
  expect(r.notifications.message?.text).toBe("no diagnostics");
  expect(cursorOf(r)).toEqual(at(0, 0));
});

test("<C-w>d shows the diagnostics of the cursor line in a float", () => {
  const s = keys(
    withDiagnostics([
      { ...diag(1, 3, "unused"), severity: 2, source: "lint" },
      diag(1, 0, "mismatched types"),
    ]),
    "j",
  ).state;
  expect(keys(s, "<C-w>d").state.lsp.float).toEqual({
    kind: "diagnostics",
    window: s.windows.active,
    at: at(1, 0),
    lines: ["E mismatched types", "W lint: unused"],
  });
});

test("formatting options follow the buffer's indentation", () => {
  const buffer = (text: string) =>
    run(fresh(), {
      type: "fileLoaded",
      path: "a.go",
      file: textFile(text),
    }).state.buffers[1] as BufferState;
  expect(formattingOptions(buffer("func a() {\n\tb()\n}\n"), 8)).toEqual({
    tabSize: 8,
    insertSpaces: false,
  });
  expect(
    formattingOptions(buffer("a {\n    b {\n        c\n    }\n}\n"), 8),
  ).toEqual({ tabSize: 4, insertSpaces: true });
  expect(formattingOptions(buffer("a\nb\n"), 2)).toEqual({
    tabSize: 2,
    insertSpaces: true,
  });
});

test("formatting options ignore doc comments and aligned continuation lines", () => {
  const buffer = (text: string) =>
    run(fresh(), {
      type: "fileLoaded",
      path: "a.ts",
      file: textFile(text),
    }).state.buffers[1] as BufferState;
  const fourSpaces = [
    "/**",
    " * doc",
    " */",
    "function a() {",
    "    b(c,",
    "      d);",
    "    if (e) {",
    "        f();",
    "    }",
    "}",
    "",
  ].join("\n");
  expect(formattingOptions(buffer(fourSpaces), 8)).toEqual({
    tabSize: 4,
    insertSpaces: true,
  });
  const twoSpaces = [
    "function a() {",
    "  if (b) {",
    "    c();",
    "  }",
    "  return f(a,",
    "           b);",
    "}",
    "",
  ].join("\n");
  expect(formattingOptions(buffer(twoSpaces), 8)).toEqual({
    tabSize: 2,
    insertSpaces: true,
  });
  const tabs = "/*\n * doc\n */\nfunc a() {\n\tb()\n}\n";
  expect(formattingOptions(buffer(tabs), 8)).toEqual({
    tabSize: 8,
    insertSpaces: false,
  });
});

test(":Format sends a formatting request with the buffer's options", () => {
  const s = run(withDiagnostics([], "fn a() {\n  b();\n}\n"), {
    type: "lspServer",
    key: "a@/ws",
    view: ready("a", ["format"]),
  }).state;
  const r = executeEx(s, "Format", 0, reg);
  expect(r.effects.filter((e) => e.kind === "lsp")).toEqual([
    {
      kind: "lsp",
      id: 1,
      key: "a@/ws",
      path: "src/a.rs",
      op: { kind: "format", options: { tabSize: 2, insertSpaces: true } },
    },
  ]);
});

test(":LspRestart restarts the servers of the active file, failed ones included", () => {
  const s = run(withDiagnostics([]), {
    type: "lspServer",
    key: "rust-analyzer@/ws",
    view: { ...ready("rust-analyzer", []), state: "failed", reason: "crash" },
  }).state;
  const r = executeEx(s, "LspRestart", 0, reg);
  expect(r.effects).toEqual([
    { kind: "lspRestart", keys: ["a@/ws", "rust-analyzer@/ws"] },
  ]);
});

test(":Diagnostics and :LspInfo open their pickers in any file", () => {
  const note = run(fresh(), {
    type: "fileLoaded",
    path: "n.md",
    file: textFile("# n\n"),
  }).state;
  for (const [ex, source] of [
    ["Diagnostics", "diagnostics"],
    ["LspInfo", "lspInfo"],
  ] as const) {
    const o = executeEx(note, ex, 0, reg).state.overlay;
    expect(o.kind === "picker" ? o.picker.source : o.kind).toBe(source);
  }
  expect(
    runCommand(note, "lsp.hover", 0, reg).state.notifications.message?.text,
  ).toBe("not available for markdown files");
});
