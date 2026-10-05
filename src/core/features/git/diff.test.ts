import { expect, test } from "bun:test";
import { diffLines, type Hunk, MAX_EDIT } from "./diff";
import { normalizeIndexText } from "./index-text";

const lines = (n: number, tag = "l") =>
  Array.from({ length: n }, (_, i) => `${tag}${i}`);

/** Put each hunk's old lines back over its new range. */
function revert(cur: readonly string[], hunks: readonly Hunk[]): string[] {
  const out = [...cur];
  for (const h of [...hunks].reverse())
    out.splice(h.new.start, h.new.count, ...h.oldLines);
  return out;
}

test("one change, one add, and one delete become three hunks with exact ranges", () => {
  const old = lines(10);
  const cur = ["l0", "l1", "L2", "l3", "l4", "new", "l5", "l6", "l8", "l9"];
  const hunks = diffLines(old, cur);
  expect(hunks).toEqual([
    {
      kind: "change",
      old: { start: 2, count: 1 },
      new: { start: 2, count: 1 },
      oldLines: ["l2"],
    },
    {
      kind: "add",
      old: { start: 5, count: 0 },
      new: { start: 5, count: 1 },
      oldLines: [],
    },
    {
      kind: "delete",
      old: { start: 7, count: 1 },
      new: { start: 8, count: 0 },
      oldLines: ["l7"],
    },
  ]);
  expect(revert(cur, hunks)).toEqual(old);
});

test("equal texts have no hunks", () => {
  expect(diffLines(lines(5), lines(5))).toEqual([]);
  expect(diffLines([], [])).toEqual([]);
});

test("a deletion at the top and a change that also removes lines are classified", () => {
  const old = lines(8);
  const cur = ["l2", "l3", "X", "l7"];
  const hunks = diffLines(old, cur);
  expect(hunks).toEqual([
    {
      kind: "topdelete",
      old: { start: 0, count: 2 },
      new: { start: 0, count: 0 },
      oldLines: ["l0", "l1"],
    },
    {
      kind: "changedelete",
      old: { start: 4, count: 3 },
      new: { start: 2, count: 1 },
      oldLines: ["l4", "l5", "l6"],
    },
  ]);
  expect(revert(cur, hunks)).toEqual(old);
});

test("a change that adds lines stays a change", () => {
  const hunks = diffLines(["a", "b", "c"], ["a", "B1", "B2", "c"]);
  expect(hunks).toEqual([
    {
      kind: "change",
      old: { start: 1, count: 1 },
      new: { start: 1, count: 2 },
      oldLines: ["b"],
    },
  ]);
});

test("an untracked file is one untracked hunk over every line", () => {
  expect(diffLines([], ["a", "b", "c"], { untracked: true })).toEqual([
    {
      kind: "untracked",
      old: { start: 0, count: 0 },
      new: { start: 0, count: 3 },
      oldLines: [],
    },
  ]);
});

test("scattered edits keep their own hunks and revert to the old text", () => {
  const old = lines(200);
  const cur = old.flatMap((l, i) =>
    i % 17 === 3
      ? []
      : i % 23 === 5
        ? [l, `+${i}`]
        : i % 31 === 7
          ? [`~${i}`]
          : [l],
  );
  const hunks = diffLines(old, cur);
  expect(hunks.length).toBeGreaterThan(10);
  for (let i = 1; i < hunks.length; i++) {
    const [a, b] = [hunks[i - 1], hunks[i]];
    expect(b?.old.start).toBeGreaterThan(
      (a?.old.start ?? 0) + (a?.old.count ?? 0),
    );
    expect(b?.new.start).toBeGreaterThan(
      (a?.new.start ?? 0) + (a?.new.count ?? 0),
    );
  }
  expect(revert(cur, hunks)).toEqual(old);
});

test("diffs with nothing in common or too many edits fall back to one change hunk quickly", () => {
  const old = lines(5000);
  const whole: Hunk[] = [
    {
      kind: "change",
      old: { start: 0, count: 5000 },
      new: { start: 0, count: 5000 },
      oldLines: old,
    },
  ];
  const disjoint = lines(5000, "x");
  let t = performance.now();
  let hunks = diffLines(old, disjoint);
  expect(performance.now() - t).toBeLessThan(50);
  expect(hunks).toEqual(whole);

  // Every odd line edited: about 5,000 edits, well past the cap.
  const scattered = old.map((l, i) => (i % 2 === 1 ? `x${i}` : l));
  t = performance.now();
  hunks = diffLines(old, scattered);
  expect(performance.now() - t).toBeLessThan(50);
  expect(MAX_EDIT).toBe(2000);
  expect(hunks).toEqual([
    {
      kind: "change",
      old: { start: 1, count: 4999 },
      new: { start: 1, count: 4999 },
      oldLines: old.slice(1),
    },
  ]);

  // Same lines in reverse order: no edit count shows up front, so the edit
  // search runs until the cap. Uncapped, this takes about 200 ms on an idle laptop.
  const reversed = [...old].reverse();
  t = performance.now();
  hunks = diffLines(old, reversed);
  expect(performance.now() - t).toBeLessThan(150);
  expect(hunks).toEqual(whole);
});

test("text typed into a note committed empty is one add hunk", () => {
  const empty = normalizeIndexText("", "lf").lines;
  expect(diffLines(empty, ["hello"])).toEqual([
    {
      kind: "add",
      old: { start: 0, count: 0 },
      new: { start: 0, count: 1 },
      oldLines: [],
    },
  ]);
  expect(diffLines(empty, ["", "hello"])).toEqual([
    {
      kind: "add",
      old: { start: 0, count: 0 },
      new: { start: 0, count: 2 },
      oldLines: [],
    },
  ]);
  expect(diffLines(empty, [""])).toEqual([]);
});
