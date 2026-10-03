import { expect, test } from "bun:test";
import { fuzzyScore, rankBy, SCORE } from "./fuzzy";

const ranked = (items: string[], query: string) =>
  rankBy(items, query, (s) => s).map((r) => r.item);

test("scoring uses fzf's published constants", () => {
  expect(SCORE).toEqual({
    match: 16,
    gapStart: -3,
    gapExtension: -1,
    boundary: 8,
    camel: 7,
    consecutive: 4,
    firstCharMultiplier: 2,
  });
});

test("word starts outrank scattered matches", () => {
  expect(
    ranked(["areas/side-projects.md", "projects/so-roadmap.md"], "srd"),
  ).toEqual(["projects/so-roadmap.md", "areas/side-projects.md"]);
  // s after "/", gap, r after "-", gap, d: 32 − 3 − 1 + 24 − 3 − 1 + 16.
  expect(fuzzyScore("projects/so-roadmap.md", "srd")).toEqual({
    score: 64,
    positions: [9, 12, 15],
  });
  // f at the start, gap, B after a lowercase letter: 32 − 3 − 1 + 23.
  expect(fuzzyScore("fooBar", "fb")?.score).toBe(51);
});

test("a command query ranks the backlinks panel title first", () => {
  const titles = [
    "Follow link",
    "Toggle backlinks panel",
    "Link this mention",
    "Toggle outline",
    "Headings in note",
    "Search backlinks of this note",
    "Tags",
    "Rename (update links)",
    "Move (update links)",
    "Save file",
    "Jump to older position",
    "Jump to newer position",
    "Jump list",
    "Previous buffer",
    "Command palette",
  ];
  expect(ranked(titles, "back")).toEqual([
    "Toggle backlinks panel",
    "Search backlinks of this note",
  ]);
});

test("an uppercase letter makes the query case-sensitive", () => {
  expect(fuzzyScore("plan.md", "Plan")).toBeNull();
  expect(fuzzyScore("Plan.md", "Plan")?.positions).toEqual([0, 1, 2, 3]);
  expect(ranked(["plan.md", "Plan.md", "other.md"], "plan")).toEqual([
    "Plan.md",
    "plan.md",
  ]);
});

test("equal scores go to the shorter text, then alphabetical order", () => {
  expect(ranked(["notes/x.md", "a/x.md", "b/x.md"], "x")).toEqual([
    "a/x.md",
    "b/x.md",
    "notes/x.md",
  ]);
});

test("an empty query keeps input order and a non-subsequence does not match", () => {
  expect(ranked(["b", "a"], "")).toEqual(["b", "a"]);
  expect(fuzzyScore("roadmap", "xyz")).toBeNull();
  expect(fuzzyScore("ab", "abc")).toBeNull();
});
