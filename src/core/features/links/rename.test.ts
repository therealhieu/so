import { expect, test } from "bun:test";
import { type DocScan, scanDoc } from "../../lang/markdown/scan";
import { applySummaries, emptyIndex, type NoteIndex } from "./note-index";
import {
  type FileEdit,
  type PathMove,
  planRename,
  renameImpact,
} from "./rename";
import { resolveLink } from "./resolve";
import { summarize } from "./summarize";

type Workspace = Record<string, string>;

function index(ws: Workspace, files: string[] = []): NoteIndex {
  return applySummaries(
    emptyIndex(),
    Object.entries(ws).map(([path, text]) =>
      summarize(path, { mtime: 1, size: 0, ctime: 1 }, scanDoc(text)),
    ),
    files,
  );
}

/** Apply span edits from last to first; every span must still hold its expected text. */
function applyEdits(text: string, edit: FileEdit): string {
  const lines = text.split("\n");
  const sorted = [...edit.edits].sort(
    (a, b) =>
      b.range.start.line - a.range.start.line ||
      b.range.start.col - a.range.start.col,
  );
  for (const e of sorted) {
    const { start, end } = e.range;
    expect(start.line).toBe(end.line);
    const line = lines[start.line] ?? "";
    expect(line.slice(start.col, end.col)).toBe(e.expected);
    lines[start.line] = line.slice(0, start.col) + e.text + line.slice(end.col);
  }
  return lines.join("\n");
}

const image = (path: string, moves: readonly PathMove[]) => {
  for (const { from, to } of moves) {
    if (path === from) return to;
    if (path.startsWith(`${from}/`)) return to + path.slice(from.length);
  }
  return path;
};

/** The workspace after the moves and the plan: texts at their new paths. */
function afterRename(
  ws: Workspace,
  moves: readonly PathMove[],
  plan: readonly FileEdit[],
): Workspace {
  const out: Workspace = {};
  for (const [path, text] of Object.entries(ws)) out[image(path, moves)] = text;
  for (const edit of plan)
    out[edit.path] = applyEdits(out[edit.path] ?? "", edit);
  return out;
}

test("rename preserves kind, alias, subpath, and frontmatter links", () => {
  const ws: Workspace = {
    "plan.md": "# Plan\n## Goals",
    "notes/a.md": "[[plan]] and [[plan|Plan]] and ![[plan#Goals]]",
    "notes/b.md": '---\nrelated: "[[plan]]"\n---\n[x](plan.md)',
    "notes/open.md": "saved text without links",
  };
  const ix = index(ws);
  const open = new Map<string, DocScan>([
    ["notes/open.md", scanDoc("typed [[plan]] here")],
  ]);
  const moves = [{ from: "plan.md", to: "projects/roadmap.md" }];
  const plan = planRename(ix, moves, open);
  const edits = Object.fromEntries(
    plan.map((f) => [f.path, f.edits.map((e) => [e.expected, e.text])]),
  );
  expect(edits).toEqual({
    "notes/a.md": [
      ["[[plan]]", "[[roadmap]]"],
      ["[[plan|Plan]]", "[[roadmap|Plan]]"],
      ["![[plan#Goals]]", "![[roadmap#Goals]]"],
    ],
    "notes/b.md": [
      ["[[plan]]", "[[roadmap]]"],
      ["[x](plan.md)", "[x](projects/roadmap.md)"],
    ],
    "notes/open.md": [["[[plan]]", "[[roadmap]]"]],
  });
  expect(plan.find((f) => f.path === "notes/open.md")?.edits[0]?.range).toEqual(
    {
      start: { line: 0, col: 6 },
      end: { line: 0, col: 14 },
    },
  );
  expect(renameImpact(plan)).toEqual({ links: 6, files: 3 });
});

test("a moved note does not capture other notes' links", () => {
  const ws: Workspace = {
    "a/plan.md": "",
    "b/plan.md": "",
    "c/deep/plan.md": "",
    "root.md": "see [[plan]]",
  };
  const plan = planRename(
    index(ws),
    [{ from: "c/deep/plan.md", to: "plan.md" }],
    new Map(),
  );
  expect(plan).toEqual([
    {
      path: "root.md",
      edits: [
        {
          range: { start: { line: 0, col: 4 }, end: { line: 0, col: 12 } },
          expected: "[[plan]]",
          text: "[[a/plan]]",
        },
      ],
    },
  ]);
});

/** Every link resolved before the moves resolves to the moved image of its target afterwards. */
function expectLinksKept(
  ws: Workspace,
  moves: readonly PathMove[],
  plan: readonly FileEdit[],
) {
  const ix = index(ws);
  const after = afterRename(ws, moves, plan);
  const ixAfter = index(after);
  for (const [path, text] of Object.entries(ws)) {
    const old = scanDoc(text).links;
    const moved = image(path, moves);
    const now = scanDoc(after[moved] ?? "").links;
    expect(now).toHaveLength(old.length);
    old.forEach((link, i) => {
      const before = resolveLink(ix, path, link);
      const current = now[i];
      if (current === undefined) throw new Error("link lost");
      if ("path" in before)
        expect({
          path,
          raw: link.raw,
          to: resolveLink(ixAfter, moved, current),
        }).toEqual({
          path,
          raw: link.raw,
          to: { ...before, path: image(before.path, moves) },
        });
      else expect(current.raw).toBe(link.raw);
      expect([current.kind, current.alias, current.subpath]).toEqual([
        link.kind,
        link.alias,
        link.subpath,
      ]);
    });
  }
}

test("folder moves map every contained file and rewrite links whose ranking changes", () => {
  const ws: Workspace = {
    "notes/x.md": "[[plan]] [[y]] [[notes/y]] [y](notes/y.md) [[idea|my idea]]",
    "notes/y.md": "[[x]]",
    "notes/plan.md": "",
    "a/b/plan.md": "",
    "idea.md": "",
    "z/q.md": "[[plan]] [[notes/x]]",
  };
  const moves = [{ from: "notes", to: "archive/notes" }];
  const plan = planRename(index(ws), moves, new Map());
  // "plan" from z/q.md now prefers a/b/plan.md (same depth, earlier name).
  expect(
    plan.map((f) => [f.path, f.edits.map((e) => [e.expected, e.text])]),
  ).toEqual([["z/q.md", [["[[plan]]", "[[notes/plan]]"]]]]);
  expect(renameImpact(plan)).toEqual({ links: 1, files: 1 });
  expectLinksKept(ws, moves, plan);
});

test("edits to a moved note use its new path", () => {
  const ws: Workspace = {
    "a/x.md": "[[plan]]",
    "a/plan.md": "",
    "b/plan.md": "",
  };
  const moves = [{ from: "a/x.md", to: "b/x.md" }];
  const plan = planRename(index(ws), moves, new Map());
  expect(plan.map((f) => [f.path, f.edits.map((e) => e.text)])).toEqual([
    ["b/x.md", ["[[a/plan]]"]],
  ]);
  expectLinksKept(ws, moves, plan);
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

const FOLDERS = ["", "a/", "b/", "a/b/", "c/deep/"];
const NAMES = ["plan", "note", "x", "idea"];

function randomWorkspace(next: () => number): Workspace {
  const pick = <T>(list: readonly T[]) =>
    list[Math.floor(next() * list.length)] as T;
  const ws: Workspace = {};
  const count = 4 + Math.floor(next() * 8);
  for (let i = 0; i < count; i++) ws[`${pick(FOLDERS)}${pick(NAMES)}.md`] = "";
  const paths = Object.keys(ws);
  for (const path of paths) {
    const links: string[] = [];
    for (let k = Math.floor(next() * 5); k > 0; k--) {
      const to = pick(paths);
      const bare = to.replace(/\.md$/, "");
      const segments = bare.split("/");
      const target = segments
        .slice(Math.floor(next() * segments.length))
        .join("/");
      const sub = pick(["", "#H", "#^id"]);
      const form = next();
      if (form < 0.4) links.push(`[[${target}${sub}]]`);
      else if (form < 0.6) links.push(`[[${target}${sub}|Alias ${k}]]`);
      else if (form < 0.75) links.push(`![[${target}]]`);
      else if (form < 0.9) links.push(`[t ${k}](${encodeURI(to)}${sub})`);
      else links.push(`[[missing-${k}]]`);
    }
    const aliases = next() < 0.2 ? `---\naliases: [${pick(NAMES)}]\n---\n` : "";
    ws[path] = `${aliases}# ${path}\n\nText ${links.join(" text ")} end.`;
  }
  return ws;
}

function randomMoves(ws: Workspace, next: () => number): PathMove[] {
  const pick = <T>(list: readonly T[]) =>
    list[Math.floor(next() * list.length)] as T;
  const paths = Object.keys(ws);
  const taken = (p: string) =>
    paths.some((q) => q === p || q.startsWith(`${p}/`));
  if (next() < 0.3) {
    const folders = [
      ...new Set(
        paths
          .filter((p) => p.includes("/"))
          .map((p) => p.slice(0, p.lastIndexOf("/"))),
      ),
    ];
    if (folders.length > 0) {
      const from = pick(folders);
      const to = `${pick(["moved", "z/moved", "c"])}/${from.split("/").at(-1)}`;
      if (!taken(to) && !to.startsWith(`${from}/`)) return [{ from, to }];
    }
  }
  const from = pick(paths);
  const to = `${pick(FOLDERS)}${pick([...NAMES, "renamed", "new"])}.md`;
  return taken(to) ? [] : [{ from, to }];
}

test("every resolved link keeps its file after random moves", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const next = random(seed);
    const ws = randomWorkspace(next);
    const moves = randomMoves(ws, next);
    if (moves.length === 0) continue;
    try {
      expectLinksKept(ws, moves, planRename(index(ws), moves, new Map()));
    } catch (e) {
      throw new Error(
        `failed with seed ${seed} moving ${JSON.stringify(moves)}: ${String(e)}`,
      );
    }
  }
});
