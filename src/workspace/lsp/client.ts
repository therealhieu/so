import { spawn } from "node:child_process";
import { basename } from "node:path";
import { pathToFileURL } from "node:url";
import {
  type CancellationToken,
  CancellationTokenSource,
  createMessageConnection,
  ResponseError,
  StreamMessageReader,
  StreamMessageWriter,
} from "vscode-jsonrpc/node";
import type {
  ApplyWorkspaceEditParams,
  ConfigurationParams,
  DocumentDiagnosticReport,
  InitializeParams,
  InitializeResult,
  PublishDiagnosticsParams,
  ServerCapabilities,
} from "vscode-languageserver-protocol";
import type { ServerSpec } from "../../core/config/lsp";
import type { Range } from "../../core/kernel/text/pos";
import {
  createTextBuffer,
  type TextBuffer,
} from "../../core/kernel/text/text-buffer";
import type { Diagnostic } from "../../core/kernel/view/diagnostics";
import type {
  CodeEdit,
  LspOp,
  LspResult,
  ServerView,
} from "../../core/state/lsp-types";
import type { Logger } from "../log";
import { clientCapabilities } from "./capabilities";
import {
  pathToUri,
  toCodeAction,
  toCodeActions,
  toCodeEdit,
  toCompletion,
  toCompletionItem,
  toDiagnostic,
  toErrorResult,
  toFormatEdit,
  toHover,
  toLocations,
  toLspDiagnostic,
  toLspPosition,
  toLspRange,
  toPrepareRename,
  toServerView,
  toSignature,
  toSymbols,
  uriToPath,
} from "./convert";
import type { LineChange } from "./sync";

/** What a client reports to its host. */
export type ClientEvents = {
  /** Diagnostics the server pushed for a workspace path. */
  diagnostics(path: string, items: Diagnostic[]): void;
  /** The server asks for a workspace edit, answered later by `reply`. */
  applyEdit(requestId: number | string, edit: CodeEdit): void;
  /** The server asks for every open document's diagnostics to be pulled again. */
  refreshDiagnostics(): void;
};

/** A pull's answer: new items, or the previous ones still hold. */
export type PullResult =
  | { kind: "full"; items: Diagnostic[] }
  | { kind: "unchanged" };

export type LspClient = {
  /** The server's features and triggers, as declared when it initialized. */
  readonly view: ServerView;
  didOpen(
    path: string,
    languageId: string,
    version: number,
    text: string,
  ): void;
  didChange(path: string, version: number, change: LineChange): void;
  didSave(path: string): void;
  didClose(path: string): void;
  /** Sends `op` for document `path`; errors come back as `error` results. */
  request(id: number, path: string, op: LspOp): Promise<LspResult>;
  cancel(id: number): void;
  /** Pulls `path`'s diagnostics with its last result id, cancelling an older pull of it. */
  pullDiagnostics(path: string): Promise<PullResult>;
  reply(
    requestId: number | string,
    applied: boolean,
    failureReason?: string,
  ): void;
  configure(settings: Record<string, unknown>): void;
  /** `shutdown`, then `exit` after the reply or at `boundMs - 100`; killed at `boundMs`. */
  stop(boundMs: number): Promise<void>;
};

/** Server stderr lines written to the debug log per client, at most. */
const STDERR_LINES = 200;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** The value at a dotted section such as "python.analysis" inside settings; the whole object for no section. */
export function sectionValue(
  settings: Record<string, unknown>,
  section: string | undefined,
): unknown {
  if (section === undefined || section === "") return settings;
  let v: unknown = settings;
  for (const part of section.split(".")) {
    if (!isObject(v) || !(part in v)) return undefined;
    v = v[part];
  }
  return v;
}

const allText = (b: TextBuffer) =>
  Array.from({ length: b.lineCount }, (_, i) => b.line(i)).join("\n");

/** The word around `col` in `line`. */
function wordAt(line: string, col: number): string {
  const word = /[\p{L}\p{N}_$]/u;
  let start = col;
  let end = col;
  while (start > 0 && word.test(line[start - 1] ?? "")) start--;
  while (end < line.length && word.test(line[end] ?? "")) end++;
  return line.slice(start, end);
}

/**
 * Spawn `binary` (argv only, no shell) for `spec` and run `initialize`,
 * `initialized`, and one `didChangeConfiguration`. Resolves with the ready
 * client; rejects with the first stderr line, or an exit or spawn reason,
 * when the process ends before that. `signal` kills a starting process.
 */
export function createLspClient(o: {
  spec: ServerSpec;
  binary: string;
  root?: string;
  workspaceRoot: string;
  events: ClientEvents;
  logger: Logger;
  spawn?: typeof spawn;
  signal?: AbortSignal;
}): Promise<LspClient> {
  const name = o.spec.name;
  const run = o.spawn ?? spawn;
  const uri = (path: string) => pathToUri(o.workspaceRoot, path);
  let settings = o.spec.settings;
  let exited = false;
  let firstStderr: string | undefined;
  let stderrLines = 0;
  let caps: ServerCapabilities = {};
  let view: ServerView | undefined;
  let nextReply = 1;
  const replies = new Map<
    number,
    (r: { applied: boolean; failureReason?: string }) => void
  >();
  const tokens = new Map<number, CancellationTokenSource>();
  /** What the server holds for each open document. */
  const docs = new Map<string, TextBuffer>();
  const pulls = new Map<string, CancellationTokenSource>();
  const resultIds = new Map<string, string>();
  let stopped: Promise<void> | undefined;
  let onClosed = () => {};
  const closed = new Promise<void>((resolve) => {
    onClosed = resolve;
  });

  const child = run(o.binary, [...o.spec.command.slice(1)], {
    cwd: o.root ?? o.workspaceRoot,
    stdio: ["pipe", "pipe", "pipe"],
  });
  const conn = createMessageConnection(
    new StreamMessageReader(child.stdout),
    new StreamMessageWriter(child.stdin),
  );
  child.stdin.on("error", () => {});
  const notify = (method: string, params?: unknown) => {
    if (!exited) void conn.sendNotification(method, params).catch(() => {});
  };

  let partial = "";
  const stderrLine = (raw: string) => {
    const line = raw.trim();
    if (line === "") return;
    firstStderr ??= line;
    if (stderrLines >= STDERR_LINES) return;
    stderrLines++;
    o.logger.info("lsp.stderr", { server: name, line });
  };
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => {
    const lines = (partial + chunk).split("\n");
    partial = lines.pop() ?? "";
    for (const l of lines) stderrLine(l);
  });
  child.stderr.on("end", () => stderrLine(partial));

  const diagnosticsOf = (method: string, raw: unknown): Diagnostic[] => {
    const list = Array.isArray(raw) ? raw : [];
    const items = list.flatMap((d) => toDiagnostic(d) ?? []);
    if (items.length < list.length)
      o.logger.info("lsp.dropped", {
        server: name,
        method,
        count: list.length - items.length,
      });
    return items;
  };

  conn.onRequest("workspace/configuration", (p: ConfigurationParams) =>
    p.items.map((item) => sectionValue(settings, item.section) ?? null),
  );
  conn.onRequest("window/workDoneProgress/create", () => null);
  conn.onRequest("workspace/diagnostic/refresh", () => {
    o.events.refreshDiagnostics();
    return null;
  });
  conn.onRequest("workspace/workspaceFolders", () =>
    o.root === undefined
      ? null
      : [{ uri: pathToFileURL(o.root).href, name: basename(o.root) }],
  );
  conn.onRequest(
    "workspace/applyEdit",
    (p: ApplyWorkspaceEditParams) =>
      new Promise((resolve) => {
        const id = nextReply++;
        replies.set(id, resolve);
        o.events.applyEdit(id, toCodeEdit(o.workspaceRoot, p.edit));
      }),
  );
  conn.onNotification(
    "textDocument/publishDiagnostics",
    (p: PublishDiagnosticsParams) => {
      const path = uriToPath(o.workspaceRoot, p.uri);
      if (path !== undefined)
        o.events.diagnostics(
          path,
          diagnosticsOf("textDocument/publishDiagnostics", p.diagnostics),
        );
    },
  );
  conn.onError(() => {
    if (!exited) child.kill("SIGKILL");
  });
  conn.listen();

  const textDocument = (path: string) => ({ uri: uri(path) });
  /** How the server wants documents synced: change kind and save options. */
  const syncOptions = (): {
    change: number;
    save?: { includeText?: boolean };
  } => {
    const t = caps.textDocumentSync;
    if (typeof t === "number") return { change: t };
    const change = typeof t?.change === "number" ? t.change : 0;
    const save = t?.save;
    if (save === undefined || save === false) return { change };
    return { change, save: save === true ? {} : save };
  };
  const position = (
    path: string,
    op: { pos: { line: number; col: number } },
  ) => ({
    textDocument: textDocument(path),
    position: toLspPosition(op.pos),
  });

  async function send(
    path: string,
    op: LspOp,
    token: CancellationToken,
  ): Promise<LspResult> {
    const ask = <T>(method: string, params: unknown) =>
      conn.sendRequest<T>(method, params, token);
    const root = o.workspaceRoot;
    switch (op.kind) {
      case "hover":
        return toHover(await ask("textDocument/hover", position(path, op)));
      case "definition":
      case "implementation":
        return toLocations(
          root,
          await ask(`textDocument/${op.kind}`, position(path, op)),
        );
      case "references":
        return toLocations(
          root,
          await ask("textDocument/references", {
            ...position(path, op),
            context: { includeDeclaration: true },
          }),
        );
      case "signature":
        return toSignature(
          await ask("textDocument/signatureHelp", position(path, op)),
        );
      case "prepareRename":
        return toPrepareRename(
          await ask("textDocument/prepareRename", position(path, op)),
          (range) => textOf(path, range, op.pos),
        );
      case "symbols":
        return toSymbols(
          await ask("textDocument/documentSymbol", {
            textDocument: textDocument(path),
          }),
        );
      case "completion":
        return toCompletion(
          await ask("textDocument/completion", {
            ...position(path, op),
            context:
              op.trigger === undefined
                ? { triggerKind: 1 }
                : { triggerKind: 2, triggerCharacter: op.trigger },
          }),
        );
      case "resolveCompletion": {
        const item = toCompletionItem(
          await ask("completionItem/resolve", op.item.data),
        );
        return item === undefined
          ? { kind: "error", message: "malformed completion item" }
          : { kind: "completionItem", item };
      }
      case "rename": {
        const edit = await ask<unknown>("textDocument/rename", {
          ...position(path, op),
          newName: op.newName,
        });
        return isObject(edit)
          ? { kind: "edit", edit: toCodeEdit(root, edit) }
          : { kind: "none" };
      }
      case "codeActions":
        return toCodeActions(
          root,
          await ask("textDocument/codeAction", {
            textDocument: textDocument(path),
            range: toLspRange(op.range),
            context: { diagnostics: op.diagnostics.map(toLspDiagnostic) },
          }),
        );
      case "resolveAction": {
        const action = toCodeAction(
          root,
          await ask("codeAction/resolve", op.action.data),
        );
        return action === undefined
          ? { kind: "error", message: "malformed code action" }
          : { kind: "action", action };
      }
      case "executeCommand": {
        const c = isObject(op.command) ? op.command : {};
        await ask("workspace/executeCommand", {
          command: c.command,
          ...(c.arguments === undefined ? {} : { arguments: c.arguments }),
        });
        return { kind: "none" };
      }
      case "format":
        return toFormatEdit(
          path,
          op.range === undefined
            ? await ask("textDocument/formatting", {
                textDocument: textDocument(path),
                options: op.options,
              })
            : await ask("textDocument/rangeFormatting", {
                textDocument: textDocument(path),
                range: toLspRange(op.range),
                options: op.options,
              }),
        );
    }
  }

  /** The text of `range` in the open document, or the word at `pos`. */
  function textOf(
    path: string,
    range: Range | undefined,
    pos: { line: number; col: number },
  ): string {
    const doc = docs.get(path);
    if (doc === undefined) return "";
    try {
      return range === undefined
        ? wordAt(doc.line(pos.line), pos.col)
        : doc.slice(range);
    } catch {
      return "";
    }
  }

  const client: LspClient = {
    get view() {
      return view as ServerView;
    },
    didOpen(path, languageId, version, text) {
      docs.set(path, createTextBuffer(text));
      notify("textDocument/didOpen", {
        textDocument: { uri: uri(path), languageId, version, text },
      });
    },
    didChange(path, version, change) {
      const prev = docs.get(path);
      if (prev === undefined) return;
      const next = prev.apply(change).buffer;
      docs.set(path, next);
      const sync = syncOptions();
      if (sync.change === 0) return;
      notify("textDocument/didChange", {
        textDocument: { uri: uri(path), version },
        contentChanges:
          sync.change === 1
            ? [{ text: allText(next) }]
            : [{ range: toLspRange(change.range), text: change.text }],
      });
    },
    didSave(path) {
      const save = syncOptions().save;
      const doc = docs.get(path);
      if (save === undefined || doc === undefined) return;
      notify("textDocument/didSave", {
        textDocument: textDocument(path),
        ...(save.includeText === true ? { text: allText(doc) } : {}),
      });
    },
    didClose(path) {
      if (!docs.delete(path)) return;
      pulls.get(path)?.cancel();
      pulls.delete(path);
      resultIds.delete(path);
      notify("textDocument/didClose", { textDocument: textDocument(path) });
    },
    async pullDiagnostics(path) {
      pulls.get(path)?.cancel();
      const source = new CancellationTokenSource();
      pulls.set(path, source);
      const previousResultId = resultIds.get(path);
      try {
        const r = await conn.sendRequest<DocumentDiagnosticReport>(
          "textDocument/diagnostic",
          {
            textDocument: textDocument(path),
            ...(previousResultId === undefined ? {} : { previousResultId }),
          },
          source.token,
        );
        // A newer pull or a close replaced this one.
        if (pulls.get(path) !== source || !isObject(r))
          return { kind: "unchanged" };
        if (typeof r.resultId === "string") resultIds.set(path, r.resultId);
        else resultIds.delete(path);
        return r.kind === "full"
          ? {
              kind: "full",
              items: diagnosticsOf("textDocument/diagnostic", r.items),
            }
          : { kind: "unchanged" };
      } finally {
        if (pulls.get(path) === source) pulls.delete(path);
        source.dispose();
      }
    },
    async request(id, path, op) {
      const source = new CancellationTokenSource();
      tokens.set(id, source);
      try {
        return await send(path, op, source.token);
      } catch (e) {
        return toErrorResult(e);
      } finally {
        tokens.delete(id);
        source.dispose();
      }
    },
    cancel(id) {
      tokens.get(id)?.cancel();
    },
    reply(requestId, applied, failureReason) {
      const answer = replies.get(Number(requestId));
      replies.delete(Number(requestId));
      answer?.(
        failureReason === undefined ? { applied } : { applied, failureReason },
      );
    },
    configure(next) {
      settings = next;
      notify("workspace/didChangeConfiguration", { settings });
    },
    stop(boundMs) {
      stopped ??= (async () => {
        if (exited) return;
        const started = performance.now();
        await Promise.race([
          conn.sendRequest("shutdown").catch(() => {}),
          Bun.sleep(Math.max(0, boundMs - 100)),
        ]);
        notify("exit");
        const left = boundMs - (performance.now() - started);
        await Promise.race([closed, Bun.sleep(Math.max(0, left))]);
        if (!exited) {
          child.kill("SIGKILL");
          await Promise.race([closed, Bun.sleep(100)]);
        }
        conn.dispose();
      })();
      return stopped;
    },
  };

  return new Promise<LspClient>((resolve, reject) => {
    let settled = false;
    const fail = (reason: string) => {
      if (settled) return;
      settled = true;
      reject(new Error(reason));
      if (!exited) child.kill("SIGKILL");
    };
    child.on("error", (e) => {
      exited = true;
      onClosed();
      fail(firstStderr ?? e.message);
    });
    child.on("close", (code, signal) => {
      exited = true;
      onClosed();
      conn.dispose();
      if (!settled)
        fail(
          firstStderr ??
            (code === null
              ? `killed by ${signal}`
              : `exited with code ${code}`),
        );
    });
    o.signal?.addEventListener("abort", () => fail("stopped"));
    const params: InitializeParams = {
      processId: process.pid,
      clientInfo: { name: "so" },
      rootUri: o.root === undefined ? null : pathToFileURL(o.root).href,
      workspaceFolders:
        o.root === undefined
          ? null
          : [{ uri: pathToFileURL(o.root).href, name: basename(o.root) }],
      capabilities: clientCapabilities({ snippets: o.spec.snippets }),
      ...(o.spec.initOptions === undefined
        ? {}
        : { initializationOptions: o.spec.initOptions }),
    };
    conn.sendRequest<InitializeResult>("initialize", params).then(
      (result) => {
        if (settled) return;
        caps =
          isObject(result) && isObject(result.capabilities)
            ? result.capabilities
            : {};
        notify("initialized", {});
        notify("workspace/didChangeConfiguration", { settings });
        view = toServerView(name, o.root, caps);
        settled = true;
        resolve(client);
      },
      (e: unknown) => {
        // A closed connection waits for the exit, which carries stderr.
        if (e instanceof ResponseError) fail(e.message);
      },
    );
  });
}
