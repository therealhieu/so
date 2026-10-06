import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createEffectRunner, type EffectRunner } from "../../src/app/effects";
import { createIndexHost, type IndexHost } from "../../src/app/index-host";
import { createLspHost, type LspHost } from "../../src/app/lsp-host";
import type { ToolHost } from "../../src/app/tool-host";
import { parseConfig } from "../../src/core/config/toml";
import { splitKeys } from "../../src/core/kernel/vim/keys";
import { fullText } from "../../src/core/state/buffers";
import {
  dirname as folderOf,
  isListed,
  listDirEffect,
} from "../../src/core/state/explorer";
import { initialState } from "../../src/core/state/init";
import { parsePersisted, snapshotSession } from "../../src/core/state/session";
import { createStore, type Store } from "../../src/core/state/store";
import type { Action, BufferState, Effect } from "../../src/core/state/types";
import { createUpdate } from "../../src/core/state/update";
import { bunGitSpawn, createGit } from "../../src/workspace/git";
import { type GitWatcher, watchGitDirs } from "../../src/workspace/git-watcher";
import { createExclusionMatcher } from "../../src/workspace/ignore";
import { createLogger } from "../../src/workspace/log";
import {
  readStateFile,
  saveStateFileSync,
} from "../../src/workspace/state-file";
import type { Trash } from "../../src/workspace/trash";
import { createOwnOps, watchWorkspace } from "../../src/workspace/watcher";
import { editingNotes, testRegistries } from "../support/state";

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

/** A git tool that never runs. */
const noTool: ToolHost = {
  run: async () => ({ kind: "failed", reason: "no git tool in this test" }),
};

/** Runner deps for a test that never discovers a repository or runs its tool. */
export const gitOff = () => ({
  git: createGit({ which: () => null, logger: createLogger({}, "/") }),
  watchGit: (): GitWatcher => ({ retarget() {}, stop() {} }),
  tool: noTool,
});

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
  /** The language server host, when the app was started with one. */
  lsp?: LspHost;
  /** config.toml, read again by `:ConfigReload`. */
  configPath: string;
  /** Stops the watcher, the index, and every language server. */
  stop(): Promise<void>;
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
    /** The environment the debug log reads (`SO_LOG`, `XDG_STATE_HOME`). */
    env?: Record<string, string>;
    /**
     * The session state file, loaded before the first listing as `main`
     * does; `restore` is a start on the folder. The `exit` effect and
     * `stop` save it, as the lifecycle does on every shutdown path.
     */
    state?: { path: string; restore: boolean };
    /**
     * Run the real language server host with this config.toml text, loaded
     * at startup as `main` does; `now` and `which` replace the host's clock
     * (crash window and answer times only) and `PATH` lookup.
     */
    lsp?: {
      config: string;
      now?: () => number;
      which?: (cmd: string) => string | null;
    };
    /**
     * Discover the repository holding `root` once started, as `main` does
     * after the first frame, running git with `env`.
     */
    git?: { env: Record<string, string> };
    /** Stands in for the git tool; without one, running it fails. */
    tool?: ToolHost;
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
  const logger = createLogger(opts.env ?? {}, root);
  const configPath =
    opts.lsp === undefined
      ? join(root, ".no-config.toml")
      : join(await mkdtemp(join(tmpdir(), "so-config-")), "config.toml");
  if (opts.lsp !== undefined) await writeFile(configPath, opts.lsp.config);
  const lsp =
    opts.lsp === undefined
      ? undefined
      : createLspHost({
          root,
          dispatch: (a) => store.dispatch(a),
          logger,
          ...(opts.lsp.now === undefined ? {} : { now: opts.lsp.now }),
          ...(opts.lsp.which === undefined ? {} : { which: opts.lsp.which }),
        });
  const git = createGit({
    spawn: bunGitSpawn(opts.git?.env),
    which: (c) => Bun.which(c),
    logger,
  });
  const gitWatchers: GitWatcher[] = [];
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
    exit: () => saveSession(),
    logger,
    configPath,
    ...(lsp === undefined ? {} : { lsp }),
    preview: { start: () => {}, stop: async () => {} },
    openUrl: async () => {},
    git,
    tool: opts.tool ?? noTool,
    watchGit: (dirs, onChange) => {
      const w = watchGitDirs(dirs, onChange, logger);
      gitWatchers.push(w);
      return w;
    },
    ...(opts.state === undefined ? {} : { statePath: opts.state.path }),
    ...(opts.index === undefined
      ? {}
      : {
          index: {
            search: (e) => index?.search(e),
            notify: (e) => index?.notify(e),
          },
        }),
  });
  const saveSession = () => {
    if (opts.state !== undefined)
      saveStateFileSync(opts.state.path, snapshotSession(store.get()));
  };
  const update = createUpdate(testRegistries());
  const store: Store = createStore(
    editingNotes(initialState({ root, cols: 100, rows: 30, color: "nocolor" })),
    (s, a) => {
      actions.push(a);
      return update(s, a);
    },
    (e) => {
      effects.push(e);
      runner.run(e);
    },
  );
  if (lsp !== undefined) {
    store.subscribe(lsp.observe);
    store.dispatch({
      type: "configLoaded",
      result: parseConfig(opts.lsp?.config ?? ""),
      reload: false,
    });
  }
  const index =
    opts.index === undefined
      ? undefined
      : createIndexHost({
          dispatch: (a) => store.dispatch(a),
          logger,
          ...opts.index,
        });
  const excluded = (rel: string) => {
    const s = store.get();
    if (matcher.isExcludedPath(rel, s.config.explorer)) return true;
    return (
      matcher.isExcludedPath(rel, { dotfiles: true }) &&
      !isListed(s, folderOf(rel))
    );
  };
  const stopWatch = watchWorkspace(root, ownOps, excluded, (event) => {
    const explorerOnly = matcher.isExcludedPath(event.path);
    store.dispatch({
      type: "fileChanged",
      event: explorerOnly ? { ...event, explorerOnly: true } : event,
    });
    if (explorerOnly) return;
    index?.notify(event);
    lsp?.notify(event);
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

  if (opts.state !== undefined)
    store.dispatch({
      type: "stateLoaded",
      state: parsePersisted(readStateFile(opts.state.path)),
      restore: opts.state.restore,
    });
  runner.run(listDirEffect(store.get(), ""));
  // Without a worker, an empty index is ready, so renames are not refused.
  if (index === undefined) store.dispatch({ type: "indexReady" });
  else index.start(root, []);
  await waitFor(() => store.get().panels.explorer.entries[""] !== undefined);
  await settle();
  if (opts.git !== undefined)
    store.dispatch({ type: "gitDetected", ...(await git.detect(root)) });

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
    ...(lsp === undefined ? {} : { lsp }),
    configPath,
    async stop() {
      stopWatch();
      for (const w of gitWatchers) w.stop();
      index?.stop();
      saveSession();
      await lsp?.stop();
    },
  };
}
