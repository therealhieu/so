import type { Pos, Range } from "../kernel/text/pos";
import type { Diagnostic } from "../kernel/view/diagnostics";
import type { InlayHint } from "../kernel/view/inlay-hints";
import type { Span } from "../kernel/view/types";

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
  | "executeCommand"
  | "inlayHints"
  | "documentHighlight"
  | "declaration"
  | "typeDefinition"
  | "workspaceSymbols";

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
  /** The executable the server runs from; absent when none was found. */
  binary?: string;
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
/** A symbol found across the workspace, at a workspace-relative location. */
export type WorkspaceSymbol = CodeLocation & { name: string; kind: string };
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

/** One request to a server; each kind maps to one protocol method in the client. */
export type LspOp =
  | {
      kind:
        | "hover"
        | "definition"
        | "declaration"
        | "typeDefinition"
        | "implementation"
        | "references"
        | "signature"
        | "prepareRename"
        | "documentHighlight";
      pos: Pos;
    }
  | { kind: "symbols" }
  | { kind: "workspaceSymbols"; query: string }
  | { kind: "completion"; pos: Pos; trigger?: string }
  | { kind: "resolveCompletion"; item: CodeCompletionItem }
  | { kind: "rename"; pos: Pos; newName: string }
  | { kind: "codeActions"; range: Range; diagnostics: readonly Diagnostic[] }
  | { kind: "resolveAction"; action: CodeAction }
  | { kind: "executeCommand"; command: unknown }
  | {
      kind: "format";
      range?: Range;
      options: { tabSize: number; insertSpaces: boolean };
    };

/** A server's answer; `quiet` marks errors that are never shown (content modified, cancelled). */
export type LspResult =
  | { kind: "hover"; text: string }
  | { kind: "locations"; items: CodeLocation[]; outside: number }
  | { kind: "symbols"; items: CodeSymbol[] }
  | { kind: "completion"; items: CodeCompletionItem[]; incomplete: boolean }
  | { kind: "completionItem"; item: CodeCompletionItem }
  | {
      kind: "signature";
      label: string;
      active?: { start: number; end: number };
    }
  | { kind: "prepareRename"; placeholder: string }
  | { kind: "highlights"; ranges: Range[] }
  | { kind: "workspaceSymbols"; items: WorkspaceSymbol[] }
  | { kind: "edit"; edit: CodeEdit }
  | { kind: "actions"; items: CodeAction[] }
  | { kind: "action"; action: CodeAction }
  | { kind: "none" }
  | { kind: "error"; message: string; quiet?: boolean };

/** A request in flight; `auto` marks one the user did not ask for, whose errors stay silent. */
export type PendingRequest = {
  feature: LspFeature;
  key: ServerKey;
  path: string;
  version: number;
  window: number;
  pos?: Pos;
  auto: boolean;
  /** Asked for by the mouse pointer resting on a word. */
  pointer?: true;
};
/** A non-modal float anchored at `at` in `window`. */
export type LspFloat = {
  kind: "hover" | "signature" | "diagnostics";
  window: number;
  at: Pos;
  lines: string[];
  /** Styles of the lines that have them, by line. */
  spans?: (Span[] | undefined)[];
  /** Opened by the mouse pointer: drawn under it, closed when it leaves the word. */
  pointer?: true;
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
/**
 * A completion accept waiting for server `key` to resolve the item, with the
 * window and Insert-mode cursor it was accepted at.
 */
export type CodeAccept = {
  id: number;
  key: ServerKey;
  item: CodeCompletionItem;
  path: string;
  version: number;
  window: number;
  cursor: Pos;
};

export type LspState = {
  servers: Record<ServerKey, ServerView>;
  /** Servers attached to each path, in routing order. */
  attached: Record<string, ServerKey[]>;
  diagnostics: Record<string, Record<ServerKey, DiagnosticSlots>>;
  /** What views draw for each path; frozen while inserting. */
  shown: Record<string, Diagnostic[]>;
  /** Each server's latest inlay hints per path. */
  inlayHints: Record<string, Record<ServerKey, InlayHint[]>>;
  pending: Record<number, PendingRequest>;
  nextId: number;
  float?: LspFloat;
  list?: { title: string; items: CodeLocation[] };
  symbols?: { path: string; items: CodeSymbol[] };
  /** The latest workspace symbol search's answer. */
  workspaceSymbols?: WorkspaceSymbol[];
  actions?: { key: ServerKey; path: string; items: CodeAction[] };
  edit?: CodeEditBatch;
  format?: { bufferId: number; requestId: number };
  /** Uses of the symbol under the cursor in `path` at buffer `version`. */
  highlights?: { path: string; version: number; ranges: Range[] };
  accept?: CodeAccept;
  /** The word the mouse pointer rests on, waiting to be hovered. */
  pointer?: { window: number; pos: Pos };
};
