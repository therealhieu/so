import { expect, test } from "bun:test";
import { parse } from "yaml";
import { applySpanEdits } from "../../features/links/rename";
import {
  type FrontmatterPatch,
  frontmatterValue,
  mergeFrontmatter,
  type PatchResult,
  patchFrontmatter,
  seedFrontmatter,
  splitFrontmatter,
  yamlScalar,
} from "./frontmatter-patch";

const LINES = [
  "---",
  "# owner: me",
  'title: "Plan: Q4"  # quoted',
  '"due date": 2026-10-05',
  "status: todo   # set by me",
  "tags:",
  "  - work",
  "  - meeting # last",
  "priority: 2",
  "---",
  "Body: status: todo",
  "",
];
const CRLF = LINES.join("\r\n");
const lf = (text: string) => text.replaceAll("\r\n", "\n");

/** `LINES` with `count` lines at `at` replaced by `lines`, joined with CRLF. */
function edited(at: number, count: number, ...lines: string[]): string {
  const out = [...LINES];
  out.splice(at, count, ...lines);
  return out.join("\r\n");
}

function properties(text: string): unknown {
  const t = lf(text);
  if (!t.startsWith("---\n")) return undefined;
  return parse(t.slice(4, t.indexOf("\n---", 3)));
}

/** The patched text, after checking that the edits turn the LF text into it too. */
function patched(text: string, patch: FrontmatterPatch): string {
  const r = patchFrontmatter(text, patch);
  if (!r.ok) throw new Error(r.reason);
  expect(applySpanEdits(lf(text), r.edits)).toBe(lf(r.text));
  return r.text;
}

function ok(r: PatchResult) {
  if (!r.ok) throw new Error(r.reason);
  return r;
}

test("setting one key changes only that key's lines and keeps comments and CRLF", () => {
  const r = ok(patchFrontmatter(CRLF, { set: "status", value: "doing" }));
  expect(r.text).toBe(edited(4, 1, "status: doing   # set by me"));
  expect(r.removed).toEqual(["status: todo   # set by me"]);
  expect(r.added).toEqual(["status: doing   # set by me"]);
  expect(applySpanEdits(lf(CRLF), r.edits)).toBe(lf(r.text));
  expect(properties(r.text)).toEqual({
    ...(properties(CRLF) as object),
    status: "doing",
  });
});

test("keys match exactly first, then without regard to case", () => {
  expect(patched(CRLF, { set: "STATUS", value: "done" })).toBe(
    edited(4, 1, "status: done   # set by me"),
  );
  const text = "---\nStatus: a\nstatus: b\n---\n";
  expect(patched(text, { set: "status", value: "c" })).toBe(
    "---\nStatus: a\nstatus: c\n---\n",
  );
});

test("a quoted key keeps its quotes and a date is written as a date", () => {
  expect(
    patched(CRLF, { set: "due date", value: "2026-10-12", date: true }),
  ).toBe(edited(3, 1, '"due date": 2026-10-12'));
  expect(patched(CRLF, { set: "due date", value: "2026-10-12" })).toBe(
    edited(3, 1, '"due date": "2026-10-12"'),
  );
});

test("setting a list replaces the whole list and keeps its indent", () => {
  const r = ok(
    patchFrontmatter(CRLF, { set: "tags", value: ["work", "urgent"] }),
  );
  expect(r.text).toBe(edited(6, 2, "  - work", "  - urgent # last"));
  expect(r.removed).toEqual(["tags:", "  - work", "  - meeting # last"]);
  expect(r.added).toEqual(["tags:", "  - work", "  - urgent # last"]);
  expect(applySpanEdits(lf(CRLF), r.edits)).toBe(lf(r.text));
  expect(patched("---\ntags:\n- a\n---\n", { set: "tags", value: ["b"] })).toBe(
    "---\ntags:\n- b\n---\n",
  );
});

test("a value can change between a scalar and a list", () => {
  expect(patched(CRLF, { set: "tags", value: "solo" })).toBe(
    edited(5, 3, "tags: solo # last"),
  );
  expect(patched(CRLF, { set: "priority", value: ["a", "b"] })).toBe(
    edited(8, 1, "priority:", "  - a", "  - b"),
  );
  expect(patched("---\nk: [a, b]\n---\n", { set: "k", value: ["c"] })).toBe(
    "---\nk:\n  - c\n---\n",
  );
});

test("empty values are filled after the colon and null is written empty", () => {
  const text = "---\nempty:\nnote: # c\n---\n";
  expect(patched(text, { set: "empty", value: "x" })).toBe(
    "---\nempty: x\nnote: # c\n---\n",
  );
  expect(patched(text, { set: "note", value: 3 })).toBe(
    "---\nempty:\nnote: 3 # c\n---\n",
  );
  expect(patched("---\nk: v\n---\n", { set: "k", value: null })).toBe(
    "---\nk:\n---\n",
  );
});

test("a new key is appended before the closing line", () => {
  const r = ok(patchFrontmatter(CRLF, { set: "owner", value: "me" }));
  expect(r.text).toBe(edited(9, 0, "owner: me"));
  expect(r.removed).toEqual([]);
  expect(r.added).toEqual(["owner: me"]);
  expect(applySpanEdits(lf(CRLF), r.edits)).toBe(lf(r.text));
  expect(patched(CRLF, { set: "next step", value: ["a"] })).toBe(
    edited(9, 0, "next step:", "  - a"),
  );
  expect(patched(CRLF, { set: "a: b", value: true })).toBe(
    edited(9, 0, '"a: b": true'),
  );
  expect(patched("---\n---\nbody", { set: "k", value: 1 })).toBe(
    "---\nk: 1\n---\nbody",
  );
});

test("a new key in an indented block keeps the block's indent", () => {
  const next = patched("---\n  a: 1\n---\n", { set: "b", value: 2 });
  expect(next).toBe("---\n  a: 1\n  b: 2\n---\n");
  expect(properties(next)).toEqual({ a: 1, b: 2 });
  const list = patched("---\n  a: 1\n---\n", { set: "tags", value: ["x"] });
  expect(properties(list)).toEqual({ a: 1, tags: ["x"] });
});

test("removing a key deletes only its lines", () => {
  const r = ok(patchFrontmatter(CRLF, { remove: "due date" }));
  expect(r.text).toBe(edited(3, 1));
  expect(r.removed).toEqual(['"due date": 2026-10-05']);
  expect(r.added).toEqual([]);
  expect(applySpanEdits(lf(CRLF), r.edits)).toBe(lf(r.text));
  expect(patched(CRLF, { remove: "tags" })).toBe(edited(5, 3));
  expect(patched(CRLF, { remove: "priority" })).toBe(edited(8, 1));
});

test("removing the last key deletes the whole block", () => {
  expect(patched("---\nk: v\n---\nbody", { remove: "k" })).toBe("body");
  expect(patched("---\r\nk: v # c\r\n---\r\nbody\r\n", { remove: "k" })).toBe(
    "body\r\n",
  );
  expect(patched("---\nk: v\n---", { remove: "k" })).toBe("");
});

test("setting a key on a note without frontmatter adds a block", () => {
  const r = ok(patchFrontmatter("body\n", { set: "status", value: "open" }));
  expect(r.text).toBe("---\nstatus: open\n---\nbody\n");
  expect(r.edits).toEqual([
    {
      range: { start: { line: 0, col: 0 }, end: { line: 0, col: 0 } },
      expected: "",
      text: "---\nstatus: open\n---\n",
    },
  ]);
  expect(r.added).toEqual(["status: open"]);
  expect(patched("body\r\nmore\r\n", { set: "k", value: 1 })).toBe(
    "---\r\nk: 1\r\n---\r\nbody\r\nmore\r\n",
  );
  expect(patched("", { set: "k", value: 1 })).toBe("---\nk: 1\n---\n");
});

test("patches that change nothing produce no edits", () => {
  for (const [text, patch] of [
    ["body", { remove: "k" }],
    [CRLF, { remove: "missing" }],
    [CRLF, { set: "status", value: "todo" }],
  ] as const) {
    const r = ok(patchFrontmatter(text, patch));
    expect(r.edits).toEqual([]);
    expect(r.text).toBe(text);
  }
});

test("frontmatter that is not a block of properties is refused", () => {
  for (const text of [
    "---\nk: [\n---\n",
    "---\nk: 1\nk: 2\n---\n",
    "---\n- a\n---\n",
    "---\n{a: 1}\n---\n",
  ])
    expect(patchFrontmatter(text, { set: "k", value: 3 }).ok).toBe(false);
});

test("text that would change type is quoted", () => {
  expect(yamlScalar("42", "")).toBe('"42"');
  expect(yamlScalar("true", "")).toBe('"true"');
  expect(yamlScalar("null", "")).toBe('"null"');
  expect(yamlScalar("2026-10-05", "")).toBe('"2026-10-05"');
  expect(yamlScalar("2026-10-05T10:30", "")).toBe('"2026-10-05T10:30"');
  expect(yamlScalar("", "")).toBe('""');
  expect(yamlScalar(" padded", "")).toBe('" padded"');
  expect(yamlScalar("a #b", "")).toBe('"a #b"');
  expect(yamlScalar("[[Link]]", "")).toBe('"[[Link]]"');
  expect(yamlScalar("two\nlines", "")).toBe('"two\\nlines"');
  expect(yamlScalar("plain text, C# and yes", "")).toBe(
    "plain text, C# and yes",
  );
});

test("text that YAML would read as an alias is quoted", () => {
  for (const text of ["*urgent*", "*a", "**bold**"]) {
    const rendered = yamlScalar(text, "");
    expect(rendered).toBe(JSON.stringify(text));
    expect(parse(`k: ${rendered}`)).toEqual({ k: text });
  }
  const r = ok(
    patchFrontmatter("---\na: 1 # c\nb: 2\n---\n", {
      set: "a",
      value: "**bold**",
    }),
  );
  expect(r.text).toBe('---\na: "**bold**" # c\nb: 2\n---\n');
});

test("frontmatter with an unresolved alias is unreadable, not a crash", () => {
  const text = "---\na: *x\n---\nbody\n";
  expect(frontmatterValue(text, "a")).toBeUndefined();
  expect(splitFrontmatter(text)).toEqual({ fm: undefined, body: text });
  expect(patchFrontmatter(text, { set: "b", value: 1 }).ok).toBe(false);
  expect(mergeFrontmatter(text, { b: 1 }).ok).toBe(false);
});

test("numbers, booleans, dates, and lists keep their Obsidian type", () => {
  expect(yamlScalar(42, "")).toBe("42");
  expect(yamlScalar(2.5, "")).toBe("2.5");
  expect(yamlScalar(true, "")).toBe("true");
  expect(yamlScalar(null, "")).toBe("");
  expect(yamlScalar("2026-10-05", "", true)).toBe("2026-10-05");
  expect(yamlScalar("soon", "", true)).toBe("soon");
  expect(yamlScalar(["a", "b"], "  ")).toBe("\n  - a\n  - b");
  expect(yamlScalar(["42", 42], "")).toBe('\n- "42"\n- 42');
  expect(yamlScalar([], "  ")).toBe("[]");
  for (const value of ["42", "true", "2026-10-05", 42, true, ["a", "1"]])
    expect(parse(`k: ${yamlScalar(value, "  ")}`)).toEqual({ k: value });
});

test("a property's value is read by key", () => {
  expect(frontmatterValue(CRLF, "status")).toBe("todo");
  expect(frontmatterValue(CRLF, "Due Date")).toBe("2026-10-05");
  expect(frontmatterValue(CRLF, "tags")).toEqual(["work", "meeting"]);
  expect(frontmatterValue(CRLF, "priority")).toBe(2);
  expect(frontmatterValue("---\nk:\n---\n", "k")).toBeNull();
  expect(frontmatterValue(CRLF, "missing")).toBeUndefined();
  expect(frontmatterValue("body", "status")).toBeUndefined();
  expect(frontmatterValue("---\nk: [\n---\n", "k")).toBeUndefined();
});

test("a template splits into its properties and body", () => {
  expect(
    splitFrontmatter("---\ntags: [meeting]\nstatus: draft\n---\n# {{title}}\n"),
  ).toEqual({
    fm: { tags: ["meeting"], status: "draft" },
    body: "# {{title}}\n",
  });
  expect(splitFrontmatter("---\r\n---\r\nBody")).toEqual({
    fm: {},
    body: "Body",
  });
  expect(splitFrontmatter("# {{title}}\n")).toEqual({
    fm: undefined,
    body: "# {{title}}\n",
  });
  expect(splitFrontmatter("---\nk: [\n---\nBody")).toEqual({
    fm: undefined,
    body: "---\nk: [\n---\nBody",
  });
});

test("merging template properties unions lists and keeps the note's scalars", () => {
  const note = "---\ntags:\n  - work\nstatus: open # keep\n---\nBody\n";
  const r = ok(
    mergeFrontmatter(note, {
      tags: ["meeting", "work"],
      status: "draft",
      owner: "me",
    }),
  );
  expect(r.text).toBe(
    "---\ntags:\n  - work\n  - meeting\nstatus: open # keep\nowner: me\n---\nBody\n",
  );
  expect(r.edits).toHaveLength(1);
  expect(applySpanEdits(note, r.edits)).toBe(r.text);
  expect(r.added).toEqual(["tags:", "  - work", "  - meeting", "owner: me"]);
  expect(r.removed).toEqual(["tags:", "  - work"]);
});

test("merging into a note without frontmatter creates a block", () => {
  const r = ok(
    mergeFrontmatter("Body\r\n", {
      tags: ["meeting"],
      due: "2026-10-05",
      status: "draft",
    }),
  );
  expect(r.text).toBe(
    "---\r\ntags:\r\n  - meeting\r\ndue: 2026-10-05\r\nstatus: draft\r\n---\r\nBody\r\n",
  );
  expect(applySpanEdits("Body\n", r.edits)).toBe(lf(r.text));
});

test("merging properties the note already has changes nothing", () => {
  const note = "---\ntags: [work]\nstatus: open\n---\n";
  const r = ok(mergeFrontmatter(note, { tags: ["work"], status: "x" }));
  expect(r.edits).toEqual([]);
  expect(r.text).toBe(note);
  expect(ok(mergeFrontmatter("Body", {})).edits).toEqual([]);
});

test("seedFrontmatter gives a blank note a block with the seeded properties", () => {
  expect(seedFrontmatter("", { status: "todo", tags: ["reading"] })).toBe(
    "---\nstatus: todo\ntags:\n  - reading\n---\n",
  );
});

test("seedFrontmatter replaces a template's value, adds to its lists, and keeps the body", () => {
  const text = "---\nstatus: draft\ntags: [idea]\n---\n# {{title}}\n";
  const out = seedFrontmatter(text, { status: "todo", tags: ["idea", "x"] });
  expect(properties(out)).toEqual({ status: "todo", tags: ["idea", "x"] });
  expect(out.endsWith("---\n# {{title}}\n")).toBe(true);
});

test("seedFrontmatter leaves text whose frontmatter cannot be read", () => {
  const text = "---\n: [\n---\nbody\n";
  expect(seedFrontmatter(text, { status: "todo" })).toBe(text);
});
