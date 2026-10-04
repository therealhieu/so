import { readFileSync, realpathSync } from "node:fs";
import { stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import pkg from "../../package.json";
import { parseConfig } from "../core/config/toml";
import { baseEditorKind, baseFileType } from "../core/features/bases/file-type";
import { KANBAN_TYPE } from "../core/features/bases/types";
import {
  BaseLayoutRegistry,
  boardLayout,
  tableLayout,
} from "../core/features/bases/views";
import {
  EditorKindRegistry,
  FileTypeRegistry,
  textFileType,
} from "../core/filetypes/registry";
import {
  defaultBindings,
  defaultGroups,
} from "../core/kernel/commands/defaults";
import { CommandRegistry } from "../core/kernel/commands/registry";
import { codeFileTypes } from "../core/lang/code/file-types";
import { markdownFileType } from "../core/lang/markdown/file-type";
import { builtinRenderers } from "../core/lang/markdown/renderers/index";
import { baseBindings, baseCommands } from "../core/state/base-commands";
import { baseViewModel } from "../core/state/base-model";
import { activeBuffer } from "../core/state/buffers";
import {
  type CommandContext,
  type CommandResult,
  registerBuiltins,
} from "../core/state/commands";
import { initialState } from "../core/state/init";
import { editorBindings, nextLineCommand } from "../core/state/keys";
import {
  linkBindings,
  linkCommands,
  linkGroups,
} from "../core/state/link-commands";
import {
  markdownBindings,
  markdownCommands,
} from "../core/state/markdown-commands";
import { markdownViewContext } from "../core/state/markdown-view";
import {
  noteBindings,
  noteCommands,
  noteGroups,
} from "../core/state/note-commands";
import { parsePersisted, snapshotSession } from "../core/state/session";
import { createStore, type Store } from "../core/state/store";
import type { Action, AppState } from "../core/state/types";
import { createUpdate, type Registries } from "../core/state/update";
import { ViewContextRegistry } from "../core/state/view-context";
import { BaseView } from "../ui/editors/base-view";
import { registerEditorView } from "../ui/editors/registry";
import { EditorView } from "../ui/editors/text-view";
import { createRenderer, createShell } from "../ui/shell";
import { paintEmbed } from "../ui/widgets/embed";
import { paintImage } from "../ui/widgets/image";
import { registerWidgetPainter } from "../ui/widgets/registry";
import { paintRule } from "../ui/widgets/rule";
import { configPath, readConfigTextSync } from "../workspace/config-file";
import { createExclusionMatcher } from "../workspace/ignore";
import { createImageLoader } from "../workspace/images";
import { createLogger, type Logger } from "../workspace/log";
import {
  readStateFile,
  saveStateFileSync,
  statePath,
} from "../workspace/state-file";
import { detectClipboard, openUrl } from "../workspace/system";
import { detectTrash } from "../workspace/trash";
import { createOwnOps, watchWorkspace } from "../workspace/watcher";
import {
  createEffectRunner,
  type EffectRunner,
  type RunnerDeps,
} from "./effects";
import { createIndexHost } from "./index-host";
import { installLifecycle } from "./lifecycle";
import { createPreviewHost } from "./preview-host";

/** Inlined from the release tag at build time; the package version otherwise. */
export const VERSION = process.env.SO_VERSION ?? pkg.version;

const USAGE = "usage: so [--version] [--help] [path]\n";

/** The one clock for keys, timers, and the statusline. */
const clock = () => performance.timeOrigin + performance.now();

type Cli = { version: boolean; help: boolean; path: string | undefined };

function parseCli(argv: string[]): Cli {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      version: { type: "boolean", short: "v" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });
  if (positionals.length > 1) throw new Error("expected at most one path");
  return {
    version: values.version === true,
    help: values.help === true,
    path: positionals[0],
  };
}

/** The workspace folder, and the file to open when `path` names one. */
async function resolveWorkspace(
  path: string,
): Promise<{ root: string; file?: string } | undefined> {
  const abs = resolve(path);
  const st = await stat(abs).catch(() => undefined);
  if (st === undefined) return undefined;
  return st.isDirectory()
    ? { root: abs }
    : { root: dirname(abs), file: basename(abs) };
}

function registries(): Registries {
  const fileTypes = new FileTypeRegistry(textFileType);
  for (const ft of codeFileTypes) fileTypes.register(ft);
  fileTypes.register(markdownFileType);
  fileTypes.register(baseFileType);
  const editorKinds = new EditorKindRegistry();
  editorKinds.register(baseEditorKind);
  const commands = new CommandRegistry<CommandContext, CommandResult>();
  registerBuiltins(commands);
  for (const c of linkCommands) commands.register(c);
  for (const c of markdownCommands) commands.register(c);
  for (const c of noteCommands) commands.register(c);
  for (const c of baseCommands) commands.register(c);
  commands.register(nextLineCommand);
  const viewContexts = new ViewContextRegistry();
  viewContexts.register("markdown", markdownViewContext);
  builtinRenderers();
  const layouts = new BaseLayoutRegistry(tableLayout);
  if (KANBAN_TYPE !== undefined) layouts.register(KANBAN_TYPE, boardLayout);
  const reg: Registries = {
    fileTypes,
    editorKinds,
    commands,
    bindings: [
      ...defaultBindings,
      ...editorBindings,
      ...linkBindings,
      ...markdownBindings,
      ...noteBindings,
      ...baseBindings,
    ],
    groups: { ...defaultGroups, ...linkGroups, ...noteGroups },
    viewContexts,
    layouts,
  };
  viewContexts.register("base", (s, id) => baseViewModel(s, id, reg));
  return reg;
}

/**
 * config.toml as it is at startup: undefined when there is none (defaults
 * stay), its parse result otherwise. A file that cannot be read is an error
 * at line 1, so the defaults apply with an error toast.
 */
function loadStartupConfig(path: string, logger: Logger): Action | undefined {
  let text: string | undefined;
  try {
    text = readConfigTextSync(path);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error("config.readFailed", { reason: message });
    return {
      type: "configLoaded",
      result: { ok: false, errors: [{ line: 1, message }] },
      reload: false,
    };
  }
  if (text === undefined) return undefined;
  const result = parseConfig(text);
  if (!result.ok)
    logger.error("config.invalid", { errors: result.errors.length });
  return { type: "configLoaded", result, reload: false };
}

/** Saves the session on shutdown; a failure is logged and never stops the exit. */
function sessionSaver(
  path: string | undefined,
  logger: Logger,
): ((s: AppState) => void) | undefined {
  if (path === undefined) return undefined;
  return (s) => {
    try {
      saveStateFileSync(path, snapshotSession(s));
    } catch (e) {
      logger.error("state.saveFailed", {
        reason: e instanceof Error ? e.message : String(e),
      });
    }
  };
}

const readOrNull = (p: string): string | null => {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return null;
  }
};

const testing = process.env.SO_TEST === "1";

/** Test-only: `SO_TEST_SLOW_WRITE=<ms>` delays every write, including the shutdown flush. */
function slowWrites(runner: EffectRunner): EffectRunner {
  const ms = testing ? Number(process.env.SO_TEST_SLOW_WRITE ?? 0) : 0;
  if (!(ms > 0)) return runner;
  return {
    run: (e) =>
      e.kind === "write"
        ? void Bun.sleep(ms).then(() => runner.run(e))
        : runner.run(e),
    flush: (w) => Bun.sleep(ms).then(() => runner.flush(w)),
  };
}

/** Test-only: `SO_TEST_THROW=1` throws outside the reducer once the active buffer's first line has "THROW". */
function injectThrow(store: Store): void {
  if (!testing || process.env.SO_TEST_THROW !== "1") return;
  store.subscribe((s) => {
    if (activeBuffer(s)?.text.line(0).includes("THROW"))
      setTimeout(() => {
        throw new Error("injected failure");
      });
  });
}

async function main(argv: string[]): Promise<void> {
  let cli: Cli;
  try {
    cli = parseCli(argv);
  } catch (e) {
    process.stderr.write(`so: ${e instanceof Error ? e.message : e}\n${USAGE}`);
    process.exit(2);
  }
  if (cli.version) {
    process.stdout.write(`so ${VERSION}\n`);
    process.exit(0);
  }
  if (cli.help) {
    process.stdout.write(USAGE);
    process.exit(0);
  }
  const target = cli.path ?? process.cwd();
  const ws = await resolveWorkspace(target);
  if (ws === undefined) {
    process.stderr.write(`so: no such file or directory: ${target}\n`);
    process.exit(2);
  }

  const logger = createLogger(process.env, homedir());
  logger.info("app.startup", { root: ws.root });
  const configFile = configPath(process.env, homedir());
  const stateFile = statePath(process.env, homedir(), realpathSync(ws.root));
  const reg = registries();
  registerEditorView("text", (ctx, deps) => new EditorView(ctx, deps));
  registerEditorView("base", (ctx, deps) => new BaseView(ctx, deps));
  registerWidgetPainter("embed", paintEmbed);
  registerWidgetPainter("text", paintEmbed);
  registerWidgetPainter("rule", paintRule);
  registerWidgetPainter("image", paintImage);
  const renderer = await createRenderer();
  const shell = createShell(renderer, {
    reg,
    now: clock,
    loadImage: createImageLoader(ws.root),
  });
  const matcher = createExclusionMatcher(ws.root, readOrNull);
  const ownOps = createOwnOps();
  const indexHost = createIndexHost({
    dispatch: (a) => store.dispatch(a),
    logger,
  });
  const previewHost = createPreviewHost({
    root: ws.root,
    store: () => store,
    isExcluded: matcher.isExcludedPath,
    dispatch: (a) => store.dispatch(a),
    logger,
  });
  // Trash, clipboard, and exit are bound once detected or constructed; the
  // runner reads them at call time.
  const deps: RunnerDeps = {
    root: ws.root,
    matcher,
    ownOps,
    trash: {
      available: false,
      move: () => Promise.reject(new Error("trash not ready")),
    },
    clipboard: { name: "none", copy: async () => {} },
    dispatch: (a) => store.dispatch(a),
    exit: () => {},
    now: clock,
    logger,
    configPath: configFile,
    ...(stateFile === undefined ? {} : { statePath: stateFile }),
    index: indexHost,
    preview: previewHost,
    openUrl: (url) => openUrl(url, process.platform),
  };
  const runner = slowWrites(createEffectRunner(deps));
  const noColor = (process.env.NO_COLOR ?? "") !== "";
  const store = createStore(
    initialState({
      root: ws.root,
      cols: renderer.width,
      rows: renderer.height,
      color: noColor ? "nocolor" : "color",
    }),
    createUpdate(reg),
    runner.run,
  );
  const config = loadStartupConfig(configFile, logger);
  if (config !== undefined) store.dispatch(config);
  if (stateFile !== undefined)
    store.dispatch({
      type: "stateLoaded",
      state: parsePersisted(readStateFile(stateFile)),
      restore: ws.file === undefined,
    });
  shell.attach(store);
  injectThrow(store);
  const saveSession = sessionSaver(stateFile, logger);
  const lifecycle = installLifecycle({
    store,
    shell,
    runner,
    ...(saveSession === undefined ? {} : { saveSession }),
    stopPreview: previewHost.stop,
  });
  deps.exit = lifecycle.exitNow;

  runner.run({ kind: "listDir", dir: "" });
  if (ws.file !== undefined) runner.run({ kind: "read", path: ws.file });

  // Watching, indexing, and platform detection start after the first frame.
  setImmediate(() => {
    watchWorkspace(ws.root, ownOps, matcher, (event) => {
      store.dispatch({ type: "fileChanged", event });
      indexHost.notify(event);
    });
    indexHost.start(ws.root, []);
    runner.run({ kind: "readPropertyTypes" });
    logger.info("app.firstFrame", { ms: Math.round(performance.now()) });
    void detectTrash({
      platform: process.platform,
      env: process.env,
      root: ws.root,
    }).then((trash) => {
      deps.trash = trash;
      store.dispatch({ type: "trashAvailable", available: trash.available });
    });
    void detectClipboard(
      {
        platform: process.platform,
        env: process.env,
        which: (cmd) => Bun.which(cmd),
        run: (cmd) =>
          Bun.spawn(cmd, { stdout: "ignore", stderr: "ignore" }).exited,
      },
      shell.copyOsc52,
    ).then((clipboard) => {
      deps.clipboard = clipboard;
    });
  });
}

await main(process.argv.slice(2));
