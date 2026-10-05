import { expect, test } from "bun:test";
import { scanDoc } from "../../lang/markdown/scan";
import {
  addFiles,
  applySummaries,
  backlinksOf,
  buildIndex,
  emptyIndex,
  movePaths,
  type NoteIndex,
  notesWithTag,
  removePaths,
  tagCounts,
} from "./note-index";
import { type NoteSummary, summarize } from "./summarize";

/** A small deterministic generator (mulberry32). */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FOLDERS = ["", "a/", "b/", "c/deep/", "notes/"];
const NAMES = ["plan", "note", "x", "Plan", "roadmap"];
const TARGETS = [
  "plan",
  "Plan",
  "note",
  "x.md",
  "b/plan",
  "c/deep/plan",
  "a/x",
  "roadmap",
  "missing",
  "photo.png",
  "alias-one",
];

function randomNote(path: string, next: () => number): NoteSummary {
  const pick = <T>(list: readonly T[]) =>
    list[Math.floor(next() * list.length)] as T;
  const links = Array.from({ length: Math.floor(next() * 4) }, () => {
    const target = pick(TARGETS);
    return next() < 0.3
      ? `[x](${target}${target.includes(".") ? "" : ".md"})`
      : `[[${target}]]`;
  });
  const aliases =
    next() < 0.3 ? `aliases: [${pick(["alias-one", "plan", "Other"])}]\n` : "";
  const tags = next() < 0.5 ? `tags: [${pick(["a", "a/b", "c"])}]\n` : "";
  const text = `---\n${aliases}${tags}---\n# ${path}\n\n${links.join(" ")} #${pick(["t", "t/u", "v"])}\n`;
  return summarize(path, { mtime: 1, size: 0, ctime: 1 }, scanDoc(text));
}

/** Plain, order-independent views of every derived map. */
function snapshot(ix: NoteIndex) {
  const sorted = <V>(m: ReadonlyMap<string, V>) =>
    Object.fromEntries(
      [...m.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    );
  return {
    files: [...ix.files].sort(),
    summaries: sorted(ix.summaries),
    facts: sorted(ix.facts),
    byBasename: sorted(ix.byBasename),
    byAlias: sorted(ix.byAlias),
    byTag: sorted(ix.byTag),
    linkSources: sorted(ix.linkSources),
    backlinks: sorted(ix.backlinks),
  };
}

const rebuilt = (ix: NoteIndex) =>
  buildIndex([...ix.summaries.values()], [...ix.files], [...ix.facts.values()]);

test("incremental updates equal a full rebuild", () => {
  for (const seed of [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) {
    const next = random(seed);
    const pick = <T>(list: readonly T[]) =>
      list[Math.floor(next() * list.length)] as T;
    const notePath = () => `${pick(FOLDERS)}${pick(NAMES)}.md`;
    let ix = emptyIndex();
    try {
      for (let step = 0; step < 120; step++) {
        const op = next();
        const existing = [...ix.files];
        if (op < 0.45) {
          const paths = Array.from(
            { length: 1 + Math.floor(next() * 3) },
            notePath,
          );
          const unique = [...new Set(paths)];
          ix = applySummaries(
            ix,
            unique.map((p) => randomNote(p, next)),
            next() < 0.3 ? [`${pick(FOLDERS)}photo.png`] : [],
          );
        } else if (op < 0.6 && existing.length > 0) {
          const victim = pick(existing);
          ix = removePaths(ix, [
            next() < 0.2
              ? victim
                  .slice(0, victim.lastIndexOf("/") + 1)
                  .replace(/\/$/, "") || victim
              : victim,
          ]);
        } else if (op < 0.85 && existing.length > 0) {
          const from = pick(existing);
          const folder =
            from.includes("/") && next() < 0.3
              ? from.slice(0, from.indexOf("/"))
              : undefined;
          const to =
            folder === undefined
              ? notePath().replace(
                  /\.md$/,
                  from.endsWith(".md") ? ".md" : ".png",
                )
              : `moved-${folder}`;
          if (
            !ix.files.has(to) &&
            ![...ix.files].some((f) => f.startsWith(`${to}/`))
          )
            ix = movePaths(ix, [{ from: folder ?? from, to }]);
        } else {
          ix = addFiles(ix, [
            `${pick(FOLDERS)}${pick(["photo.png", "plan", "data.csv"])}`,
          ]);
        }
        expect(snapshot(ix)).toEqual(snapshot(rebuilt(ix)));
      }
    } catch (e) {
      throw new Error(`failed with seed ${seed}: ${String(e)}`);
    }
  }
});

test("only notes have summaries and moved notes keep theirs at the new path", () => {
  let ix = applySummaries(
    emptyIndex(),
    [randomNote("a/plan.md", random(1))],
    ["a/photo.png"],
  );
  expect([...ix.summaries.keys()]).toEqual(["a/plan.md"]);
  expect([...ix.files].sort()).toEqual(["a/photo.png", "a/plan.md"]);
  ix = movePaths(ix, [{ from: "a", to: "z" }]);
  expect([...ix.files].sort()).toEqual(["z/photo.png", "z/plan.md"]);
  expect(ix.summaries.get("z/plan.md")?.path).toBe("z/plan.md");
});

test("backlinks, tag counts, and notes with a tag", () => {
  const note = (path: string, text: string) =>
    summarize(path, { mtime: 1, size: 0, ctime: 1 }, scanDoc(text));
  const ix = applySummaries(emptyIndex(), [
    note("plan.md", "# Plan\n#project/so"),
    note("a.md", "see [[plan]] and [[plan#Goals|goals]] #project"),
    note("b.md", "---\ntags: [project/so]\n---\n![[plan]]"),
  ]);
  expect(backlinksOf(ix, "plan.md").map((b) => [b.from, b.link.raw])).toEqual([
    ["a.md", "[[plan]]"],
    ["a.md", "[[plan#Goals|goals]]"],
    ["b.md", "![[plan]]"],
  ]);
  expect(tagCounts(ix)).toEqual([
    { tag: "project", count: 3 },
    { tag: "project/so", count: 2 },
  ]);
  expect(notesWithTag(ix, "project/so")).toEqual(["b.md", "plan.md"]);
});

test("file facts never include Markdown notes and follow moves and removals", () => {
  const facts = [
    { path: "img.png", size: 3, mtime: 5, ctime: 4 },
    { path: "a.md", size: 1, mtime: 1, ctime: 1 },
    { path: "docs/r.pdf", size: 9, mtime: 2, ctime: 2 },
  ];
  let ix = buildIndex(
    [summarize("a.md", { mtime: 1, size: 1, ctime: 1 }, scanDoc(""))],
    ["img.png", "docs/r.pdf"],
    facts,
  );
  expect([...ix.facts.keys()].sort()).toEqual(["docs/r.pdf", "img.png"]);
  expect(ix.facts.get("img.png")).toEqual(facts[0]);
  ix = applySummaries(
    ix,
    [],
    [],
    [
      { path: "img.png", size: 7, mtime: 6, ctime: 4 },
      { path: "b.md", size: 1, mtime: 1, ctime: 1 },
    ],
  );
  expect(ix.facts.get("img.png")?.size).toBe(7);
  expect(ix.facts.has("b.md")).toBe(false);
  ix = movePaths(ix, [{ from: "docs", to: "papers" }]);
  expect(ix.facts.get("papers/r.pdf")).toEqual({
    path: "papers/r.pdf",
    size: 9,
    mtime: 2,
    ctime: 2,
  });
  expect(ix.facts.has("docs/r.pdf")).toBe(false);
  ix = removePaths(ix, ["img.png"]);
  expect([...ix.facts.keys()]).toEqual(["papers/r.pdf"]);
});
