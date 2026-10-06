import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

let app: App;
let config = "";
/** Wait until config.toml holds `text`. */
const saved = (text: string) =>
  waitFor(() => {
    void readFile(app.configPath, "utf8").then(
      (t) => (config = t),
      () => {},
    );
    return config.includes(text);
  });
const names = (dir = "") =>
  (app.store.get().panels.explorer.entries[dir] ?? []).map((e) => e.name);

beforeAll(async () => {
  const root = await tmpWorkspace({
    "a.md": "alpha\n",
    ".notes/todo.md": "todo\n",
    ".gitignore": ".env\n",
    ".env": "SECRET=1\n",
  });
  await mkdir(join(root, ".git"));
  await writeFile(join(root, ".git/HEAD"), "ref: refs/heads/master\n");
  app = await startApp(root);
});

afterAll(async () => {
  await app.stop();
  await rm(app.root, { recursive: true, force: true });
});

test("H lists dot entries except .git, saves the choice, and hides them again", async () => {
  expect(names()).toEqual(["a.md"]);
  app.keys("H");
  await waitFor(() => names().includes(".notes"));
  expect(names()).not.toContain(".git");
  expect(app.store.get().panels.explorer.entries[""]).toContainEqual({
    name: ".env",
    kind: "file",
    ignored: true,
  });
  await saved("dotfiles = true");

  app.keys("I");
  await waitFor(() => !names().includes(".env"));
  await saved("gitignored = false");
  app.keys("I");
  await waitFor(() => names().includes(".env"));
  await saved("gitignored = true");

  app.select(".notes");
  app.keys("l");
  await waitFor(() => names(".notes").includes("todo.md"));
  await writeFile(join(app.root, ".notes/later.md"), "later\n");
  await waitFor(() => names(".notes").includes("later.md"));

  app.keys("H");
  await waitFor(() => !names().includes(".notes"));
  expect(app.store.get().panels.explorer.expanded).toEqual([]);
  await saved("dotfiles = false");
});
