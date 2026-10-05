import { expect, test } from "bun:test";
import { parseBlame } from "./blame";

const SHA = "0b439dcb0d14b17811580d1e000f581c71bafdd9";
const ZERO = "0".repeat(40);

const porcelain = (
  sha: string,
  author: string,
  mail: string,
  summary: string,
) =>
  [
    `${sha} 1 1 1`,
    `author ${author}`,
    `author-mail ${mail}`,
    "author-time 1759600000",
    "author-tz +0700",
    `committer ${author}`,
    `committer-mail ${mail}`,
    "committer-time 1759600000",
    "committer-tz +0700",
    `summary ${summary}`,
    "filename notes/a.md",
    "\tone",
    "",
  ].join("\n");

test("a committed blame line exposes author, time, summary, and sha", () => {
  expect(
    parseBlame(porcelain(SHA, "hieu", "<hieu@example.com>", "Add notes")),
  ).toEqual({
    committed: true,
    sha: SHA,
    author: "hieu",
    time: 1759600000,
    summary: "Add notes",
  });
});

test("both not-committed sentinels read as uncommitted", () => {
  expect(
    parseBlame(
      porcelain(
        ZERO,
        "Not Committed Yet",
        "<not.committed.yet>",
        "Version of notes/a.md from notes/a.md",
      ),
    ),
  ).toEqual({ committed: false });
  expect(
    parseBlame(
      porcelain(
        ZERO,
        "External file (--contents)",
        "<external.file>",
        "Version of notes/a.md from standard input",
      ),
    ),
  ).toEqual({ committed: false });
});

test("each sentinel alone marks a line uncommitted", () => {
  expect(parseBlame(porcelain(SHA, "Not Committed Yet", "<a@b>", "s"))).toEqual(
    { committed: false },
  );
  expect(parseBlame(porcelain(SHA, "someone", "<external.file>", "s"))).toEqual(
    { committed: false },
  );
  expect(
    parseBlame(porcelain(ZERO, "hieu", "<hieu@example.com>", "s")),
  ).toEqual({ committed: false });
});
