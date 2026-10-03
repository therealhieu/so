import { readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import pkg from "../../package.json";
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
import { activeBuffer } from "../core/state/buffers";
import {
  type CommandContext,
  type CommandResult,
  registerBuiltins,
} from "../core/state/commands";
import { initialState } from "../core/state/init";
import { createStore, type Store } from "../core/state/store";
import { createUpdate, type Registries } from "../core/state/update";
import { registerEditorView } from "../ui/editors/registry";
import { EditorView } from "../ui/editors/text-view";
import { createRenderer, createShell } from "../ui/shell";
import { createExclusionMatcher } from "../workspace/ignore";
import { detectClipboard } from "../workspace/system";
import { detectTrash } from "../workspace/trash";
import { createOwnOps, watchWorkspace } from "../workspace/watcher";
import {
  createEffectRunner,
  type EffectRunner,
  type RunnerDeps,
} from "./effects";
import { installLifecycle } from "./lifecycle";

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
  const commands = new CommandRegistry<CommandContext, CommandResult>();
  registerBuiltins(commands);
  return {
    fileTypes,
    editorKinds: new EditorKindRegistry(),
    commands,
    bindings: defaultBindings,
    groups: defaultGroups,
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

  const reg = registries();
  registerEditorView("text", (ctx, deps) => new EditorView(ctx, deps));
  const renderer = await createRenderer();
  const shell = createShell(renderer, {
    fileTypes: reg.fileTypes,
    commands: reg.commands,
    now: clock,
  });
  const matcher = createExclusionMatcher(ws.root, readOrNull);
  const ownOps = createOwnOps();
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
  shell.attach(store);
  injectThrow(store);
  const lifecycle = installLifecycle({ store, shell, runner });
  deps.exit = lifecycle.exitNow;

  runner.run({ kind: "listDir", dir: "" });
  if (ws.file !== undefined) runner.run({ kind: "read", path: ws.file });

  // Watching and platform detection start after the first frame.
  setImmediate(() => {
    watchWorkspace(ws.root, ownOps, matcher, (event) =>
      store.dispatch({ type: "fileChanged", event }),
    );
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
