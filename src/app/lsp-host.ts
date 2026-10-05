import { type ChildProcess, spawn as nodeSpawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  gateAllows,
  LSP_FILE_TYPES,
  type LspConfig,
  resolveServers,
  type ServerSpec,
} from "../core/config/lsp";
import type { TextBuffer } from "../core/kernel/text/text-buffer";
import { fullText } from "../core/state/buffers";
import type { ServerKey, ServerView } from "../core/state/lsp-types";
import type {
  Action,
  AppState,
  BufferState,
  Effect,
} from "../core/state/types";
import type { Logger } from "../workspace/log";
import {
  type ClientEvents,
  createLspClient,
  type LspClient,
} from "../workspace/lsp/client";
import { languageIdFor } from "../workspace/lsp/language-id";
import { findRoot } from "../workspace/lsp/roots";

/** The longest one server's stop takes before it is killed. */
export const LSP_STOP_BOUND_MS = 500;
/** The longest a version probe runs before it counts as failed. */
export const PROBE_BOUND_MS = 2000;

type LspEffect = Extract<
  Effect,
  { kind: "lsp" | "lspCancel" | "lspReply" | "lspRestart" }
>;

export type LspHost = {
  /** Reconcile servers and documents with the state; subscribed to the store. */
  observe(s: AppState): void;
  run(e: LspEffect): void;
  /** Stops every server and version probe; resolves once none is left. */
  stop(): Promise<void>;
};

/** One open document as a server knows it. */
type Doc = {
  path: string;
  languageId: string;
  /** The buffer's text as last observed. */
  latest: TextBuffer;
  finalNewline: boolean;
};

/** One server process for one root, across its restarts. */
type Server = {
  key: ServerKey;
  spec: ServerSpec;
  root?: string;
  binary: string;
  view: ServerView;
  client?: LspClient | undefined;
  /** Kills the process while it is starting. */
  abort?: AbortController | undefined;
  /** Settles once the current start has finished either way. */
  starting?: Promise<void>;
  /** Bumped on every launch and stop, so late callbacks are ignored. */
  generation: number;
  docs: Map<string, Doc>;
  /** Request ids sent and not answered yet. */
  inflight: Set<number>;
};

/** A command's binary: `<dir>/node_modules/.bin/<cmd>` first when `localBin`, then `PATH`. */
function findBinary(
  cmd: string | undefined,
  localBin: boolean,
  dir: string,
  exists: (p: string) => boolean,
  which: (cmd: string) => string | null,
): string | undefined {
  if (cmd === undefined) return undefined;
  if (localBin) {
    const local = join(dir, "node_modules", ".bin", cmd);
    if (exists(local)) return local;
  }
  return which(cmd) ?? undefined;
}

/** localBin: `<root or workspace>/node_modules/.bin/<cmd>` when it exists; then `which(cmd)`. */
export function resolveBinary(
  spec: ServerSpec,
  root: string | undefined,
  workspaceRoot: string,
  exists: (p: string) => boolean,
  which: (cmd: string) => string | null,
): string | undefined {
  return findBinary(
    spec.command[0],
    spec.localBin,
    root ?? workspaceRoot,
    exists,
    which,
  );
}

/**
 * Runs `probe` (a resolved binary and its arguments) in `dir` and returns
 * the first number in its output; undefined when it fails, or after
 * `boundMs`, when the child is killed.
 */
export function probeMajor(
  probe: readonly string[],
  dir: string,
  boundMs: number,
  spawn: typeof nodeSpawn,
): Promise<number | undefined> {
  return new Promise((resolve) => {
    const [cmd, ...args] = probe;
    if (cmd === undefined) return resolve(undefined);
    let out = "";
    let done = false;
    const finish = (major: number | undefined) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(major);
    };
    let child: ChildProcess;
    try {
      child = spawn(cmd, args, { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
    } catch {
      return resolve(undefined);
    }
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(undefined);
    }, boundMs);
    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", (chunk: string) => {
      out += chunk;
    });
    child.stderr?.resume();
    child.on("error", () => finish(undefined));
    child.on("close", (code) => {
      const m = /\d+/.exec(out);
      finish(code === 0 && m !== null ? Number(m[0]) : undefined);
    });
  });
}

const launchFields = (s: ServerSpec) =>
  JSON.stringify([
    s.command,
    s.initOptions,
    s.fileTypes,
    s.rootMarkers,
    s.rootSearch,
    s.snippets,
  ]);

const viewOf = (
  spec: ServerSpec,
  root: string | undefined,
  state: ServerView["state"],
  reason?: string,
): ServerView => ({
  name: spec.name,
  ...(root === undefined ? {} : { root }),
  state,
  ...(reason === undefined ? {} : { reason }),
  features: [],
  pullDiagnostics: false,
  completionTriggers: [],
  signatureTriggers: [],
});

/** A probe whose answer is not in yet. */
const PENDING = Symbol("pending");

/**
 * Runs language servers for the open code buffers: one process per
 * (server, project root), started, synced, and stopped by observing the
 * store. Dispatches made while observing are deferred, so a subscriber
 * never re-enters the store.
 */
export function createLspHost(d: {
  root: string;
  dispatch: (a: Action) => void;
  logger: Logger;
  which?: (cmd: string) => string | null;
  exists?: (p: string) => boolean;
  connect?: typeof createLspClient;
  spawn?: typeof nodeSpawn;
  now?: () => number;
}): LspHost {
  const which = d.which ?? ((cmd: string) => Bun.which(cmd));
  const exists = d.exists ?? existsSync;
  const connect = d.connect ?? createLspClient;
  const spawn = d.spawn ?? nodeSpawn;
  const now = d.now ?? (() => performance.timeOrigin + performance.now());

  const servers = new Map<ServerKey, Server>();
  /** Missing, unavailable, and failed servers: not tried again until a config change or restart. */
  const stoppedViews = new Map<ServerKey, ServerView>();
  const roots = new Map<string, string | undefined>();
  const binaries = new Map<string, string | undefined>();
  const probes = new Map<string, number | undefined | Promise<void>>();
  const probeChildren = new Set<ChildProcess>();
  /** Stops still running, awaited by `stop`. */
  const stopping = new Set<Promise<void>>();
  /** The keys last reported per path. */
  const attached = new Map<string, string>();
  let config: LspConfig | undefined;
  let specs: ServerSpec[] = [];
  let buffers: AppState["buffers"] | undefined;
  let latest: AppState | undefined;
  let observing = false;
  let stopped = false;

  const send = (a: Action) => {
    if (stopped) return;
    if (observing) queueMicrotask(() => !stopped && d.dispatch(a));
    else d.dispatch(a);
  };
  const later = (a: Action) => queueMicrotask(() => !stopped && d.dispatch(a));

  const trackedSpawn = ((cmd: string, args: string[], opts: object) => {
    const child = spawn(cmd, args, opts);
    probeChildren.add(child);
    child.on("close", () => probeChildren.delete(child));
    return child;
  }) as typeof nodeSpawn;

  /** Run `observe` again on the latest state, e.g. after a probe answered. */
  function resync(): void {
    buffers = undefined;
    if (latest !== undefined) observe(latest);
  }

  function record(key: ServerKey, view: ServerView): void {
    stoppedViews.set(key, view);
    send({ type: "lspServer", key, view });
  }

  function stopServer(server: Server): void {
    servers.delete(server.key);
    server.generation++;
    server.abort?.abort();
    const done = server.client?.stop(LSP_STOP_BOUND_MS) ?? server.starting;
    server.client = undefined;
    if (done !== undefined) {
      stopping.add(done);
      void done.finally(() => stopping.delete(done));
    }
    d.logger.info("lsp.stop", { server: server.spec.name });
    send({ type: "lspServer", key: server.key, view: undefined });
  }

  function forgetAll(): void {
    for (const server of [...servers.values()]) stopServer(server);
    for (const key of stoppedViews.keys())
      send({ type: "lspServer", key, view: undefined });
    stoppedViews.clear();
    attached.clear();
  }

  function reconcile(next: LspConfig): void {
    config = next;
    roots.clear();
    binaries.clear();
    probes.clear();
    if (!next.enabled) {
      specs = [];
      forgetAll();
      return;
    }
    specs = resolveServers(next);
    for (const server of [...servers.values()]) {
      const spec = specs.find((s) => s.name === server.spec.name);
      if (
        spec === undefined ||
        launchFields(spec) !== launchFields(server.spec)
      )
        stopServer(server);
      else {
        const settingsChanged =
          JSON.stringify(spec.settings) !==
          JSON.stringify(server.spec.settings);
        server.spec = spec;
        if (settingsChanged) server.client?.configure(spec.settings);
      }
    }
    for (const key of stoppedViews.keys())
      send({ type: "lspServer", key, view: undefined });
    stoppedViews.clear();
    attached.clear();
  }

  function events(server: Server, live: () => boolean): ClientEvents {
    return {
      diagnostics: (path, items) => {
        if (live())
          d.dispatch({
            type: "lspDiagnostics",
            key: server.key,
            path,
            source: "push",
            items,
          });
      },
      applyEdit: (requestId, edit) => {
        if (live())
          d.dispatch({
            type: "lspApplyEdit",
            key: server.key,
            requestId,
            edit,
          });
      },
    };
  }

  function open(server: Server, doc: Doc): void {
    const text = fullText(doc.latest) + (doc.finalNewline ? "\n" : "");
    server.client?.didOpen(doc.path, doc.languageId, doc.latest.version, text);
  }

  function launch(server: Server): void {
    const generation = ++server.generation;
    const live = () =>
      !stopped &&
      servers.get(server.key) === server &&
      server.generation === generation;
    const abort = new AbortController();
    server.abort = abort;
    d.logger.info("lsp.start", { server: server.spec.name });
    const started = connect({
      spec: server.spec,
      binary: server.binary,
      ...(server.root === undefined ? {} : { root: server.root }),
      workspaceRoot: d.root,
      events: events(server, live),
      logger: d.logger,
      ...(d.spawn === undefined ? {} : { spawn: d.spawn }),
      signal: abort.signal,
    });
    server.starting = started.then(
      () => {},
      () => {},
    );
    started.then(
      (client) => {
        if (!live()) {
          const done = client.stop(LSP_STOP_BOUND_MS);
          stopping.add(done);
          void done.finally(() => stopping.delete(done));
          return;
        }
        server.abort = undefined;
        server.client = client;
        server.view = client.view;
        d.dispatch({ type: "lspServer", key: server.key, view: client.view });
        for (const doc of server.docs.values()) open(server, doc);
      },
      (e: unknown) => {
        if (!live()) return;
        servers.delete(server.key);
        const reason = e instanceof Error ? e.message : String(e);
        d.logger.error("lsp.unavailable", { server: server.spec.name, reason });
        record(
          server.key,
          viewOf(server.spec, server.root, "unavailable", reason),
        );
        resync();
      },
    );
  }

  function start(
    key: ServerKey,
    spec: ServerSpec,
    root: string | undefined,
    binary: string,
  ): Server {
    const server: Server = {
      key,
      spec,
      ...(root === undefined ? {} : { root }),
      binary,
      view: viewOf(spec, root, "starting"),
      generation: 0,
      docs: new Map(),
      inflight: new Set(),
    };
    servers.set(key, server);
    send({ type: "lspServer", key, view: server.view });
    launch(server);
    return server;
  }

  /** The probed major version for `dir`, or `PENDING` while its probe runs. */
  function probeFor(
    probe: readonly string[],
    dir: string,
  ): number | undefined | typeof PENDING {
    const known = probes.get(dir);
    if (known instanceof Promise) return PENDING;
    if (probes.has(dir)) return known;
    const binary = findBinary(probe[0], true, dir, exists, which);
    if (binary === undefined) {
      probes.set(dir, undefined);
      return undefined;
    }
    const running: Promise<void> = probeMajor(
      [binary, ...probe.slice(1)],
      dir,
      PROBE_BOUND_MS,
      trackedSpawn,
    ).then((major) => {
      if (probes.get(dir) !== running) return;
      probes.set(dir, major);
      if (!stopped) resync();
    });
    probes.set(dir, running);
    return PENDING;
  }

  /** The server for `spec` and the file at `path`, started when needed; undefined when it cannot run. */
  function attach(spec: ServerSpec, path: string): Server | undefined {
    const dir = dirname(join(d.root, path));
    const rootKey = `${spec.name}\n${dir}`;
    if (!roots.has(rootKey))
      roots.set(
        rootKey,
        findRoot(dir, spec.rootMarkers, spec.rootSearch, d.root, exists),
      );
    const root = roots.get(rootKey);
    const key = root === undefined ? `${spec.name}@` : `${spec.name}@${root}`;
    const running = servers.get(key);
    if (running !== undefined) return running;
    if (stoppedViews.has(key)) return undefined;
    const base = root ?? d.root;
    const binKey = `${spec.name}\n${base}`;
    if (!binaries.has(binKey))
      binaries.set(binKey, resolveBinary(spec, root, d.root, exists, which));
    const binary = binaries.get(binKey);
    if (binary === undefined) {
      record(key, viewOf(spec, root, "missing"));
      return undefined;
    }
    if (spec.gate !== undefined) {
      const major = probeFor(spec.gate.probe, base);
      if (major === PENDING || !gateAllows(spec.gate, major)) return undefined;
    }
    return start(key, spec, root, binary);
  }

  /** Track buffer `b` in `server`, opening it once the server is ready. */
  function track(server: Server, b: BufferState): void {
    const doc = server.docs.get(b.path);
    if (doc !== undefined) {
      doc.latest = b.text;
      return;
    }
    const added: Doc = {
      path: b.path,
      languageId: languageIdFor(b.fileType, b.path),
      latest: b.text,
      finalNewline: b.finalNewline,
    };
    server.docs.set(b.path, added);
    if (server.client !== undefined) open(server, added);
  }

  function report(path: string, keys: ServerKey[]): void {
    const joined = keys.join("\n");
    if ((attached.get(path) ?? "") === joined) return;
    if (keys.length === 0) attached.delete(path);
    else attached.set(path, joined);
    send({ type: "lspAttached", path, keys });
  }

  function sync(s: AppState): void {
    const seen = new Set<string>();
    for (const b of Object.values(s.buffers)) {
      if (b.listed === false || !LSP_FILE_TYPES.includes(b.fileType)) continue;
      const keys: ServerKey[] = [];
      for (const spec of specs) {
        if (!spec.fileTypes.includes(b.fileType)) continue;
        const server = attach(spec, b.path);
        if (server === undefined) continue;
        keys.push(server.key);
        track(server, b);
      }
      seen.add(b.path);
      report(b.path, keys);
    }
    for (const path of [...attached.keys()])
      if (!seen.has(path)) report(path, []);
  }

  function observe(s: AppState): void {
    latest = s;
    if (stopped || (s.config.lsp === config && s.buffers === buffers)) return;
    observing = true;
    try {
      if (s.config.lsp !== config) reconcile(s.config.lsp);
      buffers = s.buffers;
      if (config?.enabled === true) sync(s);
    } finally {
      observing = false;
    }
  }

  function restart(keys: ServerKey[]): void {
    roots.clear();
    binaries.clear();
    probes.clear();
    for (const key of keys) {
      const server = servers.get(key);
      if (server !== undefined) stopServer(server);
      else if (stoppedViews.delete(key))
        send({ type: "lspServer", key, view: undefined });
    }
    attached.clear();
    resync();
  }

  return {
    observe,
    run(e) {
      switch (e.kind) {
        case "lsp": {
          const server = servers.get(e.key);
          const client = server?.client;
          if (server === undefined || client === undefined) {
            later({
              type: "lspResult",
              id: e.id,
              result: {
                kind: "error",
                message:
                  server === undefined
                    ? "server is not running"
                    : "server is starting",
              },
              now: now(),
            });
            return;
          }
          server.inflight.add(e.id);
          void client.request(e.id, e.path, e.op).then((result) => {
            if (!server.inflight.delete(e.id) || stopped) return;
            d.dispatch({ type: "lspResult", id: e.id, result, now: now() });
          });
          return;
        }
        case "lspCancel": {
          const server = servers.get(e.key);
          server?.inflight.delete(e.id);
          server?.client?.cancel(e.id);
          return;
        }
        case "lspReply":
          servers
            .get(e.key)
            ?.client?.reply(e.requestId, e.applied, e.failureReason);
          return;
        case "lspRestart":
          queueMicrotask(() => restart(e.keys));
          return;
      }
    },
    async stop() {
      if (stopped) return;
      stopped = true;
      for (const child of probeChildren) child.kill("SIGKILL");
      for (const server of [...servers.values()]) stopServer(server);
      await Promise.allSettled([...stopping]);
    },
  };
}
