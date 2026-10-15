import { afterAll, beforeAll, expect, test } from "bun:test";
import { rm } from "node:fs/promises";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

let app: App;
const explorer = () => app.store.get().panels.explorer;
const names = (dir: string) =>
  (explorer().entries[dir] ?? []).map((e) => e.name);

beforeAll(async () => {
  app = await startApp(
    await tmpWorkspace({
      "a.md": "alpha\n",
      "notes/deep/x.md": "x\n",
    }),
    { settle: false },
  );
  await waitFor(() => names("").includes("notes"));
});

afterAll(async () => {
  await app.stop();
  await rm(app.root, { recursive: true, force: true });
});

test("the explorer lists and selects each file opened from the editor", async () => {
  await app.open("a.md");
  expect(explorer()).toMatchObject({ focused: false, cursor: "a.md" });
  await app.open("notes/deep/x.md");
  expect(explorer()).toMatchObject({
    cursor: "notes/deep/x.md",
    expanded: ["notes", "notes/deep"],
  });
  await waitFor(() => names("notes/deep").includes("x.md"));
  expect(names("notes")).toEqual(["deep"]);
});
