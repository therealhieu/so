import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

const NOTES: Record<string, string> = {
  "plan.md": "# Plan for the quiet harbour\nSentinel line zebra-41.\n",
  "ideas.md": "Ideas link to [[plan]] and mention tangerine-77.\n",
  "notes/log.md": "A private sentence about the lighthouse keeper.\n",
};

let app: App;
let state = "";
const logPath = () => join(state, "so", "so.log");
const events = async () =>
  (await readFile(logPath(), "utf8"))
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l) as { event: string });

beforeAll(async () => {
  state = await mkdtemp(join(tmpdir(), "so-state-"));
  const root = await tmpWorkspace(NOTES);
  app = await startApp(root, {
    index: {},
    env: { SO_LOG: "debug", XDG_STATE_HOME: state },
  });
  await waitFor(() => app.store.get().index.status === "ready");
});

afterAll(async () => {
  app.stop();
  await rm(app.root, { recursive: true, force: true });
  await rm(state, { recursive: true, force: true });
});

test("the debug log never contains note text", async () => {
  app.select("plan.md");
  app.keys(`r${"<BS>".repeat(7)}roadmap.md<CR>`);
  await waitFor(() =>
    app.store
      .get()
      .notifications.toasts.some((t) => t.text.endsWith("updated")),
  );
  await writeFile(join(app.root, ".no-config.toml"), "theme = [\n");
  app.runner.run({ kind: "loadConfig" });
  await waitFor(() =>
    app.actions.some((a) => a.type === "configLoaded" && !a.result.ok),
  );

  const names = (await events()).map((e) => e.event);
  expect(names).toContain("index.ready");
  expect(names).toContain("fs.op");
  expect(names).toContain("links.edited");
  expect(names).toContain("config.invalid");

  const log = await readFile(logPath(), "utf8");
  const disk = await readFile(join(app.root, "ideas.md"), "utf8");
  for (const text of [...Object.values(NOTES), disk])
    for (const line of text.split("\n").filter((l) => l.trim() !== ""))
      expect(log).not.toContain(line);
  for (const word of ["zebra-41", "tangerine-77", "lighthouse", "harbour"])
    expect(log).not.toContain(word);
});
