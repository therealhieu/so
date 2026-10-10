import type { Mode } from "../commands/keymap";
import type { RegisterName, Registers } from "../editor/registers";
import type { UndoBlock, UndoHistory } from "../editor/undo";
import type { Pos } from "../text/pos";
import type { TextBuffer } from "../text/text-buffer";
import type { Key } from "./keys";

/**
 * The last search: pattern in Vim syntax and direction (`/` = 1, `?` = -1).
 * `hidden` after `:noh`: no highlights or count until the next `n` or `N`.
 */
export type SearchState = { pattern: string; dir: 1 | -1; hidden?: true };

/** What `.` repeats: the change's keys without the count, and its Visual size. */
export type LastChange = {
  keys: Key[];
  count?: number;
  visual?: { linewise: boolean; lines: number; endCol: number };
};

/** An Insert session in progress; it becomes one undo block on `<Esc>`. */
type InsertSession = {
  /** The command that entered Insert ("A", "cw", "3o"), for `.`. */
  change: LastChange;
  typed: Key[];
  /** "3ihi<Esc>" inserts the typed text 3 times. */
  repeat: number;
  /** "o" and "O" open a new line for every repeat. */
  repeatOpens: boolean;
  block: UndoBlock;
  /** Line that holds only auto-indent; the indent is removed on `<Esc>`. */
  autoIndentLine?: number | undefined;
};

/** Mode, pending keys, and memory between keys. Visual linewise is mode "visualLine". */
export type VimState = {
  mode: Mode;
  pending: Key[];
  /** Command-line text including its prefix (":", "/", "?"). */
  cmdline: string;
  lastChange?: LastChange;
  search?: SearchState;
  visualAnchor?: Pos;
  lastFind?: { key: "f" | "F" | "t" | "T"; char: string };
  /** Display column that j/k and linewise commands return to (Infinity after `$`). */
  wantCol?: number;
  insert?: InsertSession;
};

/** The active buffer and window as the engine sees them. */
export type BufferVim = {
  text: TextBuffer;
  cursor: Pos;
  undo: UndoHistory;
  registers: Registers;
};

/** The window viewport (first visible line, visible line count) and the tab width in cells. */
export type VimEnv = { topLine: number; rows: number; tabWidth: number };

/** The engine's only outputs. `paste` from "+ waits for the clipboard in core/state. */
export type VimEffect =
  | { kind: "changed" }
  | { kind: "yank"; register: RegisterName; text: string; linewise: boolean }
  | { kind: "paste"; register: RegisterName; before: boolean }
  | { kind: "modeChanged"; mode: Mode }
  | { kind: "ex"; line: string }
  | { kind: "search"; pattern: string; dir: 1 | -1 }
  /** A search motion went past the buffer's end (`dir` 1) or start and came round. */
  | { kind: "searchWrapped"; dir: 1 | -1 }
  | { kind: "jumped"; from: Pos };
