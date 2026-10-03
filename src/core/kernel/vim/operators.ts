import type { Mode } from "../commands/keymap";
import type { Register, RegisterName } from "../editor/registers";
import type { Edit, Pos } from "../text/pos";
import type { TextBuffer } from "../text/text-buffer";
import { colForDisplay } from "./motions";
import type { BufferVim, VimEffect, VimState } from "./types";

export type VimSession = BufferVim & { vim: VimState };

/** Working state of one handleKey call; reducers below replace `s` immutably. */
export type Run = {
  s: VimSession;
  effects: VimEffect[];
  /** Display column the command started from (Vim's curswant). */
  want: number;
  /** Tab width in cells: tab stops and the shift width. */
  tab: number;
  /** Cursor before the running command; the undo block restores it. */
  before: Pos;
  block?: { edits: Edit[]; inverses: Edit[]; cursorBefore: Pos };
  /** Some edit was applied during this call. */
  edited?: boolean;
  /** Line that holds only auto-indent after the command. */
  aiLine?: number;
};

/**
 * Text an operator works on. Charwise: `start` to `end` (exclusive).
 * Linewise: lines `start.line`–`end.line`; `start.col` is where yank leaves the cursor.
 */
export type OpRange = {
  start: Pos;
  end: Pos;
  linewise: boolean;
  /** Small deletes also shift "1–"9 (%, {, }, n, N, *, #). */
  numbered?: boolean;
  visual?: boolean;
};

export type Operator = (run: Run, r: OpRange, register?: RegisterName) => void;

export function updateVim(
  run: Run,
  patch: { [K in keyof VimState]?: VimState[K] | undefined },
): void {
  const vim: Record<string, unknown> = { ...run.s.vim };
  for (const [k, v] of Object.entries(patch))
    if (v === undefined) delete vim[k];
    else vim[k] = v;
  run.s = { ...run.s, vim: vim as VimState };
}

export function setMode(run: Run, mode: Mode): void {
  if (run.s.vim.mode === mode) return;
  updateVim(run, { mode });
  run.effects.push({ kind: "modeChanged", mode });
}

export function setCursor(run: Run, cursor: Pos): void {
  run.s = { ...run.s, cursor };
}

/** Apply an edit and record it in the running undo block. */
export function applyEdit(run: Run, edit: Edit): void {
  const { buffer, inverse } = run.s.text.apply(edit);
  run.s = { ...run.s, text: buffer };
  run.edited = true;
  run.block ??= { edits: [], inverses: [], cursorBefore: run.before };
  run.block.edits.push(edit);
  run.block.inverses.push(inverse);
}

function writeRegister(
  run: Run,
  kind: "yank" | "delete",
  name: RegisterName | undefined,
  value: Register,
  numbered = false,
): void {
  const regs = run.s.registers;
  run.s = {
    ...run.s,
    registers:
      kind === "yank"
        ? regs.yank(name, value)
        : regs.delete(name, value, numbered),
  };
  run.effects.push({ kind: "yank", register: name ?? '"', ...value });
}

const linesText = (buf: TextBuffer, first: number, last: number) => {
  let text = "";
  for (let i = first; i <= last; i++) text += `${buf.line(i)}\n`;
  return text;
};

function deleteLines(run: Run, first: number, last: number) {
  const buf = run.s.text;
  const end = buf.lineCount - 1;
  const len = (l: number) => buf.line(l).length;
  if (last < end)
    applyEdit(run, {
      range: {
        start: { line: first, col: 0 },
        end: { line: last + 1, col: 0 },
      },
      text: "",
    });
  else if (first > 0)
    applyEdit(run, {
      range: {
        start: { line: first - 1, col: len(first - 1) },
        end: { line: last, col: len(last) },
      },
      text: "",
    });
  else
    applyEdit(run, {
      range: {
        start: { line: 0, col: 0 },
        end: { line: last, col: len(last) },
      },
      text: "",
    });
}

const atWant = (run: Run, line: number): Pos => ({
  line,
  col: colForDisplay(run.s.text.line(line), run.want, run.tab),
});

const indentOf = (s: string) => s.match(/^[ \t]*/)?.[0] ?? "";

function shift(dir: 1 | -1): Operator {
  return (run, r) => {
    for (let l = r.start.line; l <= r.end.line; l++) {
      const s = run.s.text.line(l);
      if (s === "") continue;
      const indent = indentOf(s);
      const t = run.tab;
      let width = 0;
      for (const c of indent)
        width = c === "\t" ? width + t - (width % t) : width + 1;
      const next = Math.max(0, width + dir * t);
      const text = "\t".repeat(Math.floor(next / t)) + " ".repeat(next % t);
      if (text !== indent)
        applyEdit(run, {
          range: {
            start: { line: l, col: 0 },
            end: { line: l, col: indent.length },
          },
          text,
        });
    }
    setCursor(run, atWant(run, r.start.line));
  };
}

const del: Operator = (run, r, register) => {
  const buf = run.s.text;
  let { linewise } = r;
  if (!linewise && !r.visual && r.end.line > r.start.line) {
    // Vim: a multi-line delete from the indent to trailing blanks deletes whole lines.
    const rest = buf.line(r.end.line).slice(r.end.col);
    if (
      /^[ \t]*$/.test(rest) &&
      /^[ \t]*$/.test(buf.line(r.start.line).slice(0, r.start.col))
    )
      linewise = true;
  }
  if (linewise) {
    writeRegister(run, "delete", register, {
      text: linesText(buf, r.start.line, r.end.line),
      linewise: true,
    });
    deleteLines(run, r.start.line, r.end.line);
    setCursor(
      run,
      atWant(run, Math.min(r.start.line, run.s.text.lineCount - 1)),
    );
    return;
  }
  const text = buf.slice(r);
  if (text === "") return;
  writeRegister(run, "delete", register, { text, linewise: false }, r.numbered);
  applyEdit(run, { range: r, text: "" });
  setCursor(run, r.start);
};

const change: Operator = (run, r, register) => {
  const buf = run.s.text;
  if (r.linewise) {
    const first = r.start.line;
    const indent = indentOf(buf.line(first));
    writeRegister(run, "delete", register, {
      text: linesText(buf, first, r.end.line),
      linewise: true,
    });
    applyEdit(run, {
      range: {
        start: { line: first, col: 0 },
        end: { line: r.end.line, col: buf.line(r.end.line).length },
      },
      text: indent,
    });
    setCursor(run, { line: first, col: indent.length });
    if (indent !== "") run.aiLine = first;
  } else {
    const text = buf.slice(r);
    if (text !== "") {
      writeRegister(
        run,
        "delete",
        register,
        { text, linewise: false },
        r.numbered,
      );
      applyEdit(run, { range: r, text: "" });
    }
    setCursor(run, r.start);
  }
  setMode(run, "insert");
};

const yank: Operator = (run, r, register) => {
  const buf = run.s.text;
  const text = r.linewise
    ? linesText(buf, r.start.line, r.end.line)
    : buf.slice(r);
  if (text === "") return;
  writeRegister(run, "yank", register, { text, linewise: r.linewise });
  setCursor(run, r.start);
};

/** Operators by key. */
export const operators: Record<string, Operator> = {
  d: del,
  c: change,
  y: yank,
  ">": shift(1),
  "<": shift(-1),
};
