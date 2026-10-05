import type { AppConfig } from "../config/schema";
import type { ConfigResult } from "../config/toml";
import type { PropertyTypes } from "../features/bases/property-types";
import type { FileFacts, NoteIndex } from "../features/links/note-index";
import type { FileEdit } from "../features/links/rename";
import type { NoteSummary } from "../features/links/summarize";
import type { TemplateVars } from "../features/notes/template";
import type { EditorKind } from "../filetypes/registry";
import type { KeyScope } from "../kernel/commands/keymap";
import type { Registers } from "../kernel/editor/registers";
import type { UndoHistory } from "../kernel/editor/undo";
import type { WindowTree } from "../kernel/editor/windows";
import type { Pos } from "../kernel/text/pos";
import type { TextBuffer } from "../kernel/text/text-buffer";
import type { Key } from "../kernel/vim/keys";
import type { VimState } from "../kernel/vim/types";
import type {
  FrontmatterPatch,
  FrontmatterValue,
} from "../lang/markdown/frontmatter-patch";
import type { LocalDate } from "../time/local";

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
  /** Birth time when the file system reports one, else the modification time. */
  createdMs?: number;
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
  | "saveState"
  | "search";

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
  /** Absent means listed; an unlisted buffer is an embed target, never shown or persisted. */
  listed?: false;
  /** On a listed note: embed targets whose read is outstanding, and those refused. Never persisted. */
  embeds?: { requested: string[]; refused: string[] };
  /** Its file type is never written: no save, autosave, or recreate. */
  readOnly?: true;
};

export type WindowState = {
  id: WindowId;
  content: {
    /** The editor kind showing the buffer: its file type's kind when registered, else "text". */
    editor: EditorKind;
    bufferId: BufferId;
    cursor: Pos;
    scroll: number;
    /** Block ids toggled from their default fold in this window. Never persisted. */
    folds?: number[];
    /** The editor kind's own window state, created by its `open`; absent for "text". Never persisted. */
    kindState?: unknown;
    /** The "#…" part the window was opened at, consumed by the editor kind's `open`. */
    subpath?: string;
  };
};

/**
 * Where the cursor goes once a note a notes command opened is shown: the
 * first unchecked task (else the end), or the end in Insert mode.
 */
export type AfterOpen = "firstTask" | "insert";

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

/** A centred prompt; "typed" enables Enter only when `value` equals the selected name. */
type PromptBase = {
  kind: "confirm" | "input" | "typed";
  title: string;
  value: string;
  /** Rename and move: the links the operation will update, or why it will not. */
  impact?: string;
  /** Why `value` cannot be submitted; Enter does nothing while it is set. */
  invalid?: string;
};
/**
 * An explorer prompt. `op` is the operation it completes: for "create",
 * `from` is the folder the new entry goes in; otherwise the selected path.
 */
export type ExplorerPrompt = PromptBase & { op: FsOp; newNote?: never };
/** A new note's title, before its template is chosen. */
type NewNotePrompt = PromptBase & { newNote: true; op?: never };
export type PromptState = ExplorerPrompt | NewNotePrompt;

/** The docked backlinks or outline panel of the active note. */
export type SidePanelState = {
  kind: "backlinks" | "outline";
  open: boolean;
  focused: boolean;
  /** Selected row. */
  cursor: number;
  /** The unlinked-mentions search for the shown note; results with another id are dropped. */
  mentions?: { id: number; pending: boolean; hits: SearchHit[] };
};

export type CompletionState = {
  /** The position just after "[[". */
  anchor: Pos;
  mode: "notes" | "headings" | "blocks";
  /** The resolved note whose headings or blocks are listed. */
  target?: string;
  query: string;
  items: { insert: string; label: string; detail?: string }[];
  selected: number;
};

/** The open calendar: the month shown, today, and the selected day (always in `month`). */
export type CalendarState = {
  month: { year: number; month: number };
  today: LocalDate;
  selected: LocalDate;
};

export type Overlay =
  | { kind: "none" }
  | { kind: "prompt"; prompt: PromptState }
  | { kind: "conflict"; bufferId: BufferId; disk: TextFile; showDiff: boolean }
  | { kind: "whichKey"; whichKey: WhichKeyState }
  | { kind: "picker" | "palette" | "help"; picker: PickerState }
  | { kind: "completion"; completion: CompletionState }
  | { kind: "calendar"; calendar: CalendarState }
  | { kind: "zoom"; zoom: ZoomState };

/**
 * The zoom float. An image keeps its zoom `level` (times the fitted size)
 * and the centre of the view as fractions of the image; a diagram keeps its
 * drawn lines and the first row and column on screen.
 */
export type ZoomState =
  | {
      kind: "image";
      path: string;
      name: string;
      level: number;
      cx: number;
      cy: number;
    }
  | {
      kind: "diagram";
      source: string;
      spacing: "loose" | "tight";
      lines: string[];
      row: number;
      col: number;
    };

/** One picker row; `matches` are the label's matched character positions. */
export type PickerItem = {
  key: string;
  label: string;
  detail?: string;
  path?: string;
  line?: number;
  matches: number[];
};
/** An open picker: its source, query, ranked rows, and the search and preview it waits for. */
export type PickerState = {
  /** "files" | "recent" | "grep" | "headings" | "tags" | "tagNotes" | "backlinks" | "commands" | "help" */
  source: string;
  /** tagNotes: the tag; backlinks: the target path */
  arg?: string;
  query: string;
  items: PickerItem[];
  total: number;
  selected: number;
  search?: { id: number; pending: boolean; capped: boolean };
  /** When the picker opened; sources that expand dates in their preview use it. */
  time?: number;
  /** Below the preview width, `Tab` shows the preview in place of the list. */
  showPreview?: true;
  /** The selected note in the preview pane, set while that pane has the keys (`C-l`). */
  browse?: number;
  preview?: {
    id: number;
    path: string;
    line: number;
    file?: TextFile;
    refused?: "binary" | "tooLarge" | "io";
  };
  error?: string;
};

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
  /** Next id for `search` effects; results with an older id are dropped. */
  searchSeq: number;
  /** Obsidian's property type assignments, replaced on every load. */
  types: PropertyTypes;
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

/** The browser preview server: off, starting, or listening on a loopback port. Never persisted. */
export type PreviewState =
  | { status: "off" }
  | { status: "starting" }
  | { status: "on"; port: number };

/** What a pointer is over inside an editor or Base window. */
export type WindowSpot =
  /**
   * `edge` is -1 or 1 when a drag leaves the text above or below; `tag` is
   * the tag drawn there in place of its source (a frontmatter tag).
   */
  | { kind: "text"; pos: Pos; edge: -1 | 0 | 1; tag?: string }
  /** A rendered fold marker; a click flips the fold of block `block`. */
  | { kind: "fold"; block: number }
  | { kind: "winbar" }
  | { kind: "baseTab"; view: number }
  | { kind: "baseCell"; row: number; column: number }
  | { kind: "baseCard"; lane: number; card: number }
  | { kind: "base" };

/**
 * What a pointer is over, in model terms. `explorer` with path "" and
 * `sidePanel` with row -1 are the panel's frame or empty area; `overlay` is
 * inside an overlay but on no item, `outside` is outside the open overlay,
 * and `inert` is chrome that takes no click.
 */
export type MouseTarget =
  | { kind: "window"; window: WindowId; spot: WindowSpot }
  | { kind: "explorer"; path: string }
  | { kind: "sidePanel"; row: number }
  | { kind: "bufferTab"; bufferId: BufferId }
  | { kind: "overlayItem"; index: number }
  | { kind: "calendarDay"; date: LocalDate }
  | { kind: "overlay" }
  | { kind: "outside" }
  | { kind: "inert" };

/** One left-button gesture or wheel notch; the wheel repeats a vertical notch. */
export type MouseEvent =
  | { kind: "press"; target: MouseTarget; clicks: 1 | 2 | 3; ctrl: boolean }
  | { kind: "drag"; target: MouseTarget }
  | { kind: "wheel"; target: MouseTarget; dx: -1 | 0 | 1; dy: -1 | 0 | 1 };

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
    /**
     * Windows waiting for their file, and how many files of the last session
     * were not found. `navigated` marks a wait from a jump or link follow,
     * which reports its own refusal instead of counting as missing.
     */
    restore?: {
      pending: Record<
        WindowId,
        {
          path: string;
          cursor: Pos;
          scroll: number;
          navigated?: true;
          /** Placement once the read answers; never persisted. */
          after?: AfterOpen;
          /** The "#…" part to open at; never persisted. */
          subpath?: string;
        }
      >;
      missing: number;
    };
  };
  vim: VimState & {
    registers: Registers;
    pendingPaste?: { bufferId: BufferId; before: boolean };
  };
  panels: { explorer: ExplorerState; side: SidePanelState };
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
  preview: PreviewState;
};

export type Action =
  | { type: "key"; key: Key; now: number }
  | { type: "resize"; cols: number; rows: number }
  /** `embed` answers a read a note's embed sent (see the `read` effect). */
  | { type: "fileLoaded"; path: string; file: TextFile; embed?: true }
  | {
      type: "fileRefused";
      path: string;
      reason: "binary" | "tooLarge" | "io";
      embed?: true;
    }
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
  | { type: "mouse"; event: MouseEvent; now: number }
  | { type: "configLoaded"; result: ConfigResult; reload: boolean }
  | {
      type: "indexBatch";
      summaries: NoteSummary[];
      files: string[];
      /** Facts of files that are not notes. */
      facts?: FileFacts[];
      done: number;
      total: number;
    }
  | { type: "stateLoaded"; state: PersistedState | undefined; restore: boolean }
  | { type: "searchResults"; id: number; hits: SearchHit[]; capped: boolean }
  | {
      type: "previewLoaded";
      id: number;
      path: string;
      result: TextFile | { refused: "binary" | "tooLarge" | "io" };
    }
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
    }
  | { type: "previewStarted"; port: number }
  | { type: "previewStopped" }
  | { type: "previewFailed"; reason: string }
  | { type: "openUrlFailed"; url: string; reason: string }
  /** A `createNote` finished; `templatePath` echoes the effect's template. */
  | {
      type: "noteCreated";
      path: string;
      outcome: "created" | "exists" | "failed";
      template: "used" | "missing" | "unreadable" | "none";
      templatePath?: string;
      after: AfterOpen;
      reason: "daily" | "new";
      failure?: string;
    }
  /** `.obsidian/types.json` was read; `{}` when absent or malformed. */
  | { type: "propertyTypesLoaded"; types: PropertyTypes }
  /**
   * A `patchFrontmatter` finished: `text` and `stamp` are what was written,
   * `removed` and `added` the changed property lines; `reason` says why not.
   */
  | {
      type: "frontmatterPatched";
      path: string;
      ok: boolean;
      text?: string;
      stamp?: Stamp;
      removed: string[];
      added: string[];
      reason?: string;
    };

export type Effect =
  /** `embed` marks a read only a note's embed asked for; its answer carries it back. */
  | { kind: "read"; path: string; embed?: true }
  | { kind: "write"; path: string; text: string; expected?: Stamp }
  | { kind: "create" | "rename" | "move" | "trash"; op: FsOp }
  | { kind: "listDir"; dir: string }
  | { kind: "startTimer"; id: TimerId; ms: number }
  | { kind: "cancelTimer"; id: TimerId }
  | { kind: "clipboardWrite"; text: string }
  | { kind: "clipboardRead" }
  | { kind: "exit"; code: number }
  | { kind: "saveState"; state: PersistedState }
  | {
      kind: "search";
      id: number;
      query: string;
      limit: number;
      mode?: "text" | "mentions";
      names?: string[];
      exclude?: string;
    }
  | { kind: "readPreview"; id: number; path: string }
  | { kind: "loadConfig" }
  | { kind: "applyEdits"; batch: number; edit: FileEdit }
  | { kind: "startPreview" }
  | { kind: "stopPreview" }
  | { kind: "openUrl"; url: string }
  /**
   * Create `path` from `template` (workspace-relative) expanded with `vars`,
   * never replacing an entry; `fallback` is the template text when the
   * template file does not exist.
   */
  | {
      kind: "createNote";
      path: string;
      template?: string;
      fallback?: string;
      vars: TemplateVars;
      after: AfterOpen;
      reason: "daily" | "new";
    }
  /** Read `.obsidian/types.json`; answered by `propertyTypesLoaded`. */
  | { kind: "readPropertyTypes" }
  /**
   * Change one frontmatter property of a closed note on disk, only while the
   * property still holds `expected` (`undefined`: absent); answered by
   * `frontmatterPatched`.
   */
  | {
      kind: "patchFrontmatter";
      path: string;
      patch: FrontmatterPatch;
      expected: FrontmatterValue | undefined;
    };

/** What every reducer returns. */
export type Result = { state: AppState; effects: Effect[] };
