import { afterEach, beforeEach, expect, test } from "bun:test";
import { chmodSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { PROBE_BOUND_MS } from "../../src/app/lsp-host";
import type { FakeScript } from "../fixtures/fake-lsp";
import {
  fakeServerConfig,
  fakeTsc,
  killServers,
  lspConfig,
  readServerLog,
  waitForMessage,
} from "../support/lsp";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

let app: App | undefined;
let logs: string[] = [];
let dir = "";

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "so-lsp-"));
});

afterEach(async () => {
  await app?.stop();
  app = undefined;
  const alive = killServers(logs);
  logs = [];
  expect(alive).toEqual([]);
});

/** A fresh log path for one fake server. */
const logFor = (name: string) => {
  const log = join(dir, `${name}.jsonl`);
  logs.push(log);
  return log;
};

const fake = (
  name: string,
  fileTypes: string[],
  script: FakeScript,
  more: Partial<Parameters<typeof fakeServerConfig>[0]> = {},
) => {
  const log = logFor(name);
  return {
    log,
    config: fakeServerConfig({ name, fileTypes, script, log, ...more }),
  };
};

const messages = (log: string, method: string) =>
  readServerLog(log).filter((m) => m.method === method);
const processes = (log: string) =>
  readServerLog(log).filter((m) => m.pid !== undefined);
/** Toasts other than the index's own notice. */
const serverToasts = (a: App) =>
  a.store.get().notifications.toasts.filter((t) => t.text !== "index ready");
const uri = (p: string) => pathToFileURL(p).href;

async function reload(a: App, config: string): Promise<void> {
  await writeFile(a.configPath, config);
  a.keys("<Esc>:ConfigReload<CR>");
}

const pidGone = (pid: number | undefined) => {
  if (pid === undefined) return false;
  try {
    process.kill(pid, 0);
    return false;
  } catch {
    return true;
  }
};

test("servers start only when enabled and stop when disabled again", async () => {
  const root = await tmpWorkspace({ "src/main.rs": "fn main() {}\n" });
  const rs = fake("rs", ["rust"], {});
  app = await startApp(root, { lsp: { config: lspConfig(false, rs.config) } });
  await app.open("src/main.rs");
  await Bun.sleep(300);
  expect(readServerLog(rs.log)).toEqual([]);
  expect(app.store.get().lsp.servers).toEqual({});

  await reload(app, lspConfig(true, rs.config));
  await waitForMessage(rs.log, "textDocument/didOpen");
  expect(messages(rs.log, "initialize")).toHaveLength(1);
  const key = "rs@";
  await waitFor(() => app?.store.get().lsp.servers[key]?.state === "ready");
  expect(app.store.get().lsp.attached["src/main.rs"]).toEqual([key]);

  app.keys("K");
  await waitFor(() => app?.store.get().lsp.float !== undefined);
  expect(app.store.get().lsp.float?.lines).toEqual(["fake hover"]);

  const pid = processes(rs.log)[0]?.pid;
  await reload(app, lspConfig(false, rs.config));
  await waitFor(() => pidGone(pid));
  expect(app.store.get().lsp.servers).toEqual({});
  expect(app.store.get().lsp.attached).toEqual({});
  expect(processes(rs.log)).toHaveLength(1);
});

test("one process serves a Cargo workspace and marker-less files share one without a folder", async () => {
  const root = await tmpWorkspace({
    "repo/Cargo.toml": "[workspace]\n",
    "repo/a/Cargo.toml": "[package]\n",
    "repo/a/src/lib.rs": "pub fn a() {}\n",
    "repo/b/Cargo.toml": "[package]\n",
    "repo/b/src/lib.rs": "pub fn b() {}\n",
    "other/Cargo.toml": "[package]\n",
    "other/src/main.rs": "fn main() {}\n",
    "notes/a.py": "a = 1\n",
    "notes/b.py": "b = 2\n",
  });
  const rs = fake(
    "rs",
    ["rust"],
    {},
    { rootMarkers: ["Cargo.toml"], rootSearch: "topmost" },
  );
  const py = fake("py", ["python"], {}, { rootMarkers: ["pyproject.toml"] });
  app = await startApp(root, {
    lsp: { config: lspConfig(true, rs.config, py.config) },
  });
  for (const path of [
    "repo/a/src/lib.rs",
    "repo/b/src/lib.rs",
    "other/src/main.rs",
    "notes/a.py",
    "notes/b.py",
  ])
    await app.open(path);
  await waitForMessage(rs.log, "textDocument/didOpen", 5000, 3);
  await waitForMessage(py.log, "textDocument/didOpen", 5000, 2);

  // Both rs processes write to one log, in whichever order they start.
  const rsInit = messages(rs.log, "initialize")
    .map((m) => (m.params as { rootUri: string | null }).rootUri)
    .sort();
  expect(rsInit).toEqual(
    [uri(join(root, "repo")), uri(join(root, "other"))].sort(),
  );
  expect(processes(rs.log)).toHaveLength(2);
  const pyInit = messages(py.log, "initialize").map((m) => m.params) as {
    rootUri: string | null;
    workspaceFolders: unknown;
  }[];
  expect(pyInit.map((p) => [p.rootUri, p.workspaceFolders])).toEqual([
    [null, null],
  ]);
  const attached = app.store.get().lsp.attached;
  expect(attached["repo/a/src/lib.rs"]).toEqual([`rs@${join(root, "repo")}`]);
  expect(attached["repo/b/src/lib.rs"]).toEqual([`rs@${join(root, "repo")}`]);
  expect(attached["other/src/main.rs"]).toEqual([`rs@${join(root, "other")}`]);
  expect(attached["notes/b.py"]).toEqual(["py@"]);
});

test("a second server on the same file type also attaches and both diagnostics show", async () => {
  const root = await tmpWorkspace({
    "main.rs": "fn main() {\n  let x = 1;\n}\n",
  });
  const diag = (line: number, message: string) => ({
    range: {
      start: { line, character: 0 },
      end: { line, character: 2 },
    },
    severity: 1,
    message,
  });
  const a = fake("a", ["rust"], { diagnostics: [diag(0, "from a")] });
  const b = fake("b", ["rust"], {
    diagnostics: [diag(1, "from b"), diag(2, "also b")],
  });
  app = await startApp(root, {
    lsp: { config: lspConfig(true, a.config, b.config) },
  });
  await app.open("main.rs");
  await waitForMessage(a.log, "textDocument/didOpen");
  await waitForMessage(b.log, "textDocument/didOpen");
  await waitFor(() => app?.store.get().lsp.shown["main.rs"]?.length === 3);
  expect(app.store.get().lsp.attached["main.rs"]).toEqual(["a@", "b@"]);
  expect(
    app.store
      .get()
      .lsp.shown["main.rs"]?.map((d) => d.message)
      .sort(),
  ).toEqual(["also b", "from a", "from b"]);
});

test("a project's own tsc is used and picks the TypeScript server by version", async () => {
  for (const [version, chosen] of [
    ["7.0.0", "tsc"],
    ["5.9.0", "typescript"],
  ] as const) {
    const root = await tmpWorkspace({
      "package.json": "{}\n",
      "src/x.ts": "export const x = 1;\n",
    });
    const tscLog = logFor(`tsc-${version}`);
    const stub = fakeTsc(root, version, {}, tscLog);
    const ts = fake(`typescript-${version}`, ["typescript"], {});
    const config = lspConfig(
      true,
      '[lsp.servers."tsc"]\nenabled = true\n',
      ts.config.replace(
        `[lsp.servers."typescript-${version}"]`,
        '[lsp.servers."typescript"]',
      ),
    );
    app = await startApp(root, {
      lsp: {
        config,
        which: (cmd) =>
          cmd === "tsc" ? "/opt/global/bin/tsc" : Bun.which(cmd),
      },
    });
    const opened = performance.now();
    await app.open("src/x.ts");
    const attachedKeys = () => app?.store.get().lsp.attached["src/x.ts"] ?? [];
    // The gate decides once the version probe answers: no key means the
    // probe is still running, and `typescript` for a 7.x stub means it gave
    // no version (failed or ran past PROBE_BOUND_MS).
    await waitFor(() => attachedKeys().length > 0, 10_000).catch(() => {
      throw new Error(
        `tsc ${version}: no server attached ${Math.round(performance.now() - opened)} ms after open; the version probe has not answered`,
      );
    });
    if (attachedKeys()[0] !== `${chosen}@${root}`)
      throw new Error(
        `tsc ${version}: expected ${chosen}, attached ${JSON.stringify(attachedKeys())} ${Math.round(performance.now() - opened)} ms after open; the version probe answered ${chosen === "tsc" ? "no version" : "7 or later"} (PROBE_BOUND_MS is ${PROBE_BOUND_MS} ms)`,
      );
    const used = chosen === "tsc" ? tscLog : ts.log;
    const unused = chosen === "tsc" ? ts.log : tscLog;
    await waitForMessage(used, "textDocument/didOpen");
    await Bun.sleep(200);
    expect(readServerLog(unused)).toEqual([]);
    expect(attachedKeys()).toEqual([`${chosen}@${root}`]);
    if (chosen === "tsc") {
      expect(stub).toBe(join(root, "node_modules/.bin/tsc"));
      expect(processes(tscLog)[0]?.argv?.at(-1)).toBe(stub);
      expect(app.store.get().lsp.servers[`tsc@${root}`]?.binary).toBe(stub);
    }
    await app.stop();
    app = undefined;
  }
}, 15_000);

test("settings reach servers by configuration requests and initialization options", async () => {
  const root = await tmpWorkspace({
    "main.py": "x = 1\n",
    "main.rs": "fn main() {}\n",
  });
  const py = fake(
    "py",
    ["python"],
    { configurationRequest: { sections: ["python.analysis", "missing.key"] } },
    { settings: { python: { analysis: { x: 1 } } } },
  );
  const raLog = logFor("rust-analyzer");
  const ra = fakeServerConfig({
    name: "rust-analyzer",
    script: {},
    log: raLog,
    settings: { "rust-analyzer": { check: { command: "clippy" } } },
  });
  app = await startApp(root, {
    lsp: { config: lspConfig(true, py.config, ra) },
  });
  await app.open("main.py");
  await app.open("main.rs");
  await waitForMessage(py.log, "response:workspace/configuration");
  await waitForMessage(raLog, "initialize");

  expect(
    messages(py.log, "response:workspace/configuration")[0]?.result,
  ).toEqual([{ x: 1 }, null]);
  const methods = readServerLog(py.log).map((m) => m.method);
  const initialized = methods.indexOf("initialized");
  expect(methods[initialized + 1]).toBe("workspace/didChangeConfiguration");
  expect(
    messages(py.log, "workspace/didChangeConfiguration")[0]?.params,
  ).toEqual({ settings: { python: { analysis: { x: 1 } } } });
  expect(messages(raLog, "initialize")[0]?.params).toMatchObject({
    initializationOptions: { check: { command: "clippy" } },
  });
});

test("a server that exits before initializing is unavailable without a toast or restart", async () => {
  const root = await tmpWorkspace({ "main.rs": "fn main() {}\n" });
  const state = await mkdtemp(join(tmpdir(), "so-state-"));
  const rs = fake("rs", ["rust"], {
    exitBeforeInitialize: { stderr: "error: component not installed" },
  });
  app = await startApp(root, {
    lsp: { config: lspConfig(true, rs.config) },
    env: { SO_LOG: "debug", XDG_STATE_HOME: state },
  });
  await app.open("main.rs");
  await waitFor(
    () => app?.store.get().lsp.servers["rs@"]?.state === "unavailable",
  );
  expect(app.store.get().lsp.servers["rs@"]?.reason).toBe(
    "error: component not installed",
  );
  app.keys("ione<Esc>");
  await app.open("main.rs");
  await Bun.sleep(300);
  expect(processes(rs.log)).toHaveLength(1);
  expect(serverToasts(app)).toEqual([]);
  expect(app.store.get().lsp.attached["main.rs"]).toBeUndefined();
  const lines = readFileSync(join(state, "so/so.log"), "utf8")
    .split("\n")
    .filter((l) => l.includes('"lsp.unavailable"'));
  expect(lines).toHaveLength(1);
  expect(JSON.parse(lines[0] ?? "{}").reason).toBe(
    "error: component not installed",
  );
});

test("stopping kills a server that ignores shutdown within the bound", async () => {
  const root = await tmpWorkspace({ "main.rs": "fn main() {}\n" });
  const rs = fake("rs", ["rust"], { ignoreShutdown: true });
  app = await startApp(root, { lsp: { config: lspConfig(true, rs.config) } });
  await app.open("main.rs");
  await waitForMessage(rs.log, "textDocument/didOpen");
  const pid = processes(rs.log)[0]?.pid;
  const started = performance.now();
  await app.stop();
  app = undefined;
  expect(performance.now() - started).toBeLessThanOrEqual(700);
  expect(pidGone(pid)).toBe(true);
  const methods = readServerLog(rs.log).map((m) => m.method);
  expect(methods).toContain("shutdown");
  expect(methods.at(-1)).toBe("exit");
});

test("stopping leaves no version probe or starting server running", async () => {
  const root = await tmpWorkspace({
    "package.json": "{}\n",
    "src/x.ts": "export const x = 1;\n",
    "main.rs": "fn main() {}\n",
  });
  // A local tsc whose version probe records its pid and never answers.
  const probePidFile = join(dir, "probe.pid");
  const tsc = join(root, "node_modules/.bin/tsc");
  await mkdir(dirname(tsc), { recursive: true });
  await writeFile(
    tsc,
    `#!/bin/sh\nif [ "$1" = "--version" ]; then echo $$ > ${JSON.stringify(probePidFile)}; exec sleep 30; fi\n`,
  );
  chmodSync(tsc, 0o755);
  // Pay macOS's first-run check now, not inside the probe's bound.
  Bun.spawnSync([tsc], { stdout: "ignore", stderr: "ignore" });
  const rs = fake("rs", ["rust"], { ignoreInitialize: true });
  app = await startApp(root, {
    lsp: {
      config: lspConfig(
        true,
        '[lsp.servers."tsc"]\nenabled = true\n',
        rs.config,
      ),
    },
  });
  let probePid: number | undefined;
  try {
    await app.open("src/x.ts");
    await app.open("main.rs");
    await waitForMessage(rs.log, "initialize");
    await waitFor(() => {
      probePid = Number(readFileSync(probePidFile, { flag: "a+" }).toString());
      return probePid > 0;
    });
    const serverPid = processes(rs.log)[0]?.pid;
    expect([pidGone(probePid), pidGone(serverPid)]).toEqual([false, false]);

    const started = performance.now();
    await app.stop();
    app = undefined;
    const took = performance.now() - started;
    expect({ probe: pidGone(probePid), server: pidGone(serverPid) }).toEqual({
      probe: true,
      server: true,
    });
    expect(took).toBeLessThanOrEqual(700);
  } finally {
    if (probePid !== undefined && !pidGone(probePid))
      process.kill(probePid, "SIGKILL");
  }
});

const PULL_CAPS = {
  hoverProvider: true,
  diagnosticProvider: {
    interFileDependencies: false,
    workspaceDiagnostics: false,
  },
};
const diagnostic = (line: number, message: string) => ({
  range: { start: { line, character: 0 }, end: { line, character: 1 } },
  severity: 1,
  message,
});
/** The sync and pull messages the server received, in order. */
const syncLog = (log: string) =>
  readServerLog(log)
    .map((m) => m.method)
    .filter(
      (m) =>
        m === "textDocument/didOpen" ||
        m === "textDocument/didChange" ||
        m === "textDocument/diagnostic" ||
        m === "textDocument/hover",
    );

test("keys typed within the debounce produce one change sent before the next request", async () => {
  const root = await tmpWorkspace({ "main.rs": "fn main() {}\n" });
  const rs = fake("rs", ["rust"], {});
  app = await startApp(root, { lsp: { config: lspConfig(true, rs.config) } });
  await app.open("main.rs");
  await waitForMessage(rs.log, "textDocument/didOpen");
  await waitFor(() => app?.store.get().lsp.servers["rs@"]?.state === "ready");
  const opened = messages(rs.log, "textDocument/didOpen")[0]?.params as {
    textDocument: { version: number };
  };
  app.keys("i0123456789<Esc>K");
  await waitForMessage(rs.log, "textDocument/hover");
  await Bun.sleep(300);
  expect(syncLog(rs.log)).toEqual([
    "textDocument/didOpen",
    "textDocument/didChange",
    "textDocument/hover",
  ]);
  expect(messages(rs.log, "textDocument/didChange")[0]?.params).toEqual({
    textDocument: {
      uri: uri(join(root, "main.rs")),
      version: opened.textDocument.version + 10,
    },
    contentChanges: [
      {
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 12 },
        },
        text: "0123456789fn main() {}",
      },
    ],
  });
});

test("a pull server is pulled after opening and after each sent change", async () => {
  const root = await tmpWorkspace({ "main.rs": "fn main() {}\n" });
  const rs = fake("rs", ["rust"], {
    capabilities: PULL_CAPS,
    pull: { items: [diagnostic(0, "pulled")] },
  });
  app = await startApp(root, { lsp: { config: lspConfig(true, rs.config) } });
  await app.open("main.rs");
  await waitForMessage(rs.log, "textDocument/diagnostic");
  for (let n = 1; n <= 3; n++) {
    app.keys(`ix<Esc>`);
    await waitForMessage(rs.log, "textDocument/diagnostic", 5000, n + 1);
  }
  expect(syncLog(rs.log)).toEqual([
    "textDocument/didOpen",
    "textDocument/diagnostic",
    "textDocument/didChange",
    "textDocument/diagnostic",
    "textDocument/didChange",
    "textDocument/diagnostic",
    "textDocument/didChange",
    "textDocument/diagnostic",
  ]);
  const previous = messages(rs.log, "textDocument/diagnostic").map(
    (m) => (m.params as { previousResultId?: string }).previousResultId,
  );
  expect(previous).toEqual([undefined, "r1", "r2", "r3"]);
  await waitFor(() => app?.store.get().lsp.shown["main.rs"] !== undefined);
  expect(app.store.get().lsp.shown["main.rs"]?.map((d) => d.message)).toEqual([
    "pulled",
  ]);
});

test("a refresh pulls every open document again", async () => {
  const root = await tmpWorkspace({
    "a.rs": "fn a() {}\n",
    "b.rs": "fn b() {}\n",
  });
  const rs = fake("rs", ["rust"], {
    capabilities: PULL_CAPS,
    pull: { items: [] },
    refreshOn: "textDocument/hover",
  });
  app = await startApp(root, { lsp: { config: lspConfig(true, rs.config) } });
  await app.open("a.rs");
  await app.open("b.rs");
  await waitForMessage(rs.log, "textDocument/diagnostic", 5000, 2);
  await waitFor(() => app?.store.get().lsp.servers["rs@"]?.state === "ready");
  app.keys("K");
  await waitForMessage(rs.log, "textDocument/diagnostic", 5000, 4);
  await Bun.sleep(200);
  const pulled = messages(rs.log, "textDocument/diagnostic").map(
    (m) => (m.params as { textDocument: { uri: string } }).textDocument.uri,
  );
  expect(pulled.sort()).toEqual(
    [
      uri(join(root, "a.rs")),
      uri(join(root, "a.rs")),
      uri(join(root, "b.rs")),
      uri(join(root, "b.rs")),
    ].sort(),
  );
});

test("pushed and pulled lists are both kept and closing clears only the pulled one", async () => {
  const root = await tmpWorkspace({
    "main.rs": "fn main() {}\n",
    "other.rs": "",
  });
  const rs = fake("rs", ["rust"], {
    capabilities: PULL_CAPS,
    diagnostics: [diagnostic(0, "pushed")],
    pull: { items: [diagnostic(0, "pulled")] },
  });
  app = await startApp(root, { lsp: { config: lspConfig(true, rs.config) } });
  await app.open("main.rs");
  await waitFor(() => app?.store.get().lsp.shown["main.rs"]?.length === 2);
  expect(
    app.store
      .get()
      .lsp.shown["main.rs"]?.map((d) => d.message)
      .sort(),
  ).toEqual(["pulled", "pushed"]);
  await app.open("other.rs");
  await app.open("main.rs");
  app.keys(":bd<CR>");
  await waitForMessage(rs.log, "textDocument/didClose");
  await waitFor(
    () =>
      app?.store.get().lsp.diagnostics["main.rs"]?.["rs@"]?.pull === undefined,
  );
  expect(app.store.get().lsp.diagnostics["main.rs"]?.["rs@"]).toEqual({
    push: [
      {
        range: { start: { line: 0, col: 0 }, end: { line: 0, col: 1 } },
        severity: 1,
        message: "pushed",
      },
    ],
  });
});

/** The debug log's lines with `event`. */
const logged = (state: string, event: string) =>
  readFileSync(join(state, "so/so.log"), "utf8")
    .split("\n")
    .filter((l) => l.includes(`"event":"${event}"`))
    .map((l) => JSON.parse(l) as Record<string, unknown>);

test("a crashing server restarts until the fifth crash within three minutes", async () => {
  const root = await tmpWorkspace({ "main.rs": "fn secret_name() {}\n" });
  const state = await mkdtemp(join(tmpdir(), "so-state-"));
  const rs = fake("rs", ["rust"], {
    crash: { after: "textDocument/didOpen" },
  });
  app = await startApp(root, {
    lsp: { config: lspConfig(true, rs.config) },
    env: { SO_LOG: "debug", XDG_STATE_HOME: state },
  });
  await app.open("main.rs");
  await waitFor(() => app?.store.get().lsp.servers["rs@"]?.state === "failed");
  await Bun.sleep(200);
  const order: (string | undefined)[] = readServerLog(rs.log)
    .map((m) => m.method)
    .filter((m) => m === "initialize" || m === "textDocument/didOpen");
  expect(order).toEqual(
    Array.from({ length: 5 }, () => [
      "initialize",
      "textDocument/didOpen",
    ]).flat(),
  );
  expect(processes(rs.log)).toHaveLength(5);
  expect(serverToasts(app).map((t) => t.text)).toEqual([
    "rs stopped: exited with code 1",
  ]);
  const crashed = logged(state, "lsp.crashed");
  expect(crashed).toHaveLength(5);
  expect(crashed[0]?.reason).toBe("exited with code 1");
  expect(readFileSync(join(state, "so/so.log"), "utf8")).not.toContain(
    "secret_name",
  );
}, 15_000);

test("crashes spread over more than three minutes keep restarting", async () => {
  const root = await tmpWorkspace({ "main.rs": "fn main() {}\n" });
  const rs = fake("rs", ["rust"], {
    crash: { after: "textDocument/didOpen", times: 5 },
  });
  let t = 0;
  const states: string[] = [];
  app = await startApp(root, {
    lsp: {
      config: lspConfig(true, rs.config),
      now: () => {
        t += 50_000;
        return t;
      },
    },
  });
  app.store.subscribe((s) => {
    const v = s.lsp.servers["rs@"]?.state;
    if (v !== undefined && v !== states.at(-1)) states.push(v);
  });
  await app.open("main.rs");
  await waitForMessage(rs.log, "textDocument/didOpen", 5000, 6);
  await waitFor(() => app?.store.get().lsp.servers["rs@"]?.state === "ready");
  await Bun.sleep(200);
  expect(processes(rs.log)).toHaveLength(6);
  expect(states).not.toContain("failed");
  expect(states.filter((s) => s === "starting").length).toBeGreaterThanOrEqual(
    5,
  );
  expect(serverToasts(app)).toEqual([]);
}, 15_000);

test("progress is throttled and info messages do not toast", async () => {
  const root = await tmpWorkspace({ "main.rs": "fn main() {}\n" });
  const state = await mkdtemp(join(tmpdir(), "so-state-"));
  const rs = fake("rs", ["rust"], {
    progress: { count: 50, everyMs: 4 },
    messages: [
      { type: 3, message: "indexing finished" },
      { type: 2, message: "toolchain is old" },
    ],
  });
  app = await startApp(root, {
    lsp: { config: lspConfig(true, rs.config) },
    env: { SO_LOG: "debug", XDG_STATE_HOME: state },
  });
  await app.open("main.rs");
  await waitForMessage(rs.log, "response:window/workDoneProgress/create");
  await Bun.sleep(400);
  const progress = app.actions.filter(
    (a) => a.type === "lspServer" && a.view?.progress !== undefined,
  );
  expect(progress.length).toBeGreaterThanOrEqual(1);
  // 50 reports over about 200 ms; unthrottled, each would dispatch.
  expect(progress.length).toBeLessThanOrEqual(5);
  expect(app.store.get().lsp.servers["rs@"]?.progress).toBe("indexing 50/50");
  expect(serverToasts(app).map((t) => t.text)).toEqual([
    "rs: toolchain is old",
  ]);
  const info = logged(state, "lsp.message");
  expect(info).toHaveLength(1);
  expect(info[0]?.level).toBe("info");
  expect(JSON.stringify(info)).not.toContain("indexing finished");
});

test("a request still waiting when the server crashes fails as restarted", async () => {
  const root = await tmpWorkspace({ "main.rs": "fn main() {}\n" });
  const rs = fake("rs", ["rust"], {
    crash: { after: "textDocument/hover", times: 1 },
  });
  app = await startApp(root, { lsp: { config: lspConfig(true, rs.config) } });
  await app.open("main.rs");
  await waitFor(() => app?.store.get().lsp.servers["rs@"]?.state === "ready");
  app.keys("K");
  await waitFor(
    () =>
      app?.actions.some(
        (a) =>
          a.type === "lspResult" &&
          a.result.kind === "error" &&
          a.result.message === "server restarted",
      ) === true,
  );
  await waitForMessage(rs.log, "textDocument/didOpen", 5000, 2);
  expect(processes(rs.log)).toHaveLength(2);
}, 15_000);

test("a watched file change reaches a server only when it matches a registered glob", async () => {
  const root = await tmpWorkspace({ "main.rs": "fn main() {}\n" });
  const rs = fake("rs", ["rust"], { registerWatchers: { globs: ["**/*.rs"] } });
  app = await startApp(root, { lsp: { config: lspConfig(true, rs.config) } });
  await app.open("main.rs");
  await waitForMessage(rs.log, "response:client/registerCapability");
  await writeFile(join(root, "lib.rs"), "pub fn lib() {}\n");
  await writeFile(join(root, "notes.md"), "# notes\n");
  await waitForMessage(rs.log, "workspace/didChangeWatchedFiles");
  await Bun.sleep(300);
  expect(
    messages(rs.log, "workspace/didChangeWatchedFiles").map((m) => m.params),
  ).toEqual([{ changes: [{ uri: uri(join(root, "lib.rs")), type: 2 }] }]);
});

/** A server that answers every inlay hint request with `: i32` after `x`. */
const HINTS = {
  capabilities: { hoverProvider: true, inlayHintProvider: true },
  responses: {
    "textDocument/inlayHint": [
      {
        position: { line: 0, character: 20 },
        label: ": i32",
        paddingLeft: false,
      },
    ],
  },
  inlayHintRefreshOn: "textDocument/hover",
};

test("inlay hints are fetched after opening and each change, and again on refresh", async () => {
  const root = await tmpWorkspace({ "main.rs": "fn main() { let x = 1; }\n" });
  const rs = fake("rs", ["rust"], HINTS);
  app = await startApp(root, { lsp: { config: lspConfig(true, rs.config) } });
  await app.open("main.rs");
  await waitFor(
    () => app?.store.get().lsp.inlayHints["main.rs"]?.["rs@"]?.length === 1,
  );
  expect(app.store.get().lsp.inlayHints["main.rs"]?.["rs@"]).toEqual([
    { pos: { line: 0, col: 20 }, label: ": i32" },
  ]);
  const asked = () => messages(rs.log, "textDocument/inlayHint").length;
  expect(asked()).toBe(1);
  app.keys("A ");
  app.keys("<Esc>");
  await waitFor(() => asked() === 2);
  app.keys("K");
  await waitFor(() => asked() === 3);
});

test("turning inlay hints off clears them and stops asking", async () => {
  const root = await tmpWorkspace({ "main.rs": "fn main() { let x = 1; }\n" });
  const rs = fake("rs", ["rust"], HINTS);
  const on = lspConfig(true, rs.config);
  app = await startApp(root, { lsp: { config: on } });
  await app.open("main.rs");
  await waitFor(() => app?.store.get().lsp.inlayHints["main.rs"] !== undefined);
  await reload(
    app,
    on.replace("enabled = true\n", "enabled = true\ninlayHints = false\n"),
  );
  await waitFor(() => app?.store.get().lsp.inlayHints["main.rs"] === undefined);
  const before = messages(rs.log, "textDocument/inlayHint").length;
  app.keys("A ");
  app.keys("<Esc>");
  await waitForMessage(rs.log, "textDocument/didChange");
  await Bun.sleep(300);
  expect(messages(rs.log, "textDocument/inlayHint")).toHaveLength(before);
});

test("a resting cursor shows the uses a server reports", async () => {
  const root = await tmpWorkspace({
    "main.rs": "fn main() { let x = 1; x; }\n",
  });
  const rs = fake("rs", ["rust"], {
    capabilities: { documentHighlightProvider: true },
    responses: {
      "textDocument/documentHighlight": [
        {
          range: {
            start: { line: 0, character: 16 },
            end: { line: 0, character: 17 },
          },
        },
        {
          range: {
            start: { line: 0, character: 23 },
            end: { line: 0, character: 24 },
          },
        },
      ],
    },
  });
  app = await startApp(root, { lsp: { config: lspConfig(true, rs.config) } });
  await app.open("main.rs");
  await waitFor(() => app?.store.get().lsp.servers["rs@"]?.state === "ready");
  app.keys("16l");
  await waitFor(() => app?.store.get().lsp.highlights !== undefined);
  expect(app.store.get().lsp.highlights?.ranges).toHaveLength(2);
});

test("the workspace symbol picker lists what the server finds for the query", async () => {
  const root = await tmpWorkspace({
    "main.rs": "fn main() {}\n",
    "geo.rs": "pub struct Point;\n",
  });
  const rs = fake("rs", ["rust"], {
    capabilities: { workspaceSymbolProvider: true },
    responses: {
      "workspace/symbol": [
        {
          name: "Point",
          kind: 23,
          location: {
            uri: uri(join(root, "geo.rs")),
            range: {
              start: { line: 0, character: 11 },
              end: { line: 0, character: 16 },
            },
          },
        },
      ],
    },
  });
  app = await startApp(root, { lsp: { config: lspConfig(true, rs.config) } });
  await app.open("main.rs");
  await waitFor(() => app?.store.get().lsp.servers["rs@"]?.state === "ready");
  app.keys(":WorkspaceSymbols<CR>");
  app.keys("Poi");
  await waitForMessage(rs.log, "workspace/symbol");
  expect(messages(rs.log, "workspace/symbol")[0]?.params).toEqual({
    query: "Poi",
  });
  await waitFor(() => {
    const o = app?.store.get().overlay;
    return o?.kind === "picker" && o.picker.items[0]?.label === "Point";
  });
});
