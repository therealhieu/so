import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { summarize } from "../features/links/summarize";
import { splitKeys } from "../kernel/vim/keys";
import { scanDoc } from "../lang/markdown/scan";
import { fullText } from "./buffers";
import type { AppState, Effect } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);

const NOTES: Record<string, string> = {
  "projects/so.md": "# So\n\nSee [[plan#Goals]] and [[missing]].\n",
  "projects/plan.md": "# Plan\n\nintro\n\n## Goals\n\nship it\n",
  "people/linh.md": "---\naliases: [Linh]\n---\n# Linh\n",
};

function indexed(
  path = "projects/so.md",
  text = NOTES["projects/so.md"] ?? "",
): AppState {
  const files = Object.keys(NOTES);
  let s = update(fresh(), {
    type: "indexBatch",
    summaries: files.map((p) =>
      summarize(p, { mtime: 1, size: 0, ctime: 1 }, scanDoc(NOTES[p] ?? "")),
    ),
    files,
    done: files.length,
    total: files.length,
  }).state;
  s = update(s, { type: "indexReady" }).state;
  return update(s, { type: "fileLoaded", path, file: textFile(text) }).state;
}
function keys(s: AppState, seq: string) {
  const effects: Effect[] = [];
  for (const key of splitKeys(seq)) {
    const r = update(s, { type: "key", key, now: 0 });
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}
const at = (s: AppState) => {
  const w = s.windows.byId[s.windows.active];
  return {
    path: w && s.buffers[w.content.bufferId]?.path,
    ...w?.content.cursor,
  };
};

test("follow opens the heading and records a jump", () => {
  let s = keys(indexed(), "2j6l").state;
  const r = keys(s, "gd");
  expect(r.effects).toContainEqual({ kind: "read", path: "projects/plan.md" });
  expect(r.state.jumps.entries).toEqual([
    { path: "projects/so.md", line: 2, col: 6 },
  ]);
  s = update(r.state, {
    type: "fileLoaded",
    path: "projects/plan.md",
    file: textFile(NOTES["projects/plan.md"] ?? ""),
  }).state;
  expect(at(s)).toEqual({ path: "projects/plan.md", line: 4, col: 0 });

  // Back and forth with the jump list.
  s = keys(s, "<C-o>").state;
  expect(at(s)).toEqual({ path: "projects/so.md", line: 2, col: 6 });
  s = keys(s, "<C-i>").state;
  expect(at(s)).toEqual({ path: "projects/plan.md", line: 4, col: 0 });
});

test("following a missing note offers to create it", () => {
  const s = keys(indexed(), "2j$h").state;
  const r = keys(s, "gd");
  expect(r.state.overlay).toMatchObject({
    kind: "prompt",
    prompt: {
      kind: "confirm",
      title: "Create projects/missing.md? [y/N]",
      op: { kind: "create", from: "projects/missing.md", dir: false },
    },
  });
  const yes = keys(r.state, "y");
  expect(yes.effects).toContainEqual({
    kind: "create",
    op: { kind: "create", from: "projects/missing.md", dir: false },
  });
});

test("gd off a link does nothing", () => {
  const s = indexed();
  const r = keys(s, "gd");
  expect(r.effects.filter((e) => e.kind === "read")).toEqual([]);
  expect(at(r.state)).toEqual(at(s));
  expect(r.state.overlay.kind).toBe("none");
});

test("completion moves from notes to headings and inserts once", () => {
  let s = keys(indexed(), "Go[[pl").state;
  expect(s.overlay).toMatchObject({
    kind: "completion",
    completion: { mode: "notes", query: "pl" },
  });
  const c = s.overlay.kind === "completion" ? s.overlay.completion : undefined;
  expect(c?.items[0]).toMatchObject({ insert: "plan" });

  s = keys(s, "#").state;
  expect(s.overlay).toMatchObject({
    kind: "completion",
    completion: { mode: "headings", target: "projects/plan.md", query: "" },
  });
  s = keys(s, "<C-n>").state;
  s = keys(s, "<CR>").state;
  expect(s.overlay.kind).toBe("none");
  const b = Object.values(s.buffers)[0];
  expect(b && fullText(b.text).split("\n")[3]).toBe("[[plan#Goals]]");
  expect(s.vim.mode).toBe("insert");

  // One undo block: leaving Insert and undoing removes the whole line's text.
  s = keys(s, "<Esc>u").state;
  const undone = Object.values(s.buffers)[0];
  expect(undone && fullText(undone.text)).toBe(
    NOTES["projects/so.md"]?.slice(0, -1),
  );
});

test("aliases complete to their note", () => {
  const s = keys(indexed(), "Go[[Lin").state;
  const c = s.overlay.kind === "completion" ? s.overlay.completion : undefined;
  expect(c?.items.map((i) => i.label)).toContainEqual("Linh → linh");
});

test("note items do not depend on the queries typed before", () => {
  const items = (seq: string) => {
    const s = keys(indexed(), seq).state;
    return s.overlay.kind === "completion"
      ? s.overlay.completion.items
      : undefined;
  };
  expect(items("Go[[li")).toEqual(items("Go[[lix<BS>"));
  expect(items("Go[[Lin")).toEqual(items("Go[[Linx<BS>"));
  expect(items("Go[[p")).toEqual(items("Go[[pz<BS>"));
  expect(items("Go[[p")?.map((i) => i.insert)).toEqual(["plan"]);
  expect(items("Go[[pz<BS><BS>")).toEqual(items("Go[["));
});

test("note items follow index changes made while the popup is open", () => {
  let s = keys(indexed(), "Go[[pl").state;
  s = update(s, {
    type: "indexBatch",
    summaries: [
      summarize(
        "projects/plan-b.md",
        { mtime: 1, size: 0, ctime: 1 },
        scanDoc("# B\n"),
      ),
    ],
    files: [],
    done: 4,
    total: 4,
  }).state;
  s = keys(s, "a").state;
  const c = s.overlay.kind === "completion" ? s.overlay.completion : undefined;
  expect(c?.items.map((i) => i.insert)).toEqual(["plan", "plan-b"]);
});

test("the popup closes when the cursor leaves the link or Insert ends", () => {
  let s = keys(indexed(), "Go[[pl").state;
  expect(s.overlay.kind).toBe("completion");
  s = keys(s, "<Esc>").state;
  expect(s.overlay.kind).toBe("none");
  expect(s.vim.mode).toBe("normal");

  s = keys(s, "a]").state;
  expect(s.overlay.kind).toBe("none");
  s = keys(indexed(), "Go[[pl]").state;
  expect(s.overlay.kind).toBe("none");
});

const withTags = () =>
  indexed(
    "notes/t.md",
    "---\ntags: [so, planning]\n---\nsee [[plan]] #so/ui\n",
  );
const picked = (s: AppState) =>
  s.overlay.kind === "picker"
    ? { source: s.overlay.picker.source, arg: s.overlay.picker.arg }
    : undefined;

test("gd on a tag lists the notes with it, from the body or the frontmatter", () => {
  const body = keys(withTags(), "3j$gd").state;
  expect(picked(body)).toEqual({ source: "tagNotes", arg: "so/ui" });
  const fm = keys(withTags(), "jfpgd").state;
  expect(picked(fm)).toEqual({ source: "tagNotes", arg: "planning" });
});

test("gd on a link still follows it, and Enter does not open a tag's notes", () => {
  const link = keys(withTags(), "3jf[gd");
  expect(link.effects).toContainEqual({
    kind: "read",
    path: "projects/plan.md",
  });
  expect(keys(withTags(), "3j$<CR>").state.overlay.kind).toBe("none");
});
