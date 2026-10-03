import { afterEach, expect, test } from "bun:test";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createTestRenderer } from "@opentui/core/testing";
import { createEffectRunner } from "../../src/app/effects";
import { defaults } from "../../src/core/config/schema";
import { parseConfig } from "../../src/core/config/toml";
import { splitKeys } from "../../src/core/kernel/vim/keys";
import { initialState } from "../../src/core/state/init";
import { createStore, type Store } from "../../src/core/state/store";
import { createUpdate } from "../../src/core/state/update";
import { registerEditorView } from "../../src/ui/editors/registry";
import { EditorView } from "../../src/ui/editors/text-view";
import { createShell } from "../../src/ui/shell";
import { themeOf } from "../../src/ui/theme";
import {
  configPath,
  readConfigTextSync,
} from "../../src/workspace/config-file";
import { createExclusionMatcher } from "../../src/workspace/ignore";
import { createLogger } from "../../src/workspace/log";
import { createOwnOps } from "../../src/workspace/watcher";
import { testRegistries } from "../support/state";
import { clock, tmpWorkspace, waitFor } from "./helpers";

const LONG = Array.from({ length: 40 }, (_, i) => `word${i}`).join(" ");

const SAVE_ON_LEADER_W = `[keys.normal]
"<leader>w" = "file.save"
`;

type Running = Awaited<ReturnType<typeof start>>;
let app: Running | undefined;
afterEach(async () => {
  app?.shell.destroy();
  if (app) await rm(app.base, { recursive: true, force: true });
  app = undefined;
});

/**
 * The app as `main` wires it, at 80×24: config.toml under a temp
 * XDG_CONFIG_HOME read before the shell attaches, the real runner (which
 * reloads it), and the shell's key normalizer on a test renderer.
 */
async function start(config?: string) {
  const base = await tmpWorkspace({
    "ws/notes/a.md": `${LONG}\nsecond\n`,
    "ws/scripts/sync.ts": "export const x = 1;\n",
  });
  const root = join(base, "ws");
  const path = configPath({ XDG_CONFIG_HOME: join(base, "xdg") }, "/no-home");
  await mkdir(join(base, "xdg/so"), { recursive: true });
  if (config !== undefined) await writeFile(path, config);

  registerEditorView("text", (ctx, deps) => new EditorView(ctx, deps));
  const t = await createTestRenderer({ width: 80, height: 24 });
  const reg = testRegistries();
  const runner = createEffectRunner({
    root,
    matcher: createExclusionMatcher(root, () => null),
    ownOps: createOwnOps(),
    trash: { available: false, move: () => Promise.reject(new Error("no")) },
    clipboard: { name: "none", copy: async () => {} },
    dispatch: (a) => store.dispatch(a),
    exit: () => {},
    logger: createLogger({}, base),
    configPath: path,
  });
  const store: Store = createStore(
    initialState({ root, cols: 80, rows: 24, color: "color" }),
    createUpdate(reg),
    runner.run,
  );
  const text = readConfigTextSync(path);
  if (text !== undefined)
    store.dispatch({
      type: "configLoaded",
      result: parseConfig(text),
      reload: false,
    });
  const shell = createShell(t.renderer, { reg, now: clock });
  shell.attach(store);

  const keys = (seq: string) => {
    for (const key of splitKeys(seq, store.get().config.leader))
      store.dispatch({ type: "key", key, now: clock() });
  };
  const activePath = () => {
    const s = store.get();
    const w = s.windows.byId[s.windows.active];
    return w && s.buffers[w.content.bufferId]?.path;
  };
  return {
    base,
    root,
    path,
    t,
    store,
    shell,
    keys,
    async open(file: string) {
      keys(`<Esc>:e ${file}<CR>`);
      await waitFor(() => activePath() === file);
    },
    async frame() {
      await t.renderOnce();
      return t.captureCharFrame().split("\n");
    },
    /** Rewrite config.toml and run :ConfigReload; resolves once it is applied. */
    async reload(next: string) {
      await writeFile(path, next);
      const before = store.get();
      keys(":ConfigReload<CR>");
      await waitFor(
        () =>
          store.get().config !== before.config ||
          store.get().notifications.toasts.length >
            before.notifications.toasts.length,
      );
    },
    toasts: () => store.get().notifications.toasts.map((x) => x.text),
  };
}

/** Milliseconds a legacy Esc byte takes to leave Insert through the normalizer. */
async function escDelay(a: Running): Promise<number> {
  a.keys("i");
  expect(a.store.get().vim.mode).toBe("insert");
  const t0 = performance.now();
  a.t.mockInput.pressEscape();
  await waitFor(() => a.store.get().vim.mode === "normal", 2000);
  return performance.now() - t0;
}

test("a leader binding from config saves the file", async () => {
  app = await start(SAVE_ON_LEADER_W);
  app.keys("<leader>e");
  await app.open("notes/a.md");
  app.keys("ggIx<Esc>");
  // Leaving Insert saves too; wait for it, then change the text in Normal mode.
  await waitFor(() => app?.store.get().buffers[1]?.dirty === false);
  app.keys("x");
  expect(app.store.get().buffers[1]?.dirty).toBe(true);
  app.keys("<leader>w");
  await waitFor(() => app?.store.get().buffers[1]?.dirty === false);
  expect(await readFile(join(app.root, "notes/a.md"), "utf8")).toBe(
    `${LONG}\nsecond\n`,
  );
});

test("an invalid startup config applies defaults and names its line", async () => {
  app = await start(
    ['theme = "light"', "", "[editor]", "wrap = false", "", "", "e = = 5"].join(
      "\n",
    ),
  );
  expect(app.store.get().config).toBe(defaults);
  const [toast] = app.toasts();
  expect(toast).toStartWith("config.toml:7: ");
  const frame = await app.frame();
  expect(frame.some((l) => l.includes("config.toml:7:"))).toBe(true);
});

test("per-scope overrides apply by file type", async () => {
  app = await start(
    `${SAVE_ON_LEADER_W}[filetypes.markdown.keys.normal]\n"<leader>w" = "window.vsplit"\n`,
  );
  app.keys("<leader>e");
  await app.open("notes/a.md");
  app.keys("<leader>w");
  expect(app.store.get().windows.tree.kind).toBe("row");
  expect(app.store.get().windows.active).toBe(2);
  await app.open("scripts/sync.ts");
  app.keys("x<leader>w");
  await waitFor(() => {
    const b = Object.values(app?.store.get().buffers ?? {}).find(
      (x) => x.path === "scripts/sync.ts",
    );
    return b?.dirty === false;
  });
  expect(await readFile(join(app.root, "scripts/sync.ts"), "utf8")).toBe(
    "xport const x = 1;\n",
  );
  expect(app.store.get().windows.active).toBe(2);
});

test("reload applies bindings, escape timeout, theme, and wrap", async () => {
  app = await start(SAVE_ON_LEADER_W);
  app.keys("<leader>e");
  await app.open("notes/a.md");
  let frame = await app.frame();
  expect(frame.filter((l) => l.includes("word")).length).toBeGreaterThan(1);
  expect(themeOf(app.store.get()).name).toBe("dark");
  expect(await escDelay(app)).toBeLessThan(150);

  await app.reload(
    [
      'leader = ","',
      "escTimeoutMs = 300",
      'theme = "light"',
      "[editor]",
      "wrap = false",
      "[keys.normal]",
      '"<leader>v" = "window.vsplit"',
    ].join("\n"),
  );
  expect(app.toasts()).toEqual([]);
  app.keys("<leader>v");
  expect(app.store.get().windows.active).toBe(2);
  expect(themeOf(app.store.get()).name).toBe("light");
  expect(await escDelay(app)).toBeGreaterThanOrEqual(280);
  frame = await app.frame();
  // Both windows show the paragraph on one row ending in the overflow marker.
  const rows = frame.filter((l) => l.includes("word0")).join("\n");
  expect(rows.split("word0").length - 1).toBe(2);
  expect(rows.split("›").length - 1).toBe(2);
  expect(frame.some((l) => l.includes("word39"))).toBe(false);
});

test("an invalid reload keeps the previous config", async () => {
  app = await start(SAVE_ON_LEADER_W);
  app.keys("<leader>e");
  await app.open("notes/a.md");
  const before = app.store.get().config;
  await app.reload('[keys.normal]\n"<leader>w" = "no.such.command"\n');
  expect(app.store.get().config).toBe(before);
  expect(app.toasts()).toEqual([
    'config.toml:2: unknown command id "no.such.command"',
  ]);
  app.keys("x<leader>w");
  await waitFor(() => app?.store.get().buffers[1]?.dirty === false);
  expect(await readFile(join(app.root, "notes/a.md"), "utf8")).toBe(
    `ord0 ${LONG.slice(6)}\nsecond\n`,
  );
});

test("reload of a missing config file applies the defaults", async () => {
  app = await start('theme = "light"\n');
  expect(app.store.get().config.theme).toBe("light");
  await rm(app.path);
  app.keys("<leader>e:ConfigReload<CR>");
  await waitFor(() => app?.store.get().config.theme === "dark");
  expect(app.store.get().config).toEqual(defaults);
});

test('color = "never" paints without colour', async () => {
  app = await start('color = "never"\n');
  expect(themeOf(app.store.get()).name).toBe("nocolor");
  await app.t.renderOnce();
  const intents = new Set(
    app.t
      .captureSpans()
      .lines.flatMap((l) => l.spans)
      .flatMap((sp) => [sp.fg.intent, sp.bg.intent]),
  );
  expect([...intents]).toEqual(["default"]);
});
