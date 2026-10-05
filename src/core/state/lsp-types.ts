import type { Pos, Range } from "../kernel/text/pos";
import type { Diagnostic } from "../kernel/view/diagnostics";

/** `${name}@${root}`, or `${name}@` for files with no project root. */
export type ServerKey = string;

export type LspFeature =
  | "hover"
  | "definition"
  | "implementation"
  | "references"
  | "symbols"
  | "completion"
  | "completionResolve"
  | "signature"
  | "rename"
  | "prepareRename"
  | "codeActions"
  | "codeActionResolve"
  | "format"
  | "rangeFormat"
  | "executeCommand";

/**
 * One server for one root. `missing`: its binary resolved nowhere;
 * `unavailable`: it ended before initializing, with `reason`. Neither is
 * ever attached.
 */
export type ServerView = {
  name: string;
  /** Absent for the server of files with no project root. */
  root?: string;
  state: "missing" | "unavailable" | "starting" | "ready" | "failed";
  reason?: string;
  progress?: string;
  features: readonly LspFeature[];
  /** The server answers diagnostic pulls. */
  pullDiagnostics: boolean;
  completionTriggers: readonly string[];
  signatureTriggers: readonly string[];
};

/** A workspace-relative location. */
export type CodeLocation = { path: string; range: Range };
export type CodeSymbol = {
  name: string;
  kind: string;
  range: Range;
  depth: number;
};
export type CodeTextEdit = { range: Range; text: string };
/** Edits per file, with the document version they apply to; `outside` counts refused files outside the workspace. */
export type CodeEdit = {
  files: { path: string; version?: number; edits: CodeTextEdit[] }[];
  outside: number;
};
/**
 * A completion item. `cursor` is the cursor offset inside the inserted text;
 * `command` runs after the edits; `data` goes back to the server unread.
 */
export type CodeCompletionItem = {
  label: string;
  detail?: string;
  kind?: string;
  filterText: string;
  sortText: string;
  edit?: CodeTextEdit;
  insertText?: string;
  cursor?: number;
  additional: CodeTextEdit[];
  command?: unknown;
  resolved: boolean;
  data: unknown;
};
/** A code action; `command` and `data` go back to the server unread. */
export type CodeAction = {
  title: string;
  kind?: string;
  edit?: CodeEdit;
  command?: unknown;
  resolved: boolean;
  data: unknown;
};

/** A request in flight; `auto` marks one the user did not ask for, whose errors stay silent. */
export type PendingRequest = {
  feature: LspFeature;
  key: ServerKey;
  path: string;
  version: number;
  window: number;
  pos?: Pos;
  auto: boolean;
};
/** A non-modal float anchored at `at` in `window`. */
export type LspFloat = {
  kind: "hover" | "signature" | "diagnostics";
  window: number;
  at: Pos;
  lines: string[];
  active?: { line: number; start: number; end: number };
};
/** A workspace edit in progress: files still to apply, applied, and skipped. */
export type CodeEditBatch = {
  batch: number;
  pending: string[];
  updated: string[];
  skipped: { path: string; reason: string }[];
  /** The server request the edit answers. */
  reply?: { key: ServerKey; requestId: number | string };
};
/** Pushed and pulled diagnostics of one server for one path, kept apart. */
export type DiagnosticSlots = { push?: Diagnostic[]; pull?: Diagnostic[] };
/** A completion accept waiting for the item to resolve. */
export type CodeAccept = {
  id: number;
  item: CodeCompletionItem;
  path: string;
  version: number;
};

export type LspState = {
  servers: Record<ServerKey, ServerView>;
  /** Servers attached to each path, in routing order. */
  attached: Record<string, ServerKey[]>;
  diagnostics: Record<string, Record<ServerKey, DiagnosticSlots>>;
  /** What views draw for each path; frozen while inserting. */
  shown: Record<string, Diagnostic[]>;
  pending: Record<number, PendingRequest>;
  nextId: number;
  float?: LspFloat;
  list?: { title: string; items: CodeLocation[] };
  symbols?: { path: string; items: CodeSymbol[] };
  actions?: { key: ServerKey; path: string; items: CodeAction[] };
  edit?: CodeEditBatch;
  format?: { bufferId: number; requestId: number };
  accept?: CodeAccept;
};
