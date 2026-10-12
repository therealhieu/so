import { expect, test } from "bun:test";
import { fresh, testRegistries, textFile } from "../../../test/support/state";
import { backlinksOf } from "../features/links/note-index";
import type { FileEdit } from "../features/links/rename";
import { summarize } from "../features/links/summarize";
import { splitKeys } from "../kernel/vim/keys";
import { scanDoc } from "../lang/markdown/scan";
import { applyBufferEdits, fullText } from "./buffers";
import type { Action, AppState, Effect, FsOp, Result } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);
const run = (s: AppState, ...actions: Action[]) =>
  actions.reduce((st, a) => update(st, a).state, s);
/** Keys in Vim notation; every key's effects are collected. */
function keys(s: AppState, seq: string): Result {
  let r: Result = { state: s, effects: [] };
  for (const key of splitKeys(seq)) {
    const next = update(r.state, { type: "key", key, now: 5 });
    r = { state: next.state, effects: [...r.effects, ...next.effects] };
  }
  return r;
}

/**
 * 12 notes linking to notes/plan.md 31 times: seven with three links, five
 * with two. `extra` adds other notes (path → text).
 */
function workspace(extra: Record<string, string> = {}) {
  const notes: Record<string, string> = {
    "notes/plan.md": "# Plan\n## Goals\n",
    "notes/other.md": "# Other\n",
    ...extra,
  };
  for (let i = 1; i <= 12; i++)
    notes[`refs/r${i}.md`] =
      i <= 7
        ? "[[plan]] [[plan|P]] [[plan#Goals]]\n"
        : "[[plan]] [x](notes/plan.md)\n";
  return notes;
}

const summaries = (notes: Record<string, string>) =>
  Object.entries(notes).map(([p, t]) =>
    summarize(p, { mtime: 1, size: 0, ctime: 1 }, scanDoc(t)),
  );

function indexing(notes = workspace()): AppState {
  const all = summaries(notes);
  return run(fresh(), {
    type: "indexBatch",
    summaries: all,
    files: Object.keys(notes),
    done: all.length,
    total: all.length,
  });
}

/** A ready index; its "index ready" toast is dismissed. */
function ready(notes = workspace()): AppState {
  const s = run(indexing(notes), { type: "indexReady" });
  return { ...s, notifications: { toasts: [] } };
}

const selecting = (s: AppState, path: string): AppState => ({
  ...s,
  panels: {
    ...s.panels,
    explorer: { ...s.panels.explorer, focused: true, cursor: path },
  },
});

const prompt = (s: AppState) =>
  s.overlay.kind === "prompt" ? s.overlay.prompt : undefined;
const kinds = (effects: Effect[]) =>
  effects
    .map((e) => e.kind)
    .filter(
      (k) => k !== "cancelTimer" && k !== "startTimer" && k !== "listDir",
    );
const applyEdits = (effects: Effect[]) =>
  effects.filter(
    (e): e is Extract<Effect, { kind: "applyEdits" }> =>
      e.kind === "applyEdits",
  );
const textOf = (s: AppState) => {
  const b = s.buffers[1];
  return b === undefined ? undefined : fullText(b.text);
};
const toasts = (s: AppState) =>
  s.notifications.toasts.map((t) => [t.level, t.text]);

/** `m` on notes/plan.md, then the new path, then Enter. */
function move(s: AppState, to: string): Result {
  const opened = keys(selecting(s, "notes/plan.md"), "m");
  const cleared = keys(opened.state, "<BS>".repeat("notes/plan.md".length));
  return keys(cleared.state, `${to}<CR>`);
}
const moveOp = (r: Result): FsOp => {
  const e = r.effects.find((x) => x.kind === "move");
  if (e === undefined || e.kind !== "move") throw new Error("no move");
  return e.op;
};

test("rename while ready shows the impact and blocks an existing name", () => {
  let r = keys(selecting(ready(), "notes/plan.md"), "r");
  expect(prompt(r.state)).toMatchObject({
    title: "Rename",
    value: "plan.md",
    impact: "No links to update",
  });
  r = keys(r.state, "<BS><BS><BS><BS><BS><BS><BS>other.md");
  expect(prompt(r.state)?.invalid).toBe("notes/other.md already exists");
  expect(prompt(r.state)?.impact).toBeUndefined();
  r = keys(r.state, "<CR>");
  expect(prompt(r.state)?.value).toBe("other.md");
  expect(kinds(r.effects)).toEqual([]);
  r = keys(r.state, "<BS><BS><BS><BS><BS><BS><BS><BS>");
  expect(prompt(r.state)?.invalid).toBe("name is empty");
  r = keys(r.state, "roadmap.md");
  expect(prompt(r.state)).toMatchObject({
    impact: "31 links in 12 files will be updated",
  });
  expect(prompt(r.state)?.invalid).toBeUndefined();
  const outside = move(ready(), "../x.md");
  expect(prompt(outside.state)?.invalid).toBe("outside the workspace");
  expect(kinds(outside.effects)).toEqual([]);
});

test("a note nothing links to has no links to update", () => {
  const r = keys(selecting(ready(), "notes/other.md"), "m");
  expect(prompt(keys(r.state, "x").state)?.impact).toBe("No links to update");
});

test("rename while indexing is refused", () => {
  for (const s of [indexing(), fresh()]) {
    const r = keys(selecting(s, "notes/plan.md"), "r");
    expect(r.state.overlay.kind).toBe("none");
    expect(r.state.notifications.message?.text).toBe(
      "index not ready — try again when indexing finishes",
    );
    expect(kinds(r.effects)).toEqual([]);
  }
});

test("rename with the index unavailable warns and only moves the file", () => {
  const down = run(
    ready(),
    { type: "indexFailed", final: false, reason: "x" },
    { type: "indexFailed", final: true, reason: "x" },
  );
  const opened = keys(selecting(down, "notes/plan.md"), "m");
  expect(prompt(opened.state)?.impact).toBe(
    "links will not be updated (index unavailable)",
  );
  const r = move(down, "projects/roadmap.md");
  expect(kinds(r.effects)).toEqual(["move"]);
  expect(r.state.index.rewrite).toBeUndefined();
  const done = update(r.state, { type: "fsResult", op: moveOp(r), ok: true });
  expect(applyEdits(done.effects)).toEqual([]);
});

test("a failed file operation applies no edit", () => {
  const r = move(ready(), "projects/roadmap.md");
  expect(applyEdits(r.effects)).toEqual([]);
  expect(r.state.index.rewrite?.edits.length).toBe(12);
  const failed = update(r.state, {
    type: "fsResult",
    op: moveOp(r),
    ok: false,
    reason: "E13: File exists (projects/roadmap.md)",
  });
  expect(applyEdits(failed.effects)).toEqual([]);
  expect(failed.state.index.rewrite).toBeUndefined();
  expect(failed.state.notifications.message?.text).toBe(
    "E13: File exists (projects/roadmap.md)",
  );
});

test("edits apply after the operation and report one toast", () => {
  let s = ready();
  s = run(s, {
    type: "fileLoaded",
    path: "refs/r1.md",
    file: textFile("[[plan]] [[plan|P]] [[plan#Goals]] z\n"),
  });
  s = keys(s, "$x").state; // an unsaved change, autosave pending
  expect(s.buffers[1]?.dirty).toBe(true);
  const undoDepth = s.buffers[1]?.undo.done.length ?? 0;
  const r = move(s, "projects/roadmap.md");
  expect(kinds(r.effects)).toEqual(["move"]);
  // Nothing is edited before the file operation succeeds.
  expect(textOf(r.state)).toBe("[[plan]] [[plan|P]] [[plan#Goals]] ");

  const done = update(r.state, { type: "fsResult", op: moveOp(r), ok: true });
  const b = done.state.buffers[1];
  expect(textOf(done.state)).toBe(
    "[[roadmap]] [[roadmap|P]] [[roadmap#Goals]] ",
  );
  expect(b?.dirty).toBe(true);
  expect(b?.undo.done.length).toBe(undoDepth + 1);
  expect(done.effects).toContainEqual({
    kind: "startTimer",
    id: "autosave:1",
    ms: 1000,
  });
  const closed = applyEdits(done.effects);
  expect(closed.map((e) => e.edit.path).sort()).toEqual(
    Array.from({ length: 11 }, (_, i) => `refs/r${i + 2}.md`).sort(),
  );
  expect(new Set(closed.map((e) => e.batch)).size).toBe(1);
  expect(toasts(done.state)).toEqual([]);

  let st = done.state;
  for (const e of closed) {
    const skipped = e.edit.path === "refs/r9.md";
    const text = "[[roadmap]] [x](projects/roadmap.md)\n";
    st = run(
      st,
      skipped
        ? {
            type: "editsApplied",
            batch: e.batch,
            path: e.edit.path,
            ok: false,
            reason: "changed on disk",
          }
        : {
            type: "editsApplied",
            batch: e.batch,
            path: e.edit.path,
            ok: true,
            text,
          },
    );
    if (e !== closed.at(-1)) expect(toasts(st)).toEqual([]);
  }
  expect(toasts(st)).toEqual([
    ["info", "11 files updated"],
    ["error", "skipped: refs/r9.md (changed on disk)"],
  ]);
  expect(st.index.rewrite).toBeUndefined();
  // Written files reach the index from the text the runner wrote.
  expect(
    backlinksOf(st.index.ix, "projects/roadmap.md").some(
      (l) => l.from === "refs/r10.md",
    ),
  ).toBe(true);
});

test("an open buffer whose text no longer matches is not edited", () => {
  let s = run(fresh(), {
    type: "fileLoaded",
    path: "a.md",
    file: textFile("see [[plan]]\n"),
  });
  const edit: FileEdit = {
    path: "a.md",
    edits: [
      {
        range: { start: { line: 0, col: 4 }, end: { line: 0, col: 12 } },
        expected: "[[plan]]",
        text: "[[roadmap]]",
      },
    ],
  };
  const ok = applyBufferEdits(s, edit, 0, reg);
  expect(ok.stale).toBe(false);
  expect(textOf(ok.state)).toBe("see [[roadmap]]");
  s = keys(s, "<Esc>0ix<Esc>").state;
  const stale = applyBufferEdits(s, edit, 0, reg);
  expect(stale).toMatchObject({ stale: true, effects: [] });
  expect(stale.state).toBe(s);
});

test("a rename while links are still updating is refused and keeps the first plan", () => {
  const notes = workspace({ "b.md": "[[other]]\n" });
  const first = move(ready(notes), "projects/roadmap.md");
  expect(first.state.index.rewrite?.edits.length).toBe(12);
  const busy = "links still updating — try again when the update finishes";

  // `r` on another note before the first move reports back: no prompt, no op.
  const second = keys(selecting(first.state, "notes/other.md"), "r");
  expect(second.state.overlay.kind).toBe("none");
  expect(second.state.notifications.message?.text).toBe(busy);
  expect(kinds(second.effects)).toEqual([]);
  expect(second.state.index.rewrite).toEqual(first.state.index.rewrite);

  // A prompt already open when the rewrite started is refused on Enter.
  const opened = keys(selecting(ready(notes), "notes/other.md"), "r");
  const typed = keys(opened.state, "<BS><BS><BS><BS><BS><BS><BS><BS>misc.md");
  const racing: AppState = {
    ...typed.state,
    index: first.state.index,
  };
  const submitted = keys(racing, "<CR>");
  expect(submitted.state.overlay.kind).toBe("none");
  expect(submitted.state.notifications.message?.text).toBe(busy);
  expect(kinds(submitted.effects)).toEqual([]);

  // The first plan still applies after its file operation succeeds.
  const done = update(second.state, {
    type: "fsResult",
    op: moveOp(first),
    ok: true,
  });
  expect(
    applyEdits(done.effects)
      .map((e) => e.edit.path)
      .sort(),
  ).toEqual(Array.from({ length: 12 }, (_, i) => `refs/r${i + 1}.md`).sort());
  let st = done.state;
  for (const e of applyEdits(done.effects))
    st = run(st, {
      type: "editsApplied",
      batch: e.batch,
      path: e.edit.path,
      ok: true,
    });
  expect(toasts(st)).toEqual([["info", "12 files updated"]]);
  expect(st.index.rewrite).toBeUndefined();

  // Once the batch reports, renaming works again.
  const again = keys(selecting(st, "notes/other.md"), "r");
  expect(prompt(again.state)?.title).toBe("Rename");
});

test("a cut note pasted into another folder moves with its links updated", () => {
  const cut = keys(selecting(ready(), "notes/plan.md"), "x").state;
  const r = update(cut, {
    type: "fileClip",
    target: "refs",
    clip: { op: "copy", paths: ["/ws/notes/plan.md"] },
    dirs: [],
    now: 9,
  });
  const op: FsOp = { kind: "move", from: "notes/plan.md", to: "refs/plan.md" };
  expect(r.effects).toContainEqual({ kind: "move", op });
  // The name stays "plan", so only the five path links change.
  expect(r.state.index.rewrite?.edits.length).toBe(5);
  const refused = update(
    keys(selecting(indexing(), "notes/plan.md"), "x").state,
    {
      type: "fileClip",
      target: "refs",
      clip: null,
      dirs: [],
      now: 9,
    },
  );
  expect(kinds(refused.effects)).toEqual([]);
  expect(refused.state.notifications.message?.text).toBe(
    "index not ready — try again when indexing finishes",
  );
});
