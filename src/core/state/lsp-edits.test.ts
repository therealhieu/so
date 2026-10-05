import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import type { Pos } from "../kernel/text/pos";
import { splitKeys } from "../kernel/vim/keys";
import { fullText } from "./buffers";
import { request } from "./lsp";
import type {
  CodeEdit,
  CodeTextEdit,
  LspFeature,
  ServerView,
} from "./lsp-types";
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
const keys = (s: AppState, seq: string): Result =>
  run(
    s,
    ...splitKeys(seq).map((key): Action => ({ type: "key", key, now: 5 })),
  );

const at = (line: number, col: number): Pos => ({ line, col });
const replace = (line: number, from: number, to: number, text: string) => ({
  range: { start: at(line, from), end: at(line, to) },
  text,
});

const TEXT = "const old = 1;\nexport { old };";

/** `src/a.ts` open with server `a` attached. */
function open(features: LspFeature[] = ["rename"]): AppState {
  return run(
    fresh(),
    { type: "fileLoaded", path: "src/a.ts", file: textFile(`${TEXT}\n`) },
    { type: "lspServer", key: "a@/ws", view: ready("a", features) },
    { type: "lspAttached", path: "src/a.ts", keys: ["a@/ws"] },
  ).state;
}

const textOf = (s: AppState, path = "src/a.ts") => {
  const b = Object.values(s.buffers).find((x) => x.path === path);
  return b === undefined ? undefined : fullText(b.text);
};
const versionOf = (s: AppState) =>
  Object.values(s.buffers).find((x) => x.path === "src/a.ts")?.text.version ??
  0;
const applyEdit = (edit: CodeEdit, requestId = 7): Action => ({
  type: "lspApplyEdit",
  key: "a@/ws",
  requestId,
  edit,
});
const closed = (
  path: string,
  edits: CodeTextEdit[] = [replace(0, 0, 0, "x")],
) => ({
  path,
  edits,
});
const replies = (effects: Effect[]) =>
  effects.filter((e) => e.kind === "lspReply");
const batchOf = (effects: Effect[], path: string) => {
  const e = effects.find(
    (x) => x.kind === "applyEdits" && x.edit.path === path,
  );
  return e?.kind === "applyEdits" ? e.batch : -1;
};
const toasts = (s: AppState) => s.notifications.toasts.map((t) => t.text);

test("an edit over an open and a closed file edits the buffer and queues the file", () => {
  const s = open();
  const sent = request(s, "rename", {
    kind: "rename",
    pos: at(0, 6),
    newName: "next",
  });
  const r = run(sent.state, {
    type: "lspResult",
    id: 1,
    result: {
      kind: "edit",
      edit: {
        files: [
          {
            path: "src/a.ts",
            edits: [replace(0, 6, 9, "next"), replace(1, 9, 12, "next")],
          },
          { path: "src/b.ts", edits: [replace(2, 9, 12, "next")] },
        ],
        outside: 0,
      },
    },
  });
  expect(textOf(r.state)).toBe("const next = 1;\nexport { next };");
  const queued = r.effects.filter((e) => e.kind === "applyEdits");
  expect(queued).toEqual([
    {
      kind: "applyEdits",
      batch: batchOf(r.effects, "src/b.ts"),
      edit: { path: "src/b.ts", edits: [replace(2, 9, 12, "next")] },
    },
  ]);
  expect(r.state.lsp.edit?.pending).toEqual(["src/b.ts"]);
  expect(textOf(keys(r.state, "u").state)).toBe(TEXT);
});

test("a versioned edit for an older buffer applies nothing and says why", () => {
  const s = keys(open(), "ix<Esc>u").state;
  const version = versionOf(s);
  const r = run(
    s,
    applyEdit({
      files: [
        {
          path: "src/a.ts",
          version: version - 1,
          edits: [replace(0, 6, 9, "next")],
        },
      ],
      outside: 0,
    }),
  );
  expect(textOf(r.state)).toBe(TEXT);
  expect(r.state.notifications.message?.text).toBe(
    "edit: refused, src/a.ts changed in the editor",
  );
  expect(replies(r.effects)).toEqual([
    {
      kind: "lspReply",
      key: "a@/ws",
      requestId: 7,
      applied: false,
      failureReason: "refused: src/a.ts (changed in the editor)",
    },
  ]);
});

test("an edit with files outside the workspace is refused whole", () => {
  const r = run(
    open(),
    applyEdit({
      files: [{ path: "src/a.ts", edits: [replace(0, 6, 9, "next")] }],
      outside: 1,
    }),
  );
  expect(textOf(r.state)).toBe(TEXT);
  expect(replies(r.effects)).toMatchObject([
    { applied: false, failureReason: "refused: 1 file outside the workspace" },
  ]);
});

test("a server edit is answered once after the closed files are written", () => {
  const r = run(open(), applyEdit({ files: [closed("src/b.ts")], outside: 0 }));
  expect(replies(r.effects)).toEqual([]);
  const batch = batchOf(r.effects, "src/b.ts");
  const done = run(r.state, {
    type: "editsApplied",
    batch,
    path: "src/b.ts",
    ok: true,
    text: "x",
  });
  expect(replies(done.effects)).toEqual([
    { kind: "lspReply", key: "a@/ws", requestId: 7, applied: true },
  ]);
  expect(toasts(done.state)).toContain("1 file changed");
  expect(done.state.lsp.edit).toBeUndefined();
  const again = run(done.state, {
    type: "editsApplied",
    batch,
    path: "src/b.ts",
    ok: true,
  });
  expect(replies(again.effects)).toEqual([]);
});

test("a skipped file is named in the reply", () => {
  const r = run(
    open(),
    applyEdit({
      files: [closed("src/b.ts"), closed("src/c.ts")],
      outside: 0,
    }),
  );
  const batch = batchOf(r.effects, "src/b.ts");
  expect(batchOf(r.effects, "src/c.ts")).toBe(batch);
  const done = run(
    r.state,
    { type: "editsApplied", batch, path: "src/b.ts", ok: true },
    {
      type: "editsApplied",
      batch,
      path: "src/c.ts",
      ok: false,
      reason: "edit out of range",
    },
  );
  expect(replies(done.effects)).toEqual([
    {
      kind: "lspReply",
      key: "a@/ws",
      requestId: 7,
      applied: false,
      failureReason: "skipped: src/c.ts (edit out of range)",
    },
  ]);
  expect(toasts(done.state)).toEqual([
    "1 file changed",
    "skipped: src/c.ts (edit out of range)",
  ]);
});

test("an open buffer edit out of range is skipped and the reply says so", () => {
  const r = run(
    open(),
    applyEdit({
      files: [{ path: "src/a.ts", edits: [replace(9, 0, 1, "x")] }],
      outside: 0,
    }),
  );
  expect(textOf(r.state)).toBe(TEXT);
  expect(replies(r.effects)).toMatchObject([
    {
      applied: false,
      failureReason: "skipped: src/a.ts (edit out of range)",
    },
  ]);
});

test("a second edit while closed files are still written is refused", () => {
  const first = run(
    open(),
    applyEdit({ files: [closed("src/b.ts")], outside: 0 }, 1),
  );
  const second = run(
    first.state,
    applyEdit({ files: [closed("src/c.ts")], outside: 0 }, 2),
  );
  expect(replies(second.effects)).toEqual([
    {
      kind: "lspReply",
      key: "a@/ws",
      requestId: 2,
      applied: false,
      failureReason: "refused: another edit is still being applied",
    },
  ]);
  expect(second.state.lsp.edit).toEqual(first.state.lsp.edit);
});

test("server edit batches and link rewrite batches never share an id", () => {
  const s = open();
  const rewriting: AppState = {
    ...s,
    index: {
      ...s.index,
      rewrite: {
        batch: 100,
        edits: [],
        pending: ["notes/x.md"],
        updated: [],
        skipped: [],
      },
    },
  };
  const r = run(
    rewriting,
    applyEdit({ files: [closed("src/b.ts")], outside: 0 }),
  );
  expect(batchOf(r.effects, "src/b.ts")).toBe(101);
  const link = run(r.state, {
    type: "editsApplied",
    batch: 100,
    path: "notes/x.md",
    ok: true,
  });
  expect(link.state.lsp.edit?.pending).toEqual(["src/b.ts"]);
  expect(replies(link.effects)).toEqual([]);
});

test("a server edit during Insert joins the typed change for undo", () => {
  const typing = keys(open(), "jA x").state;
  const edited = run(
    typing,
    applyEdit({
      files: [{ path: "src/a.ts", edits: [replace(0, 0, 0, "import y;\n")] }],
      outside: 0,
    }),
  ).state;
  const done = keys(edited, " z<Esc>").state;
  expect(textOf(done)).toBe("import y;\nconst old = 1;\nexport { old }; x z");
  expect(textOf(keys(done, "u").state)).toBe(TEXT);
});
