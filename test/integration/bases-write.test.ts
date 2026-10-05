import { afterEach, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { baseViewModel } from "../../src/core/state/base-model";
import type { Action } from "../../src/core/state/types";
import { testRegistries } from "../support/state";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

const BOARD = `filters:
  and:
    - file.inFolder("tasks")
views:
  - type: kanban-test
    name: Board
    order: [file.name]
    groupBy:
      property: status
      direction: ASC
`;
const A = "---\nstatus: todo # next up\ndue: 2026-10-05\n---\n# A\n";
const B = "---\nstatus: doing\n---\n# B\n";

const reg = testRegistries();
const started: App[] = [];
const temps: string[] = [];

afterEach(async () => {
  for (const app of started.splice(0)) {
    app.stop();
    await rm(app.root, { recursive: true, force: true });
  }
  for (const dir of temps.splice(0))
    await rm(dir, { recursive: true, force: true });
});

/** board.base open over two indexed notes, focus on a.md in the todo lane. */
async function board(env?: Record<string, string>): Promise<App> {
  const root = await tmpWorkspace({
    "board.base": BOARD,
    "tasks/a.md": A,
    "tasks/b.md": B,
  });
  const app = await startApp(root, {
    index: {},
    ...(env === undefined ? {} : { env }),
  });
  started.push(app);
  await waitFor(() => app.store.get().index.status === "ready");
  await app.open("board.base");
  app.keys("l");
  expect(lanes(app)).toEqual({
    doing: ["tasks/b.md"],
    todo: ["tasks/a.md"],
    None: [],
  });
  return app;
}

const lanes = (app: App) => {
  const s = app.store.get();
  const m = baseViewModel(s, s.windows.active, reg);
  return Object.fromEntries(
    (m?.board?.lanes ?? []).map((l) => [l.label, l.cards.map((c) => c.path)]),
  );
};

type Patched = Extract<Action, { type: "frontmatterPatched" }>;
const patched = (app: App) =>
  app.actions.filter((a): a is Patched => a.type === "frontmatterPatched");

test("moving a card on a closed note changes only its status line", async () => {
  const state = await mkdtemp(join(tmpdir(), "so-state-"));
  temps.push(state);
  const app = await board({ SO_LOG: "debug", XDG_STATE_HOME: state });
  app.keys("H");
  await waitFor(() => patched(app).length === 1);
  expect(patched(app)[0]).toMatchObject({ ok: true, path: "tasks/a.md" });
  expect(await readFile(join(app.root, "tasks/a.md"), "utf8")).toBe(
    A.replace("status: todo", "status: doing"),
  );
  // The emptied todo lane goes; the card keeps focus in its new lane.
  expect(lanes(app)).toEqual({
    doing: ["tasks/a.md", "tasks/b.md"],
    None: [],
  });
  const s = app.store.get();
  expect(baseViewModel(s, s.windows.active, reg)?.focus).toMatchObject({
    lane: 0,
    card: 0,
  });
  expect(
    app.store.get().notifications.toasts.map((t) => t.text),
  ).toContainEqual(
    "tasks/a.md: - status: todo # next up / + status: doing # next up",
  );
  const log = (await readFile(join(state, "so", "so.log"), "utf8"))
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l) as Record<string, unknown>)
    .filter((l) => l.event === "bases.patched");
  // The path only: no property values or note text.
  expect(log).toEqual([
    {
      event: "bases.patched",
      level: "info",
      path: "tasks/a.md",
      time: expect.any(String),
    },
  ]);
});

test("a card move after an external edit is refused and the file is unchanged", async () => {
  const app = await board();
  const external = A.replace("status: todo", "status: done");
  await writeFile(join(app.root, "tasks/a.md"), external);
  app.keys("H");
  await waitFor(() => patched(app).length === 1);
  expect(patched(app)[0]).toEqual({
    type: "frontmatterPatched",
    path: "tasks/a.md",
    ok: false,
    removed: [],
    added: [],
    reason: "changed on disk",
  });
  expect(await readFile(join(app.root, "tasks/a.md"), "utf8")).toBe(external);
  const errors = app.store
    .get()
    .notifications.toasts.filter((t) => t.level === "error");
  expect(errors.map((t) => t.text)).toEqual([
    "not written: tasks/a.md (changed on disk)",
  ]);
  // The watcher reports the edit and the board shows the value on disk.
  await waitFor(() => (lanes(app).done ?? []).includes("tasks/a.md"));
  expect(lanes(app)).toEqual({
    doing: ["tasks/b.md"],
    done: ["tasks/a.md"],
    None: [],
  });
});
