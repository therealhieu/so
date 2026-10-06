import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import type { Pos } from "../kernel/text/pos";
import type { Diagnostic } from "../kernel/view/diagnostics";
import { splitKeys } from "../kernel/vim/keys";
import { fullText } from "./buffers";
import { executeEx, runCommand } from "./commands";
import { formattingOptions } from "./lsp-commands";
import type { LspFeature, LspResult, ServerView } from "./lsp-types";
import type { Action, AppState, BufferState, Effect, Result } from "./types";
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

const UGLY = "fn a() {\nb();\n}";

/** `src/a.rs` holding `UGLY`, with formatting server `a`; `formatOnSave` and autosave as given. */
function formatting(o: { formatOnSave: boolean; autosave: boolean }): AppState {
  const s = run(
    fresh(),
    { type: "fileLoaded", path: "src/a.rs", file: textFile(`${UGLY}\n`) },
    { type: "lspServer", key: "a@/ws", view: ready("a", ["format"]) },
    { type: "lspAttached", path: "src/a.rs", keys: ["a@/ws"] },
  ).state;
  return {
    ...s,
    config: {
      ...s.config,
      autosave: { ...s.config.autosave, enabled: o.autosave },
      lsp: { ...s.config.lsp, formatOnSave: o.formatOnSave },
    },
  };
}

const textOf = (s: AppState) => {
  const b = Object.values(s.buffers).find((x) => x.path === "src/a.rs");
  return b === undefined ? undefined : fullText(b.text);
};
const kinds = (effects: Effect[]) => effects.map((e) => e.kind);
const indent: LspResult = {
  kind: "edit",
  edit: {
    files: [
      {
        path: "src/a.rs",
        edits: [{ range: { start: at(1, 0), end: at(1, 0) }, text: "    " }],
      },
    ],
    outside: 0,
  },
};
const timerOf = (effects: Effect[]) =>
  effects.find((e) => e.kind === "startTimer" && e.id.startsWith("lspFormat"));

test(":Format applies the server edits as one undo step", () => {
  const sent = keys(
    formatting({ formatOnSave: false, autosave: false }),
    ":Format<CR>",
  );
  const done = run(sent.state, {
    type: "lspResult",
    id: 1,
    result: indent,
    now: 0,
  });
  expect(textOf(done.state)).toBe("fn a() {\n    b();\n}");
  expect(textOf(keys(done.state, "u").state)).toBe(UGLY);
});

test("format on save formats :w only and never waits more than a second", () => {
  const edited = keys(formatting({ formatOnSave: true, autosave: false }), "x");
  const saving = keys(edited.state, ":w<CR>");
  expect(kinds(saving.effects)).not.toContain("write");
  expect(saving.effects.filter((e) => e.kind === "lsp")).toMatchObject([
    { op: { kind: "format" } },
  ]);
  const timer = timerOf(saving.effects);
  expect(timer).toMatchObject({ ms: 1000 });
  const id = timer?.kind === "startTimer" ? timer.id : "lspFormat:0";
  const twice = keys(saving.state, ":w<CR>");
  expect(
    kinds(twice.effects).filter((k) => k === "lsp" || k === "write"),
  ).toEqual([]);

  const formatted = run(saving.state, {
    type: "lspResult",
    now: 0,
    id: 1,
    result: indent,
  });
  expect(textOf(formatted.state)).toBe("n a() {\n    b();\n}");
  expect(formatted.effects).toContainEqual({ kind: "cancelTimer", id });
  expect(
    formatted.effects.filter((e) => e.kind === "write").map((e) => e.text),
  ).toEqual(["n a() {\n    b();\n}\n"]);
  expect(formatted.state.lsp.format).toBeUndefined();

  const silent = run(saving.state, { type: "timer", id, now: 1005 });
  expect(kinds(silent.effects)).toContain("write");
  expect(silent.effects).toContainEqual({
    kind: "lspCancel",
    id: 1,
    key: "a@/ws",
  });
  expect(silent.state.notifications.toasts.map((t) => t.text)).toEqual([
    "format timed out; saved without formatting",
  ]);
  const late = run(silent.state, {
    type: "lspResult",
    id: 1,
    result: indent,
    now: 0,
  });
  expect(textOf(late.state)).toBe("n a() {\nb();\n}");
  expect(kinds(late.effects)).not.toContain("write");
});

test("autosave never formats", () => {
  const edited = keys(formatting({ formatOnSave: true, autosave: true }), "x");
  const b = Object.values(edited.state.buffers)[0];
  const fired = run(edited.state, {
    type: "timer",
    id: `autosave:${b?.id ?? 0}`,
    now: 1_000_000,
  });
  expect(kinds(fired.effects)).toContain("write");
  expect(kinds(fired.effects)).not.toContain("lsp");
});

test("a write after a format answer that then fails retries in the future", () => {
  const saving = keys(
    keys(formatting({ formatOnSave: true, autosave: false }), "x").state,
    ":w<CR>",
  );
  const formatted = run(saving.state, {
    type: "lspResult",
    id: 1,
    result: indent,
    now: 2000,
  });
  const write = formatted.effects.find((e) => e.kind === "write");
  const failed = run(formatted.state, {
    type: "saveFailed",
    path: write?.kind === "write" ? write.path : "",
    reason: "EACCES",
  });
  const b = Object.values(failed.state.buffers).find(
    (x) => x.save.kind === "failed",
  );
  expect(b?.save).toMatchObject({ kind: "failed", reason: "EACCES" });
  const retryAt = b?.save.kind === "failed" ? b.save.retryAt : 0;
  expect(retryAt).toBeGreaterThan(2000);
});

test("a failed format on save still saves, with a warning", () => {
  const saving = keys(
    keys(formatting({ formatOnSave: true, autosave: false }), "x").state,
    ":w<CR>",
  );
  const failed = run(saving.state, {
    type: "lspResult",
    now: 0,
    id: 1,
    result: { kind: "error", message: "syntax error" },
  });
  expect(kinds(failed.effects)).toContain("write");
  expect(failed.state.notifications.toasts.map((t) => t.text)).toEqual([
    "format failed (syntax error); saved without formatting",
  ]);
});
