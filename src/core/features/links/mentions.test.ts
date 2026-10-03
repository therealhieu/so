import { expect, test } from "bun:test";
import { scanDoc } from "../../lang/markdown/scan";
import { linkMentionEdit } from "./mentions";
import { applySummaries, emptyIndex } from "./note-index";
import { summarize } from "./summarize";

const ix = applySummaries(
  emptyIndex(),
  ["plan.md", "notes/x.md", "archive/plan.md"].map((p) =>
    summarize(p, 1, scanDoc("")),
  ),
);
const range = { start: { line: 2, col: 4 }, end: { line: 2, col: 8 } };

test("linking a mention edits only its span", () => {
  expect(
    linkMentionEdit(ix, "plan.md", { path: "notes/x.md", range, text: "Plan" }),
  ).toEqual({
    path: "notes/x.md",
    edits: [{ range, expected: "Plan", text: "[[plan|Plan]]" }],
  });
  expect(
    linkMentionEdit(ix, "plan.md", { path: "notes/x.md", range, text: "plan" }),
  ).toEqual({
    path: "notes/x.md",
    edits: [{ range, expected: "plan", text: "[[plan]]" }],
  });
});

test("a mention of an ambiguous name gets a link that resolves to its target", () => {
  expect(
    linkMentionEdit(ix, "archive/plan.md", {
      path: "notes/x.md",
      range,
      text: "plan",
    }).edits[0]?.text,
  ).toBe("[[archive/plan]]");
});
