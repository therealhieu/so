import { expect, test } from "bun:test";
import {
  fresh,
  openBuffer,
  testRegistries,
  textFile,
} from "../../../test/support/state";
import { splitKeys } from "../kernel/vim/keys";
import { frontmatterValue } from "../lang/markdown/frontmatter-patch";
import { activeBuffer, activeWindow, fullText } from "./buffers";
import { newNotePath, newNoteTitleError } from "./explorer";
import { pickerSources } from "./picker";
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

const TEMPLATE = "---\ntags: [meeting]\n---\n# {{title}} {{date}}\n";

/** `note.md` open with `text`, the templates indexed, and `<leader>nt` pressed. */
function templatePicker(text: string, cursorKeys = ""): Result {
  const opened = run(
    indexed(fresh(), ["templates/meeting.md", "templates/daily.md", "x.md"]),
    loaded("note.md", text),
    ...keys(cursorKeys),
  ).state;
  return run(opened, ...keys(" nt"));
}

const previewOf = (r: Result, text: string): Action => {
  const read = r.effects.find((e) => e.kind === "readPreview");
  if (read?.kind !== "readPreview") throw new Error("no preview read");
  return {
    type: "previewLoaded",
    id: read.id,
    path: read.path,
    result: textFile(text),
  };
};

const noteText = (s: AppState) => {
  const b = activeBuffer(s);
  return b === undefined ? undefined : fullText(b.text);
};

test("the template picker lists the templates folder and previews the first", () => {
  const r = templatePicker("hello");
  expect(r.state.overlay).toMatchObject({
    kind: "picker",
    picker: {
      source: "templates",
      items: [
        expect.objectContaining({ path: "templates/daily.md" }),
        expect.objectContaining({ path: "templates/meeting.md" }),
      ],
    },
  });
  expect(r.effects).toContainEqual(
    expect.objectContaining({
      kind: "readPreview",
      path: "templates/daily.md",
    }),
  );
});

test("a template inserted at the start of a note goes in whole, in one undo step", () => {
  const r = templatePicker("hello");
  const picked = run(r.state, ...keys("<C-n>"));
  const s = run(
    picked.state,
    previewOf(picked, TEMPLATE),
    ...keys("<CR>"),
  ).state;
  expect(s.overlay.kind).toBe("none");
  expect(noteText(s)).toBe(
    "---\ntags: [meeting]\n---\n# note 2026-10-03\nhello",
  );
  expect(noteText(run(s, ...keys("u")).state)).toBe("hello");
});

test("inserting a template mid-note merges its properties and undoes in one step", () => {
  const original = "---\ntags: [work]\nstatus: open\n---\nbody";
  const r = templatePicker(original, "G");
  const picked = run(r.state, ...keys("<C-n>"));
  const s = run(
    picked.state,
    previewOf(picked, TEMPLATE),
    ...keys("<CR>"),
  ).state;
  const text = noteText(s) ?? "";
  expect(text.endsWith("---\n# note 2026-10-03\nbody")).toBe(true);
  expect(text.split("---\n").length).toBe(3);
  expect(frontmatterValue(text, "tags")).toEqual(["work", "meeting"]);
  expect(frontmatterValue(text, "status")).toBe("open");
  expect(activeWindow(s)?.content.cursor.line).toBe(
    text.split("\n").length - 1,
  );
  expect(noteText(run(s, ...keys("u")).state)).toBe(original);
});

test("accepting before the template loads keeps the picker open", () => {
  const r = templatePicker("hello");
  const s = run(r.state, ...keys("<CR>")).state;
  expect(s.overlay.kind).toBe("picker");
  expect(s.notifications.message?.text).toBe("loading template…");
  expect(noteText(s)).toBe("hello");
});

test("the template preview shows the source, a marker, then the expansion", () => {
  const r = templatePicker("hello");
  const s = run(r.state, previewOf(r, "# {{title}}\n")).state;
  const p = s.overlay.kind === "picker" ? s.overlay.picker : undefined;
  const item = p?.items[p.selected];
  const file = p?.preview?.file;
  if (p === undefined || item === undefined || file === undefined)
    throw new Error("no loaded preview");
  const lines = pickerSources.templates?.render?.(s, item, file) ?? [];
  expect(lines.map((l) => l.text)).toEqual(["# {{title}}", "▸", "# note"]);
  expect(lines[0]?.ranges).toEqual([{ from: 2, to: 11, style: "floatMatch" }]);
});

test("template insertion is a Markdown command", () => {
  const s = run(
    indexed(fresh(), ["templates/meeting.md"]),
    loaded("app.ts", "const a = 1;"),
    ...keys(":template.insert<CR>"),
  ).state;
  expect(s.overlay.kind).toBe("none");
  expect(s.notifications.message?.text).toBe(
    "not available for typescript files",
  );
});

const prompt = (s: AppState) =>
  s.overlay.kind === "prompt" ? s.overlay.prompt : undefined;

function newNotePrompt(): AppState {
  return run(
    indexed(fresh(), ["templates/meeting.md"]),
    loaded("index.md", "# Index"),
    ...keys(" nn"),
  ).state;
}

test("<leader>nn asks for a new note's title", () => {
  expect(prompt(newNotePrompt())).toEqual({
    kind: "input",
    title: "New note",
    value: "",
    newNote: true,
  });
});

test("new-note titles that leave the workspace are refused inline", () => {
  const s = newNotePrompt();
  for (const typed of ["../x", "/x", "a/./b", "a//b"]) {
    const r = run(s, ...keys(typed), ...keys("<CR>"));
    expect(prompt(r.state)?.invalid).toBeDefined();
    expect(r.state.overlay.kind).toBe("prompt");
    expect(r.effects.some((e) => e.kind === "createNote")).toBe(false);
  }
  const cleared = run(s, ...keys("a<BS>")).state;
  expect(prompt(cleared)?.invalid).toBe("title is empty");
  expect(run(cleared, ...keys("<CR>")).state.overlay.kind).toBe("prompt");
  expect(newNoteTitleError("a/b")).toBeUndefined();
  expect(newNotePath("a/b")).toBe("a/b.md");
  expect(newNotePath(" Garden plan.md ")).toBe("Garden plan.md");
});

test("a new note's template is chosen with the blank note first", () => {
  // Each step starts from a fresh chooser: toMatchObject may rewrite what it inspects.
  const chooser = () => run(newNotePrompt(), ...keys("a/b<CR>")).state;
  expect(chooser().overlay).toMatchObject({
    kind: "picker",
    picker: {
      source: "newNoteTemplates",
      arg: "a/b.md",
      items: [
        expect.objectContaining({ label: "(blank note)" }),
        expect.objectContaining({ path: "templates/meeting.md" }),
      ],
    },
  });
  const blank = run(chooser(), ...keys("<CR>"));
  expect(blank.state.overlay.kind).toBe("none");
  expect(blank.effects).toContainEqual({
    kind: "createNote",
    path: "a/b.md",
    vars: {
      title: "b",
      at: expect.objectContaining({ year: 2026, month: 10, day: 3 }),
    },
    after: "insert",
    reason: "new",
  });
  const templated = run(chooser(), ...keys("<C-n><CR>"));
  expect(templated.effects).toContainEqual(
    expect.objectContaining({
      kind: "createNote",
      path: "a/b.md",
      template: "templates/meeting.md",
      after: "insert",
      reason: "new",
    }),
  );
});

test("Esc at either step creates nothing", () => {
  const atTitle = run(newNotePrompt(), ...keys("x<Esc>"));
  expect(atTitle.state.overlay.kind).toBe("none");
  const atTemplate = run(newNotePrompt(), ...keys("x<CR><Esc>"));
  expect(atTemplate.state.overlay.kind).toBe("none");
  for (const r of [atTitle, atTemplate])
    expect(r.effects.some((e) => e.kind === "createNote")).toBe(false);
});

test("a new note with an existing name is refused and not opened", () => {
  const s = newNotePrompt();
  const r = run(
    { ...s, overlay: { kind: "none" } },
    created("a/b.md", { outcome: "exists", reason: "new", after: "insert" }),
  );
  expect(r.effects.some((e) => e.kind === "read")).toBe(false);
  expect(activeBuffer(r.state)?.path).toBe("index.md");
  expect(r.state.notifications.toasts).toContainEqual(
    expect.objectContaining({
      level: "error",
      text: "E13: File exists (a/b.md)",
    }),
  );
});
