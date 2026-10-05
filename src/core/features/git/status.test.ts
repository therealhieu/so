import { expect, test } from "bun:test";
import { explorerMarkers, type FileStatus, parseStatus } from "./status";

const OID = "1234567890abcdef1234567890abcdef12345678";
const H = (c: string) => c.repeat(40);

const Z = [
  `# branch.oid ${OID}`,
  "# branch.head (detached)",
  `1 .M N... 100644 100644 100644 ${H("a")} ${H("b")} notes/a.md`,
  `2 R. N... 100644 100644 100644 ${H("c")} ${H("d")} R100 notes/b.md`,
  "notes/old-b.md",
  `u UU N... 100644 100644 100644 100644 ${H("1")} ${H("2")} ${H("3")} notes/c.md`,
  "? notes/new/x.md",
  `1 .M S.M. 160000 160000 160000 ${H("e")} ${H("e")} notes/sub`,
  `1 M. N... 100644 100644 100644 ${H("f")} ${H("9")} notes/with space.md`,
  `1 M. N... 100644 100644 100644 ${H("f")} ${H("9")} other/out.md`,
  `2 R. N... 100644 100644 100644 ${H("c")} ${H("d")} R100 other/moved.md`,
  "notes/moved-out.md",
  "? README.md",
  "",
].join("\0");

const clean: Omit<FileStatus, "index" | "worktree"> = {
  conflict: false,
  untracked: false,
  submodule: false,
};

test("status keeps workspace-relative paths and consumes rename origins", () => {
  const st = parseStatus(Z, "notes/");
  expect([...st.files.keys()].sort()).toEqual([
    "a.md",
    "b.md",
    "c.md",
    "moved-out.md",
    "new/x.md",
    "old-b.md",
    "sub",
    "with space.md",
  ]);
  expect(st.head).toEqual({ kind: "detached", short: "1234567" });
  expect(st.op).toBeUndefined();
  expect(st.files.get("a.md")).toEqual({
    index: ".",
    worktree: "M",
    ...clean,
    hI: H("b"),
  });
  expect(st.files.get("b.md")).toEqual({
    index: "R",
    worktree: ".",
    ...clean,
    hI: H("d"),
  });
  expect(st.files.get("old-b.md")).toEqual({
    index: "D",
    worktree: ".",
    ...clean,
  });
  expect(st.files.get("c.md")).toEqual({
    index: "U",
    worktree: "U",
    ...clean,
    conflict: true,
  });
  expect(st.files.get("new/x.md")).toEqual({
    index: "?",
    worktree: "?",
    ...clean,
    untracked: true,
  });
  expect(st.files.get("sub")).toEqual({
    index: ".",
    worktree: "M",
    ...clean,
    submodule: true,
    hI: H("e"),
  });
});

test("status at the repository top keeps every path", () => {
  const st = parseStatus(Z, "");
  expect(st.files.has("other/out.md")).toBe(true);
  expect(st.files.has("notes/a.md")).toBe(true);
  expect(st.files.has("README.md")).toBe(true);
  expect(st.files.has("notes/moved-out.md")).toBe(true);
});

test("status reads a branch and an unborn head", () => {
  expect(
    parseStatus(`# branch.oid ${OID}\0# branch.head main\0`, "").head,
  ).toEqual({ kind: "branch", name: "main" });
  expect(
    parseStatus("# branch.oid (initial)\0# branch.head trunk\0", "").head,
  ).toEqual({ kind: "unborn", name: "trunk" });
});

const status = (...records: string[]) =>
  parseStatus(
    [`# branch.oid ${OID}`, "# branch.head main", ...records, ""].join("\0"),
    "",
  );
const tracked = (xy: string, path: string) =>
  `1 ${xy} N... 100644 100644 100644 ${H("a")} ${H("b")} ${path}`;

test("each row gets one marker and staged-and-modified reads modified", () => {
  const m = explorerMarkers(
    status(
      `u UU N... 100644 100644 100644 100644 ${H("1")} ${H("2")} ${H("3")} c.md`,
      "? u.md",
      tracked("MM", "both.md"),
      tracked(".M", "work.md"),
      tracked("M.", "staged.md"),
      tracked("A.", "added.md"),
    ),
  );
  expect(Object.fromEntries(m)).toEqual({
    "c.md": "conflict",
    "u.md": "untracked",
    "both.md": "modified",
    "work.md": "modified",
    "staged.md": "staged",
    "added.md": "staged",
  });
});

test("ancestor folders contain changes, including a deleted tracked file", () => {
  const st = status(
    tracked(".M", "a/b/c.md"),
    tracked(".D", "old/gone.md"),
    tracked("D.", "trash/deep/gone.md"),
    "? a/new.md",
  );
  const m = explorerMarkers(st);
  expect(Object.fromEntries(m)).toEqual({
    a: "contains",
    "a/b": "contains",
    "a/b/c.md": "modified",
    "a/new.md": "untracked",
    old: "contains",
    trash: "contains",
    "trash/deep": "contains",
  });
  expect(m.has("old/gone.md")).toBe(false);
  expect(explorerMarkers(st)).toBe(m);
});
