import { expect, test } from "bun:test";
import {
  fresh,
  openBuffer,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import { activeBuffer, activeWindow, fullText } from "./buffers";
import type { Action, AppState, Effect, Result } from "./types";
import { createUpdate } from "./update";

const reg = testRegistries();
const update = createUpdate(reg);
/** Saturday 2026-10-03 09:05 in the local time zone. */
const NOW = new Date(2026, 9, 3, 9, 5).getTime();

function run(s: AppState, ...actions: Action[]): Result {
  const effects: Effect[] = [];
  for (const a of actions) {
    const r = update(s, a);
    s = r.state;
    effects.push(...r.effects);
  }
  return { state: s, effects };
}

const keys = (seq: string): Action[] =>
  splitKeys(seq).map((key) => ({ type: "key", key, now: NOW }));
const ex = (cmd: string) => keys(`:${cmd}<CR>`);

const indexed = (s: AppState, files: string[]): AppState =>
  update(s, {
    type: "indexBatch",
    summaries: [],
    files,
    done: 0,
    total: 0,
  }).state;

const created = (
  path: string,
  patch: Partial<Extract<Action, { type: "noteCreated" }>> = {},
): Action => ({
  type: "noteCreated",
  path,
  outcome: "created",
  template: "used",
  templatePath: "templates/daily.md",
  after: "firstTask",
  reason: "daily",
  ...patch,
});

const loaded = (path: string, text: string): Action => ({
  type: "fileLoaded",
  path,
  file: textFile(text),
});

const toasts = (s: AppState) => s.notifications.toasts.map((t) => t.text);

test(":Today with no daily note emits one exclusive create from the daily template", () => {
  const r = run(fresh(), ...ex("Today"));
  const creates = r.effects.filter((e) => e.kind === "createNote");
  expect(creates).toHaveLength(1);
  expect(creates[0]).toMatchObject({
    kind: "createNote",
    path: "daily/2026-10-03.md",
    template: "templates/daily.md",
    fallback: "# {{date}}",
    vars: {
      title: "2026-10-03",
      at: { year: 2026, month: 10, day: 3, hour: 9, minute: 5 },
    },
    after: "firstTask",
    reason: "daily",
  });
});

test(":Today opens a case-variant daily note instead of creating one", () => {
  const s = indexed(fresh(), ["Daily/2026-10-03.MD"]);
  const r = run(s, ...ex("Today"));
  expect(r.effects.some((e) => e.kind === "createNote")).toBe(false);
  expect(r.effects).toContainEqual({
    kind: "read",
    path: "Daily/2026-10-03.MD",
  });
});

test(":Yesterday and :Tomorrow step from the open daily note, else from today", () => {
  const fromToday = run(fresh(), ...ex("Tomorrow"));
  expect(fromToday.effects).toContainEqual(
    expect.objectContaining({
      kind: "createNote",
      path: "daily/2026-10-04.md",
    }),
  );
  const s = openBuffer(fresh(), "daily/2026-09-30.md", "# old");
  const back = run(s, ...ex("Yesterday"));
  expect(back.effects).toContainEqual(
    expect.objectContaining({
      kind: "createNote",
      path: "daily/2026-09-29.md",
      vars: expect.objectContaining({
        title: "2026-09-29",
        at: expect.objectContaining({ day: 29, hour: 9, minute: 5 }),
      }),
    }),
  );
});

test("<leader>nd runs :Today", () => {
  const r = run(fresh(), loaded("index.md", "# Index"), ...keys(" nd"));
  expect(r.effects).toContainEqual(
    expect.objectContaining({
      kind: "createNote",
      path: "daily/2026-10-03.md",
    }),
  );
});

test("a created daily note opens with the cursor on the first unchecked task", () => {
  const path = "daily/2026-10-03.md";
  const r = run(fresh(), created(path));
  expect(r.effects).toContainEqual({ kind: "read", path });
  expect(toasts(r.state)).toContain(
    "Created daily/2026-10-03.md from templates/daily.md",
  );
  const s = update(r.state, loaded(path, "# x\n- [x] a\n- [ ] b\n")).state;
  expect(activeBuffer(s)?.path).toBe(path);
  expect(activeWindow(s)?.content.cursor).toEqual({ line: 2, col: 6 });
  expect(s.windows.restore).toBeUndefined();
});

test("a daily note without an open task opens at its end", () => {
  const path = "daily/2026-10-03.md";
  const s = run(
    fresh(),
    created(path, { outcome: "exists" }),
    loaded(path, "# x\n\ntext"),
  ).state;
  expect(activeWindow(s)?.content.cursor).toEqual({ line: 2, col: 3 });
  expect(toasts(s)).toEqual([]);
});

test("an already open daily note is placed at once", () => {
  const path = "daily/2026-10-03.md";
  const s = openBuffer(fresh(), path, "- [x] a\n- [ ] b");
  const r = run(s, created(path, { outcome: "exists" }));
  expect(r.effects.some((e) => e.kind === "read")).toBe(false);
  expect(activeWindow(r.state)?.content.cursor).toEqual({ line: 1, col: 6 });
});

test("a note created for insert opens in Insert mode at its end", () => {
  const path = "Meeting.md";
  const s = run(
    fresh(),
    created(path, { after: "insert", reason: "new", template: "none" }),
    loaded(path, "# Meeting\n\nnotes"),
  ).state;
  expect(s.vim.mode).toBe("insert");
  expect(activeWindow(s)?.content.cursor).toEqual({ line: 2, col: 5 });
  const typed = run(s, ...keys("!<Esc>")).state;
  expect(fullText(activeBuffer(typed)?.text ?? (undefined as never))).toBe(
    "# Meeting\n\nnotes!",
  );
});

test("an unreadable template still opens the empty note and names the template", () => {
  const path = "daily/2026-10-03.md";
  const r = run(fresh(), created(path, { template: "unreadable" }));
  expect(r.effects).toContainEqual({ kind: "read", path });
  expect(r.state.notifications.toasts).toContainEqual(
    expect.objectContaining({
      level: "error",
      text: expect.stringContaining("templates/daily.md"),
    }),
  );
});

test("a failed create shows an error and opens nothing", () => {
  const r = run(
    fresh(),
    created("daily/2026-10-03.md", {
      outcome: "failed",
      failure: "EACCES: permission denied",
    }),
  );
  expect(r.effects.some((e) => e.kind === "read")).toBe(false);
  expect(r.state.notifications.toasts).toContainEqual(
    expect.objectContaining({
      level: "error",
      text: "cannot create daily/2026-10-03.md: EACCES: permission denied",
    }),
  );
});
