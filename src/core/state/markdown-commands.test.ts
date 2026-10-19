import { expect, test } from "bun:test";
import {
  fresh,
  freshDefaults,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import { layoutText } from "../kernel/view/text-view";
import type { TextView } from "../kernel/view/types";
import { splitKeys } from "../kernel/vim/keys";
import type { Doc } from "../lang/markdown/doc";
import {
  livePreview,
  type MarkdownViewInput,
  type PreviewCtx,
} from "../lang/markdown/live-preview";
import { activeBuffer, activeWindow } from "./buffers";
import { markdownViewContextFor } from "./markdown-view";
import type { Action, AppState } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);
const markdownViewContext = markdownViewContextFor(reg);

function keys(s: AppState, seq: string): AppState {
  for (const key of splitKeys(seq))
    s = update(s, { type: "key", key, now: 0 }).state;
  return s;
}
const open = (s: AppState, path: string, text: string): AppState =>
  update(s, { type: "fileLoaded", path, file: textFile(text) }).state;
const indexed = (files: string[]): AppState =>
  update(fresh(), {
    type: "indexBatch",
    summaries: [],
    files,
    done: 0,
    total: 0,
  } satisfies Action).state;

const folds = (s: AppState) => activeWindow(s)?.content.folds ?? [];
const text = (s: AppState) => {
  const b = activeBuffer(s);
  const out: string[] = [];
  for (let l = 0; l < (b?.text.lineCount ?? 0); l++)
    out.push(b?.text.line(l) ?? "");
  return out.join("\n");
};
const message = (s: AppState) => s.notifications.message?.text;

/** The active note's rows in live view with the window's context, cursor off the note. */
function liveRows(s: AppState): string[] {
  const b = activeBuffer(s);
  if (b === undefined) return [];
  const host = {
    width: 60,
    rows: 40,
    imageSize: () => undefined,
    cell: { width: 8, height: 16 },
    sizedText: false,
  };
  const ctx = markdownViewContext(s, s.windows.active, host) as PreviewCtx;
  const v: TextView = {
    buf: b.text,
    width: 60,
    topRow: 0,
    rows: 40,
    cursor: { line: b.text.lineCount + 5, col: 0 },
    folds: new Set(),
    visible: { from: 0, to: b.text.lineCount },
  };
  const input: MarkdownViewInput = {
    doc: b.analysis as Doc,
    view: "live",
    ctx,
  };
  return layoutText(v, [livePreview as never], input).map((r) =>
    r.spans.map((sp) => sp.text).join(""),
  );
}

const NOTE =
  "# Note\n\nIntro.\n\n> [!note] Title\n> body one\n> body two\n\nEnd.\n";

test("a fold follows its callout when lines are inserted above", () => {
  let s = open(fresh(), "n.md", NOTE);
  s = keys(s, "4jza");
  const [id] = folds(s);
  expect(id).toBeDefined();
  expect(liveRows(s)).toContain("● Title ▸");
  expect(liveRows(s)).not.toContain("▎ body one");

  s = keys(s, "ggOTop<Esc>");
  expect(text(s).startsWith("Top\n# Note")).toBe(true);
  expect(folds(s)).toEqual([id as number]);
  expect(liveRows(s)).toContain("● Title ▸");

  s = keys(s, "5jA!<Esc>");
  expect(liveRows(s)).toContain("● Title!");
  expect(liveRows(s)).toContain("▎ body one");
  s = keys(s, "za");
  expect(folds(s)).toHaveLength(1);
  expect(folds(s)).not.toContain(id as number);

  s = keys(s, "dap");
  expect(text(s)).not.toContain("Title");
  s = keys(s, "ggza");
  expect(message(s)).toBe("nothing to fold here");
  expect(folds(s)).toEqual([]);
});

test("a callout marked folded starts folded with no toggle", () => {
  const s = open(fresh(), "n.md", "Text.\n\n> [!tip]- Hidden\n> secret\n");
  expect(folds(s)).toEqual([]);
  const rows = liveRows(s);
  expect(rows).toContain("★ Hidden ▸");
  expect(rows.join("\n")).not.toContain("secret");
});

test("a note opens in reading view and cycles live, source, reading with a message", () => {
  let s = open(freshDefaults(), "n.md", NOTE);
  expect(activeBuffer(s)?.view).toBe("reading");
  const seen: [string | undefined, string | undefined][] = [];
  for (let i = 0; i < 3; i++) {
    s = keys(s, "<leader>m");
    seen.push([activeBuffer(s)?.view, message(s)]);
  }
  expect(seen).toEqual([
    ["live", "mode: live"],
    ["source", "mode: source"],
    ["reading", "mode: reading (read-only)"],
  ]);
});

test("note keys do nothing in a code file", () => {
  const before = open(
    fresh(),
    "scripts/sync.ts",
    "const a = 1;\nconst b = 2;\n",
  );
  let s = keys(before, "<leader>m");
  expect(activeBuffer(s)?.view).toBe("source");
  expect(text(s)).toBe(text(before));
  s = keys(before, "<CR>");
  expect(activeWindow(s)?.content.cursor.line).toBe(1);
  expect(text(s)).toBe(text(before));
});

test("enter toggles a task and one undo restores it", () => {
  let s = open(fresh(), "n.md", "- [ ] x\n- plain\n");
  s = keys(s, "<CR>");
  expect(text(s)).toBe("- [x] x\n- plain");
  expect(activeBuffer(s)?.dirty).toBe(true);
  s = keys(s, "<leader>x");
  expect(text(s)).toBe("- [ ] x\n- plain");
  s = keys(s, "<leader>xu");
  expect(text(s)).toBe("- [ ] x\n- plain");
  s = keys(s, "j<leader>x");
  expect(message(s)).toBe("no checkbox on this line");
});

test("enter on a link follows it", () => {
  let s = indexed(["n.md", "other.md"]);
  s = open(s, "n.md", "See [[other]].\n");
  s = keys(s, "4l");
  const r = update(s, { type: "key", key: "<CR>", now: 0 });
  expect(r.effects).toContainEqual({ kind: "read", path: "other.md" });
});

test("substitution is refused in reading view and works in live view", () => {
  const live = open(fresh(), "n.md", "foo\n");
  const reading = keys(live, "<leader>m<leader>m");
  expect(activeBuffer(reading)?.view).toBe("reading");
  const refused = keys(reading, ":s/foo/bar/<CR>");
  expect(text(refused)).toBe("foo");
  expect(activeBuffer(refused)?.dirty).toBe(false);
  expect(message(refused)).toBe("reading mode — <leader>m to edit");
  const replaced = keys(live, ":s/foo/bar/<CR>");
  expect(text(replaced)).toBe("bar");
  expect(activeBuffer(replaced)?.dirty).toBe(true);
});
