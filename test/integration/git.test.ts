import { afterEach, expect, test } from "bun:test";
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

async function startInRepo(files: Record<string, string>): Promise<App> {
  repo = await gitRepo(files);
  app = await startApp(repo.root, { git: { env: repo.env } });
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
