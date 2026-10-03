import type { Mode } from "../commands/keymap";
import type { Register } from "../editor/registers";
import type { UndoBlock } from "../editor/undo";
import type { Pos } from "../text/pos";
import type { Key } from "./keys";
import {
  cursorDisplayCol,
  firstNonBlank,
  lastCol,
  type MotionCtx,
  type MotionResult,
  motions,
  nextCol,
  prevCol,
  wordUnderCursor,
} from "./motions";
import {
  applyEdit,
  type OpRange,
  operators,
  type Run,
  setCursor,
  setMode,
  updateVim,
  type VimSession,
} from "./operators";
import { type ParsedCommand, parseKeys } from "./parser";
import { textObjects } from "./text-objects";
import type { LastChange, VimEffect, VimEnv } from "./types";

/**
 * Feed one key to the engine. Returns the next state and the effects that
 * core/state applies (dirty flag, clipboard, ex commands, messages).
 */
export function handleKey(
  s: VimSession,
  key: Key,
  env: VimEnv,
): { s: VimSession; effects: VimEffect[] } {
  const run: Run = { s, effects: [], want: 0, before: s.cursor };
  dispatch(run, key, env);
  if (run.edited) run.effects.push({ kind: "changed" });
  if (run.block !== undefined) {
    const ins = run.s.vim.insert;
    if (ins !== undefined)
      updateVim(run, {
        insert: { ...ins, block: merge(ins.block, run.block) },
      });
    else run.s = { ...run.s, undo: run.s.undo.push(run.block) };
  }
  return { s: run.s, effects: run.effects };
}

function dispatch(run: Run, key: Key, env: VimEnv): void {
  const { mode, pending } = run.s.vim;
  if (mode === "insert") {
    insertKey(run, key, true);
    return;
  }
  if (mode === "cmdline") {
    cmdlineKey(run, key, env);
    return;
  }
  const parsed = parseKeys([...pending, key], mode);
  if (parsed.kind === "incomplete") {
    updateVim(run, { pending: [...pending, key] });
    return;
  }
  updateVim(run, { pending: [] });
  if (parsed.kind === "command") execute(run, parsed.command, env);
}

const merge = (a: UndoBlock, b: UndoBlock): UndoBlock => ({
  edits: [...a.edits, ...b.edits],
  inverses: [...a.inverses, ...b.inverses],
  cursorBefore: a.cursorBefore,
});

const isVisual = (mode: Mode) => mode === "visual" || mode === "visualLine";
const before = (a: Pos, b: Pos) =>
  a.line < b.line || (a.line === b.line && a.col < b.col);
const indentOf = (s: string) => s.match(/^[ \t]*/)?.[0] ?? "";
const lineOf = (run: Run, line = run.s.cursor.line) => run.s.text.line(line);

function execute(run: Run, cmd: ParsedCommand, env: VimEnv): void {
  const { vim, cursor } = run.s;
  run.want = vim.wantCol ?? cursorDisplayCol(lineOf(run), cursor.col);
  updateVim(run, { wantCol: undefined });
  if (isVisual(vim.mode)) visualCommand(run, cmd, env);
  else normalCommand(run, cmd, env);
  if (run.s.vim.mode === "normal") {
    const line = Math.min(run.s.cursor.line, run.s.text.lineCount - 1);
    setCursor(run, {
      line,
      col: Math.min(run.s.cursor.col, lastCol(lineOf(run, line))),
    });
  }
}

// --- Normal mode -------------------------------------------------------------

/** Commands that are an operator with a fixed motion. */
const ALIASES: Record<string, [string, string]> = {
  x: ["d", "l"],
  X: ["d", "h"],
  Y: ["y", "$"],
};
const NOT_CHANGES = new Set(["u", "<C-r>", "."]);

function normalCommand(run: Run, cmd: ParsedCommand, env: VimEnv): void {
  const t = cmd.target ?? "";
  const count = cmd.count ?? 1;
  const alias = ALIASES[t];
  const change: LastChange = { keys: cmd.keys };
  if (cmd.count !== undefined) change.count = cmd.count;
  if (alias !== undefined)
    operate(run, { ...cmd, op: alias[0], target: alias[1] }, env, change);
  else if (cmd.op !== undefined) operate(run, cmd, env, change);
  else
    switch (t) {
      case "p":
      case "P":
        putRegister(run, cmd, t === "P");
        break;
      case "J":
        join(run, run.s.cursor.line, Math.max(2, count), false);
        break;
      case "~":
        toggleCase(run, count);
        break;
      case "r":
        replaceChars(run, cmd.char ?? "", count);
        break;
      case "i":
      case "a":
      case "I":
      case "A":
      case "o":
      case "O":
        startInsert(run, t, count, change);
        break;
      case "u":
      case "<C-r>":
        undoRedo(run, t === "<C-r>", count);
        break;
      case ".":
        repeat(run, cmd, env);
        break;
      case "v":
      case "V":
        updateVim(run, { visualAnchor: run.s.cursor });
        setMode(run, t === "v" ? "visual" : "visualLine");
        break;
      case ":":
      case "/":
      case "?":
        updateVim(run, { cmdline: t });
        setMode(run, "cmdline");
        break;
      case "<Esc>":
        break;
      default:
        moveCursor(run, cmd, env);
    }
  if (
    run.edited &&
    run.s.vim.mode === "normal" &&
    !NOT_CHANGES.has(t) &&
    cmd.op !== "y"
  )
    updateVim(run, { lastChange: change });
}

function moveCursor(run: Run, cmd: ParsedCommand, env: VimEnv): void {
  const res = runMotion(run, cmd.target ?? "", cmd, env);
  if (res === null) return;
  setCursor(run, res.to);
  if (res.want !== undefined) updateVim(run, { wantCol: res.want });
}

function runMotion(
  run: Run,
  key: string,
  cmd: ParsedCommand,
  env: VimEnv,
  operator?: string,
): MotionResult | null {
  const { vim, text } = run.s;
  let at = run.s.cursor;
  let search = vim.search;
  if (key === "*" || key === "#") {
    const word = wordUnderCursor(text, at);
    if (word === null) return null;
    search = { pattern: `\\<${word.word}\\>`, dir: key === "*" ? 1 : -1 };
    updateVim(run, { search });
    run.effects.push({ kind: "search", ...search });
    at = { line: at.line, col: word.col };
  }
  const ctx: MotionCtx = {
    hasCount: cmd.count !== undefined,
    want: run.want,
    env,
  };
  if (operator !== undefined) ctx.operator = operator;
  if (cmd.char !== undefined) ctx.char = cmd.char;
  if (vim.lastFind !== undefined) ctx.lastFind = vim.lastFind;
  if (search !== undefined) ctx.search = search;
  if (
    (key === "f" || key === "F" || key === "t" || key === "T") &&
    cmd.char !== undefined
  )
    updateVim(run, { lastFind: { key, char: cmd.char } });
  return motions[key]?.(text, at, cmd.count ?? 1, ctx) ?? null;
}

/** Deletes with these motions also go to register "1 (Vi compatible). */
const NUMBERED_MOTIONS = new Set(["{", "}", "n", "N", "*", "#"]);

function operate(
  run: Run,
  cmd: ParsedCommand,
  env: VimEnv,
  change: LastChange,
): void {
  const op = cmd.op ?? "";
  const t = cmd.target ?? "";
  const { text, cursor } = run.s;
  const count = cmd.count ?? 1;
  let range: OpRange;
  if (t === op) {
    if (count > 1 && cursor.line === text.lineCount - 1) return;
    const end = {
      line: Math.min(cursor.line + count - 1, text.lineCount - 1),
      col: 0,
    };
    range = { start: cursor, end, linewise: true };
  } else if (textObjects[t] !== undefined) {
    const obj = textObjects[t](text, cursor, count);
    if (obj === null) return;
    range = obj.linewise
      ? { start: obj.start, end: obj.end, linewise: true }
      : exclusiveRange(run, obj.start, obj.end);
  } else {
    const res = runMotion(run, t, cmd, env, op);
    if (res === null) return;
    range = motionRange(run, cursor, res);
    if (NUMBERED_MOTIONS.has(t)) range.numbered = true;
  }
  // Like Vim, undo returns the cursor to where the operated text starts.
  run.before = range.start;
  operators[op]?.(run, range, cmd.register);
  if (run.s.vim.mode === "insert") beginInsert(run, change, 1, false);
}

function motionRange(run: Run, from: Pos, res: MotionResult): OpRange {
  const [start, end] = before(res.to, from) ? [res.to, from] : [from, res.to];
  if (res.linewise) return { start, end, linewise: true };
  if (!res.inclusive) return exclusiveRange(run, start, end);
  const s = lineOf(run, end.line);
  return {
    start,
    end: { line: end.line, col: Math.min(nextCol(s, end.col), s.length) },
    linewise: false,
  };
}

/**
 * An exclusive range ending in column 0 of a later line ends on the previous
 * line instead, and becomes linewise when it starts in the indent.
 */
function exclusiveRange(run: Run, start: Pos, end: Pos): OpRange {
  if (end.col > 0 || end.line === start.line)
    return { start, end, linewise: false };
  const prev = end.line - 1;
  if (/^[ \t]*$/.test(lineOf(run, start.line).slice(0, start.col)))
    return { start, end: { line: prev, col: 0 }, linewise: true };
  return {
    start,
    end: { line: prev, col: lineOf(run, prev).length },
    linewise: false,
  };
}

function putRegister(run: Run, cmd: ParsedCommand, putBefore: boolean): void {
  const name = cmd.register ?? '"';
  if (name === "+") {
    run.effects.push({ kind: "paste", register: name, before: putBefore });
    return;
  }
  const value = run.s.registers.get(name);
  if (value !== undefined) put(run, value, cmd.count ?? 1, putBefore);
}

function put(
  run: Run,
  value: Register,
  count: number,
  putBefore: boolean,
): void {
  const { text: buf, cursor } = run.s;
  const text = value.text.repeat(count);
  if (value.linewise) {
    const line = putBefore ? cursor.line : cursor.line + 1;
    if (line < buf.lineCount)
      applyEdit(run, {
        range: { start: { line, col: 0 }, end: { line, col: 0 } },
        text,
      });
    else {
      const end = { line: line - 1, col: buf.line(line - 1).length };
      applyEdit(run, {
        range: { start: end, end },
        text: `\n${text.slice(0, -1)}`,
      });
    }
    setCursor(run, { line, col: firstNonBlank(lineOf(run, line)) });
    return;
  }
  const s = buf.line(cursor.line);
  const col =
    putBefore || s.length === 0
      ? cursor.col
      : Math.min(nextCol(s, cursor.col), s.length);
  const at = { line: cursor.line, col };
  applyEdit(run, { range: { start: at, end: at }, text });
  setCursor(
    run,
    text.includes("\n")
      ? at
      : { line: at.line, col: prevCol(lineOf(run), col + text.length) },
  );
}

/** Join `n` lines from `first`; one space between them unless the next starts with ")". */
function join(run: Run, first: number, n: number, visual: boolean): void {
  const last = run.s.text.lineCount - 1;
  if (first + n - 1 > last) {
    if (n <= 2 && !visual) return;
    n = last - first + 1;
    if (n < 2) return;
  }
  let col = 0;
  for (let i = 1; i < n; i++) {
    const cur = lineOf(run, first);
    const next = lineOf(run, first + 1);
    const lead = indentOf(next).length;
    const rest = next.slice(lead);
    const end = cur.at(-1);
    const space =
      rest !== "" &&
      !rest.startsWith(")") &&
      cur !== "" &&
      end !== " " &&
      end !== "\t"
        ? " "
        : "";
    applyEdit(run, {
      range: {
        start: { line: first, col: cur.length },
        end: { line: first + 1, col: lead },
      },
      text: space,
    });
    col = cur.length;
  }
  setCursor(run, { line: first, col });
}

const toggle = (s: string) =>
  [...s]
    .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
    .join("");

function toggleCase(run: Run, count: number): void {
  const { line, col } = run.s.cursor;
  const s = lineOf(run);
  if (s === "") return;
  let end = col;
  for (let n = 0; n < count && end < s.length; n++) end = nextCol(s, end);
  const range = { start: { line, col }, end: { line, col: end } };
  applyEdit(run, { range, text: toggle(s.slice(col, end)) });
  setCursor(run, { line, col: end });
}

function replaceChars(run: Run, char: string, count: number): void {
  const { line, col } = run.s.cursor;
  const s = lineOf(run);
  let end = col;
  for (let n = 0; n < count; n++) {
    if (end >= s.length) return;
    end = nextCol(s, end);
  }
  applyEdit(run, {
    range: { start: { line, col }, end: { line, col: end } },
    text: char.repeat(count),
  });
  setCursor(run, { line, col: col + (count - 1) * char.length });
}

function undoRedo(run: Run, redo: boolean, count: number): void {
  for (let n = 0; n < count; n++) {
    const step = redo ? run.s.undo.redo() : run.s.undo.undo();
    if (step === undefined) return;
    let text = run.s.text;
    let top = Number.POSITIVE_INFINITY;
    let bottom = 0;
    for (const edit of step.edits) {
      text = text.apply(edit).buffer;
      top = Math.min(top, edit.range.start.line);
      bottom = Math.max(
        bottom,
        edit.range.start.line + edit.text.split("\n").length - 1,
      );
    }
    run.s = { ...run.s, text, undo: step.history };
    run.edited = true;
    // Like Vim: undo returns to the cursor before the change when it lies in
    // the changed lines; otherwise the cursor goes to the first changed line.
    const b = step.block.cursorBefore;
    const near = !redo && b.line >= top - 1 && b.line <= bottom;
    const line = Math.min(near ? b.line : top, text.lineCount - 1);
    const col = line === b.line ? b.col : firstNonBlank(text.line(line));
    setCursor(run, { line, col });
  }
}

function repeat(run: Run, cmd: ParsedCommand, env: VimEnv): void {
  const last = run.s.vim.lastChange;
  if (last === undefined) return;
  const count =
    last.visual === undefined ? (cmd.count ?? last.count) : undefined;
  if (last.visual !== undefined) {
    const v = last.visual;
    const cursor = run.s.cursor;
    const line = Math.min(cursor.line + v.lines - 1, run.s.text.lineCount - 1);
    const want = v.lines === 1 ? cursor.col + v.endCol : v.endCol;
    updateVim(run, {
      mode: v.linewise ? "visualLine" : "visual",
      visualAnchor: cursor,
    });
    setCursor(run, { line, col: Math.min(want, lastCol(lineOf(run, line))) });
  }
  const keys = [
    ...(count === undefined ? [] : String(count).split("")),
    ...last.keys,
  ];
  const mode = run.s.vim.mode;
  const outer = run.effects;
  run.effects = [];
  for (const k of keys) dispatch(run, k, env);
  outer.push(...run.effects.filter((e) => e.kind !== "modeChanged"));
  run.effects = outer;
  if (run.s.vim.mode !== mode)
    run.effects.push({ kind: "modeChanged", mode: run.s.vim.mode });
}

// --- Insert mode -------------------------------------------------------------

function startInsert(
  run: Run,
  key: string,
  count: number,
  change: LastChange,
): void {
  const { line, col } = run.s.cursor;
  const s = lineOf(run);
  if (key === "a" && s !== "") setCursor(run, { line, col: nextCol(s, col) });
  else if (key === "A") setCursor(run, { line, col: s.length });
  else if (key === "I") setCursor(run, { line, col: indentOf(s).length });
  else if (key === "o" || key === "O") openLine(run, key === "o");
  setMode(run, "insert");
  beginInsert(run, change, count, key === "o" || key === "O");
}

/** Open a line below or above the cursor with the current line's indent. */
function openLine(run: Run, below: boolean): void {
  const { line } = run.s.cursor;
  const s = lineOf(run);
  const indent = indentOf(s);
  const at = below ? { line, col: s.length } : { line, col: 0 };
  applyEdit(run, {
    range: { start: at, end: at },
    text: below ? `\n${indent}` : `${indent}\n`,
  });
  const target = below ? line + 1 : line;
  setCursor(run, { line: target, col: indent.length });
  if (indent === "") delete run.aiLine;
  else run.aiLine = target;
}

function beginInsert(
  run: Run,
  change: LastChange,
  repeat: number,
  repeatOpens: boolean,
): void {
  // With no edit yet ("i", "a", "A", "I"), undo returns to the insertion
  // point, where Neovim saves the cursor on the session's first change.
  const block = run.block ?? {
    edits: [],
    inverses: [],
    cursorBefore: run.s.cursor,
  };
  delete run.block;
  updateVim(run, {
    insert: {
      change,
      typed: [],
      repeat,
      repeatOpens,
      block,
      autoIndentLine: run.aiLine,
    },
  });
}

function insertKey(run: Run, key: Key, record: boolean): void {
  const ins = run.s.vim.insert ?? {
    change: { keys: ["i"] },
    typed: [],
    repeat: 1,
    repeatOpens: false,
    block: { edits: [], inverses: [], cursorBefore: run.s.cursor },
  };
  if (key === "<Esc>") {
    endInsert(run);
    return;
  }
  const { line, col } = run.s.cursor;
  const s = lineOf(run);
  let ai = ins.autoIndentLine;
  if (key === "<BS>") {
    if (col > 0) {
      const start = { line, col: prevCol(s, col) };
      applyEdit(run, { range: { start, end: { line, col } }, text: "" });
      setCursor(run, start);
    } else if (line > 0) {
      const start = { line: line - 1, col: lineOf(run, line - 1).length };
      applyEdit(run, { range: { start, end: { line, col: 0 } }, text: "" });
      setCursor(run, start);
    }
  } else if (key === "<CR>") {
    // Auto-indent: the new line takes this line's indent; moved text loses its leading blanks.
    const indent = indentOf(s);
    const rest = s.slice(col);
    const blanks = indentOf(rest).length;
    applyEdit(run, {
      range: { start: { line, col }, end: { line, col: col + blanks } },
      text: `\n${indent}`,
    });
    setCursor(run, { line: line + 1, col: indent.length });
    ai = indent !== "" && rest.length === blanks ? line + 1 : undefined;
  } else {
    const char =
      key === "<Tab>" ? "\t" : [...key].length === 1 ? key : undefined;
    if (char === undefined) return;
    const at = { line, col };
    applyEdit(run, { range: { start: at, end: at }, text: char });
    setCursor(run, { line, col: col + char.length });
    if (ai === line) ai = undefined;
  }
  updateVim(run, {
    insert: {
      ...ins,
      typed: record ? [...ins.typed, key] : ins.typed,
      autoIndentLine: ai,
    },
  });
}

function endInsert(run: Run): void {
  const ins = run.s.vim.insert;
  if (ins === undefined) {
    setMode(run, "normal");
    return;
  }
  for (let n = 1; n < ins.repeat; n++) {
    if (ins.repeatOpens) {
      openLine(run, true);
      const cur = run.s.vim.insert;
      if (cur !== undefined)
        updateVim(run, { insert: { ...cur, autoIndentLine: run.aiLine } });
    }
    for (const k of ins.typed) insertKey(run, k, false);
  }
  const session = run.s.vim.insert ?? ins;
  const { line } = run.s.cursor;
  const s = lineOf(run);
  if (session.autoIndentLine === line && /^[ \t]+$/.test(s)) {
    applyEdit(run, {
      range: { start: { line, col: 0 }, end: { line, col: s.length } },
      text: "",
    });
    setCursor(run, { line, col: 0 });
  }
  const block =
    run.block === undefined ? session.block : merge(session.block, run.block);
  delete run.block;
  if (block.edits.length > 0)
    run.s = { ...run.s, undo: run.s.undo.push(block) };
  const lastChange = {
    ...ins.change,
    keys: [...ins.change.keys, ...ins.typed, "<Esc>"],
  };
  updateVim(run, { insert: undefined, lastChange, wantCol: undefined });
  setMode(run, "normal");
  const cur = run.s.cursor;
  setCursor(run, {
    line: cur.line,
    col: cur.col > 0 ? prevCol(lineOf(run), cur.col) : 0,
  });
}

// --- Command line ------------------------------------------------------------

function cmdlineKey(run: Run, key: Key, env: VimEnv): void {
  const line = run.s.vim.cmdline;
  if (key === "<Esc>" || (key === "<BS>" && line.length <= 1)) {
    updateVim(run, { cmdline: "" });
    setMode(run, "normal");
    return;
  }
  if (key === "<BS>") {
    updateVim(run, { cmdline: line.slice(0, -1) });
    return;
  }
  if (key !== "<CR>") {
    const char =
      key === "<Tab>" ? "\t" : [...key].length === 1 ? key : undefined;
    if (char !== undefined) updateVim(run, { cmdline: line + char });
    return;
  }
  updateVim(run, { cmdline: "" });
  setMode(run, "normal");
  const body = line.slice(1);
  if (line.startsWith(":")) {
    run.effects.push({ kind: "ex", line: body });
    return;
  }
  const pattern = body === "" ? run.s.vim.search?.pattern : body;
  if (pattern === undefined) return;
  const search = { pattern, dir: line.startsWith("?") ? -1 : 1 } as const;
  updateVim(run, { search });
  run.effects.push({ kind: "search", ...search });
  const cursor = run.s.cursor;
  run.want = cursorDisplayCol(lineOf(run), cursor.col);
  const res = runMotion(run, "n", { keys: [] }, env);
  if (res !== null) setCursor(run, res.to);
}

// --- Visual mode -------------------------------------------------------------

const VISUAL_CHANGES = new Set(["x", "p", "P", "J", "~", "r"]);

function visualCommand(run: Run, cmd: ParsedCommand, env: VimEnv): void {
  const t = cmd.target ?? "";
  const { vim, cursor, text } = run.s;
  if (cmd.op !== undefined || VISUAL_CHANGES.has(t)) {
    visualChange(run, cmd);
    return;
  }
  if (t === "<Esc>") {
    exitVisual(run);
    return;
  }
  if (t === "v" || t === "V") {
    const mode = t === "v" ? "visual" : "visualLine";
    vim.mode === mode ? exitVisual(run) : setMode(run, mode);
    return;
  }
  if (t === "o") {
    updateVim(run, { visualAnchor: cursor });
    setCursor(run, vim.visualAnchor ?? cursor);
    return;
  }
  const obj = textObjects[t]?.(text, cursor, cmd.count ?? 1);
  if (obj === undefined) {
    moveCursor(run, cmd, env);
    return;
  }
  if (obj === null) return;
  const { end } = obj;
  const last =
    end.col > 0
      ? { line: end.line, col: prevCol(text.line(end.line), end.col) }
      : end.line > obj.start.line
        ? { line: end.line - 1, col: lastCol(text.line(end.line - 1)) }
        : end;
  updateVim(run, { visualAnchor: obj.start });
  setCursor(run, last);
  if (obj.linewise) setMode(run, "visualLine");
}

function exitVisual(run: Run): void {
  updateVim(run, { visualAnchor: undefined });
  setMode(run, "normal");
}

function visualRange(run: Run): OpRange {
  const { vim, cursor, text } = run.s;
  const anchor = vim.visualAnchor ?? cursor;
  const [start, end] = before(cursor, anchor)
    ? [cursor, anchor]
    : [anchor, cursor];
  if (vim.mode === "visualLine")
    return {
      start: { line: start.line, col: 0 },
      end: { line: end.line, col: 0 },
      linewise: true,
      visual: true,
    };
  const s = text.line(end.line);
  let e = { line: end.line, col: Math.min(nextCol(s, end.col), s.length) };
  if (
    (run.want === Number.POSITIVE_INFINITY || s === "") &&
    end.line < text.lineCount - 1
  )
    e = { line: end.line + 1, col: 0 };
  return { start, end: e, linewise: false, visual: true };
}

function visualChange(run: Run, cmd: ParsedCommand): void {
  const t = cmd.target ?? "";
  const range = visualRange(run);
  const { vim, cursor } = run.s;
  const anchor = vim.visualAnchor ?? cursor;
  const [first, last] = before(cursor, anchor)
    ? [cursor, anchor]
    : [anchor, cursor];
  const lines = last.line - first.line + 1;
  const visual = {
    linewise: range.linewise,
    lines,
    endCol: lines === 1 ? last.col - first.col : last.col,
  };
  const change: LastChange = { keys: cmd.keys, visual };
  exitVisual(run);
  run.before = first;
  const op = cmd.op ?? (t === "x" ? "d" : undefined);
  if (op !== undefined) operators[op]?.(run, range, cmd.register);
  else if (t === "J") join(run, range.start.line, Math.max(2, lines), true);
  else if (t === "p" || t === "P") {
    const name = cmd.register ?? '"';
    if (name === "+")
      run.effects.push({ kind: "paste", register: name, before: true });
    const value = run.s.registers.get(name);
    if (name === "+" || value === undefined) return;
    // Text deleted from the end of a line (or the buffer) is replaced by putting after it.
    const atEnd = range.linewise
      ? range.end.line === run.s.text.lineCount - 1
      : range.end.col >= lineOf(run, range.end.line).length;
    operators.d?.(run, range);
    put(run, value, 1, !atEnd);
  } else {
    const r = range.linewise
      ? {
          start: range.start,
          end: {
            line: range.end.line,
            col: lineOf(run, range.end.line).length,
          },
        }
      : range;
    const old = run.s.text.slice(r);
    const char = cmd.char ?? "";
    applyEdit(run, {
      range: r,
      text: t === "~" ? toggle(old) : old.replace(/[^\n]/g, char),
    });
    setCursor(run, range.start);
  }
  if (run.s.vim.mode === "insert") beginInsert(run, change, 1, false);
  else if (run.edited && op !== "y") updateVim(run, { lastChange: change });
}
