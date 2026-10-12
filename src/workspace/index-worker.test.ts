import { afterAll, beforeAll, expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { NoteSummary } from "../core/features/links/summarize";
import type { SearchHit } from "../core/state/types";
import type { FromWorker, ToWorker } from "./index-worker";

let root: string;

const PLAN_MENTIONS = [
  "---",
  "aliases: [Plan]",
  "about: Plan",
  "---",
  "Plan comes first, then the plan again.",
  "See [[plan]] and [the Plan](notes/plan.md) and #Plan.",
  "Inline `Plan` code and planning and Planet.",
  "```",
  "Plan inside a fence",
  "```",
  "%% Plan in a comment %%",
].join("\n");

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "so-worker-"));
  const files: Record<string, string | Uint8Array> = {
    ".gitignore": "ignored/\n",
    ".hidden/secret.md": "# Secret\nTODO hidden\n",
    "node_modules/pkg/readme.md": "# Pkg\nTODO module\n",
    "ignored/skip.md": "# Skip\nTODO ignored\n",
    "notes/plan.md": "# Plan\nThe plan.\n",
    "notes/mentions.md": `${PLAN_MENTIONS}\n`,
    "src/tool.ts": "// TODO one\nconst a = 1; // TODO two\n// todo lower\n",
    "photo.png": new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0, 0x54, 0x4f, 0x44, 0x4f,
    ]),
    "readme.txt": "nothing to see\n",
  };
  for (const [path, body] of Object.entries(files)) {
    await mkdir(join(root, path, ".."), { recursive: true });
    await writeFile(join(root, path), body);
  }
  await writeFile(
    join(root, "big.log"),
    `TODO big\n${"x".repeat(17 * 1024 * 1024)}\n`,
  );
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

/** A real worker thread; `send` posts a message, `next` waits for a reply. */
function startWorker() {
  const worker = new Worker(new URL("./index-worker.ts", import.meta.url));
  const inbox: FromWorker[] = [];
  const waiters: (() => void)[] = [];
  worker.onmessage = (e: MessageEvent<FromWorker>) => {
    inbox.push(e.data);
    for (const w of waiters.splice(0)) w();
  };
  const until = async (pred: (m: FromWorker) => boolean) => {
    const deadline = performance.now() + 4000;
    for (;;) {
      const found = inbox.find(pred);
      if (found !== undefined) return found;
      if (performance.now() > deadline) throw new Error("no reply in time");
      await new Promise<void>((r) => {
        waiters.push(r);
        setTimeout(r, 50);
      });
    }
  };
  return {
    inbox,
    send: (m: ToWorker) => worker.postMessage(m),
    until,
    async scanned() {
      worker.postMessage({ t: "scan", root, ignore: [] } satisfies ToWorker);
      await until((m) => m.t === "ready");
      const batches = inbox.filter(
        (m): m is Extract<FromWorker, { t: "batch" }> => m.t === "batch",
      );
      return {
        files: batches.flatMap((b) => b.files ?? []),
        facts: batches.flatMap((b) => b.facts ?? []),
        summaries: batches.flatMap((b) => b.summaries),
        batches,
      };
    },
    async search(m: Omit<Extract<ToWorker, { t: "search" }>, "t">) {
      worker.postMessage({ t: "search", ...m } satisfies ToWorker);
      return (await until(
        (r) => r.t === "results" && r.id === m.id,
      )) as Extract<FromWorker, { t: "results" }>;
    },
    stop: () => worker.terminate(),
  };
}

const paths = (hits: SearchHit[]) => [...new Set(hits.map((h) => h.path))];

test("scan lists visible files and summarizes notes only", async () => {
  const w = startWorker();
  try {
    const { files, summaries, batches } = await w.scanned();
    expect(files.sort()).toEqual([
      "big.log",
      "notes/mentions.md",
      "notes/plan.md",
      "photo.png",
      "readme.txt",
      "src/tool.ts",
    ]);
    expect(summaries.map((s: NoteSummary) => s.path).sort()).toEqual([
      "notes/mentions.md",
      "notes/plan.md",
    ]);
    expect(summaries.find((s) => s.path === "notes/plan.md")?.title).toBe(
      "Plan",
    );
    const last = batches.at(-1);
    expect(last?.done).toBe(2);
    expect(last?.total).toBe(2);
  } finally {
    w.stop();
  }
});

test("text search is literal and skips binary and large files", async () => {
  const w = startWorker();
  try {
    await w.scanned();
    const r = await w.search({ id: 7, query: "TODO", limit: 100 });
    expect(r.capped ?? false).toBe(false);
    expect(paths(r.hits)).toEqual(["src/tool.ts"]);
    expect(r.hits.map((h) => [h.line, h.col, h.len])).toEqual([
      [0, 3, 4],
      [1, 16, 4],
    ]);
    expect(r.hits[0]?.text).toBe("// TODO one");
    // Lower-case queries ignore case; regular-expression characters are literal.
    const lower = await w.search({ id: 8, query: "todo", limit: 100 });
    expect(lower.hits.map((h) => h.line)).toEqual([0, 1, 2]);
    const literal = await w.search({ id: 9, query: "a = 1;", limit: 100 });
    expect(literal.hits.map((h) => [h.path, h.line])).toEqual([
      ["src/tool.ts", 1],
    ]);
    expect((await w.search({ id: 10, query: ".*", limit: 100 })).hits).toEqual(
      [],
    );
  } finally {
    w.stop();
  }
});

test("search stops at the limit and reports capped", async () => {
  const w = startWorker();
  try {
    await w.scanned();
    const r = await w.search({ id: 3, query: "o", limit: 2 });
    expect(r.hits.length).toBe(2);
    expect(r.capped).toBe(true);
  } finally {
    w.stop();
  }
});

test("mentions ignore links, code, tags, comments, and frontmatter", async () => {
  const w = startWorker();
  try {
    await w.scanned();
    const r = await w.search({
      id: 4,
      query: "",
      limit: 100,
      mode: "mentions",
      names: ["plan"],
      exclude: "notes/plan.md",
    });
    expect(r.hits.map((h) => [h.path, h.line, h.col, h.len])).toEqual([
      ["notes/mentions.md", 4, 0, 4],
      ["notes/mentions.md", 4, 27, 4],
    ]);
    const self = await w.search({
      id: 5,
      query: "",
      limit: 100,
      mode: "mentions",
      names: ["plan"],
      exclude: "notes/mentions.md",
    });
    expect(paths(self.hits)).toEqual(["notes/plan.md"]);
  } finally {
    w.stop();
  }
});

test("changed notes are summarized again and removed ones leave the search", async () => {
  const w = startWorker();
  try {
    await w.scanned();
    await writeFile(join(root, "notes/new.md"), "# New\nTODO fresh [[plan]]\n");
    w.send({ t: "changed", paths: ["notes/new.md"] });
    const update = (await w.until(
      (m) =>
        m.t === "batch" && m.summaries.some((s) => s.path === "notes/new.md"),
    )) as Extract<FromWorker, { t: "batch" }>;
    expect([update.done, update.total]).toEqual([0, 0]);
    expect(update.summaries[0]?.links.map((l) => l.target)).toEqual(["plan"]);
    expect(
      paths((await w.search({ id: 11, query: "fresh", limit: 10 })).hits),
    ).toEqual(["notes/new.md"]);
    w.send({ t: "removed", paths: ["notes/new.md"] });
    expect(
      (await w.search({ id: 12, query: "fresh", limit: 10 })).hits,
    ).toEqual([]);
  } finally {
    await rm(join(root, "notes/new.md"), { force: true });
    w.stop();
  }
});

test("a moved file or folder is searched under its new path", async () => {
  const w = startWorker();
  try {
    await w.scanned();
    await rename(join(root, "notes"), join(root, "docs"));
    w.send({ t: "moved", from: "notes", to: "docs" });
    expect(
      paths((await w.search({ id: 21, query: "The plan", limit: 10 })).hits),
    ).toEqual(["docs/plan.md"]);
  } finally {
    await rename(join(root, "docs"), join(root, "notes"));
    w.stop();
  }
});

test("a folder the index holds nothing under is walked and joins the index", async () => {
  const w = startWorker();
  try {
    await w.scanned();
    await mkdir(join(root, "fresh/deep"), { recursive: true });
    await writeFile(join(root, "fresh/deep/idea.md"), "# Idea\nTODO walked\n");
    await writeFile(join(root, "fresh/data.csv"), "a,b\n");
    w.send({ t: "changed", paths: ["fresh"] });
    const update = (await w.until(
      (m) => m.t === "batch" && (m.files ?? []).includes("fresh/data.csv"),
    )) as Extract<FromWorker, { t: "batch" }>;
    expect(update.files).toEqual(["fresh/data.csv", "fresh/deep/idea.md"]);
    expect(update.summaries.map((x) => x.path)).toEqual(["fresh/deep/idea.md"]);
    expect(update.facts?.map((f) => f.path)).toEqual(["fresh/data.csv"]);
    expect(
      paths((await w.search({ id: 22, query: "walked", limit: 10 })).hits),
    ).toEqual(["fresh/deep/idea.md"]);
  } finally {
    await rm(join(root, "fresh"), { recursive: true, force: true });
    w.stop();
  }
});

test("the worker never changes the workspace", async () => {
  const snapshot = async () => {
    const out: string[] = [];
    for (const name of (
      await readdir(root, { recursive: true, withFileTypes: true })
    )
      .map((d) => join(d.parentPath, d.name))
      .sort())
      out.push(`${name} ${(await stat(name)).mtimeMs}`);
    return out;
  };
  const before = await snapshot();
  const w = startWorker();
  try {
    await w.scanned();
    await w.search({ id: 1, query: "TODO", limit: 1000 });
    await w.search({
      id: 2,
      query: "",
      limit: 1000,
      mode: "mentions",
      names: ["plan"],
    });
  } finally {
    w.stop();
  }
  expect(await snapshot()).toEqual(before);
});

test("the index carries size and created time for notes and facts for other files", async () => {
  const w = startWorker();
  try {
    const { summaries, facts } = await w.scanned();
    const plan = summaries.find((s) => s.path === "notes/plan.md");
    const st = await stat(join(root, "notes/plan.md"));
    expect(plan?.size).toBe(st.size);
    expect(plan?.ctime).toBe(st.birthtimeMs > 0 ? st.birthtimeMs : st.mtimeMs);
    expect(facts.map((f) => f.path).sort()).toEqual([
      "big.log",
      "photo.png",
      "readme.txt",
      "src/tool.ts",
    ]);
    const photo = await stat(join(root, "photo.png"));
    expect(facts.find((f) => f.path === "photo.png")).toEqual({
      path: "photo.png",
      size: photo.size,
      mtime: photo.mtimeMs,
      ctime: photo.birthtimeMs > 0 ? photo.birthtimeMs : photo.mtimeMs,
    });
  } finally {
    w.stop();
  }
});

test("a changed file that is not a note gets fresh facts", async () => {
  const w = startWorker();
  try {
    await w.scanned();
    await writeFile(join(root, "readme.txt"), "nothing to see here at all\n");
    w.send({ t: "changed", paths: ["readme.txt"] });
    const update = (await w.until(
      (m) =>
        m.t === "batch" &&
        m.total === 0 &&
        (m.facts ?? []).some((f) => f.path === "readme.txt"),
    )) as Extract<FromWorker, { t: "batch" }>;
    expect([update.done, update.summaries]).toEqual([0, []]);
    expect(update.facts?.[0]?.size).toBe(27);
  } finally {
    await writeFile(join(root, "readme.txt"), "nothing to see\n");
    w.stop();
  }
});
