/**
 * A scripted language server for tests, run as
 * `bun test/fixtures/fake-lsp.ts <script.json> <log.jsonl> [tag]`.
 * It speaks LSP over stdio, appends every message it receives to the log as
 * one JSON line (the first line holds its argv and pid), answers from the
 * script, and exits when its stdin closes.
 */
import { appendFileSync, readFileSync, writeSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  createMessageConnection,
  ResponseError,
  StreamMessageReader,
  StreamMessageWriter,
} from "vscode-jsonrpc/node";

export type FakeScript = {
  /** Merged over the default capabilities: incremental sync with saves, and hover. */
  capabilities?: Record<string, unknown>;
  /** Results by request method; `null` when absent. */
  responses?: Record<string, unknown>;
  /** Published for each document on open and change. */
  diagnostics?: unknown[];
  /** Published for these other files, by absolute path, whenever a document opens. */
  otherDiagnostics?: { path: string; diagnostics: unknown[] }[];
  /** Answers pulls with these items and a new result id each time. */
  pull?: { items: unknown[] };
  /** Progress reports sent after `initialized`, `everyMs` apart. */
  progress?: { count: number; everyMs: number };
  /** `window/showMessage` notifications sent after `initialized`. */
  messages?: { type: number; message: string }[];
  /** Exit with code 1 after receiving `after`, in the first `times` processes. */
  crash?: { after: string; times?: number };
  /** Write this stderr line and exit before reading anything. */
  exitBeforeInitialize?: { stderr: string };
  /** Never answer `initialize`. */
  ignoreInitialize?: boolean;
  /** Never answer `shutdown` and ignore `exit`. */
  ignoreShutdown?: boolean;
  /** Completion items, offered only to clients with snippet support when `requiresSnippets`. */
  completion?: { items: unknown[]; requiresSnippets?: boolean };
  /** `codeAction/resolve` fails with RequestFailed. */
  resolveActionFails?: boolean;
  /** Methods answered with ContentModified. */
  contentModified?: string[];
  /** Methods answered with ContentModified the first `times` they are received. */
  contentModifiedFirst?: { methods: string[]; times: number };
  /** Asks `workspace/configuration` for these sections after `initialized`. */
  configurationRequest?: { sections: (string | null)[] };
  /** Registers file watchers with these globs after `initialized`. */
  registerWatchers?: { globs: string[] };
  /** Sends `workspace/diagnostic/refresh` when this method is received. */
  refreshOn?: string;
  /** Sends `workspace/inlayHint/refresh` when this method is received. */
  inlayHintRefreshOn?: string;
  /** Sends `workspace/applyEdit` with `edit` when `on` is received. */
  applyEdit?: { on: string; edit: unknown };
};

const [scriptPath = "", logPath = ""] = process.argv.slice(2);
const script: FakeScript = JSON.parse(readFileSync(scriptPath, "utf8"));
const log = (entry: Record<string, unknown>) =>
  appendFileSync(logPath, `${JSON.stringify(entry)}\n`);

/** How many processes of this log have received `initialize`, this one included. */
const initializeCount = () =>
  readFileSync(logPath, "utf8")
    .split("\n")
    .filter((l) => l.includes('"method":"initialize"')).length;

log({ argv: process.argv.slice(1), pid: process.pid });

if (script.exitBeforeInitialize !== undefined) {
  writeSync(2, `${script.exitBeforeInitialize.stderr}\n`);
  process.exit(1);
}

const conn = createMessageConnection(
  new StreamMessageReader(process.stdin),
  new StreamMessageWriter(process.stdout),
);
let snippets = false;
let pulls = 0;

const asked = (method: string, params?: unknown) =>
  conn
    .sendRequest(method, params)
    .then((result) => log({ method: `response:${method}`, result }))
    .catch((e: unknown) =>
      log({ method: `response:${method}`, error: String(e) }),
    );

function afterInitialized(): void {
  const c = script.configurationRequest;
  if (c !== undefined)
    void asked("workspace/configuration", {
      items: c.sections.map((section) => (section === null ? {} : { section })),
    });
  const w = script.registerWatchers;
  if (w !== undefined)
    void asked("client/registerCapability", {
      registrations: [
        {
          id: "watchers",
          method: "workspace/didChangeWatchedFiles",
          registerOptions: {
            watchers: w.globs.map((globPattern) => ({ globPattern })),
          },
        },
      ],
    });
  for (const m of script.messages ?? [])
    void conn.sendNotification("window/showMessage", m);
  const p = script.progress;
  if (p !== undefined)
    void asked("window/workDoneProgress/create", { token: "work" }).then(() => {
      void conn.sendNotification("$/progress", {
        token: "work",
        value: { kind: "begin", title: "indexing" },
      });
      let sent = 0;
      const timer = setInterval(() => {
        sent++;
        void conn.sendNotification("$/progress", {
          token: "work",
          value: { kind: "report", message: `${sent}/${p.count}` },
        });
        if (sent >= p.count) clearInterval(timer);
      }, p.everyMs);
    });
}

function received(method: string, params: unknown): void {
  log({ method, params });
  const crash = script.crash;
  if (
    crash !== undefined &&
    crash.after === method &&
    initializeCount() <= (crash.times ?? Number.POSITIVE_INFINITY)
  )
    process.exit(1);
  if (script.refreshOn === method) void asked("workspace/diagnostic/refresh");
  if (script.inlayHintRefreshOn === method)
    void asked("workspace/inlayHint/refresh");
  if (script.applyEdit?.on === method)
    void asked("workspace/applyEdit", { edit: script.applyEdit.edit });
}

/** How often each method was answered with ContentModified so far. */
const modified = new Map<string, number>();

conn.onRequest((method, params) => {
  received(method, params);
  if (script.contentModified?.includes(method))
    return new ResponseError(-32801, "content modified");
  const first = script.contentModifiedFirst;
  if (first?.methods.includes(method)) {
    const n = (modified.get(method) ?? 0) + 1;
    modified.set(method, n);
    if (n <= first.times) return new ResponseError(-32801, "content modified");
  }
  switch (method) {
    case "initialize": {
      if (script.ignoreInitialize === true) return new Promise(() => {});
      const caps = params as {
        capabilities?: {
          textDocument?: {
            completion?: { completionItem?: { snippetSupport?: boolean } };
          };
        };
      };
      snippets =
        caps.capabilities?.textDocument?.completion?.completionItem
          ?.snippetSupport === true;
      return {
        capabilities: {
          textDocumentSync: { openClose: true, change: 2, save: {} },
          hoverProvider: true,
          ...script.capabilities,
        },
        serverInfo: { name: "fake" },
      };
    }
    case "shutdown":
      return script.ignoreShutdown === true ? new Promise(() => {}) : null;
    case "textDocument/diagnostic":
      pulls++;
      return {
        kind: "full",
        resultId: `r${pulls}`,
        items: script.pull?.items ?? [],
      };
    case "textDocument/completion": {
      const c = script.completion;
      if (c === undefined || (c.requiresSnippets === true && !snippets))
        return null;
      return { isIncomplete: false, items: c.items };
    }
    case "codeAction/resolve":
      if (script.resolveActionFails === true)
        return new ResponseError(-32803, "cannot create the file");
      return params;
    case "textDocument/hover":
      return script.responses?.[method] ?? { contents: "fake hover" };
  }
  return script.responses?.[method] ?? null;
});

conn.onNotification((method, params) => {
  received(method, params);
  if (method === "initialized") afterInitialized();
  else if (method === "exit" && script.ignoreShutdown !== true) process.exit(0);
  else if (
    (method === "textDocument/didOpen" ||
      method === "textDocument/didChange") &&
    script.diagnostics !== undefined
  ) {
    const uri = (params as { textDocument: { uri: string } }).textDocument.uri;
    void conn.sendNotification("textDocument/publishDiagnostics", {
      uri,
      diagnostics: script.diagnostics,
    });
  }
  if (method === "textDocument/didOpen")
    for (const o of script.otherDiagnostics ?? [])
      void conn.sendNotification("textDocument/publishDiagnostics", {
        uri: pathToFileURL(o.path).href,
        diagnostics: o.diagnostics,
      });
});

conn.onClose(() => process.exit(0));
process.stdin.on("close", () => process.exit(0));
conn.listen();
