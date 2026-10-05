import { afterEach, beforeEach, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
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

  const rsInit = messages(rs.log, "initialize").map(
    (m) => (m.params as { rootUri: string | null }).rootUri,
  );
  expect(rsInit).toEqual([uri(join(root, "repo")), uri(join(root, "other"))]);
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
    await app.open("src/x.ts");
    const used = chosen === "tsc" ? tscLog : ts.log;
    const unused = chosen === "tsc" ? ts.log : tscLog;
    await waitForMessage(used, "textDocument/didOpen");
    await Bun.sleep(200);
    expect(readServerLog(unused)).toEqual([]);
    expect(app.store.get().lsp.attached["src/x.ts"]).toEqual([
      `${chosen}@${root}`,
    ]);
    if (chosen === "tsc") expect(processes(tscLog)[0]?.argv?.at(-1)).toBe(stub);
    await app.stop();
    app = undefined;
  }
});

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
