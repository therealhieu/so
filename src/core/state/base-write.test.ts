import { expect, test } from "bun:test";
import { indexed, noteSummary, TASK_NOTES } from "../../../test/support/bases";
import {
  fresh,
  stamp,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import { onFrontmatterPatched, writeProperty } from "./base-write";
import { bufferForPath, fullText } from "./buffers";
import type { Action, AppState, Effect } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);
const NOW = new Date(2026, 9, 3, 9, 5).getTime();
const PATH = "tasks/write-report.md";
const NOTE = TASK_NOTES[PATH] ?? "";

const run = (s: AppState, ...actions: Action[]) => {
  const effects: Effect[] = [];
  for (const a of actions) {
    const r = update(s, a);
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
};
const key = (k: string): Action => ({ type: "key", key: k, now: NOW });
const keys = (seq: string): Action[] => [...seq].map(key);

/** The note open with an unsaved edit in its body (its last character deleted). */
function openDirty(): AppState {
  return run(
    fresh(),
    indexed(),
    { type: "fileLoaded", path: PATH, file: textFile(NOTE) },
    ...keys("G$x"),
  ).state;
}

const toasts = (s: AppState) => s.notifications.toasts.map((t) => t.text);

test("a property change on an open note is one undo step and keeps unsaved edits", () => {
  const s = openDirty();
  const before = bufferForPath(s, PATH);
  expect(before?.dirty).toBe(true);
  expect(fullText(before?.text as never)).toEndWith("# Write repor");
  const r = writeProperty(
    s,
    PATH,
    { set: "status", value: "doing" },
    "todo",
    NOW,
    reg,
  );
  const b = bufferForPath(r.state, PATH);
  if (b === undefined) throw new Error("note not open");
  const text = fullText(b.text);
  expect(text).toContain("status: doing # next up\n");
  expect(text).toEndWith("# Write repor");
  expect(b.undo.done.length).toBe((before?.undo.done.length ?? 0) + 1);
  expect(b.save.kind).toBe("scheduled");
  expect(r.effects).toContainEqual({
    kind: "startTimer",
    id: `autosave:${b.id}`,
    ms: s.config.autosave.delayMs,
  });
  expect(r.effects.some((e) => e.kind === "patchFrontmatter")).toBe(false);
  expect(toasts(r.state)).toContain(
    `${PATH}: - status: todo # next up / + status: doing # next up`,
  );
  // One `u` takes back the property change alone.
  const undone = run(r.state, key("u")).state;
  const back = fullText(bufferForPath(undone, PATH)?.text as never);
  expect(back).toContain("status: todo # next up\n");
  expect(back).toEndWith("# Write repor");
});

test("a property change on a closed note is sent to the write queue with the shown value", () => {
  const s = run(fresh(), indexed()).state;
  const r = writeProperty(
    s,
    PATH,
    { set: "status", value: "doing" },
    "todo",
    NOW,
    reg,
  );
  expect(r.effects).toEqual([
    {
      kind: "patchFrontmatter",
      path: PATH,
      patch: { set: "status", value: "doing" },
      expected: "todo",
    },
  ]);
  expect(r.state).toBe(s);
});

test("a property the open note cannot take is refused without an edit", () => {
  const broken = "---\nstatus: [todo\n---\n# Broken\n";
  const s = run(fresh(), {
    type: "fileLoaded",
    path: PATH,
    file: textFile(broken),
  }).state;
  const r = writeProperty(
    s,
    PATH,
    { set: "status", value: "doing" },
    "todo",
    NOW,
    reg,
  );
  expect(bufferForPath(r.state, PATH)?.text).toBe(
    bufferForPath(s, PATH)?.text as never,
  );
  expect(r.state.notifications.toasts.at(-1)?.level).toBe("error");
});

test("a written patch updates the index and shows the change", () => {
  const plain = "---\nstatus: todo\n---\n# Plain\n";
  const s = run(fresh(), indexed({ "tasks/plain.md": plain })).state;
  const text = "---\nstatus: doing\n---\n# Plain\n";
  const r = onFrontmatterPatched(s, {
    type: "frontmatterPatched",
    path: "tasks/plain.md",
    ok: true,
    text,
    stamp: stamp(7),
    removed: ["status: todo"],
    added: ["status: doing"],
  });
  expect(
    r.state.index.ix.summaries.get("tasks/plain.md")?.frontmatter.status,
  ).toBe("doing");
  expect(toasts(r.state)).toEqual([
    "tasks/plain.md: - status: todo / + status: doing",
  ]);
  expect(r.state.notifications.toasts[0]?.level).toBe("info");
  expect(r.effects).not.toContainEqual({
    kind: "read",
    path: "tasks/plain.md",
  });

  // Opened while the patch was written: the buffer reads the patched file.
  const opened = run(s, {
    type: "fileLoaded",
    path: "tasks/plain.md",
    file: textFile(plain, 1),
  }).state;
  const reread = onFrontmatterPatched(opened, {
    type: "frontmatterPatched",
    path: "tasks/plain.md",
    ok: true,
    text,
    stamp: stamp(7),
    removed: ["status: todo"],
    added: ["status: doing"],
  });
  expect(reread.effects).toContainEqual({
    kind: "read",
    path: "tasks/plain.md",
  });
});

test("a refused patch leaves the index at the disk value", () => {
  const s = run(fresh(), indexed()).state;
  const r = onFrontmatterPatched(s, {
    type: "frontmatterPatched",
    path: PATH,
    ok: false,
    removed: [],
    added: [],
    reason: "changed on disk",
  });
  expect(r.state.index.ix).toBe(s.index.ix);
  expect(r.state.notifications.toasts).toEqual([
    {
      id: 1,
      level: "error",
      text: `not written: ${PATH} (changed on disk)`,
    },
  ]);
});

test("the reducer routes a patch answer", () => {
  const s = run(fresh(), indexed()).state;
  const text = NOTE.replace("todo", "doing");
  const r = run(s, {
    type: "frontmatterPatched",
    path: PATH,
    ok: true,
    text,
    stamp: stamp(3),
    removed: ["status: todo # next up"],
    added: ["status: doing # next up"],
  });
  expect(r.state.index.ix.summaries.get(PATH)).toEqual(
    expect.objectContaining({
      frontmatter: noteSummary(PATH, text).frontmatter,
    }),
  );
});
