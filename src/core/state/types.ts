import type { AppConfig } from "../config/schema";
import type { ConfigResult } from "../config/toml";
import type { NoteIndex } from "../features/links/note-index";
import type { FileEdit } from "../features/links/rename";
import type { NoteSummary } from "../features/links/summarize";
import type { KeyScope } from "../kernel/commands/keymap";
import type { Registers } from "../kernel/editor/registers";
import type { UndoHistory } from "../kernel/editor/undo";
import type { WindowTree } from "../kernel/editor/windows";
import type { Pos } from "../kernel/text/pos";
import type { TextBuffer } from "../kernel/text/text-buffer";
import type { Key } from "../kernel/vim/keys";
import type { VimState } from "../kernel/vim/types";

export type BufferId = number;
export type WindowId = number;

/** File identity on disk; equal only when all three fields are equal. */
export type Stamp = { mtimeMs: number; size: number; hash: string };
/** A text file as read: `text` has no BOM; `eol` is "\r\n" when any CRLF exists. */
export type TextFile = {
  text: string;
  bom: boolean;
  eol: "\n" | "\r\n";
  stamp: Stamp;
};
/** One listed folder entry; symlinks report their target's kind. */
export type DirEntry = { name: string; kind: "file" | "dir" };
/** A file-system operation; `permanent` turns "trash" into a deletion. Paths are workspace-relative. */
export type FsOp = {
  kind: "create" | "rename" | "move" | "trash";
  from: string;
  to?: string;
  dir?: boolean;
  permanent?: true;
};
export type FileEvent =
  | { kind: "changed"; path: string; isDir: boolean }
  | { kind: "removed"; path: string };
/** One search match: a line of `path` with the match at `col`, `len` code units long. */
export type SearchHit = {
  path: string;
  line: number;
  col: number;
  len: number;
  text: string;
};
export type TimerId =
  | `autosave:${BufferId}`
  | `retry:${BufferId}`
  | `toast:${number}`
  | "whichKey"
  | "saveState";

/**
 * Where a buffer's save stands. `writing.at` is when the write was requested
 * and `writing.attempt` counts the failures before it, so a failure can set
 * `retryAt` and the backoff without a clock.
 */
export type SaveState =
  | { kind: "idle" }
  | { kind: "scheduled"; at: number }
  | { kind: "writing"; version: number; at: number; attempt: number }
  | { kind: "failed"; reason: string; attempt: number; retryAt: number };

export type BufferState = {
  id: BufferId;
  path: string;
  fileType: string;
  view: string;
  text: TextBuffer;
  undo: UndoHistory;
  bom: boolean;
  eol: "\n" | "\r\n";
  finalNewline: boolean;
  stamp: Stamp;
  savedVersion: number;
  dirty: boolean;
  disk: "present" | "deleted";
  save: SaveState;
  /** `:bd` is waiting for this buffer's write before closing it. */
  closing?: true;
  /** The file type's analysis of `text` at its current version (`Doc` for Markdown). */
  analysis?: unknown;
};

export type WindowState = {
  id: WindowId;
  content: { editor: "text"; bufferId: BufferId; cursor: Pos; scroll: number };
};

export type TerminalState = {
  cols: number;
  rows: number;
  color: "color" | "nocolor";
  quit?: { code: 0; waiting: BufferId[] };
};

export type ExplorerState = {
  open: boolean;
  focused: boolean;
  /** Listed folders by workspace-relative path ("" is the root). */
  entries: Record<string, DirEntry[]>;
  expanded: string[];
  /** Selected path ("" when nothing is selected). */
  cursor: string;
  trash: "unknown" | "available" | "unavailable";
};

/**
 * An explorer prompt. `op` is the operation it completes: for "create",
 * `from` is the folder the new entry goes in; otherwise the selected path.
 * "typed" enables Enter only when `value` equals the selected name.
 */
export type PromptState = {
  kind: "confirm" | "input" | "typed";
  title: string;
  value: string;
  op: FsOp;
  /** Rename and move: the links the operation will update, or why it will not. */
  impact?: string;
  /** Why `value` cannot be submitted; Enter does nothing while it is set. */
  invalid?: string;
};

export type Overlay =
  | { kind: "none" }
  | { kind: "prompt"; prompt: PromptState }
  | { kind: "conflict"; bufferId: BufferId; disk: TextFile; showDiff: boolean }
  | { kind: "whichKey"; whichKey: WhichKeyState };

/** The which-key popup: the pending prefix and the scope its keys resolve in. */
export type WhichKeyState = { prefix: Key[]; scope: KeyScope };

/** The per-workspace state file: positions and layout, never note text. */
export type PersistedState = {
  version: 1;
  recent: string[];
  jumps: JumpList;
  buffers: { path: string; view: string }[];
  layout: {
    tree: WindowTree;
    active: WindowId;
    windows: { id: WindowId; path: string; cursor: Pos; scroll: number }[];
  };
};

/** A position the cursor jumped from; Neovim's jumplist entry. */
export type JumpEntry = { path: string; line: number; col: number };
/** `at` is the entry the next <C-o> returns to plus one; `entries.length` when not travelling. */
export type JumpList = { entries: JumpEntry[]; at: number };

/** The workspace index: its build status and the one NoteIndex in the process. Never persisted. */
export type IndexState = {
  status: "idle" | "indexing" | "ready" | "unavailable";
  done: number;
  total: number;
  ix: NoteIndex;
  /** A rename or link-mention waiting for its file operation or its closed-file writes. */
  rewrite?: LinkRewrite;
};
export type LinkRewrite = {
  batch: number;
  /** Rename and move: the file operation the edits wait for. */
  op?: FsOp;
  edits: FileEdit[];
  pending: string[];
  updated: string[];
  skipped: { path: string; reason: string }[];
};

export type Toast = { id: number; level: "info" | "error"; text: string };

export type MouseEvent = { kind: "scroll"; delta: number };

export type AppState = {
  workspace: { root: string };
  buffers: Record<BufferId, BufferState>;
  nextBufferId: BufferId;
  /** A window without a `byId` entry is empty (nothing open). */
  windows: {
    tree: WindowTree;
    byId: Record<WindowId, WindowState>;
    active: WindowId;
    nextWindowId: WindowId;
    /** Windows of the last session waiting for their file, and how many files were not found. */
    restore?: {
      pending: Record<WindowId, { path: string; cursor: Pos; scroll: number }>;
      missing: number;
    };
  };
  vim: VimState & {
    registers: Registers;
    pendingPaste?: { bufferId: BufferId; before: boolean };
  };
  panels: { explorer: ExplorerState };
  overlay: Overlay;
  notifications: {
    toasts: Toast[];
    message?: { text: string; level: "info" | "error" };
  };
  config: AppConfig;
  terminal: TerminalState;
  index: IndexState;
  jumps: JumpList;
  /** Workspace paths, most recently opened first. */
  recent: string[];
};

export type Action =
  | { type: "key"; key: Key; now: number }
  | { type: "resize"; cols: number; rows: number }
  | { type: "fileLoaded"; path: string; file: TextFile }
  | { type: "fileRefused"; path: string; reason: "binary" | "tooLarge" | "io" }
  | { type: "saved"; path: string; stamp: Stamp }
  | { type: "saveFailed"; path: string; reason: string }
  | { type: "fileChanged"; event: FileEvent }
  | {
      type: "dirListed";
      dir: string;
      entries: DirEntry[] | null;
      reason?: string;
    }
  | { type: "fsResult"; op: FsOp; ok: boolean; reason?: string }
  | { type: "trashAvailable"; available: boolean }
  | { type: "timer"; id: TimerId; now: number }
  | { type: "clipboardText"; text: string; error?: string }
  | { type: "mouse"; event: MouseEvent }
  | { type: "configLoaded"; result: ConfigResult; reload: boolean }
  | {
      type: "indexBatch";
      summaries: NoteSummary[];
      files: string[];
      done: number;
      total: number;
    }
  | { type: "stateLoaded"; state: PersistedState | undefined; restore: boolean }
  | { type: "indexReady" }
  | { type: "indexFailed"; final: boolean; reason: string }
  | {
      type: "editsApplied";
      batch: number;
      path: string;
      ok: boolean;
      text?: string;
      stamp?: Stamp;
      reason?: string;
    };

export type Effect =
  | { kind: "read"; path: string }
  | { kind: "write"; path: string; text: string; expected?: Stamp }
  | { kind: "create" | "rename" | "move" | "trash"; op: FsOp }
  | { kind: "listDir"; dir: string }
  | { kind: "startTimer"; id: TimerId; ms: number }
  | { kind: "cancelTimer"; id: TimerId }
  | { kind: "clipboardWrite"; text: string }
  | { kind: "clipboardRead" }
  | { kind: "exit"; code: number }
  | { kind: "saveState"; state: PersistedState }
  | { kind: "loadConfig" }
  | { kind: "applyEdits"; batch: number; edit: FileEdit };

/** What every reducer returns. */
export type Result = { state: AppState; effects: Effect[] };
