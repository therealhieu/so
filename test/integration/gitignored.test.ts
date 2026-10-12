import { afterAll, beforeAll, expect, test } from "bun:test";
import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

let app: App;
const names = (dir = "") =>
  (app.store.get().panels.explorer.entries[dir] ?? []).map((e) => e.name);
const changes = (prefix: string) =>
  app.actions.filter(
    (a) => a.type === "fileChanged" && a.event.path.startsWith(prefix),
  ).length;

beforeAll(async () => {
  app = await startApp(
    await tmpWorkspace({
      "a.md": "alpha\n",
      ".gitignore": "dist/\n",
      "dist/out/old.js": "old\n",
    }),
  );
  await waitFor(() => names().includes("dist"));
});

afterAll(async () => {
  await app.stop();
  await rm(app.root, { recursive: true, force: true });
});

test("writes into a collapsed gitignored folder never reach the app", async () => {
  for (let i = 0; i < 20; i++)
    await writeFile(join(app.root, `dist/out/f${i}.js`), "x\n");
  await writeFile(join(app.root, "b.md"), "b\n");
  await waitFor(() => names().includes("b.md"));
  expect(changes("dist/")).toBe(0);
});

test("an expanded gitignored folder follows its changes", async () => {
  app.select("dist");
  app.keys("l");
  await waitFor(() => names("dist").includes("out"));
  await writeFile(join(app.root, "dist/new.js"), "new\n");
  await waitFor(() => names("dist").includes("new.js"));
  expect(app.store.get().panels.explorer.entries.dist).toContainEqual({
    name: "new.js",
    kind: "file",
    ignored: true,
  });
});
