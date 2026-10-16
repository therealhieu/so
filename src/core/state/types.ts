import type { AppConfig } from "../config/schema";
import type { ConfigResult } from "../config/toml";
import type { SettingValue } from "../config/toml-edit";
import type { PropertyTypes } from "../features/bases/property-types";
import type {
  BrowserStatus,
  PageInput,
  PagePoint,
  PageSize,
} from "../features/browser/file-type";
import type { RawKey } from "../features/browser/keys";
import type { BlameLine } from "../features/git/blame";
import type { Hunk } from "../features/git/diff";
import type { IndexText } from "../features/git/index-text";
import type { RepoHead, RepoStatus } from "../features/git/status";
import type { FileFacts, NoteIndex } from "../features/links/note-index";
import type { FileEdit } from "../features/links/rename";
import type { NoteSummary } from "../features/links/summarize";
import type { TemplateVars } from "../features/notes/template";
import type { PdfAnnotation } from "../features/pdf/annotations";
import type { PdfPageLayout, PdfPoint } from "../features/pdf/layout";
import type { PdfOutlineItem } from "../features/pdf/outline";
import type {
  SqliteCheckResult,
  SqliteCountResult,
  SqlitePageResult,
  SqliteSchemaResult,
  SqliteSource,
  SqliteTable,
} from "../features/sqlite/types";
import type { EditorKind } from "../filetypes/registry";
import type { KeyScope } from "../kernel/commands/keymap";
import type { RegisterName, Registers } from "../kernel/editor/registers";
import type { UndoHistory } from "../kernel/editor/undo";
import type { WindowTree } from "../kernel/editor/windows";
import type { Pos } from "../kernel/text/pos";
import type { TextBuffer } from "../kernel/text/text-buffer";
import type { Diagnostic } from "../kernel/view/diagnostics";
import type { InlayHint } from "../kernel/view/inlay-hints";
import type { Key } from "../kernel/vim/keys";
import type { VimState } from "../kernel/vim/types";
import type {
  FrontmatterPatch,
  FrontmatterValue,
} from "../lang/markdown/frontmatter-patch";
import type { MermaidSvg } from "../lang/markdown/renderers/mermaid";
import type { LocalDate } from "../time/local";
import type { LineField } from "./line-field";
import type {
  CodeCompletionItem,
  CodeEdit,
  LspOp,
  LspResult,
  LspState,
  ServerKey,
  ServerView,
} from "./lsp-types";
import type { MessageLevel } from "./result";

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
/** `ignored`: a `.gitignore` matches it; listed only while gitignored entries are shown. */
export type DirEntry = { name: string; kind: "file" | "dir"; ignored?: true };
/**
 * A file-system operation; `permanent` turns "trash" into a deletion. Paths
 * are workspace-relative, except that `outside` makes a copy's or move's
 * `from` an absolute path outside the workspace.
 */
export type FsOp = {
  kind: "create" | "rename" | "move" | "trash" | "copy";
  from: string;
  to?: string;
  dir?: boolean;
  permanent?: true;
  outside?: true;
};
/** Files on a clipboard and whether pasting copies or moves them. */
export type FileClip = { op: "copy" | "cut"; paths: string[] };
/** `explorerOnly`: a path the index skips, watched only for the explorer. */
export type FileEvent =
  | { kind: "changed"; path: string; isDir: boolean; explorerOnly?: true }
  | { kind: "removed"; path: string; explorerOnly?: true };
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
  | "keyTimeout"
  | "saveState"
  | "search"
  | "completion"
  | "lspResolve"
  | "lspHighlight"
  | "lspPointer"
  | `lsp:${number}`
  | `lspFormat:${BufferId}`
  | `gitDiff:${BufferId}`
  | "gitRefresh"
  | "sqliteCheck";

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

/** What `pdfinfo` answered about a PDF: its page count, no Poppler, or why it failed. */
export type PdfInfoResult =
  | { kind: "ok"; pages: number }
  | { kind: "missing" }
  | { kind: "failed"; reason: string };

/** A PDF buffer's page count as known for the file version `stamp`. */
export type PdfInfo = { stamp: Stamp } & (
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; pages: number }
  | { status: "failed"; reason: string }
);

/** What `pdftotext` answered: each page's text, in page order. */
export type PdfTextResult =
  | { kind: "ok"; pages: string[] }
  | { kind: "missing" }
  | { kind: "failed"; reason: string };

/** What `pdftotext -bbox-layout` answered for one page. */
export type PdfLayoutResult =
  | { kind: "ok"; layout: PdfPageLayout }
  | { kind: "missing" }
  | { kind: "failed"; reason: string };

/** What `pdftohtml` answered: the PDF's table of contents. */
export type PdfOutlineResult =
  | { kind: "ok"; items: PdfOutlineItem[] }
  | { kind: "missing" }
  | { kind: "failed"; reason: string };

/** Data read from a PDF for the file version `stamp`, loaded on first use. */
export type PdfLoad<T> = { stamp: Stamp } & (
  | { status: "loading" }
  | { status: "ready"; value: T }
  | { status: "failed"; reason: string }
);

/** A PDF's highlights and notes, read from its annotations file. Never persisted. */
export type AnnotationLoad =
  | { status: "loading" }
  /** `detached` lists items whose quote is no longer on their page. */
  | { status: "ready"; items: PdfAnnotation[]; detached?: string[] }
  | { status: "failed"; reason: string };

/** A table's row count, read after its first rows. */
export type SqliteCount =
  | { status: "loading" }
  | { status: "ready"; count: number }
  | { status: "failed" };

/**
 * A SQLite database's schema as read for the file version `stamp`. `gen`
 * counts the reads of this buffer, so a reload of the same bytes still drops
 * answers to the read before it.
 */
export type SqliteInfo = { stamp: Stamp; gen: number } & (
  | { status: "loading" }
  | {
      status: "ready";
      tables: SqliteTable[];
      counts: Record<string, SqliteCount>;
    }
  | { status: "notSqlite" }
  | { status: "failed"; reason: string }
);

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
  /** Its file type has its own viewer: `text` stays empty and is never diffed. */
  binary?: true;
  /** A PDF's page count for the bytes `stamp` names. Never persisted. */
  pdf?: PdfInfo;
  /** A PDF's text per page, read for search. Never persisted. */
  pdfText?: PdfLoad<string[]>;
  /** A PDF's table of contents. Never persisted. */
  pdfOutline?: PdfLoad<PdfOutlineItem[]>;
  /** Words and their boxes of the PDF pages read so far, by page. Never persisted. */
  pdfLayout?: Record<number, PdfLoad<PdfPageLayout>>;
  /** A SQLite database's schema and row counts. Never persisted. */
  sqlite?: SqliteInfo;
  /** Kept at the front of the bufferline and out of bulk closes. */
  pinned?: true;
};

/**
 * Where a window last showed a buffer; `kind` is the editor kind's state
 * there (a PDF's page, a base's view), so returning keeps it.
 */
export type BufferView = {
  cursor: Pos;
  scroll: number;
  kind?: { editor: string; state: unknown };
};

export type WindowState = {
  id: WindowId;
  /** The view each buffer this window left had, restored when it shows it again. Never persisted. */
  views?: Record<BufferId, BufferView>;
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
    /** Show the buffer as text although its file type has another editor kind. */
    source?: true;
  };
};

/**
 * Where the cursor goes once a note a notes command opened is shown: the
 * first unchecked task (else the end), or the end in Insert mode.
 */
export type AfterOpen = "firstTask" | "insert";
/** Why a note is created: a daily note, a new note, or a new row of a base (which stays in view). */
export type NoteReason = "daily" | "new" | "row";

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
  /** Columns of the tree after a resize; unset follows `[explorer] width`. */
  width?: number;
  /** The entry under the pointer; the tree shows its whole name. */
  hover?: string;
  /** What `y` or `x` last took, by workspace path; a paste falls back to it. */
  clip?: FileClip;
};

/** A centred prompt; "typed" enables Enter only when `value` equals the selected name. */
type PromptBase = {
  kind: "confirm" | "input" | "typed";
  title: string;
  value: string;
  /** Where in `value` typing goes; absent means its end. */
  caret?: number;
  /** Rename and move: the links the operation will update, or why it will not. */
  impact?: string;
  /** Why `value` cannot be submitted; Enter does nothing while it is set. */
  invalid?: string;
};
/**
 * An explorer prompt. `op` is the operation it completes: for "create",
 * `from` is the folder the new entry goes in; otherwise the selected path.
 */
export type ExplorerPrompt = PromptBase & {
  op: FsOp;
  newNote?: never;
  rename?: never;
  setting?: never;
  binding?: never;
  pdfNote?: never;
};
/**
 * A new note's title, before its template is chosen; `row` makes it a row of
 * base window `window`, blank with `properties`, and keeps that window.
 */
type NewNotePrompt = PromptBase & {
  newNote: true;
  row?: {
    window: WindowId;
    properties: Record<string, FrontmatterValue>;
    /** Properties set to the time the note is created. */
    stamp: readonly string[];
  };
  op?: never;
  rename?: never;
  setting?: never;
  binding?: never;
  pdfNote?: never;
};
/** A new name for the symbol `name` at `pos`, asked of the server `key`. */
type RenamePrompt = PromptBase & {
  rename: {
    key: ServerKey;
    path: string;
    pos: Pos;
    version: number;
    name: string;
  };
  op?: never;
  newNote?: never;
  setting?: never;
  binding?: never;
  pdfNote?: never;
};
/** A typed value for the setting at `path`; the settings `picker` comes back after it. */
type SettingPrompt = PromptBase & {
  setting: { path: string[]; picker: PickerState };
  op?: never;
  newNote?: never;
  rename?: never;
  binding?: never;
  pdfNote?: never;
};
/**
 * One step of editing a key binding in the keymap `picker`, which comes back
 * after it. Adding asks the mode, then the keys, then what they run;
 * changing asks only the keys, and unbinds `from`. A change to a built-in
 * binding waits for `y` at a `confirm` step.
 */
type BindingPrompt = PromptBase & {
  binding: {
    step: "mode" | "keys" | "target" | "confirm";
    mode: string;
    filetype?: string;
    /** The keys being replaced, when changing a binding. */
    from?: string;
    seq?: string;
    /** What the keys run: a command id or a key sequence. */
    id?: string;
    /** Confirming: the table changes waiting for `y`, what they do to built-in bindings, and the message after. */
    entries?: { seq: string; id?: string }[];
    notice?: string[];
    done?: string;
    picker: PickerState;
  };
  op?: never;
  newNote?: never;
  rename?: never;
  setting?: never;
  pdfNote?: never;
};
/** The text of a note on PDF `pdf`'s annotation `item`, new or being changed. */
type PdfNotePrompt = PromptBase & {
  pdfNote: { pdf: string; item: PdfAnnotation };
  op?: never;
  newNote?: never;
  rename?: never;
  setting?: never;
  binding?: never;
};
export type PromptState =
  | ExplorerPrompt
  | NewNotePrompt
  | RenamePrompt
  | SettingPrompt
  | BindingPrompt
  | PdfNotePrompt;

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
  /** The position just after "[[", or the word start for code. */
  anchor: Pos;
  mode: "notes" | "headings" | "blocks" | "code";
  /** The resolved note whose headings or blocks are listed. */
  target?: string;
  query: string;
  /** Ranked rows; `source` is the row's index in `code.items`. */
  items: { insert: string; label: string; detail?: string; source?: number }[];
  selected: number;
  /** Code completion: the server's items, kept for local re-ranking and accept. */
  code?: {
    key: ServerKey;
    items: CodeCompletionItem[];
    incomplete: boolean;
    version: number;
  };
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
  | { kind: "zoom"; zoom: ZoomState }
  | { kind: "gitHunk"; bufferId: BufferId; hunk: Hunk }
  | { kind: "pdfMenu"; window: WindowId; on: PdfMenuSubject }
  | { kind: "sqliteQuery"; query: SqliteQueryState };

/**
 * The query dialog of SQLite window `window`. `field` may hold newlines.
 * Each edit bumps `gen`; the check answers only the latest. `recall` is the
 * history entry shown while stepping with `↑`/`↓`, `draft` the text typed
 * before it; `matches` lists what `Tab` could not choose between.
 */
export type SqliteQueryState = {
  window: WindowId;
  field: LineField;
  gen: number;
  check:
    | { status: "idle" | "checking" }
    | { status: "ok"; columns: string[] }
    | { status: "failed"; reason: string };
  recall?: number;
  draft?: string;
  matches?: string[];
};

/**
 * What the PDF action float is about: the selection, or an annotation, shown
 * because the pointer rests on it (`hover`) or after a click on it.
 */
export type PdfMenuSubject =
  | { kind: "selection" }
  | { kind: "annotation"; id: string; hover?: true };

/**
 * The zoom float. An image keeps its zoom `level` (times the fitted size),
 * the centre of the view as fractions of the image, and how much of the
 * float it covers at fit per axis (the UI measures it; 1 until then); a
 * diagram keeps its drawn lines and the first row and column on screen.
 */
/** Decoded pixels: `width`×`height` RGBA, four bytes per pixel, rows top to bottom. */
export type RgbaImage = { rgba: Uint8Array; width: number; height: number };

/** Part of an SVG drawn into `width`×`height` pixels over `background`. */
export type SvgRaster = {
  svg: string;
  background: string;
  /** The region of the SVG's user space to draw. */
  crop: { x: number; y: number; w: number; h: number };
  width: number;
  height: number;
};

export type ZoomState =
  | {
      kind: "image";
      path: string;
      name: string;
      level: number;
      cx: number;
      cy: number;
      fill: { x: number; y: number };
      /** Where the last press in the float was, and the view's centre then. */
      grab?: ZoomGrab;
      /** A diagram drawn as an image: its SVG, and its text drawing for when that cannot be drawn. */
      diagram?: { svg: MermaidSvg; lines: string[] };
    }
  | {
      kind: "diagram";
      source: string;
      spacing: "loose" | "tight";
      lines: string[];
      row: number;
      col: number;
      /** Where the last press in the float was, and the first row and column then. */
      grab?: ZoomGrab;
    };

/** A press point in the zoom float and the view's position (`cx`/`cy` or `col`/`row`) at that press. */
export type ZoomGrab = { fx: number; fy: number; x: number; y: number };

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
  /** "files" | "buffers" | "recent" | "grep" | "headings" | "tags" | "tagNotes" | "backlinks" | "commands" | "help" */
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
  /** The picker `Esc` returns to, as the theme list returns to the settings. */
  back?: PickerState;
};

/** The which-key popup: the pending prefix and the scope its keys resolve in. */
export type WhichKeyState = { prefix: Key[]; scope: KeyScope };

/** The per-workspace state file: positions and layout, never note text. */
export type PersistedState = {
  version: 1;
  recent: string[];
  jumps: JumpList;
  /** Open buffers in bufferline order. */
  buffers: { path: string; view: string; pinned?: true | undefined }[];
  layout: {
    tree: WindowTree;
    active: WindowId;
    windows: { id: WindowId; path: string; cursor: Pos; scroll: number }[];
  };
  /** Present once the explorer was resized. */
  explorer?: { width: number } | undefined;
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

/** The repository holding the workspace. Paths are absolute. */
export type RepoInfo = {
  top: string;
  gitDir: string;
  commonDir: string;
  /** The workspace's repo-relative folder: "" at the top, else ending in "/". */
  prefix: string;
  head: RepoHead;
  op?: "rebasing" | "merging";
};

/** What the index holds for one path. */
export type IndexEntry =
  | {
      kind: "tracked";
      oid: string;
      mode: string;
      conflicted: boolean;
      text: IndexText;
    }
  | { kind: "untracked" }
  | { kind: "ignored" };

/**
 * A git operation waiting for buffer writes, like `:q` waits in
 * `terminal.quit`. `saved` names the files the tool launch wrote.
 */
export type GitPending =
  | { op: "tool"; waiting: BufferId[]; saved: string[] }
  | { op: "stage"; bufferId: BufferId; line: number; waiting: BufferId[] };

/** The staged hunk's 1-based position `n` of `m`, and whether a save came first. */
export type StageReport = { n: number; m: number; saved: boolean };

/**
 * Git state, never persisted. `files` holds the open buffers' index entries
 * and hunks by workspace-relative path; `repo` is null outside a repository.
 * `dirChanged` marks a git-dir change that the next status read has not
 * answered yet: a checkout or pull can change an index entry that status
 * reports as clean both before and after.
 */
export type GitState = {
  repo: RepoInfo | null;
  status: RepoStatus | null;
  files: Record<string, { index?: IndexEntry; hunks: Hunk[] }>;
  pending?: GitPending;
  dirChanged?: true;
};

/** How the full-screen git tool ended. */
export type ToolResult =
  | { kind: "exited"; code: number; signal?: string }
  | { kind: "missing"; tool: string }
  | { kind: "failed"; reason: string };

export type Toast = { id: number; level: "info" | "error"; text: string };

/** The browser preview server: off, starting, or listening on a loopback port. Never persisted. */
export type PreviewState =
  | { status: "off" }
  | { status: "starting" }
  /** `token` opens the page; the server refuses requests without it. */
  | { status: "on"; port: number; token: string };

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
  /** The header separator right of table column `column`, which is `width` cells wide. */
  | { kind: "baseEdge"; column: number; width: number }
  | { kind: "baseCard"; lane: number; card: number }
  | { kind: "base" }
  /** On a browser page; `at` is the point under the pointer, absent off the frame. */
  | { kind: "browser"; at?: PagePoint }
  /** On a PDF page; `at` is the point under the pointer, absent off the page. */
  | { kind: "pdf"; at?: PdfPoint }
  /** In an image window; `at` is the point as fractions of the window's width and height. */
  | { kind: "image"; at: { fx: number; fy: number } }
  /** A SQLite grid cell; `row` counts from the source's first row. */
  | { kind: "sqliteCell"; row: number; column: number }
  /** The header separator right of SQLite column `column`, which is `width` cells wide. */
  | { kind: "sqliteEdge"; column: number; width: number }
  | { kind: "sqlite" };

/**
 * What a pointer is over, in model terms. `explorer` with path "" and
 * `sidePanel` with row -1 are the panel's frame or empty area; `overlay` is
 * inside an overlay but on no item, `outside` is outside the open overlay,
 * and `inert` is chrome that takes no click.
 */
export type MouseTarget =
  | { kind: "window"; window: WindowId; spot: WindowSpot }
  | { kind: "explorer"; path: string }
  /** The docked explorer's separator; `width` is the tree width with the separator at the pointer. */
  | { kind: "explorerEdge"; width: number }
  | { kind: "sidePanel"; row: number }
  | { kind: "bufferTab"; bufferId: BufferId }
  | { kind: "overlayItem"; index: number }
  | { kind: "calendarDay"; date: LocalDate }
  /** A point in the zoom float, as fractions of its inner area (outside it during a drag). */
  | { kind: "zoomPoint"; fx: number; fy: number }
  | { kind: "overlay" }
  | { kind: "outside" }
  | { kind: "inert" };

/** One left-button gesture, middle press, or wheel notch; the wheel repeats a vertical notch. */
export type MouseEvent =
  | { kind: "press"; target: MouseTarget; clicks: 1 | 2 | 3; ctrl: boolean }
  | { kind: "drag"; target: MouseTarget }
  | { kind: "wheel"; target: MouseTarget; dx: -1 | 0 | 1; dy: -1 | 0 | 1 }
  /** A middle-button press. */
  | { kind: "middle"; target: MouseTarget }
  /** The pointer moved onto `target` with no button held. */
  | { kind: "move"; target: MouseTarget }
  /**
   * The left button came up after a press on a PDF or browser page: on the
   * PDF page the press started on, or where a drag over a browser page
   * ended. `clicks` is the press's count.
   */
  | { kind: "release"; target: MouseTarget; clicks: 1 | 2 | 3 };

export type AppState = {
  workspace: { root: string };
  buffers: Record<BufferId, BufferState>;
  nextBufferId: BufferId;
  /** Listed buffers in bufferline order, pinned ones first. */
  bufferOrder: BufferId[];
  /** Listed buffers, most recently shown first; the second is the alternate. */
  bufferMru: BufferId[];
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
     * `background` lists the last session's other buffers still being read,
     * and `buffers` their saved order and pins, applied once all have answered.
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
      background?: string[];
      buffers?: { path: string; pinned?: true | undefined }[];
    };
  };
  vim: VimState & {
    registers: Registers;
    pendingPaste?: {
      bufferId: BufferId;
      register: RegisterName;
      before: boolean;
      count: number;
    };
  };
  panels: { explorer: ExplorerState; side: SidePanelState };
  overlay: Overlay;
  notifications: {
    toasts: Toast[];
    message?: { text: string; level: MessageLevel };
  };
  config: AppConfig;
  terminal: TerminalState;
  index: IndexState;
  jumps: JumpList;
  /** Workspace paths, most recently opened first. */
  recent: string[];
  preview: PreviewState;
  lsp: LspState;
  git: GitState;
  /** Highlights and notes by PDF path, for the PDFs opened so far. */
  annotations: Record<string, AnnotationLoad>;
};

export type Action =
  /** `raw` is the key as the terminal reported it, when the shell knows it. */
  | { type: "key"; key: Key; now: number; raw?: RawKey }
  /** A key the editor has no name for (F-keys, Ctrl+arrows); only a page takes it. */
  | { type: "rawKey"; raw: RawKey; now: number }
  | { type: "resize"; cols: number; rows: number }
  /** How much of the zoom float the shown image covers at fit, per axis (0..1]. */
  | { type: "zoomFill"; path: string; fill: { x: number; y: number } }
  /** Image window `window` drew a `size` image covering `fill` of it at fit, per axis (0..1]. */
  | {
      type: "imageLaidOut";
      window: WindowId;
      fill: { x: number; y: number };
      size: { width: number; height: number };
    }
  /** How many columns after the pinned first one a base table window shows scrolled off. */
  | { type: "baseScrolled"; window: WindowId; col: number }
  /**
   * What a SQLite window drew: the columns scrolled off after the pinned
   * one, its body rows, and the lines its schema or cell pane holds.
   */
  | {
      type: "sqliteLaidOut";
      window: WindowId;
      col: number;
      rows: number;
      lines: number;
    }
  /** Answers the `sqliteSchema` effect for read `gen` of the file version `stamp`. */
  | {
      type: "sqliteSchema";
      path: string;
      stamp: Stamp;
      gen: number;
      result: SqliteSchemaResult;
    }
  /** Answers the `sqlitePage` effect of window `window`. */
  | {
      type: "sqlitePage";
      path: string;
      gen: number;
      window: WindowId;
      source: SqliteSource;
      offset: number;
      result: SqlitePageResult;
    }
  /** Answers the `sqliteCount` effect. */
  | {
      type: "sqliteCount";
      path: string;
      gen: number;
      table: string;
      result: SqliteCountResult;
    }
  /** Answers the `sqliteCheck` effect for edit `gen` of the query dialog. */
  | { type: "sqliteChecked"; gen: number; result: SqliteCheckResult }
  /** Text pasted into the terminal. */
  | { type: "paste"; text: string }
  /** Answers the `pdfInfo` effect for the file version `stamp`. */
  | { type: "pdfInfo"; path: string; stamp: Stamp; result: PdfInfoResult }
  /** How many rows a PDF window drew its page in and how many it shows. */
  /** Answers the `pdfText` effect for the file version `stamp`. */
  | { type: "pdfText"; path: string; stamp: Stamp; result: PdfTextResult }
  /** Answers the `pdfLayout` effect for page `page` of the file version `stamp`. */
  | {
      type: "pdfLayout";
      path: string;
      stamp: Stamp;
      page: number;
      result: PdfLayoutResult;
    }
  /** Answers the `pdfOutline` effect for the file version `stamp`. */
  | { type: "pdfOutline"; path: string; stamp: Stamp; result: PdfOutlineResult }
  /** Answers `readAnnotations`: the file's text, `null` when there is none. */
  | {
      type: "annotationsRead";
      pdf: string;
      text: string | null;
      reason?: string;
    }
  /** A `writeAnnotations` or `moveAnnotations` failed. */
  | { type: "annotationsFailed"; pdf: string; reason: string }
  | {
      type: "pdfLaidOut";
      window: WindowId;
      pageRows: number;
      viewRows: number;
      pageCols: number;
      viewCols: number;
    }
  /** The device pixels a browser window drew its page in, and a row's height in them. */
  | {
      type: "browserLaidOut";
      window: WindowId;
      width: number;
      height: number;
      cellHeight: number;
    }
  /** What the browser host reports for window `window`'s page. */
  | { type: "browserEvent"; window: WindowId; event: BrowserEvent }
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
  | { type: "fileClipboardWritten"; clip: FileClip; system: boolean }
  | { type: "fileClipboardFailed"; reason: string }
  /** A long copy or move into `to` has started `done` of its `total` entries. */
  | { type: "copyProgress"; to: string; done: number; total: number }
  /**
   * The system clipboard's files for a paste into `target` (`null`: none),
   * paths inside the workspace spelled from its root; `dirs` are the folders.
   */
  | {
      type: "fileClip";
      target: string;
      clip: FileClip | null;
      dirs: string[];
      now: number;
      error?: string;
    }
  | { type: "mouse"; event: MouseEvent; now: number }
  | { type: "configLoaded"; result: ConfigResult; reload: boolean }
  | {
      type: "bindingsFailed";
      previous: Pick<AppConfig, "keys" | "filetypes">;
      reason: string;
    }
  | {
      type: "settingFailed";
      path: string[];
      previous: SettingValue;
      reason: string;
    }
  | {
      type: "indexBatch";
      summaries: NoteSummary[];
      files: string[];
      /** Facts of files that are not notes. */
      facts?: FileFacts[];
      /** Files a rescan no longer finds. */
      removed?: string[];
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
  | { type: "previewStarted"; port: number; token: string }
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
      reason: NoteReason;
      failure?: string;
      /** What was written, when created. */
      text?: string;
      stamp?: Stamp;
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
    }
  /** A server's state changed; `undefined`: it was stopped. */
  | { type: "lspServer"; key: ServerKey; view: ServerView | undefined }
  /** The servers attached to `path`, in routing order. */
  | { type: "lspAttached"; path: string; keys: ServerKey[] }
  /** Server `key`'s pushed or pulled diagnostics for `path`, replacing that list. */
  | {
      type: "lspDiagnostics";
      key: ServerKey;
      path: string;
      source: "push" | "pull";
      items: Diagnostic[];
    }
  /** Server `key`'s inlay hints for `path`, replacing its list; empty removes it. */
  | { type: "lspInlayHints"; key: ServerKey; path: string; items: InlayHint[] }
  | { type: "lspResult"; id: number; result: LspResult; now: number }
  | {
      type: "lspMessage";
      key: ServerKey;
      level: "error" | "warning";
      text: string;
    }
  /** Server `key` asks for `edit`; answered once by `lspReply` with `requestId`. */
  | {
      type: "lspApplyEdit";
      key: ServerKey;
      requestId: number | string;
      edit: CodeEdit;
    }
  | { type: "gitDetected"; repo: RepoInfo | null; notice?: string }
  | {
      type: "gitStatus";
      result: { ok: true; status: RepoStatus } | { ok: false; reason: string };
    }
  | {
      type: "gitIndexRead";
      path: string;
      entry: IndexEntry | { kind: "failed"; reason: string };
    }
  /** `report` echoes the `gitStage` effect's. */
  | {
      type: "gitStaged";
      path: string;
      result: "ok" | "stale" | { failed: string };
      report: StageReport;
    }
  | { type: "toolExited"; result: ToolResult }
  /** `line` is 0-based; `now` is when the answer arrived, for its relative date. */
  | {
      type: "gitBlamed";
      path: string;
      line: number;
      result: BlameLine | { failed: string };
      now: number;
    }
  | { type: "gitDirChanged" };

export type Effect =
  /** `embed` marks a read only a note's embed asked for; its answer carries it back. */
  | { kind: "read"; path: string; embed?: true }
  | { kind: "write"; path: string; text: string; expected?: Stamp }
  | { kind: "create" | "rename" | "move" | "trash" | "copy"; op: FsOp }
  /** `dotfiles` lists dot entries other than `.git`; `gitignored` lists names a `.gitignore` matches. */
  | { kind: "listDir"; dir: string; dotfiles?: true; gitignored?: true }
  | { kind: "startTimer"; id: TimerId; ms: number }
  | { kind: "cancelTimer"; id: TimerId }
  | { kind: "clipboardWrite"; text: string }
  | { kind: "clipboardRead" }
  /** Put files, by absolute path, on the system clipboard. */
  | { kind: "fileClipboardWrite"; clip: FileClip }
  | { kind: "fileClipboardRead"; target: string }
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
  /**
   * Set or (`id` undefined) remove key bindings in config.toml in one write;
   * the `previous` keymaps are restored if it fails.
   */
  | {
      kind: "writeBindings";
      edits: { path: string[]; id?: string }[];
      previous: Pick<AppConfig, "keys" | "filetypes">;
    }
  /** Write one config.toml value; `previous` is restored if the write fails. */
  | {
      kind: "writeSetting";
      path: string[];
      value: SettingValue;
      previous: SettingValue;
    }
  | { kind: "applyEdits"; batch: number; edit: FileEdit }
  | { kind: "startPreview" }
  | { kind: "stopPreview" }
  | { kind: "openUrl"; url: string }
  /**
   * Create `path` from `template` (workspace-relative) expanded with `vars`
   * and `frontmatter` set, never replacing an entry; `fallback` is the
   * template text when the template file does not exist.
   */
  | {
      kind: "createNote";
      path: string;
      template?: string;
      fallback?: string;
      vars: TemplateVars;
      frontmatter?: Record<string, FrontmatterValue>;
      after: AfterOpen;
      reason: NoteReason;
    }
  /** Read `.obsidian/types.json`; answered by `propertyTypesLoaded`. */
  | { kind: "readPropertyTypes" }
  /** Drive the page of browser window `window`; answered by `browserEvent`. */
  | { kind: "browser"; window: WindowId; op: BrowserOp }
  /** Count the pages of the PDF at `path`; answered by `pdfInfo` with the same stamp. */
  | { kind: "pdfInfo"; path: string; stamp: Stamp }
  /** Read the PDF's text per page; answered by `pdfText`. */
  | { kind: "pdfText"; path: string; stamp: Stamp }
  /** Read one page's words and boxes; answered by `pdfLayout`. */
  | { kind: "pdfLayout"; path: string; stamp: Stamp; page: number }
  /** Read the PDF's table of contents; answered by `pdfOutline`. */
  | { kind: "pdfOutline"; path: string; stamp: Stamp }
  /** Read the schema of the SQLite database at `path`; answered by `sqliteSchema`. */
  | { kind: "sqliteSchema"; path: string; stamp: Stamp; gen: number }
  /** Read rows of `source` from `offset` for window `window`; answered by `sqlitePage`. */
  | {
      kind: "sqlitePage";
      path: string;
      gen: number;
      window: WindowId;
      source: SqliteSource;
      offset: number;
    }
  /** Count the rows of table `table`; answered by `sqliteCount`. */
  | { kind: "sqliteCount"; path: string; gen: number; table: string }
  /** Whether `sql` would run on the database at `path`; answered by `sqliteChecked`. */
  | { kind: "sqliteCheck"; path: string; gen: number; sql: string }
  /** Read the annotations file of PDF `pdf`; answered by `annotationsRead`. */
  | { kind: "readAnnotations"; pdf: string }
  /** Replace the annotations file of PDF `pdf`; only a failure is answered. */
  | { kind: "writeAnnotations"; pdf: string; text: string }
  /** Move the annotations of a PDF or folder from `from` to `to`, if any. */
  | { kind: "moveAnnotations"; from: string; to: string; dir: boolean }
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
    }
  /** Send `op` for `path` to server `key`; answered by `lspResult` with `id`. */
  | { kind: "lsp"; id: number; key: ServerKey; path: string; op: LspOp }
  | { kind: "lspCancel"; id: number; key: ServerKey }
  /** Answer the server's edit request `requestId`. */
  | {
      kind: "lspReply";
      key: ServerKey;
      requestId: number | string;
      applied: boolean;
      failureReason?: string;
    }
  | { kind: "lspRestart"; keys: ServerKey[] }
  /** Read the status of the workspace's part of the repository; answered by `gitStatus`. */
  | { kind: "gitStatus"; repo: RepoInfo; prefix: string }
  /** Read the index entry of `path` (`repoPath` from the top); answered by `gitIndexRead`. */
  | { kind: "gitReadIndex"; repo: RepoInfo; path: string; repoPath: string }
  /**
   * Apply `patch` to the index entry, only while its oid is `expectedOid`;
   * `null` marks an untracked file to add with intent-to-add first.
   * Answered by `gitStaged`, which echoes `report`.
   */
  | {
      kind: "gitStage";
      repo: RepoInfo;
      path: string;
      repoPath: string;
      expectedOid: string | null;
      patch: string;
      report: StageReport;
    }
  /** Blame 0-based `line` of `contents` (the unsaved buffer); answered by `gitBlamed`. */
  | {
      kind: "gitBlame";
      repo: RepoInfo;
      path: string;
      repoPath: string;
      line: number;
      contents: string;
    }
  /** Watch the first level of these folders; a change answers `gitDirChanged`. */
  | { kind: "gitWatch"; dirs: string[] }
  /** Hand the terminal to `argv` in `cwd`; answered by `toolExited`. */
  | { kind: "runTool"; argv: string[]; cwd: string };

/** What every reducer returns. */
export type Result = { state: AppState; effects: Effect[] };

/**
 * What a browser window asks of its page. `open` shows the workspace file
 * `path` (starting Chrome and the tab when needed); `copy` reads the page's
 * selection, answered by a `selection` event.
 */
export type BrowserOp =
  | { op: "open"; path: string; size: PageSize }
  | { op: "close" }
  | { op: "resize"; size: PageSize }
  | { op: "input"; input: PageInput }
  | { op: "back" }
  | { op: "forward" }
  | { op: "reload" }
  | { op: "copy" };

/** What the browser host reports about one window's page. */
export type BrowserEvent =
  | { kind: "status"; status: BrowserStatus }
  | { kind: "page"; url: string; title: string; loading: boolean }
  | { kind: "selection"; text: string }
  /** After a click: whether the page's focus is now on a field that takes typing. */
  | { kind: "focus"; editable: boolean };
