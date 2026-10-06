import { LSP_FILE_TYPES, resolveServers } from "../config/lsp";
import type { Binding } from "../kernel/commands/defaults";
import type { Mode } from "../kernel/commands/keymap";
import type { Command } from "../kernel/commands/registry";
import type { Pos, Range } from "../kernel/text/pos";
import type { Diagnostic } from "../kernel/view/diagnostics";
import { activeBuffer, activeWindow, placeCursor } from "./buffers";
import type { CommandContext, CommandResult } from "./commands";
import { noServerMessage, openRenamePrompt, pickServer, request } from "./lsp";
import type { ServerKey } from "./lsp-types";
import { openPicker } from "./picker";
import { message, none } from "./result";
import type { AppState, BufferState, Result } from "./types";

type AppCommand = Command<CommandContext, CommandResult>;

const SIGN = { 1: "E", 2: "W", 3: "I", 4: "H" } as const;

const before = (a: Pos, b: Pos) =>
  a.line < b.line || (a.line === b.line && a.col < b.col);

/** The active window's cursor, or the start of the buffer. */
const cursorOf = (s: AppState): Pos =>
  activeWindow(s)?.content.cursor ?? { line: 0, col: 0 };

/** Ask for `feature` at the cursor; hover and signature replace an older one. */
function atCursor(
  c: CommandContext,
  kind:
    | "hover"
    | "definition"
    | "declaration"
    | "typeDefinition"
    | "implementation"
    | "references"
    | "signature",
): Result {
  return request(
    c.state,
    kind,
    { kind, pos: cursorOf(c.state) },
    kind === "hover" || kind === "signature" ? { replace: true } : {},
  );
}

/** The Visual selection as a range (end exclusive), or undefined outside Visual mode. */
function selection(s: AppState): Range | undefined {
  const anchor = s.vim.visualAnchor;
  const b = activeBuffer(s);
  if (anchor === undefined || b === undefined) return undefined;
  const cur = cursorOf(s);
  const [from, to] = before(cur, anchor) ? [cur, anchor] : [anchor, cur];
  if (s.vim.mode === "visualLine")
    return {
      start: { line: from.line, col: 0 },
      end: { line: to.line, col: b.text.line(to.line).length },
    };
  return s.vim.mode === "visual"
    ? { start: from, end: { line: to.line, col: to.col + 1 } }
    : undefined;
}

/** Visual mode ends once its selection is sent. */
function leaveVisual(s: AppState): AppState {
  if (s.vim.visualAnchor === undefined) return s;
  const { visualAnchor: _, ...vim } = s.vim;
  return { ...s, vim: { ...vim, mode: "normal" } };
}

function codeAction(c: CommandContext): Result {
  const s = c.state;
  const b = activeBuffer(s);
  const pos = cursorOf(s);
  const range = selection(s) ?? { start: pos, end: pos };
  const diagnostics = (
    b === undefined ? [] : (s.lsp.shown[b.path] ?? [])
  ).filter(
    (d) =>
      d.range.start.line <= range.end.line &&
      d.range.end.line >= range.start.line,
  );
  return request(leaveVisual(s), "codeActions", {
    kind: "codeActions",
    range,
    diagnostics,
  });
}

const IDENT = /[\p{L}\p{N}_$]/u;

/** The identifier at `col` of `line`, or "" when the cursor is not on one. */
function wordAt(line: string, col: number): string {
  if (!IDENT.test(line[col] ?? "")) return "";
  let from = col;
  let to = col + 1;
  while (from > 0 && IDENT.test(line[from - 1] ?? "")) from--;
  while (to < line.length && IDENT.test(line[to] ?? "")) to++;
  return line.slice(from, to);
}

/**
 * `grn`: a server that can prepare a rename gets asked first; otherwise the
 * prompt starts from the word under the cursor.
 */
function rename(c: CommandContext): Result {
  const s = c.state;
  const b = activeBuffer(s);
  const pos = cursorOf(s);
  if (b !== undefined && pickServer(s, b.path, "prepareRename") !== undefined)
    return request(s, "prepareRename", { kind: "prepareRename", pos });
  const key = b && pickServer(s, b.path, "rename");
  // Without a rename server, `request` explains why nothing can be sent.
  if (b === undefined || key === undefined)
    return request(s, "rename", { kind: "rename", pos, newName: "" });
  return openRenamePrompt(
    s,
    { key, path: b.path, pos, version: b.text.version },
    wordAt(b.text.line(pos.line), pos.col),
  );
}

/**
 * Indentation for the formatter: tabs when the first indented line starts
 * with one, else spaces as wide as the most common indent step between
 * consecutive lines (`tabWidth` when nothing is indented). Blank lines and
 * block-comment continuations (` * text`) are skipped; a rare aligned
 * continuation loses to the step most lines use, and a tie goes to the
 * smaller step.
 */
export function formattingOptions(
  b: BufferState,
  tabWidth: number,
): { tabSize: number; insertSpaces: boolean } {
  const steps = new Map<number, number>();
  let previous = 0;
  let indented = false;
  for (let i = 0; i < b.text.lineCount; i++) {
    const line = b.text.line(i);
    const text = line.trimStart();
    if (text === "" || text.startsWith("*")) continue;
    const indent = line.length - text.length;
    if (indent > 0 && !indented) {
      if (line[0] === "\t") return { tabSize: tabWidth, insertSpaces: false };
      indented = true;
    }
    if (indent > previous && line[0] === " ")
      steps.set(indent - previous, (steps.get(indent - previous) ?? 0) + 1);
    previous = indent;
  }
  let tabSize = tabWidth;
  let best = 0;
  for (const [step, count] of steps)
    if (count > best || (count === best && step < tabSize)) {
      tabSize = step;
      best = count;
    }
  return { tabSize, insertSpaces: true };
}

/** `:Format`: the Visual selection, or the whole buffer. */
function formatCommand(c: CommandContext): Result {
  const s = c.state;
  const b = activeBuffer(s);
  if (b === undefined) return message(s, noServerMessage(s, b));
  const options = formattingOptions(b, s.config.editor.tabWidth);
  const range = selection(s);
  return range === undefined
    ? request(s, "format", { kind: "format", options })
    : request(leaveVisual(s), "rangeFormat", {
        kind: "format",
        range,
        options,
      });
}

/** How long `:w` waits for the formatter before saving unformatted. */
const FORMAT_ON_SAVE_MS = 1000;

/** `:w` with format on save: format the whole buffer first; its result or the timeout writes it. */
export function formatThenSave(c: CommandContext, b: BufferState): Result {
  const s = c.state;
  const requestId = s.lsp.nextId;
  const r = request(s, "format", {
    kind: "format",
    options: formattingOptions(b, s.config.editor.tabWidth),
  });
  return {
    state: {
      ...r.state,
      lsp: { ...r.state.lsp, format: { bufferId: b.id, requestId } },
    },
    effects: [
      ...r.effects,
      { kind: "startTimer", id: `lspFormat:${b.id}`, ms: FORMAT_ON_SAVE_MS },
    ],
  };
}

/** The active file's shown diagnostics, in position order. */
function sortedDiagnostics(s: AppState): Diagnostic[] {
  const b = activeBuffer(s);
  const shown = b === undefined ? [] : (s.lsp.shown[b.path] ?? []);
  return [...shown].sort(
    (a, b) =>
      a.range.start.line - b.range.start.line ||
      a.range.start.col - b.range.start.col,
  );
}

/** `]d`/`[d`: the next or previous diagnostic start, wrapping at the ends. */
function diagnosticJump(c: CommandContext, dir: 1 | -1): Result {
  const list = sortedDiagnostics(c.state);
  if (list.length === 0) return message(c.state, "no diagnostics");
  const cur = cursorOf(c.state);
  const target =
    dir === 1
      ? (list.find((d) => before(cur, d.range.start)) ?? list[0])
      : (list.findLast((d) => before(d.range.start, cur)) ?? list.at(-1));
  return target === undefined
    ? none(c.state)
    : none(placeCursor(c.state, target.range.start));
}

/** `<C-w>d`: the cursor line's diagnostics in a float, the most severe first. */
function diagnosticFloat(c: CommandContext): Result {
  const s = c.state;
  const cur = cursorOf(s);
  const here = sortedDiagnostics(s)
    .filter(
      (d) => d.range.start.line <= cur.line && d.range.end.line >= cur.line,
    )
    .sort((a, b) => a.severity - b.severity);
  if (here.length === 0) return message(s, "no diagnostics on this line");
  const lines = here.map(
    (d) =>
      `${SIGN[d.severity]} ${d.source === undefined ? "" : `${d.source}: `}${d.message.split("\n", 1)[0] ?? ""}`,
  );
  return none({
    ...s,
    lsp: {
      ...s.lsp,
      float: {
        kind: "diagnostics",
        window: s.windows.active,
        at: { line: cur.line, col: 0 },
        lines,
      },
    },
  });
}

/**
 * `:LspRestart`: the servers attached to the active file, and the stopped
 * ones (failed, unavailable, missing) whose file types include it.
 */
function restartAttached(c: CommandContext): Result {
  const s = c.state;
  const b = activeBuffer(s);
  if (b === undefined) return message(s, noServerMessage(s, b));
  const names = new Set(
    resolveServers(s.config.lsp)
      .filter((spec) => spec.fileTypes.includes(b.fileType))
      .map((spec) => spec.name),
  );
  const attached = s.lsp.attached[b.path] ?? [];
  const stopped = Object.entries(s.lsp.servers)
    .filter(
      ([key, v]) =>
        !attached.includes(key) &&
        names.has(v.name) &&
        v.state !== "starting" &&
        v.state !== "ready",
    )
    .map(([key]) => key);
  const keys: ServerKey[] = [...attached, ...stopped];
  return keys.length === 0
    ? message(s, noServerMessage(s, b))
    : { state: s, effects: [{ kind: "lspRestart", keys }] };
}

/** The workspace symbol picker, when a server attached to the buffer searches symbols. */
function workspaceSymbols(c: CommandContext): Result {
  const b = activeBuffer(c.state);
  if (b === undefined || (c.state.lsp.attached[b.path] ?? []).length === 0)
    return message(c.state, noServerMessage(c.state, b));
  if (pickServer(c.state, b.path, "workspaceSymbols") === undefined)
    return message(c.state, "workspaceSymbols: not supported");
  return openPicker(
    {
      ...c,
      state: { ...c.state, lsp: { ...c.state.lsp, workspaceSymbols: [] } },
    },
    "lspWorkspaceSymbols",
  );
}

const code = (
  id: string,
  title: string,
  run: AppCommand["run"],
): AppCommand => ({ id, title, filetypes: LSP_FILE_TYPES, run });

export const lspCommands: readonly AppCommand[] = [
  code("lsp.hover", "Hover", (c) => atCursor(c, "hover")),
  code("lsp.definition", "Go to definition", (c) => atCursor(c, "definition")),
  code("lsp.declaration", "Go to declaration", (c) =>
    atCursor(c, "declaration"),
  ),
  code("lsp.typeDefinition", "Go to type definition", (c) =>
    atCursor(c, "typeDefinition"),
  ),
  code("lsp.workspaceSymbols", "Workspace symbols", workspaceSymbols),
  code("lsp.implementation", "Go to implementation", (c) =>
    atCursor(c, "implementation"),
  ),
  code("lsp.references", "References", (c) => atCursor(c, "references")),
  code("lsp.symbols", "Document symbols", (c) =>
    request(c.state, "symbols", { kind: "symbols" }),
  ),
  code("lsp.rename", "Rename symbol", rename),
  code("lsp.codeAction", "Code action", codeAction),
  code("lsp.signature", "Signature help", (c) => atCursor(c, "signature")),
  code("lsp.complete", "Complete", (c) =>
    request(
      c.state,
      "completion",
      { kind: "completion", pos: cursorOf(c.state) },
      { replace: true },
    ),
  ),
  code("lsp.format", "Format", formatCommand),
  code("diag.next", "Next diagnostic", (c) => diagnosticJump(c, 1)),
  code("diag.prev", "Previous diagnostic", (c) => diagnosticJump(c, -1)),
  code("diag.float", "Line diagnostics", diagnosticFloat),
  {
    id: "diag.list",
    title: "Diagnostics",
    run: (c) => openPicker(c, "diagnostics"),
  },
  {
    id: "lsp.info",
    title: "Language servers",
    run: (c) => openPicker(c, "lspInfo"),
  },
  code("lsp.restart", "Restart language servers", restartAttached),
];

/** Neovim 0.11's default language keys, plus `gd`, `<C-Space>`, and `<leader>xd`. */
const KEYS: readonly [Mode, string, string][] = [
  ["normal", "K", "lsp.hover"],
  ["normal", "gd", "lsp.definition"],
  ["normal", "gD", "lsp.declaration"],
  ["normal", "grt", "lsp.typeDefinition"],
  ["normal", "grr", "lsp.references"],
  ["normal", "gri", "lsp.implementation"],
  ["normal", "gO", "lsp.symbols"],
  ["normal", "grn", "lsp.rename"],
  ["normal", "gra", "lsp.codeAction"],
  ["visual", "gra", "lsp.codeAction"],
  ["normal", "]d", "diag.next"],
  ["normal", "[d", "diag.prev"],
  ["normal", "<C-w>d", "diag.float"],
  ["insert", "<C-s>", "lsp.signature"],
  ["insert", "<C-Space>", "lsp.complete"],
  ["normal", "<leader>xd", "diag.list"],
  ["normal", "<leader>xs", "lsp.workspaceSymbols"],
];

/** The language keys for every code file type; notes, bases, and text get none. */
export const lspBindings: readonly Binding[] = LSP_FILE_TYPES.flatMap(
  (filetype) =>
    KEYS.map(([mode, seq, id]) => ({ scope: { mode, filetype }, seq, id })),
);

export const lspGroups = { "<leader>x": "code" } as const;
