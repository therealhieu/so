import type { Pos, Range } from "../kernel/text/pos";
import type {
  Diagnostic,
  DiagnosticSeverity,
} from "../kernel/view/diagnostics";
import { activeBuffer, activeWindow, bufferForPath } from "./buffers";
import { onCompletionResult, onResolvedItem } from "./code-completion";
import { goTo, recordJump } from "./jumps";
import { startCodeEdit } from "./lsp-edits";
import type {
  CodeAction,
  DiagnosticSlots,
  LspFeature,
  LspOp,
  LspResult,
  LspState,
  PendingRequest,
  ServerKey,
} from "./lsp-types";
import { openPicker } from "./picker";
import { chain, message, none, toast } from "./result";
import { writeBuffer } from "./save";
import type { Action, AppState, Effect, Result } from "./types";
import type { Registries } from "./update";

/** User requests that get no answer in this long report a timeout. */
const REQUEST_MS = 5000;

const LOCATION_TITLES: Partial<Record<LspFeature, string>> = {
  definition: "Definitions",
  implementation: "Implementations",
  references: "References",
};

const withLsp = (s: AppState, patch: Partial<LspState>): AppState => ({
  ...s,
  lsp: { ...s.lsp, ...patch },
});

const serverName = (s: AppState, key: ServerKey): string =>
  s.lsp.servers[key]?.name ?? key;

/** Only starting and ready servers are attached to files. */
const running = (s: AppState, key: ServerKey): boolean => {
  const state = s.lsp.servers[key]?.state;
  return state === "starting" || state === "ready";
};

/** The first attached, ready server with `feature`, in table order. */
export function pickServer(
  s: AppState,
  path: string,
  feature: LspFeature,
): ServerKey | undefined {
  return (s.lsp.attached[path] ?? []).find((key) => {
    const v = s.lsp.servers[key];
    return v?.state === "ready" && v.features.includes(feature);
  });
}

/** `pending` without the requests `drop` selects, and the effects that end them. */
function dropPending(
  s: AppState,
  drop: (p: PendingRequest, id: number) => boolean,
): Result {
  const pending: LspState["pending"] = {};
  const effects: Effect[] = [];
  for (const [n, p] of Object.entries(s.lsp.pending)) {
    const id = Number(n);
    if (!drop(p, id)) {
      pending[id] = p;
      continue;
    }
    effects.push({ kind: "lspCancel", id, key: p.key });
    if (!p.auto) effects.push({ kind: "cancelTimer", id: `lsp:${id}` });
  }
  return effects.length === 0
    ? none(s)
    : { state: withLsp(s, { pending }), effects };
}

/**
 * Record a pending request for the active buffer and emit it. `key` pins the
 * server that produced the item or action; otherwise the first capable one
 * answers. `replace` cancels older requests of the same feature. An `auto`
 * request gets no timeout and stays silent when nothing can answer it.
 */
export function request(
  s: AppState,
  feature: LspFeature,
  op: LspOp,
  o: { auto?: boolean; replace?: boolean; key?: ServerKey } = {},
): Result {
  const auto = o.auto === true;
  const b = activeBuffer(s);
  const keys = b === undefined ? [] : (s.lsp.attached[b.path] ?? []);
  const key =
    b === undefined
      ? undefined
      : o.key !== undefined
        ? s.lsp.servers[o.key]?.state === "ready"
          ? o.key
          : undefined
        : pickServer(s, b.path, feature);
  if (b === undefined || key === undefined) {
    if (auto) return none(s);
    if (keys.length === 0 || o.key !== undefined)
      return message(
        s,
        `no language server for ${b?.fileType ?? "this window"}`,
      );
    // A starting server's features are not known yet.
    const starting = keys.filter((k) => s.lsp.servers[k]?.state === "starting");
    const names = (ks: ServerKey[]) =>
      ks.map((k) => serverName(s, k)).join(", ");
    return starting.length === keys.length
      ? message(s, `${feature}: ${names(starting)} is starting`)
      : message(s, `${feature}: not supported by ${names(keys)}`);
  }
  const cleared =
    o.replace === true ? dropPending(s, (p) => p.feature === feature) : none(s);
  return chain(cleared, (st) => {
    const id = st.lsp.nextId;
    const p: PendingRequest = {
      feature,
      key,
      path: b.path,
      version: b.text.version,
      window: st.windows.active,
      auto,
      ...("pos" in op ? { pos: op.pos } : {}),
    };
    const effects: Effect[] = auto
      ? []
      : [{ kind: "startTimer", id: `lsp:${id}`, ms: REQUEST_MS }];
    effects.push({ kind: "lsp", id, key, path: b.path, op });
    return {
      state: withLsp(st, {
        pending: { ...st.lsp.pending, [id]: p },
        nextId: id + 1,
      }),
      effects,
    };
  });
}

/** Remove request `id`, returning it with the state without it. */
function takePending(
  s: AppState,
  id: number,
): { state: AppState; p: PendingRequest | undefined } {
  const p = s.lsp.pending[id];
  if (p === undefined) return { state: s, p };
  const { [id]: _, ...pending } = s.lsp.pending;
  return { state: withLsp(s, { pending }), p };
}

/** A server answered request `id`; stale, unknown, and quiet answers change nothing. */
export function onLspResult(
  s: AppState,
  a: { id: number; result: LspResult; now: number },
  reg: Registries,
): Result {
  const { state, p } = takePending(s, a.id);
  if (p === undefined) return none(s);
  const ended: Effect[] = p.auto
    ? []
    : [{ kind: "cancelTimer", id: `lsp:${a.id}` }];
  const b = bufferForPath(state, p.path);
  const current = b !== undefined && b.text.version === p.version;
  const format = state.lsp.format;
  const fresh =
    format?.requestId === a.id
      ? formattedSave(
          state,
          format,
          current ? a.result : { kind: "none" },
          a.now,
          reg,
        )
      : current
        ? applyResult(state, a.id, p, a.result, a.now, reg)
        : none(state);
  return { state: fresh.state, effects: [...ended, ...fresh.effects] };
}

/** `s` without the format-on-save wait. */
function withoutFormat(s: AppState): AppState {
  const { format: _, ...lsp } = s.lsp;
  return { ...s, lsp };
}

/** Write buffer `id` as `:w` does. */
const save = (s: AppState, id: number, now: number): Result =>
  writeBuffer(s, id, now, { recreate: s.buffers[id]?.disk === "deleted" });

/**
 * The formatter answered a `:w`: apply its edits, then write. A failure
 * writes the buffer unformatted with a warning; a stale answer just writes.
 */
function formattedSave(
  s: AppState,
  f: { bufferId: number },
  r: LspResult,
  now: number,
  reg: Registries,
): Result {
  const waited: Result = {
    state: withoutFormat(s),
    effects: [{ kind: "cancelTimer", id: `lspFormat:${f.bufferId}` }],
  };
  return chain(waited, (st) => {
    if (r.kind === "edit")
      return chain(
        startCodeEdit(st, r.edit, { title: "format" }, now, reg),
        (x) => save(x, f.bufferId, now),
      );
    if (r.kind !== "error" || r.quiet === true)
      return save(st, f.bufferId, now);
    return chain(save(st, f.bufferId, now), (x) =>
      toast(
        x,
        "info",
        `format failed (${r.message}); saved without formatting`,
      ),
    );
  });
}

/** `:w` waited a second for the formatter: give up on it and write unformatted. */
export function onFormatTimeout(
  s: AppState,
  bufferId: number,
  now: number,
): Result {
  const f = s.lsp.format;
  if (f === undefined || f.bufferId !== bufferId) return none(s);
  const dropped = dropPending(withoutFormat(s), (_p, id) => id === f.requestId);
  return chain(
    chain(dropped, (st) => save(st, bufferId, now)),
    (st) => toast(st, "info", "format timed out; saved without formatting"),
  );
}

function applyResult(
  s: AppState,
  id: number,
  p: PendingRequest,
  r: LspResult,
  now: number,
  reg: Registries,
): Result {
  const pos = p.pos ?? { line: 0, col: 0 };
  switch (r.kind) {
    case "error":
      if (r.quiet === true || p.auto) return none(s);
      // A code action that fails to resolve fails alone; the others still work.
      return p.feature === "codeActionResolve"
        ? message(s, `${serverName(s, p.key)}: ${r.message}`, "error")
        : message(s, `${p.feature}: ${r.message}`, "error");
    case "none":
      return p.auto ||
        p.feature === "executeCommand" ||
        p.feature === "format" ||
        p.feature === "rangeFormat"
        ? none(s)
        : message(s, `${p.feature}: nothing found`);
    case "hover": {
      const lines = r.text.split("\n");
      return lines.every((l) => l.trim() === "")
        ? message(s, `${p.feature}: nothing found`)
        : none(
            withLsp(s, {
              float: { kind: "hover", window: p.window, at: pos, lines },
            }),
          );
    }
    case "signature":
      return none(
        withLsp(s, {
          float: {
            kind: "signature",
            window: p.window,
            at: pos,
            lines: [r.label],
            ...(r.active === undefined
              ? {}
              : { active: { line: 0, ...r.active } }),
          },
        }),
      );
    case "locations":
      return onLocations(s, r, p.feature, reg);
    case "symbols":
      return r.items.length === 0
        ? message(s, `${p.feature}: nothing found`)
        : openPicker(
            {
              state: withLsp(s, { symbols: { path: p.path, items: r.items } }),
              now: 0,
              reg,
            },
            "lspSymbols",
          );
    case "prepareRename":
      return openRenamePrompt(
        s,
        { key: p.key, path: p.path, pos, version: p.version },
        r.placeholder,
      );
    case "edit":
      return startCodeEdit(s, r.edit, { title: p.feature }, now, reg);
    case "actions":
      return r.items.length === 0
        ? message(s, `${p.feature}: nothing found`)
        : openPicker(
            {
              state: withLsp(s, {
                actions: { key: p.key, path: p.path, items: r.items },
              }),
              now: 0,
              reg,
            },
            "lspActions",
          );
    case "action":
      return runAction(s, { ...r.action, resolved: true }, p.key, now, reg);
    case "completion":
      return onCompletionResult(s, p, r);
    case "completionItem":
      return onResolvedItem(s, id, r.item, now, reg);
  }
}

/**
 * Run code action `action` of server `key`: apply its edit, then send its
 * command. An action listed without its edit is resolved first, when the
 * server can resolve it.
 */
export function runAction(
  s: AppState,
  action: CodeAction,
  key: ServerKey,
  now: number,
  reg: Registries,
): Result {
  const command = (st: AppState): Result =>
    action.command === undefined
      ? none(st)
      : request(
          st,
          "executeCommand",
          { kind: "executeCommand", command: action.command },
          { key },
        );
  if (action.edit !== undefined)
    return chain(
      startCodeEdit(s, action.edit, { title: "codeAction" }, now, reg),
      command,
    );
  if (
    !action.resolved &&
    s.lsp.servers[key]?.features.includes("codeActionResolve") === true
  )
    return request(
      s,
      "codeActionResolve",
      { kind: "resolveAction", action },
      { key },
    );
  return action.command === undefined
    ? message(s, `codeAction: ${action.title} has nothing to apply`)
    : command(s);
}

/** A server asks for a workspace edit; it is answered once, applied or not. */
export function onLspApplyEdit(
  s: AppState,
  a: Extract<Action, { type: "lspApplyEdit" }>,
  reg: Registries,
): Result {
  return startCodeEdit(
    s,
    a.edit,
    { title: "edit", reply: { key: a.key, requestId: a.requestId } },
    0,
    reg,
  );
}

/** Ask for a new name for the symbol at `rename.pos`, starting from `value`. */
export function openRenamePrompt(
  s: AppState,
  rename: { key: ServerKey; path: string; pos: Pos; version: number },
  value: string,
): Result {
  return none({
    ...s,
    overlay: {
      kind: "prompt",
      prompt: {
        kind: "input",
        title: "Rename symbol",
        value,
        invalid: "type a new name",
        rename: { ...rename, name: value },
      },
    },
  });
}

const outsideNote = (n: number) => `${n} outside the workspace`;

/**
 * One location jumps there (recorded, so <C-o> returns); several open the
 * `lspLocations` picker. Locations outside the workspace are only counted.
 * The answer has no time, so a save of the buffer left is due now (0).
 */
function onLocations(
  s: AppState,
  r: Extract<LspResult, { kind: "locations" }>,
  feature: LspFeature,
  reg: Registries,
): Result {
  const [first] = r.items;
  if (first === undefined)
    return message(
      s,
      r.outside === 0
        ? `${feature}: nothing found`
        : r.outside === 1
          ? `${feature} is outside the workspace`
          : `${feature}: ${outsideNote(r.outside)}`,
    );
  const shown =
    r.items.length === 1
      ? goTo(recordJump(s), first.path, first.range.start, 0)
      : (() => {
          const title = LOCATION_TITLES[feature] ?? feature;
          return openPicker(
            {
              state: withLsp(s, { list: { title, items: r.items } }),
              now: 0,
              reg,
            },
            "lspLocations",
            title,
          );
        })();
  return r.outside === 0
    ? shown
    : chain(shown, (st) => message(st, outsideNote(r.outside)));
}

/** Request `id`'s timer fired first: drop it, cancel it, and say so. */
export function onLspTimeout(s: AppState, id: number): Result {
  const { state, p } = takePending(s, id);
  if (p === undefined) return none(s);
  const shown = p.auto
    ? none(state)
    : message(state, `${p.feature}: timed out`, "error");
  return {
    state: shown.state,
    effects: [{ kind: "lspCancel", id, key: p.key }],
  };
}

/** `diagnostics` without server `key`'s lists; emptied paths are removed. */
function withoutServerDiagnostics(
  d: LspState["diagnostics"],
  key: ServerKey,
): LspState["diagnostics"] {
  const out: LspState["diagnostics"] = {};
  for (const [path, byKey] of Object.entries(d)) {
    const { [key]: _, ...rest } = byKey;
    if (Object.keys(rest).length > 0) out[path] = rest;
  }
  return out;
}

/** `attached` without server `key`; emptied paths are removed. */
function detached(
  a: LspState["attached"],
  key: ServerKey,
): LspState["attached"] {
  const out: LspState["attached"] = {};
  for (const [path, keys] of Object.entries(a)) {
    const rest = keys.filter((k) => k !== key);
    if (rest.length > 0) out[path] = rest;
  }
  return out;
}

/**
 * A server's view changed. A server that stopped (`undefined`) is forgotten;
 * one that is not starting or ready is detached and its diagnostics dropped.
 * Turning `failed` toasts once; `missing` and `unavailable` stay quiet.
 */
export function onLspServer(
  s: AppState,
  a: Extract<Action, { type: "lspServer" }>,
): Result {
  const { key, view } = a;
  const prev = s.lsp.servers[key];
  const { [key]: _, ...others } = s.lsp.servers;
  const servers =
    view === undefined ? others : { ...s.lsp.servers, [key]: view };
  const live = view?.state === "starting" || view?.state === "ready";
  const next = live
    ? withLsp(s, { servers })
    : withLsp(s, {
        servers,
        attached: detached(s.lsp.attached, key),
        diagnostics: withoutServerDiagnostics(s.lsp.diagnostics, key),
      });
  const ended = live ? none(next) : dropPending(next, (p) => p.key === key);
  return view?.state === "failed" && prev?.state !== "failed"
    ? chain(ended, (st) =>
        toast(st, "error", `${view.name} stopped: ${view.reason ?? "crashed"}`),
      )
    : ended;
}

/** The servers attached to a path; keys that are not running are left out. */
export function onLspAttached(
  s: AppState,
  a: Extract<Action, { type: "lspAttached" }>,
): Result {
  const keys = a.keys.filter((k) => running(s, k));
  const { [a.path]: _, ...rest } = s.lsp.attached;
  return none(
    withLsp(s, {
      attached: keys.length === 0 ? rest : { ...rest, [a.path]: keys },
    }),
  );
}

/** A server's error or warning, as a toast named after the server. */
export function onLspMessage(
  s: AppState,
  a: Extract<Action, { type: "lspMessage" }>,
): Result {
  return toast(
    s,
    a.level === "error" ? "error" : "info",
    `${serverName(s, a.key)}: ${a.text}`,
  );
}

/**
 * Server `key`'s pushed or pulled list for `path` replaced; empty lists,
 * servers, and paths are pruned. Other servers and the other slot are kept.
 */
export function onLspDiagnostics(
  s: AppState,
  a: Extract<Action, { type: "lspDiagnostics" }>,
): Result {
  const byKey = { ...s.lsp.diagnostics[a.path] };
  const slots: DiagnosticSlots = { ...byKey[a.key] };
  if (a.items.length === 0) delete slots[a.source];
  else slots[a.source] = a.items;
  if (slots.push === undefined && slots.pull === undefined) delete byKey[a.key];
  else byKey[a.key] = slots;
  const diagnostics = { ...s.lsp.diagnostics };
  if (Object.keys(byKey).length === 0) delete diagnostics[a.path];
  else diagnostics[a.path] = byKey;
  return none(withLsp(s, { diagnostics }));
}

/** Every server's pushed then pulled diagnostics for one path. */
export function mergedDiagnostics(
  byKey: Readonly<Record<ServerKey, DiagnosticSlots>> | undefined,
): Diagnostic[] {
  return Object.values(byKey ?? {}).flatMap((slots) => [
    ...(slots.push ?? []),
    ...(slots.pull ?? []),
  ]);
}

/** The path whose shown diagnostics stay as they are: the one being typed into. */
const frozenPath = (s: AppState): string | undefined =>
  s.vim.mode === "insert" ? activeBuffer(s)?.path : undefined;

const sameItems = (a: readonly Diagnostic[], b: readonly Diagnostic[]) =>
  a.length === b.length && a.every((d, i) => d === b[i]);

/**
 * Post-step: `shown` follows the merged diagnostics of every path, except the
 * path the active window is in Insert mode on, which keeps its list until
 * Insert ends.
 */
export function syncDiagnostics(prev: AppState, r: Result): Result {
  const s = r.state;
  const frozen = frozenPath(s);
  if (s.lsp.diagnostics === prev.lsp.diagnostics && frozen === frozenPath(prev))
    return r;
  let shown: LspState["shown"] | undefined;
  const paths = new Set([
    ...Object.keys(s.lsp.diagnostics),
    ...Object.keys(s.lsp.shown),
  ]);
  for (const path of paths) {
    if (path === frozen) continue;
    const want = mergedDiagnostics(s.lsp.diagnostics[path]);
    if (sameItems(s.lsp.shown[path] ?? [], want)) continue;
    shown ??= { ...s.lsp.shown };
    if (want.length === 0) delete shown[path];
    else shown[path] = want;
  }
  return shown === undefined
    ? r
    : { state: withLsp(s, { shown }), effects: r.effects };
}

/** `s` without the info float. */
export function withoutFloat(s: AppState): AppState {
  if (s.lsp.float === undefined) return s;
  const { float: _, ...lsp } = s.lsp;
  return { ...s, lsp };
}

/**
 * Post-step: the float closes when its window is no longer active or shows
 * another buffer. Signature help lives only in Insert mode; a hover or
 * diagnostic float also closes when the text, the cursor, or the mode
 * changes.
 */
export function syncFloat(prev: AppState, r: Result): Result {
  const s = r.state;
  const f = s.lsp.float;
  if (f === undefined) return r;
  const close = (): Result => ({ state: withoutFloat(s), effects: r.effects });
  const w = s.windows.byId[f.window];
  if (w === undefined || s.windows.active !== f.window) return close();
  if (f.kind === "signature") return s.vim.mode === "insert" ? r : close();
  if (prev.lsp.float !== f) return r;
  const was = prev.windows.byId[f.window];
  const b = s.buffers[w.content.bufferId];
  const changed =
    was === undefined ||
    was.content.bufferId !== w.content.bufferId ||
    prev.buffers[was.content.bufferId]?.text.version !== b?.text.version ||
    was.content.cursor.line !== w.content.cursor.line ||
    was.content.cursor.col !== w.content.cursor.col ||
    prev.vim.mode !== s.vim.mode;
  return changed ? close() : r;
}

/** Whether `range` covers the cell at `line`/`col`; an empty range covers its start. */
function covers(range: Range, line: number, col: number): boolean {
  const { start, end } = range;
  if (start.line === end.line && start.col === end.col)
    return line === start.line && col === start.col;
  if (line < start.line || line > end.line) return false;
  const from = line === start.line ? start.col : 0;
  const to = line === end.line ? end.col : Number.POSITIVE_INFINITY;
  return col >= from && col < to;
}

/** The shown diagnostic under the active window's cursor, the most severe first. */
export function cursorDiagnostic(
  s: AppState,
): { severity: DiagnosticSeverity; text: string } | undefined {
  const w = activeWindow(s);
  const b = activeBuffer(s);
  if (w === undefined || b === undefined) return undefined;
  const { line, col } = w.content.cursor;
  let best: Diagnostic | undefined;
  for (const d of s.lsp.shown[b.path] ?? [])
    if (
      covers(d.range, line, col) &&
      (best === undefined || d.severity < best.severity)
    )
      best = d;
  if (best === undefined) return undefined;
  const text = best.message.split("\n", 1)[0] ?? "";
  return {
    severity: best.severity,
    text: best.source === undefined ? text : `${best.source}: ${text}`,
  };
}
