import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import type { AppState, BufferState, Effect } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);

const load = (s: AppState, path: string) =>
  update(s, { type: "fileLoaded", path, file: textFile("one\ntwo\n") }).state;
const loadAll = (...paths: string[]) => paths.reduce(load, fresh());
function keys(
  s: AppState,
  seq: string,
): { state: AppState; effects: Effect[] } {
  const effects: Effect[] = [];
  for (const key of splitKeys(seq)) {
    const r = update(s, { type: "key", key, now: 0 });
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}
const ex = (s: AppState, line: string) => keys(s, `:${line}<CR>`);
const shown = (s: AppState) => {
  const w = s.windows.byId[s.windows.active];
  return w && s.buffers[w.content.bufferId]?.path;
};
const tabs = (s: AppState) => s.bufferOrder.map((id) => s.buffers[id]?.path);
const said = (s: AppState) => s.notifications.message?.text;
const byPath = (s: AppState, path: string): BufferState => {
  const b = Object.values(s.buffers).find((x) => x.path === path);
  if (b === undefined) throw new Error(`no buffer ${path}`);
  return b;
};
const patch = (s: AppState, path: string, p: Partial<BufferState>) => {
  const b = byPath(s, path);
  return { ...s, buffers: { ...s.buffers, [b.id]: { ...b, ...p } } };
};

test("]b and [b walk the bufferline and wrap", () => {
  let s = loadAll("a.md", "b.md", "c.md");
  s = keys(s, "]b").state;
  expect(shown(s)).toBe("a.md");
  s = keys(s, "[b").state;
  expect(shown(s)).toBe("c.md");
});

test("<C-^> and :b# toggle between the last two buffers", () => {
  let s = loadAll("a.md", "b.md", "c.md");
  s = keys(s, "<C-^>").state;
  expect(shown(s)).toBe("b.md");
  s = keys(s, "<C-^>").state;
  expect(shown(s)).toBe("c.md");
  s = ex(s, "b#").state;
  expect(shown(s)).toBe("b.md");
  s = ex(s, "b #").state;
  expect(shown(s)).toBe("c.md");
});

test("the alternate is refused with only one buffer", () => {
  const s = keys(loadAll("a.md"), " bb").state;
  expect(said(s)).toBe("E23: No alternate file");
});

test(":b prefers a file-name prefix over a match anywhere in the path", () => {
  let s = loadAll("a.md", "d.md", "notes/dd.md");
  s = ex(s, "b a").state;
  expect(shown(s)).toBe("a.md");
  expect(said(ex(s, "b d").state)).toBe("E93: More than one match for d");
  s = ex(s, "b d.").state;
  expect(shown(s)).toBe("d.md");
  s = ex(s, "b notes").state;
  expect(shown(s)).toBe("notes/dd.md");
});

test(":b goes to a buffer by number or by a unique part of its path", () => {
  let s = loadAll("notes/alpha.md", "notes/beta.md", "todo.md");
  s = ex(s, `b ${byPath(s, "notes/alpha.md").id}`).state;
  expect(shown(s)).toBe("notes/alpha.md");
  s = ex(s, "b TODO").state;
  expect(shown(s)).toBe("todo.md");
  expect(said(ex(s, "b notes").state)).toBe(
    "E93: More than one match for notes",
  );
  expect(said(ex(s, "b gamma").state)).toBe(
    "E94: No matching buffer for gamma",
  );
  expect(said(ex(s, "b 99").state)).toBe("E86: Buffer 99 does not exist");
});

test(":ls opens the buffer picker, the previous buffer first and the current last", () => {
  const s = ex(loadAll("a.md", "b.md", "c.md"), "ls").state;
  expect(s.overlay.kind).toBe("picker");
  if (s.overlay.kind !== "picker") return;
  expect(s.overlay.picker.source).toBe("buffers");
  expect(s.overlay.picker.items.map((i) => i.path)).toEqual([
    "b.md",
    "a.md",
    "c.md",
  ]);
});

test("C-x in the buffer picker closes the selected buffer and lists again", () => {
  let s = keys(loadAll("a.md", "b.md", "c.md"), " ,").state;
  s = keys(s, "<C-x>").state;
  expect(Object.values(s.buffers).map((b) => b.path)).toEqual(["a.md", "c.md"]);
  if (s.overlay.kind !== "picker") throw new Error("picker closed");
  expect(s.overlay.picker.items.map((i) => i.path)).toEqual(["a.md", "c.md"]);
});

test("a pinned buffer moves to the front and stays out of bulk closes", () => {
  let s = loadAll("a.md", "b.md", "c.md", "d.md");
  s = keys(s, " bp").state;
  expect(said(s)).toBe("pinned");
  expect(tabs(s)).toEqual(["d.md", "a.md", "b.md", "c.md"]);
  s = ex(s, "b b.md").state;
  s = keys(s, " bo").state;
  expect(tabs(s)).toEqual(["d.md", "b.md"]);
  s = keys(s, " bP").state;
  expect(tabs(s)).toEqual(["d.md"]);
  expect(shown(s)).toBe("d.md");
});

test("closing to the left or right keeps the active and pinned buffers", () => {
  let s = loadAll("a.md", "b.md", "c.md", "d.md", "e.md");
  s = ex(s, "b a.md").state;
  s = keys(s, " bp").state;
  s = ex(s, "b c.md").state;
  s = keys(s, " bl").state;
  expect(tabs(s)).toEqual(["a.md", "c.md", "d.md", "e.md"]);
  s = keys(s, " br").state;
  expect(tabs(s)).toEqual(["a.md", "c.md"]);
});

test("a bulk close keeps buffers whose changes cannot be written", () => {
  let s = loadAll("a.md", "b.md", "c.md");
  s = patch(s, "a.md", { dirty: true, disk: "deleted" });
  s = keys(s, " bo").state;
  expect(tabs(s)).toEqual(["a.md", "c.md"]);
  expect(said(s)).toBe("E37: No write since last change (a.md kept open)");
});

test("]B and [B move a tab within its pinned or unpinned group", () => {
  let s = loadAll("a.md", "b.md", "c.md");
  s = keys(s, "[B").state;
  expect(tabs(s)).toEqual(["a.md", "c.md", "b.md"]);
  s = keys(s, "[B[B").state;
  expect(tabs(s)).toEqual(["c.md", "a.md", "b.md"]);
  s = keys(s, " bp").state;
  s = ex(s, "b a.md").state;
  s = keys(s, "[B").state;
  expect(tabs(s)).toEqual(["c.md", "a.md", "b.md"]);
});

test("<leader>N shows the Nth tab and <leader>9 the last", () => {
  let s = loadAll("a.md", "b.md", "c.md");
  s = keys(s, " 2").state;
  expect(shown(s)).toBe("b.md");
  s = keys(s, " 9").state;
  expect(shown(s)).toBe("c.md");
  s = keys(s, " 7").state;
  expect(shown(s)).toBe("c.md");
});

test(":wa writes every buffer with unsaved changes", () => {
  let s = loadAll("a.md", "b.md", "c.md");
  s = patch(s, "a.md", { dirty: true });
  s = patch(s, "b.md", { dirty: true });
  const writes = ex(s, "wa").effects.flatMap((e) =>
    e.kind === "write" ? [e.path] : [],
  );
  expect(writes.sort()).toEqual(["a.md", "b.md"]);
});
