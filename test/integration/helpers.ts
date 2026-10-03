import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createEffectRunner, type EffectRunner } from "../../src/app/effects";
import { createIndexHost, type IndexHost } from "../../src/app/index-host";
import { splitKeys } from "../../src/core/kernel/vim/keys";
import { fullText } from "../../src/core/state/buffers";
import { initialState } from "../../src/core/state/init";
import { createStore, type Store } from "../../src/core/state/store";
import type { Action, BufferState, Effect } from "../../src/core/state/types";
import { createUpdate } from "../../src/core/state/update";
import { createExclusionMatcher } from "../../src/workspace/ignore";
import { createLogger } from "../../src/workspace/log";
import type { Trash } from "../../src/workspace/trash";
import { createOwnOps, watchWorkspace } from "../../src/workspace/watcher";
import { testRegistries } from "../support/state";

/** The runner's clock, so key times and timer times compare. */
export const clock = () => performance.timeOrigin + performance.now();

/** The watcher debounce (50 ms) plus time for macOS event replays. */
export const settle = () => Bun.sleep(50 + 300);

export async function waitFor(pred: () => boolean, ms = 5000): Promise<void> {
  const until = performance.now() + ms;
  while (!pred()) {
    if (performance.now() > until) throw new Error("timed out waiting");
    await Bun.sleep(5);
  }
}

/** A fresh temp folder holding `files` (workspace-relative path → text). */
export async function tmpWorkspace(
  files: Record<string, string> = {},
): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "so-it-"));
  for (const [path, text] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), text);
  }
  return root;
}

/**
 * A trash double whose moves hold the serial queue until `release()`; after
 * that, every move (even one not started yet) completes at once.
 */
export function gatedTrash(): Trash & { release(): void } {
  let open = () => {};
  const gate = new Promise<void>((r) => {
    open = r;
  });
  return { available: true, move: () => gate, release: () => open() };
}

export type App = {
  root: string;
  store: Store;
  runner: EffectRunner;
  /** Every action that reached `update`, in order. */
  actions: Action[];
  /** Every effect the runner received, in order. */
  effects: Effect[];
  keys(seq: string): void;
  /** `:e path` and wait until the buffer is shown. */
  open(path: string): Promise<BufferState>;
  buffer(path: string): BufferState | undefined;
  text(path: string): string | undefined;
  /** Focus the explorer and move its selection to `path`. */
  select(path: string): void;
  /** The index host, when the app was started with one. */
  index?: IndexHost;
  stop(): void;
};

/**
 * The app as `main` wires it, minus the UI: real store and reducers, real
 * runner and file adapter, and a real watcher on `root`.
 */
export async function startApp(
  root: string,
  opts: {
    trash?: Trash;
    /** Run the real index host and worker; `spawn` may wrap the worker. */
    index?: { spawn?: () => Worker };
  } = {},
): Promise<App> {
  const actions: Action[] = [];
  const effects: Effect[] = [];
  const matcher = createExclusionMatcher(root, (p) => {
    try {
      return readFileSync(p, "utf8");
    } catch {
      return null;
    }
  });
  const ownOps = createOwnOps();
  const runner = createEffectRunner({
    root,
    matcher,
    ownOps,
    trash: opts.trash ?? {
      available: false,
      move: () => Promise.reject(new Error("no trash")),
    },
    clipboard: { name: "none", copy: async () => {} },
    dispatch: (a) => store.dispatch(a),
    exit: () => {},
    logger: createLogger({}, root),
    configPath: join(root, ".no-config.toml"),
  });
  const update = createUpdate(testRegistries());
  const store: Store = createStore(
    initialState({ root, cols: 100, rows: 30, color: "nocolor" }),
    (s, a) => {
      actions.push(a);
      return update(s, a);
    },
    (e) => {
      effects.push(e);
      runner.run(e);
    },
  );
  const index =
    opts.index === undefined
      ? undefined
      : createIndexHost({
          dispatch: (a) => store.dispatch(a),
          logger: createLogger({}, root),
          ...opts.index,
        });
  const stopWatch = watchWorkspace(root, ownOps, matcher, (event) => {
    store.dispatch({ type: "fileChanged", event });
    index?.notify(event);
  });
  const buffer = (path: string) =>
    Object.values(store.get().buffers).find((b) => b.path === path);
  const keys = (seq: string) => {
    for (const key of splitKeys(seq))
      store.dispatch({ type: "key", key, now: clock() });
  };
  const activePath = () => {
    const s = store.get();
    const w = s.windows.byId[s.windows.active];
    return w && s.buffers[w.content.bufferId]?.path;
  };

  runner.run({ kind: "listDir", dir: "" });
  // Without a worker, an empty index is ready, so renames are not refused.
  if (index === undefined) store.dispatch({ type: "indexReady" });
  else index.start(root, []);
  await waitFor(() => store.get().panels.explorer.entries[""] !== undefined);
  await settle();

  return {
    root,
    store,
    runner,
    actions,
    effects,
    keys,
    async open(path) {
      keys(`<Esc>:e ${path}<CR>`);
      await waitFor(() => activePath() === path);
      return buffer(path) as BufferState;
    },
    buffer,
    text: (path) => {
      const b = buffer(path);
      return b && fullText(b.text);
    },
    select(path) {
      if (!store.get().panels.explorer.focused) keys("<Esc> e");
      for (
        let i = 0;
        i < 50 && store.get().panels.explorer.cursor !== path;
        i++
      )
        keys("k");
      for (
        let i = 0;
        i < 50 && store.get().panels.explorer.cursor !== path;
        i++
      )
        keys("j");
      if (store.get().panels.explorer.cursor !== path)
        throw new Error(`cannot select ${path}`);
    },
    ...(index === undefined ? {} : { index }),
    stop() {
      stopWatch();
      index?.stop();
    },
  };
}
