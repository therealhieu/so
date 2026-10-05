import { expect, test } from "bun:test";
import { scanDoc } from "../../lang/markdown/scan";
import { applySummaries, emptyIndex, type NoteIndex } from "./note-index";
import { linkText, resolveLink } from "./resolve";
import { summarize } from "./summarize";

const note = (path: string, text = "") =>
  summarize(path, { mtime: 1, size: 0, ctime: 1 }, scanDoc(text));

function index(notes: Record<string, string>, files: string[] = []): NoteIndex {
  return applySummaries(
    emptyIndex(),
    Object.entries(notes).map(([path, text]) => note(path, text)),
    files,
  );
}

const WORKSPACE = index({
  "a/plan.md": "",
  "a/x.md": "",
  "b/plan.md": "",
  "plan-x.md": "---\naliases: [plan]\n---\n",
  "c/deep/plan.md": "",
  "root.md": "",
  "note.md": "",
  "a/plan x.md": "",
});

test("resolution follows the documented order", () => {
  const resolve = (from: string, target: string, subpath?: string) =>
    resolveLink(
      WORKSPACE,
      from,
      subpath === undefined ? { target } : { target, subpath },
    );
  // A file name in the source's folder comes first.
  expect(resolve("a/x.md", "plan")).toEqual({ path: "a/plan.md" });
  // Otherwise the alias wins over file names in other folders.
  expect(resolve("root.md", "plan")).toEqual({ path: "plan-x.md" });
  // A vault-root path, with or without .md.
  expect(resolve("root.md", "b/plan")).toEqual({ path: "b/plan.md" });
  expect(resolve("root.md", "c/deep/plan.md")).toEqual({
    path: "c/deep/plan.md",
  });
  // A folder suffix narrows file-name candidates.
  expect(resolve("root.md", "deep/plan")).toEqual({ path: "c/deep/plan.md" });
  // A name with .md behaves like the bare name.
  expect(resolve("a/x.md", "plan.md")).toEqual({ path: "a/plan.md" });
  // Chained headings and block subpaths.
  expect(resolve("root.md", "note", "#H1#H2")).toEqual({
    path: "note.md",
    heading: ["H1", "H2"],
  });
  expect(resolve("root.md", "note", "#^id")).toEqual({
    path: "note.md",
    block: "id",
  });
  // Markdown-link targets arrive URL-decoded from the scan.
  const [md] = scanDoc("[text](a/plan%20x.md)").links;
  expect(md && resolveLink(WORKSPACE, "root.md", md)).toEqual({
    path: "a/plan x.md",
  });
  expect(resolve("root.md", "missing")).toEqual({ unresolved: "missing" });
  // An in-note link is the note itself.
  expect(resolve("root.md", "", "#Top")).toEqual({
    path: "root.md",
    heading: ["Top"],
  });
});

test("among equal candidates the fewest folders win, then alphabetical order", () => {
  const ix = index({
    "z/q.md": "",
    "b/n.md": "",
    "a/n.md": "",
    "c/d/n.md": "",
  });
  expect(resolveLink(ix, "z/q.md", { target: "n" })).toEqual({
    path: "a/n.md",
  });
  const deep = index({ "z/q.md": "", "c/d/n.md": "", "e/n.md": "" });
  expect(resolveLink(deep, "z/q.md", { target: "N" })).toEqual({
    path: "e/n.md",
  });
});

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

test("link text round-trips and is shortest", () => {
  for (const seed of [21, 22, 23, 24, 25]) {
    const next = random(seed);
    const pick = <T>(list: readonly T[]) =>
      list[Math.floor(next() * list.length)] as T;
    const notes: Record<string, string> = {};
    for (let i = 0; i < 25; i++) {
      const folder = pick(["", "a/", "b/", "a/b/", "c/a/b/"]);
      const name = pick(["plan", "note", "x", "Plan"]);
      notes[`${folder}${name}.md`] =
        next() < 0.2
          ? `---\naliases: [${pick(["note", "x", "other"])}]\n---\n`
          : "";
    }
    const ix = index(notes, ["a/photo.png", "photo.png", "c/photo.png"]);
    try {
      for (const from of ix.summaries.keys())
        for (const to of ix.files) {
          const text = linkText(ix, from, to);
          expect({
            from,
            to,
            text,
            path: resolveLink(ix, from, { target: text }),
          }).toEqual({
            from,
            to,
            text,
            path: { path: to },
          });
          const segments = text.split("/");
          for (let k = 1; k < segments.length; k++) {
            const shorter = segments.slice(k).join("/");
            expect(resolveLink(ix, from, { target: shorter })).not.toEqual({
              path: to,
            });
          }
        }
    } catch (e) {
      throw new Error(`failed with seed ${seed}: ${String(e)}`);
    }
  }
});

test("link text drops .md for notes and keeps other extensions", () => {
  expect(linkText(WORKSPACE, "root.md", "note.md")).toBe("note");
  expect(linkText(WORKSPACE, "a/x.md", "b/plan.md")).toBe("b/plan");
  expect(linkText(WORKSPACE, "root.md", "c/deep/plan.md")).toBe("deep/plan");
  const files = index({ "n.md": "" }, ["assets/photo.png"]);
  expect(linkText(files, "n.md", "assets/photo.png")).toBe("photo.png");
});
