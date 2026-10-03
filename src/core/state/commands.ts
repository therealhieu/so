import type { Command, CommandRegistry } from "../kernel/commands/registry";
import { focusDirection, splitWindow } from "../kernel/editor/windows";
import type { Edit } from "../kernel/text/pos";
import { parseEx } from "../kernel/vim/ex";
import { firstNonBlank } from "../kernel/vim/motions";
import { searchPattern } from "../kernel/vim/search";
import {
  activeBuffer,
  activeWindow,
  openPath,
  setBuffer,
  setWindow,
  showBuffer,
} from "./buffers";
import { reloadConfig } from "./config";
import {
  collapse,
  expandOrOpen,
  moveCursor,
  openSelected,
  startOp,
  toggleExplorer,
} from "./explorer";
import { chain, message, none } from "./result";
import {
  autosaveNow,
  closeBuffer,
  requestQuit,
  scheduleAutosave,
  writeBuffer,
} from "./save";
import type { AppState, Result } from "./types";
import type { Registries } from "./update";

/** What a built-in command reads; commands are pure. */
export type CommandContext = {
  state: AppState;
  now: number;
  args?: string;
  reg: Registries;
};
export type CommandResult = Result;
type AppCommand = Command<CommandContext, CommandResult>;

/** Ex command names (with `!` where it matters) → command ids. */
export const EX_ALIASES: Readonly<Record<string, string>> = {
  w: "file.save",
  write: "file.save",
  q: "app.quit",
  quit: "app.quit",
  wq: "app.quit",
  "q!": "app.quitForce",
  "quit!": "app.quitForce",
  e: "file.edit",
  edit: "file.edit",
  sp: "window.split",
  split: "window.split",
  vs: "window.vsplit",
  vsplit: "window.vsplit",
  bn: "buffer.next",
  bnext: "buffer.next",
  bp: "buffer.prev",
  bprevious: "buffer.prev",
  bd: "buffer.delete",
  bdelete: "buffer.delete",
  "bd!": "buffer.deleteForce",
  "bdelete!": "buffer.deleteForce",
  ConfigReload: "config.reload",
};

/** Run a registered command; a command limited to other file types is a no-op notice. */
export function runCommand(
  s: AppState,
  id: string,
  now: number,
  reg: Registries,
  args?: string,
): Result {
  const cmd = reg.commands.get(id);
  if (cmd === undefined) return message(s, `unknown command: ${id}`, "error");
  const ft = activeBuffer(s)?.fileType;
  if (
    cmd.filetypes !== undefined &&
    ft !== undefined &&
    !cmd.filetypes.includes(ft)
  )
    return message(s, `not available for ${ft} files`);
  return cmd.run(
    args === undefined ? { state: s, now, reg } : { state: s, now, args, reg },
  );
}

/**
 * Execute a command line (without ":"): a registered command id with an
 * optional argument, `:s`/`:%s`, or an alias of a command id.
 */
export function executeEx(
  s: AppState,
  line: string,
  now: number,
  reg: Registries,
): Result {
  const typed = line.trim();
  if (typed === "") return none(s);
  const word = typed.split(/\s+/, 1)[0] ?? "";
  if (reg.commands.get(word) !== undefined)
    return runCommand(
      s,
      word,
      now,
      reg,
      typed.slice(word.length).trim() || undefined,
    );
  const ex = parseEx(typed);
  if (ex !== undefined && "pattern" in ex) return substitute(s, ex, now, reg);
  const id = ex && EX_ALIASES[ex.cmd + (ex.bang ? "!" : "")];
  if (ex === undefined || id === undefined)
    return message(s, `E492: Not an editor command: ${typed}`, "error");
  return runCommand(s, id, now, reg, ex.arg);
}

/** Vim replacement text → JavaScript: `&` and `\0`–`\9` refer to the match. */
const replacement = (rep: string) =>
  rep.replace(/\\(.)|(\$)|&/g, (_m, esc: string | undefined, dollar) => {
    if (dollar !== undefined) return "$$";
    if (esc === undefined) return "$&";
    if (esc === "0") return "$&";
    return /[1-9]/.test(esc) ? `$${esc}` : esc;
  });

/** `:s/pat/rep/[g]` on the cursor line, `:%s` on every line; one undo step. */
function substitute(
  s: AppState,
  ex: {
    range: "line" | "all";
    pattern: string;
    replacement: string;
    global: boolean;
  },
  now: number,
  reg: Registries,
): Result {
  const w = activeWindow(s);
  const b = activeBuffer(s);
  const re = searchPattern(ex.pattern);
  if (w === undefined || b === undefined) return none(s);
  const notFound = message(
    s,
    `E486: Pattern not found: ${ex.pattern}`,
    "error",
  );
  if (re === undefined) return notFound;
  const once = new RegExp(re.source, re.flags.replace("g", ""));
  const rep = replacement(ex.replacement);
  const [first, last] =
    ex.range === "all"
      ? [0, b.text.lineCount - 1]
      : [w.content.cursor.line, w.content.cursor.line];
  let text = b.text;
  const edits: Edit[] = [];
  const inverses: Edit[] = [];
  let lastLine = -1;
  for (let line = first; line <= last; line++) {
    const old = text.line(line);
    const next = old.replace(ex.global ? re : once, rep);
    if (next === old) continue;
    const edit = {
      range: { start: { line, col: 0 }, end: { line, col: old.length } },
      text: next,
    };
    const applied = text.apply(edit);
    text = applied.buffer;
    edits.push(edit);
    inverses.push(applied.inverse);
    lastLine = line;
  }
  if (lastLine < 0) return notFound;
  const cursor = { line: lastLine, col: firstNonBlank(text.line(lastLine)) };
  const edited = setWindow(
    setBuffer(
      s,
      b.id,
      {
        text,
        undo: b.undo.push({ edits, inverses, cursorBefore: w.content.cursor }),
        dirty: text.version !== b.savedVersion,
      },
      reg,
    ),
    { ...w, content: { ...w.content, cursor } },
  );
  const searched: AppState = {
    ...edited,
    vim: { ...edited.vim, search: { pattern: ex.pattern, dir: 1 } },
  };
  return scheduleAutosave(searched, b.id, now);
}

/** `:e` paths are relative to the workspace root; absolute paths must be inside it. */
function workspacePath(root: string, arg: string): string | undefined {
  const rel = arg.startsWith(`${root}/`)
    ? arg.slice(root.length + 1)
    : arg.startsWith("/")
      ? undefined
      : arg;
  if (rel === undefined) return undefined;
  const parts: string[] = [];
  for (const part of rel.split("/")) {
    if (part === "" || part === ".") continue;
    if (part !== "..") parts.push(part);
    else if (parts.pop() === undefined) return undefined;
  }
  return parts.length === 0 ? undefined : parts.join("/");
}

function editFile(ctx: CommandContext): Result {
  const s = ctx.state;
  const arg = ctx.args?.trim() ?? "";
  if (arg === "") return message(s, "E32: No file name", "error");
  const path = workspacePath(s.workspace.root, arg);
  if (path === undefined)
    return message(s, `outside the workspace: ${arg}`, "error");
  return openPath(s, path, ctx.now);
}

function writeActive(ctx: CommandContext): Result {
  const b = activeBuffer(ctx.state);
  if (b === undefined) return message(ctx.state, "E32: No file name", "error");
  return writeBuffer(ctx.state, b.id, ctx.now, {
    recreate: b.disk === "deleted",
  });
}

function closeActive(ctx: CommandContext, force: boolean): Result {
  const b = activeBuffer(ctx.state);
  return b === undefined
    ? none(ctx.state)
    : closeBuffer(ctx.state, b.id, { force }, ctx.now);
}

/** `:bn` / `:bp`: show the next or previous open buffer, saving the one left. */
function cycleBuffer(ctx: CommandContext, delta: 1 | -1): Result {
  const s = ctx.state;
  const ids = Object.values(s.buffers)
    .map((b) => b.id)
    .sort((a, b) => a - b);
  const current = activeBuffer(s);
  if (current === undefined || ids.length < 2) return none(s);
  const at = ids.indexOf(current.id);
  const next = ids[(at + delta + ids.length) % ids.length];
  if (next === undefined) return none(s);
  return chain(autosaveNow(s, current.id, ctx.now), (st) =>
    none(showBuffer(st, next)),
  );
}

/** `:sp` / `:vs`: the new window shows the same buffer and takes focus. */
function split(s: AppState, dir: "row" | "column"): Result {
  const id = s.windows.nextWindowId;
  const w = activeWindow(s);
  const windows = {
    ...s.windows,
    tree: splitWindow(s.windows.tree, s.windows.active, dir, id),
    active: id,
    nextWindowId: id + 1,
  };
  const next: AppState = { ...s, windows };
  return none(w === undefined ? next : setWindow(next, { ...w, id }));
}

function focus(s: AppState, dir: "h" | "j" | "k" | "l"): Result {
  const target = focusDirection(s.windows.tree, s.windows.active, dir);
  return none(
    target === undefined
      ? s
      : { ...s, windows: { ...s.windows, active: target } },
  );
}

const builtins: AppCommand[] = [
  { id: "file.save", title: "Save file", run: writeActive },
  { id: "config.reload", title: "Reload config", run: reloadConfig },
  {
    id: "app.quit",
    title: "Quit",
    run: (c) => requestQuit(c.state, { force: false }, c.now),
  },
  {
    id: "app.quitForce",
    title: "Quit without saving",
    run: (c) => requestQuit(c.state, { force: true }, c.now),
  },
  {
    id: "buffer.delete",
    title: "Close buffer",
    run: (c) => closeActive(c, false),
  },
  {
    id: "buffer.deleteForce",
    title: "Close buffer without saving",
    run: (c) => closeActive(c, true),
  },
  { id: "buffer.next", title: "Next buffer", run: (c) => cycleBuffer(c, 1) },
  {
    id: "buffer.prev",
    title: "Previous buffer",
    run: (c) => cycleBuffer(c, -1),
  },
  { id: "file.edit", title: "Open file", run: editFile },
  {
    id: "window.split",
    title: "Split window",
    run: (c) => split(c.state, "column"),
  },
  {
    id: "window.vsplit",
    title: "Split window vertically",
    run: (c) => split(c.state, "row"),
  },
  ...(["h", "j", "k", "l"] as const).map(
    (d): AppCommand => ({
      id: `window.focus${d}`,
      title: `Focus window ${d}`,
      run: (c) => focus(c.state, d),
    }),
  ),
  {
    id: "explorer.toggle",
    title: "Toggle explorer",
    run: (c) => toggleExplorer(c.state),
  },
  {
    id: "explorer.down",
    title: "Next entry",
    run: (c) => moveCursor(c.state, 1),
  },
  {
    id: "explorer.up",
    title: "Previous entry",
    run: (c) => moveCursor(c.state, -1),
  },
  {
    id: "explorer.open",
    title: "Open entry",
    run: (c) => openSelected(c.state, c.now),
  },
  {
    id: "explorer.expand",
    title: "Expand folder",
    run: (c) => expandOrOpen(c.state, c.now),
  },
  {
    id: "explorer.collapse",
    title: "Collapse folder",
    run: (c) => collapse(c.state),
  },
  {
    id: "explorer.create",
    title: "New file or folder",
    run: (c) => startOp(c.state, "create"),
  },
  {
    id: "explorer.rename",
    title: "Rename",
    run: (c) => startOp(c.state, "rename"),
  },
  { id: "explorer.move", title: "Move", run: (c) => startOp(c.state, "move") },
  {
    id: "explorer.delete",
    title: "Delete",
    run: (c) => startOp(c.state, "delete"),
  },
];

export function registerBuiltins(
  commands: CommandRegistry<CommandContext, CommandResult>,
): void {
  for (const cmd of builtins) commands.register(cmd);
}
