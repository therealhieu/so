import { afterAll, beforeAll, expect, test } from "bun:test";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseConfig } from "../../src/core/config/toml";
import { backlinksOf } from "../../src/core/features/links/note-index";
import { sidePanelRows } from "../../src/core/state/side-panel";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

let app: App;
const disk = (path: string) => readFile(join(app.root, path), "utf8");
const BOM = "﻿";

beforeAll(async () => {
  const root = await tmpWorkspace({
    "plan.md": "# Plan\n## Goals\n",
    "a.md": "[[plan]] and [[plan|Plan]]\n",
    "b.md": "![[plan#Goals]] [x](plan.md)\n",
    "c.md": '---\nrelated: "[[plan]]"\n---\nbody\n',
    "d.md": "see [[plan]]\n",
    "e.md": "[[plan]]\n",
    "f.md": `${BOM}[[plan]]\r\nline\r\n`,
  });
  app = await startApp(root, { index: {} });
  // Autosave stays out of the way, so the open buffer's disk text is observable.
  app.store.dispatch({
    type: "configLoaded",
    result: parseConfig(
      '[autosave]\ndelayMs = 60000\n[preview]\nmode = "live"\n',
    ),
    reload: false,
  });
  await waitFor(() => app.store.get().index.status === "ready");
});

afterAll(async () => {
  app.stop();
  await rm(app.root, { recursive: true, force: true });
});

test("closed files are rewritten atomically and stale files are skipped", async () => {
  await app.open("d.md");
  app.keys("x"); // an unsaved change in an open note
  expect(app.buffer("d.md")?.dirty).toBe(true);

  // Changed by another program after indexing: the planned span is stale.
  const changed = "moved [[plan]]\n";
  await writeFile(join(app.root, "e.md"), changed);

  app.select("plan.md");
  app.keys("m");
  expect(app.store.get().overlay).toMatchObject({
    kind: "prompt",
    prompt: { value: "plan.md" },
  });
  app.keys(`${"<BS>".repeat(7)}projects/roadmap.md`);
  expect(app.store.get().overlay).toMatchObject({
    prompt: { impact: "8 links in 6 files will be updated" },
  });
  app.keys("<CR>");
  await waitFor(() =>
    app.store
      .get()
      .notifications.toasts.some((t) => t.text.endsWith("updated")),
  );

  expect(await Bun.file(join(app.root, "projects/roadmap.md")).exists()).toBe(
    true,
  );
  expect(await disk("a.md")).toBe("[[roadmap]] and [[roadmap|Plan]]\n");
  expect(await disk("b.md")).toBe(
    "![[roadmap#Goals]] [x](projects/roadmap.md)\n",
  );
  expect(await disk("c.md")).toBe('---\nrelated: "[[roadmap]]"\n---\nbody\n');
  expect(await disk("f.md")).toBe(`${BOM}[[roadmap]]\r\nline\r\n`);
  expect(await disk("e.md")).toBe(changed);
  // The open note is edited in memory and saved by its own write.
  expect(await disk("d.md")).toBe("see [[plan]]\n");
  expect(app.text("d.md")).toBe("ee [[roadmap]]");
  expect(app.buffer("d.md")?.dirty).toBe(true);
  expect(
    app.store
      .get()
      .notifications.toasts.filter((t) => t.text !== "index ready")
      .map((t) => [t.level, t.text]),
  ).toEqual([
    ["info", "5 files updated"],
    ["error", "skipped: e.md (changed on disk)"],
  ]);
  expect(app.store.get().index.rewrite).toBeUndefined();

  app.keys(":w<CR>");
  await waitFor(() => app.buffer("d.md")?.dirty === false);
  expect(await disk("d.md")).toBe("ee [[roadmap]]\n");
});

test("linking a mention edits an open dirty buffer in memory and a closed file atomically", async () => {
  await writeFile(join(app.root, "goal.md"), "# Goal\n");
  await writeFile(join(app.root, "m1.md"), "the goal is near\n");
  await writeFile(join(app.root, "m2.md"), "our goal again\n");
  await waitFor(() =>
    ["goal.md", "m1.md", "m2.md"].every((p) =>
      app.store.get().index.ix.summaries.has(p),
    ),
  );
  await app.open("m1.md");
  app.keys("A!<Esc>");
  expect(app.buffer("m1.md")?.dirty).toBe(true);

  await app.open("goal.md");
  app.keys(" lb");
  expect(app.store.get().panels.side).toMatchObject({
    kind: "backlinks",
    open: true,
    focused: true,
  });
  const unlinked = () =>
    sidePanelRows(app.store.get())
      .filter((r) => r.section === "unlinked")
      .map((r) => r.path);
  await waitFor(() => app.store.get().panels.side.mentions?.pending === false);
  expect(unlinked()).toEqual(["m1.md", "m2.md"]);

  app.keys("l");
  expect(app.text("m1.md")).toBe("the [[goal]] is near!");
  expect(app.buffer("m1.md")?.dirty).toBe(true);
  expect(unlinked()).toEqual(["m2.md"]);

  app.keys("l");
  await waitFor(() => app.store.get().index.rewrite === undefined);
  expect(await disk("m2.md")).toBe("our [[goal]] again\n");
  expect(unlinked()).toEqual([]);
  const linked = () =>
    backlinksOf(app.store.get().index.ix, "goal.md").map((b) => b.from);
  expect(linked()).toEqual(["m2.md"]);

  // The open note joins Linked once it is saved.
  await app.open("m1.md");
  app.keys(":w<CR>");
  await waitFor(() => app.buffer("m1.md")?.dirty === false);
  expect(await disk("m1.md")).toBe("the [[goal]] is near!\n");
  expect(linked()).toEqual(["m1.md", "m2.md"]);
});
