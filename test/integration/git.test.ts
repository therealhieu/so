import { afterEach, expect, test } from "bun:test";
import type { ToolHost } from "../../src/app/tool-host";
import { explorerMarkers } from "../../src/core/features/git/status";
import { statusSegments } from "../../src/core/state/status";
import { type GitRepo, gitRepo } from "../support/git-repo";
import { type App, startApp, waitFor } from "./helpers";

let app: App | undefined;
let repo: GitRepo | undefined;

afterEach(async () => {
  app?.stop();
  app = undefined;
  await repo?.cleanup();
  repo = undefined;
});

async function startInRepo(
  files: Record<string, string>,
  tool?: ToolHost,
): Promise<App> {
  repo = await gitRepo(files);
  app = await startApp(repo.root, {
    git: { env: repo.env },
    ...(tool === undefined ? {} : { tool }),
  });
  const a = app;
  await waitFor(() => a.store.get().git.status !== null);
  return a;
}

const markers = (a: App) => {
  const st = a.store.get().git.status;
  return st === null ? new Map() : explorerMarkers(st);
};

test("an external commit refreshes the ref and markers", async () => {
  const a = await startInRepo({ "a.md": "a\n", "notes/b.md": "b\n" });
  await a.open("a.md");
  expect(statusSegments(a.store.get()).git?.ref).toBe("main");
  const r = repo as GitRepo;
  await r.write("notes/b.md", "changed\n");
  await waitFor(() => markers(a).get("notes/b.md") === "modified");
  expect(markers(a).get("notes")).toBe("contains");

  await r.run(["checkout", "-q", "-b", "feature"]);
  await r.run(["commit", "-qam", "external"]);
  const done = performance.now();
  await waitFor(
    () =>
      statusSegments(a.store.get()).git?.ref === "feature" &&
      markers(a).size === 0,
    1000,
  );
  expect(performance.now() - done).toBeLessThan(1000);
});

test("editing, saving, and staging puts the typed line in the index", async () => {
  const a = await startInRepo({ "a.md": "first\nsecond\n" });
  await a.open("a.md");
  await waitFor(
    () => a.store.get().git.files["a.md"]?.index?.kind === "tracked",
  );
  a.keys("<Esc>otyped line<Esc>");
  a.keys("<leader>ghs");
  await waitFor(() => a.actions.some((x) => x.type === "gitStaged"));
  const staged = a.actions.find((x) => x.type === "gitStaged");
  expect(staged).toMatchObject({ path: "a.md", result: "ok" });
  const r = repo as GitRepo;
  expect(await r.run(["diff", "--cached"])).toContain("+typed line\n");
  expect(await r.run(["show", ":a.md"])).toBe("first\ntyped line\nsecond\n");
  expect(a.buffer("a.md")?.dirty).toBe(false);
});

test("a clean note with a BOM has no hunks and stages an edit", async () => {
  const a = await startInRepo({ "a.md": "﻿hello\nworld\n" });
  await a.open("a.md");
  await waitFor(
    () => a.store.get().git.files["a.md"]?.index?.kind === "tracked",
  );
  expect(a.store.get().git.files["a.md"]?.hunks).toEqual([]);
  expect(statusSegments(a.store.get()).git).toMatchObject({
    added: 0,
    changed: 0,
    removed: 0,
  });

  a.keys("<Esc>ggA there<Esc>");
  a.keys("<leader>ghs");
  await waitFor(() => a.actions.some((x) => x.type === "gitStaged"));
  expect(a.actions.find((x) => x.type === "gitStaged")).toMatchObject({
    path: "a.md",
    result: "ok",
  });
  const r = repo as GitRepo;
  expect(await r.run(["show", ":a.md"])).toBe("﻿hello there\nworld\n");
  await waitFor(() => a.store.get().git.files["a.md"]?.hunks.length === 0);

  a.keys("ggA again<Esc>");
  await waitFor(() => (a.store.get().git.files["a.md"]?.hunks.length ?? 0) > 0);
  a.keys("<leader>ghr");
  expect(a.text("a.md")).toBe("hello there\nworld");
  expect(a.buffer("a.md")?.bom).toBe(true);
});

test("a tool that checks out an open file reloads its buffer", async () => {
  const runs: string[] = [];
  const checkout: ToolHost = {
    async run(argv, cwd) {
      runs.push(`${argv.join(" ")} @ ${cwd}`);
      await (repo as GitRepo).run(["checkout", "other", "--", "a.md"]);
      return { kind: "exited", code: 0 };
    },
  };
  repo = await gitRepo({ "a.md": "a\n" });
  await repo.run(["checkout", "-q", "-b", "other"]);
  await repo.write("a.md", "from other\n");
  await repo.run(["commit", "-qam", "other"]);
  await repo.run(["checkout", "-q", "main"]);
  await repo.write("a.md", "a\nlocal\n");
  app = await startApp(repo.root, {
    git: { env: repo.env },
    tool: checkout,
  });
  const a = app;
  await a.open("a.md");
  await waitFor(() => (a.store.get().git.files["a.md"]?.hunks.length ?? 0) > 0);
  expect(a.buffer("a.md")?.dirty).toBe(false);

  a.keys("<Esc><leader>gg");
  await waitFor(() => a.text("a.md") === "from other");
  await waitFor(() => a.store.get().git.files["a.md"]?.hunks.length === 0);
  expect(runs).toEqual([`lazygit @ ${repo.root}`]);
  expect(a.actions).toContainEqual({
    type: "toolExited",
    result: { kind: "exited", code: 0 },
  });
  expect(a.store.get().overlay.kind).not.toBe("conflict");
  expect(a.buffer("a.md")?.dirty).toBe(false);
});
