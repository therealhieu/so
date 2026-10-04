import { afterEach, expect, test } from "bun:test";
import {
  chmod,
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { splitKeys } from "../../src/core/kernel/vim/keys";
import { activeBuffer, activeWindow } from "../../src/core/state/buffers";
import type { Action } from "../../src/core/state/types";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

/** Saturday 2026-10-03 09:05 in the local time zone. */
const NOW = new Date(2026, 9, 3, 9, 5).getTime();
const TEMPLATES = join(import.meta.dir, "../fixtures/workspace/templates");
const TODAY = "daily/2026-10-03.md";

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

async function workspace(
  files: Record<string, string> = {},
  opts: { templates?: boolean; env?: Record<string, string> } = {},
): Promise<App> {
  const root = await tmpWorkspace(files);
  if (opts.templates !== false)
    await cp(TEMPLATES, join(root, "templates"), { recursive: true });
  const app = await startApp(root, opts.env ? { env: opts.env } : {});
  started.push(app);
  return app;
}

/** Type keys at the fixed clock, so dates do not depend on the real day. */
const press = (app: App, seq: string) => {
  for (const key of splitKeys(seq))
    app.store.dispatch({ type: "key", key, now: NOW });
};

type NoteCreated = Extract<Action, { type: "noteCreated" }>;
const answers = (app: App): NoteCreated[] =>
  app.actions.filter((a): a is NoteCreated => a.type === "noteCreated");

/** Run an ex command and wait for its create to answer. */
async function exCreate(app: App, cmd: string): Promise<NoteCreated> {
  const before = answers(app).length;
  press(app, `<Esc>:${cmd}<CR>`);
  await waitFor(() => answers(app).length > before);
  return answers(app)[before] as NoteCreated;
}

const shown = (app: App) => activeBuffer(app.store.get())?.path;
const leftovers = async (dir: string) =>
  (await readdir(dir)).filter((n) => n.includes(".so-new-"));

const DAILY_TODAY = [
  "---",
  "date: 2026-10-03",
  "tags: [daily]",
  "---",
  "# Saturday, October 3",
  "",
  "## Plan",
  "- [ ] ",
  "",
  "## Notes",
  "",
  "## Log",
  "09:05 started the day",
  "",
].join("\n");

test("a second :Today leaves the daily note's bytes and mtime unchanged", async () => {
  const app = await workspace();
  const first = await exCreate(app, "Today");
  expect(first).toMatchObject({ outcome: "created", template: "used" });
  await waitFor(() => shown(app) === TODAY);
  const path = join(app.root, TODAY);
  expect(await readFile(path, "utf8")).toBe(DAILY_TODAY);
  expect(activeWindow(app.store.get())?.content.cursor).toEqual({
    line: 7,
    col: 5,
  });
  const before = await stat(path);

  const second = await exCreate(app, "Today");
  expect(second.outcome).toBe("exists");
  expect(await readFile(path, "utf8")).toBe(DAILY_TODAY);
  expect((await stat(path)).mtimeMs).toBe(before.mtimeMs);
  expect(app.effects.filter((e) => e.kind === "write")).toEqual([]);
});

test("a daily note that appears after the index check is opened, not overwritten", async () => {
  const app = await workspace();
  await mkdir(join(app.root, "daily"));
  await writeFile(join(app.root, TODAY), "mine\n- [ ] keep\n");
  const answer = await exCreate(app, "Today");
  expect(answer.outcome).toBe("exists");
  await waitFor(() => shown(app) === TODAY);
  expect(await readFile(join(app.root, TODAY), "utf8")).toBe(
    "mine\n- [ ] keep\n",
  );
  expect(activeWindow(app.store.get())?.content.cursor).toEqual({
    line: 1,
    col: 6,
  });
  expect(await leftovers(join(app.root, "daily"))).toEqual([]);
});

test("a case-variant daily note on a case-insensitive volume is not overwritten", async () => {
  const app = await workspace();
  await mkdir(join(app.root, "daily"));
  await writeFile(join(app.root, "daily/2026-10-03.MD"), "variant\n");
  const insensitive = await stat(join(app.root, TODAY)).then(
    () => true,
    () => false,
  );
  if (!insensitive) return;
  expect((await exCreate(app, "Today")).outcome).toBe("exists");
  expect(await readFile(join(app.root, "daily/2026-10-03.MD"), "utf8")).toBe(
    "variant\n",
  );
  expect(await leftovers(join(app.root, "daily"))).toEqual([]);
});

test("a missing daily template falls back to the built-in one", async () => {
  const app = await workspace({}, { templates: false });
  const answer = await exCreate(app, "Today");
  expect(answer).toMatchObject({ outcome: "created", template: "missing" });
  expect(await readFile(join(app.root, TODAY), "utf8")).toBe("# 2026-10-03");
  await waitFor(() => shown(app) === TODAY);
});

test("an unreadable daily template creates an empty note with an error", async () => {
  const app = await workspace({}, { templates: false });
  await mkdir(join(app.root, "templates"));
  await writeFile(join(app.root, "templates/daily.md"), "a\u0000b");
  const answer = await exCreate(app, "Today");
  expect(answer).toMatchObject({ outcome: "created", template: "unreadable" });
  expect(await readFile(join(app.root, TODAY), "utf8")).toBe("");
  await waitFor(() => shown(app) === TODAY);
  expect(app.store.get().notifications.toasts).toContainEqual(
    expect.objectContaining({
      level: "error",
      text: "template unreadable: templates/daily.md — created an empty note",
    }),
  );
});

test("a daily note in a read-only folder fails cleanly", async () => {
  if (process.getuid?.() === 0) return;
  const app = await workspace();
  const daily = join(app.root, "daily");
  await mkdir(daily);
  await chmod(daily, 0o555);
  try {
    const answer = await exCreate(app, "Today");
    expect(answer.outcome).toBe("failed");
    expect(await readdir(daily)).toEqual([]);
    expect(shown(app)).toBeUndefined();
    expect(app.store.get().notifications.toasts).toContainEqual(
      expect.objectContaining({
        level: "error",
        text: expect.stringContaining(`cannot create ${TODAY}`),
      }),
    );
  } finally {
    await chmod(daily, 0o755);
  }
});

test(":Yesterday from a subfolder daily note creates the previous day and logs the path only", async () => {
  const state = await mkdtemp(join(tmpdir(), "so-state-"));
  temps.push(state);
  const app = await workspace(
    { "daily/2026/10/2026-10-03.md": "# today\n" },
    { env: { SO_LOG: "debug", XDG_STATE_HOME: state } },
  );
  await writeFile(
    join(app.root, ".no-config.toml"),
    '[daily]\nformat = "YYYY/MM/YYYY-MM-DD"\n',
  );
  app.runner.run({ kind: "loadConfig" });
  await waitFor(
    () => app.store.get().config.daily.format === "YYYY/MM/YYYY-MM-DD",
  );
  await app.open("daily/2026/10/2026-10-03.md");

  const answer = await exCreate(app, "Yesterday");
  expect(answer).toMatchObject({
    path: "daily/2026/10/2026-10-02.md",
    outcome: "created",
  });
  const text = await readFile(
    join(app.root, "daily/2026/10/2026-10-02.md"),
    "utf8",
  );
  expect(text).toContain("date: 2026-10-02\n");
  expect(text).toContain("# Friday, October 2\n");
  await waitFor(() => shown(app) === "daily/2026/10/2026-10-02.md");

  const log = await readFile(join(state, "so", "so.log"), "utf8");
  const created = log
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l) as Record<string, unknown>)
    .filter((l) => l.event === "notes.created");
  expect(created).toEqual([
    expect.objectContaining({
      path: "daily/2026/10/2026-10-02.md",
      created: true,
    }),
  ]);
  for (const line of ["Friday, October 2", "started the day", "today"])
    expect(log).not.toContain(line);
});
