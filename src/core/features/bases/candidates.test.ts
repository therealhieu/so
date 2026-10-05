import { expect, test } from "bun:test";
import { scanDoc } from "../../lang/markdown/scan";
import { buildIndex } from "../links/note-index";
import { summarize } from "../links/summarize";
import { candidatesFrom } from "./candidates";

const text = [
  "---",
  "status: todo",
  "tags: [work]",
  "---",
  "# Plan",
  "See [[b]] and ![[img.png]] #later",
].join("\n");

const ix = buildIndex(
  [
    summarize(
      "Projects/plan.md",
      { mtime: 20, size: 12, ctime: 10 },
      scanDoc(text),
    ),
  ],
  ["Projects/plan.md", "img.png"],
  [{ path: "img.png", size: 300, mtime: 7, ctime: 5 }],
);

test("candidates expose every file field for notes and other files", () => {
  const [plan, img] = candidatesFrom(ix, new Map());
  expect(plan).toEqual({
    path: "Projects/plan.md",
    name: "plan.md",
    basename: "plan",
    folder: "Projects",
    ext: "md",
    size: 12,
    mtime: 20,
    ctime: 10,
    properties: { status: "todo", tags: ["work"] },
    tags: ["work", "later"],
    links: ["b", "img.png"],
    embeds: ["img.png"],
  });
  expect(img).toEqual({
    path: "img.png",
    name: "img.png",
    basename: "img",
    folder: "",
    ext: "png",
    size: 300,
    mtime: 7,
    ctime: 5,
    properties: {},
    tags: [],
    links: [],
    embeds: [],
  });
});

test("an open buffer's properties override the indexed summary", () => {
  const dirty = scanDoc("---\nstatus: doing\n---\n#now [[c]]\n");
  const plan = candidatesFrom(ix, new Map([["Projects/plan.md", dirty]])).find(
    (c) => c.path === "Projects/plan.md",
  );
  expect(plan?.properties).toEqual({ status: "doing" });
  expect(plan?.tags).toEqual(["now"]);
  expect(plan?.links).toEqual(["c"]);
  expect(plan?.size).toBe(12);
});

test("every indexed file yields exactly one candidate", () => {
  const more = buildIndex(
    [],
    ["a.md", "b.txt", "c/d.pdf"],
    [{ path: "b.txt", size: 1, mtime: 1, ctime: 1 }],
  );
  const all = candidatesFrom(more, new Map([["zzz.md", scanDoc("")]]));
  expect(all.map((c) => c.path)).toEqual(["a.md", "b.txt", "c/d.pdf"]);
  expect(all.find((c) => c.path === "c/d.pdf")).toMatchObject({
    size: 0,
    mtime: 0,
    ctime: 0,
  });
});
