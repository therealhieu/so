import { isAbsolute, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ResponseError } from "vscode-jsonrpc";
import {
  type Command,
  type CompletionItem,
  type CompletionList,
  type DocumentSymbol,
  type Hover,
  type Location,
  type LocationLink,
  LSPErrorCodes,
  type CodeAction as LspCodeAction,
  type Diagnostic as LspDiagnostic,
  type Range as LspRange,
  type MarkedString,
  type MarkupContent,
  type Position,
  type PrepareRenameResult,
  type ServerCapabilities,
  type SignatureHelp,
  type SymbolInformation,
  type TextEdit,
  type WorkspaceEdit,
} from "vscode-languageserver-protocol";
import type { Pos, Range } from "../../core/kernel/text/pos";
import type {
  Diagnostic,
  DiagnosticSeverity,
} from "../../core/kernel/view/diagnostics";
import type { InlayHint } from "../../core/kernel/view/inlay-hints";
import type {
  CodeAction,
  CodeCompletionItem,
  CodeEdit,
  CodeSymbol,
  CodeTextEdit,
  LspFeature,
  LspResult,
  ServerView,
  WorkspaceSymbol,
} from "../../core/state/lsp-types";

const NONE: LspResult = { kind: "none" };

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** The `file:` URI of workspace path `path`. */
export function pathToUri(root: string, path: string): string {
  return pathToFileURL(join(root, path)).href;
}

/** The workspace path of a `file:` URI inside `root`; undefined for anything else. */
export function uriToPath(root: string, uri: string): string | undefined {
  if (!uri.startsWith("file:")) return undefined;
  let abs: string;
  try {
    abs = fileURLToPath(uri);
  } catch {
    return undefined;
  }
  const rel = relative(root, abs);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) return undefined;
  return rel.split("\\").join("/");
}

export const toLspPosition = (p: Pos): Position => ({
  line: p.line,
  character: p.col,
});

export const toLspRange = (r: Range): LspRange => ({
  start: toLspPosition(r.start),
  end: toLspPosition(r.end),
});

const isIndex = (n: unknown): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= 0;

function toPos(p: unknown): Pos | undefined {
  if (!isObject(p) || !isIndex(p.line) || !isIndex(p.character))
    return undefined;
  return { line: p.line, col: p.character };
}

function toRange(r: unknown): Range | undefined {
  if (!isObject(r)) return undefined;
  const start = toPos(r.start);
  const end = toPos(r.end);
  return start === undefined || end === undefined ? undefined : { start, end };
}

function toTextEdit(e: unknown): CodeTextEdit | undefined {
  if (!isObject(e)) return undefined;
  const range = toRange(e.range);
  // A 3.18 snippet edit carries its text as a snippet.
  const snippet = isObject(e.snippet) ? e.snippet.value : undefined;
  const text =
    typeof e.newText === "string"
      ? e.newText
      : typeof snippet === "string"
        ? flattenSnippet(snippet).text
        : undefined;
  return range === undefined || text === undefined
    ? undefined
    : { range, text };
}

/** A server diagnostic; undefined when its range or message is malformed. */
export function toDiagnostic(d: LspDiagnostic): Diagnostic | undefined {
  const range = toRange(d.range);
  if (range === undefined || typeof d.message !== "string") return undefined;
  const severity: DiagnosticSeverity =
    d.severity === 2 || d.severity === 3 || d.severity === 4 ? d.severity : 1;
  const out: Diagnostic = { range, severity, message: d.message };
  if (typeof d.source === "string") out.source = d.source;
  if (typeof d.code === "string" || typeof d.code === "number")
    out.code = String(d.code);
  return out;
}

/** A diagnostic as a server sends it, for code action requests. */
export function toLspDiagnostic(d: Diagnostic): LspDiagnostic {
  return {
    range: toLspRange(d.range),
    severity: d.severity,
    message: d.message,
    ...(d.source === undefined ? {} : { source: d.source }),
    ...(d.code === undefined ? {} : { code: d.code }),
  };
}

/** Locations inside the workspace; the rest are counted in `outside`. */
export function toLocations(
  root: string,
  r: Location | Location[] | LocationLink[] | null | undefined,
): LspResult {
  const list: unknown[] = r == null ? [] : Array.isArray(r) ? r : [r];
  const items: { path: string; range: Range }[] = [];
  let outside = 0;
  for (const l of list) {
    if (!isObject(l)) continue;
    const uri = typeof l.uri === "string" ? l.uri : l.targetUri;
    const range = toRange("uri" in l ? l.range : l.targetSelectionRange);
    if (typeof uri !== "string" || range === undefined) continue;
    const path = uriToPath(root, uri);
    if (path === undefined) outside++;
    else items.push({ path, range });
  }
  return { kind: "locations", items, outside };
}

const SYMBOL_KINDS = [
  "File",
  "Module",
  "Namespace",
  "Package",
  "Class",
  "Method",
  "Property",
  "Field",
  "Constructor",
  "Enum",
  "Interface",
  "Function",
  "Variable",
  "Constant",
  "String",
  "Number",
  "Boolean",
  "Array",
  "Object",
  "Key",
  "Null",
  "EnumMember",
  "Struct",
  "Event",
  "Operator",
  "TypeParameter",
];

const kindName = (names: readonly string[], kind: unknown) =>
  typeof kind === "number" ? names[kind - 1] : undefined;

/** Document symbols as a flat list in tree order, with their depth. */
export function toSymbols(
  r: DocumentSymbol[] | SymbolInformation[] | null | undefined,
): LspResult {
  const items: CodeSymbol[] = [];
  const walk = (list: unknown, depth: number) => {
    if (!Array.isArray(list)) return;
    for (const s of list) {
      if (!isObject(s) || typeof s.name !== "string") continue;
      const range = toRange(
        "selectionRange" in s
          ? s.selectionRange
          : isObject(s.location)
            ? s.location.range
            : undefined,
      );
      if (range === undefined) continue;
      items.push({
        name: s.name,
        kind: kindName(SYMBOL_KINDS, s.kind) ?? "Symbol",
        range,
        depth,
      });
      walk(s.children, depth + 1);
    }
  };
  walk(r, 0);
  return { kind: "symbols", items };
}

/** The ranges of a document highlight answer; none when there are no uses. */
export function toHighlights(r: unknown): LspResult {
  if (!Array.isArray(r)) return NONE;
  const ranges = r.flatMap((h) => {
    const range = isObject(h) ? toRange(h.range) : undefined;
    return range === undefined ? [] : [range];
  });
  return ranges.length === 0 ? NONE : { kind: "highlights", ranges };
}

/**
 * Inlay hints as plain labels: label parts are joined, and `paddingLeft` /
 * `paddingRight` become spaces. Hints without a position or text are dropped.
 */
export function toInlayHints(r: unknown): InlayHint[] {
  if (!Array.isArray(r)) return [];
  const out: InlayHint[] = [];
  for (const h of r) {
    if (!isObject(h)) continue;
    const pos = toPos(h.position);
    const text =
      typeof h.label === "string"
        ? h.label
        : Array.isArray(h.label)
          ? h.label
              .map((p) =>
                isObject(p) && typeof p.value === "string" ? p.value : "",
              )
              .join("")
          : "";
    if (pos === undefined || text === "") continue;
    const label = `${h.paddingLeft === true ? " " : ""}${text.replace(/\s+/g, " ")}${h.paddingRight === true ? " " : ""}`;
    out.push({ pos, label });
  }
  return out;
}

/** Workspace symbols with a range inside the workspace; others are dropped. */
export function toWorkspaceSymbols(root: string, r: unknown): LspResult {
  const items: WorkspaceSymbol[] = [];
  for (const s of Array.isArray(r) ? r : []) {
    if (!isObject(s) || typeof s.name !== "string" || !isObject(s.location))
      continue;
    const { uri } = s.location;
    const range = toRange(s.location.range);
    const path = typeof uri === "string" ? uriToPath(root, uri) : undefined;
    if (path === undefined || range === undefined) continue;
    items.push({
      name: s.name,
      kind: kindName(SYMBOL_KINDS, s.kind) ?? "Symbol",
      path,
      range,
    });
  }
  return { kind: "workspaceSymbols", items };
}

const COMPLETION_KINDS = [
  "Text",
  "Method",
  "Function",
  "Constructor",
  "Field",
  "Variable",
  "Class",
  "Interface",
  "Module",
  "Property",
  "Unit",
  "Value",
  "Enum",
  "Keyword",
  "Snippet",
  "Color",
  "File",
  "Reference",
  "Folder",
  "EnumMember",
  "Constant",
  "Struct",
  "Event",
  "Operator",
  "TypeParameter",
];

/**
 * Snippet syntax to plain text: tabstops and placeholders keep their default
 * text, choices their first option, variables their default or nothing;
 * `$0` marks the cursor, and escapes are undone.
 */
export function flattenSnippet(snippet: string): {
  text: string;
  cursor?: number;
} {
  let i = 0;
  let out = "";
  let cursor: number | undefined;
  const name = () => {
    const m = /^(\d+|[A-Za-z_][A-Za-z0-9_]*)/.exec(snippet.slice(i));
    if (m === null) return undefined;
    i += m[0].length;
    return m[0];
  };
  /** Reads until an unescaped `stop` (or the end); returns whether it was found. */
  const body = (stop: string | undefined): boolean => {
    while (i < snippet.length) {
      const c = snippet[i] as string;
      if (stop !== undefined && c === stop) {
        i++;
        return true;
      }
      if (c === "\\" && i + 1 < snippet.length) {
        out += snippet[i + 1];
        i += 2;
      } else if (c === "$") {
        i++;
        element();
      } else {
        out += c;
        i++;
      }
    }
    return false;
  };
  const element = () => {
    const at = i;
    if (snippet[i] !== "{") {
      const n = name();
      if (n === undefined) out += "$";
      else if (n === "0") cursor = out.length;
      return;
    }
    i++;
    const n = name();
    if (n === undefined) {
      i = at;
      out += "$";
      return;
    }
    if (n === "0") cursor = out.length;
    const c = snippet[i];
    if (c === "}") i++;
    else if (c === ":") {
      i++;
      body("}");
    } else if (c === "|") {
      i++;
      const end = snippet.indexOf("|}", i);
      const choices = snippet.slice(i, end < 0 ? undefined : end);
      out += (choices.split(/(?<!\\),/)[0] ?? "").replace(/\\(.)/g, "$1");
      i = end < 0 ? snippet.length : end + 2;
    } else if (c === "/") {
      // A transform: the variable's value is unknown, so nothing is inserted.
      let slashes = 0;
      while (i < snippet.length && slashes < 3) {
        if (snippet[i] === "\\") i++;
        else if (snippet[i] === "/") slashes++;
        i++;
      }
      while (i < snippet.length && snippet[i] !== "}") i++;
      i++;
    } else {
      i = at;
      out += "$";
    }
  };
  body(undefined);
  return cursor === undefined ? { text: out } : { text: out, cursor };
}

type ItemDefaults = CompletionList["itemDefaults"];

/** One completion item; `data` keeps the server's item for resolving. */
export function toCompletionItem(
  raw: CompletionItem,
  defaults?: ItemDefaults,
): CodeCompletionItem | undefined {
  if (!isObject(raw) || typeof raw.label !== "string") return undefined;
  const snippet = (raw.insertTextFormat ?? defaults?.insertTextFormat) === 2;
  const flat = (t: string) => (snippet ? flattenSnippet(t) : { text: t });
  const item: CodeCompletionItem = {
    label: raw.label,
    filterText: raw.filterText ?? raw.label,
    sortText: raw.sortText ?? raw.label,
    additional: [],
    resolved: false,
    data:
      raw.data === undefined && defaults?.data !== undefined
        ? { ...raw, data: defaults.data }
        : raw,
  };
  if (typeof raw.detail === "string") item.detail = raw.detail;
  const kind = kindName(COMPLETION_KINDS, raw.kind);
  if (kind !== undefined) item.kind = kind;
  const textEdit = raw.textEdit;
  const editRange = defaults?.editRange;
  const range =
    textEdit !== undefined
      ? "range" in textEdit
        ? textEdit.range
        : textEdit.insert
      : editRange !== undefined
        ? "insert" in editRange
          ? editRange.insert
          : editRange
        : undefined;
  let cursor: number | undefined;
  if (range !== undefined) {
    const r = toRange(range);
    if (r === undefined) return undefined;
    const f = flat(
      textEdit?.newText ?? raw.textEditText ?? raw.insertText ?? raw.label,
    );
    item.edit = { range: r, text: f.text };
    cursor = f.cursor;
  } else if (typeof raw.insertText === "string") {
    const f = flat(raw.insertText);
    item.insertText = f.text;
    cursor = f.cursor;
  }
  if (cursor !== undefined) item.cursor = cursor;
  for (const e of raw.additionalTextEdits ?? []) {
    const edit = toTextEdit(e);
    if (edit === undefined) return undefined;
    item.additional.push(edit);
  }
  if (raw.command !== undefined) item.command = raw.command;
  return item;
}

/** A completion answer; items that cannot be converted are left out. */
export function toCompletion(
  r: CompletionItem[] | CompletionList | null | undefined,
): Extract<LspResult, { kind: "completion" }> {
  const list = Array.isArray(r) ? r : (r?.items ?? []);
  const defaults = Array.isArray(r) ? undefined : r?.itemDefaults;
  const items: CodeCompletionItem[] = [];
  for (const raw of list) {
    const item = toCompletionItem(raw, defaults);
    if (item !== undefined) items.push(item);
  }
  return {
    kind: "completion",
    items,
    incomplete: !Array.isArray(r) && r?.isIncomplete === true,
  };
}

/**
 * A workspace edit as edits per workspace file. Files outside the workspace,
 * or with malformed edits, are counted in `outside`, which refuses the edit.
 * File creations, renames, and deletions are not supported and are left out.
 */
export function toCodeEdit(root: string, we: WorkspaceEdit): CodeEdit {
  const files = new Map<string, CodeEdit["files"][number]>();
  let outside = 0;
  const add = (uri: unknown, version: unknown, edits: unknown) => {
    const path = typeof uri === "string" ? uriToPath(root, uri) : undefined;
    const converted = Array.isArray(edits) ? edits.map(toTextEdit) : [];
    if (
      path === undefined ||
      !Array.isArray(edits) ||
      converted.some((e) => e === undefined)
    ) {
      outside++;
      return;
    }
    const file = files.get(path) ?? { path, edits: [] };
    if (typeof version === "number" && file.version === undefined)
      file.version = version;
    file.edits.push(...(converted as CodeTextEdit[]));
    files.set(path, file);
  };
  if (Array.isArray(we.documentChanges)) {
    for (const c of we.documentChanges as unknown[])
      if (isObject(c) && isObject(c.textDocument))
        add(c.textDocument.uri, c.textDocument.version, c.edits);
  } else if (isObject(we.changes))
    for (const [uri, edits] of Object.entries(we.changes))
      add(uri, undefined, edits);
  return { files: [...files.values()], outside };
}

/** Formatting edits for `path`; nothing when there are none. */
export function toFormatEdit(
  path: string,
  edits: TextEdit[] | null | undefined,
): LspResult {
  if (edits == null || edits.length === 0) return NONE;
  const converted = edits.map(toTextEdit);
  if (converted.some((e) => e === undefined))
    return { kind: "error", message: "malformed edits" };
  return {
    kind: "edit",
    edit: { files: [{ path, edits: converted as CodeTextEdit[] }], outside: 0 },
  };
}

/** Markdown text without code fences. */
const unfenced = (md: string) =>
  md
    .split("\n")
    .filter((l) => !/^\s*(```|~~~)/.test(l))
    .join("\n");

function markedText(c: MarkupContent | MarkedString): string {
  if (typeof c === "string") return unfenced(c);
  if ("kind" in c) return c.kind === "markdown" ? unfenced(c.value) : c.value;
  return c.value;
}

/** Hover contents as plain text: Markdown fences dropped, the text kept. */
export function toHover(h: Hover | null | undefined): LspResult {
  if (!isObject(h)) return NONE;
  const parts = Array.isArray(h.contents) ? h.contents : [h.contents];
  const text = parts
    .filter((p) => typeof p === "string" || isObject(p))
    .map((p) => markedText(p).replace(/^\s*\n|\s+$/g, ""))
    .filter((t) => t !== "")
    .join("\n\n");
  return text === "" ? NONE : { kind: "hover", text };
}

/** The active signature's label, with the active parameter's span in it. */
export function toSignature(h: SignatureHelp | null | undefined): LspResult {
  if (!isObject(h) || !Array.isArray(h.signatures)) return NONE;
  const sig = h.signatures[h.activeSignature ?? 0] ?? h.signatures[0];
  if (!isObject(sig) || typeof sig.label !== "string") return NONE;
  const index = sig.activeParameter ?? h.activeParameter ?? 0;
  const param = index === null ? undefined : sig.parameters?.[index];
  const result: LspResult = { kind: "signature", label: sig.label };
  if (param === undefined) return result;
  if (typeof param.label === "string") {
    const start = sig.label.indexOf(param.label);
    if (start >= 0) result.active = { start, end: start + param.label.length };
  } else if (Array.isArray(param.label)) {
    const [start, end] = param.label;
    if (isIndex(start) && isIndex(end)) result.active = { start, end };
  }
  return result;
}

/**
 * A prepare-rename answer; `textOf(range)` reads the document, and
 * `textOf(undefined)` gives the word at the requested position.
 */
export function toPrepareRename(
  r: PrepareRenameResult | null | undefined,
  textOf: (range: Range | undefined) => string,
): LspResult {
  const o: unknown = r;
  if (!isObject(o)) return NONE;
  if (typeof o.placeholder === "string")
    return { kind: "prepareRename", placeholder: o.placeholder };
  if ("defaultBehavior" in o)
    return { kind: "prepareRename", placeholder: textOf(undefined) };
  const range = toRange("range" in o ? o.range : o);
  return range === undefined
    ? NONE
    : { kind: "prepareRename", placeholder: textOf(range) };
}

/** A code action or command; `data` keeps the server's object for resolving and running. */
export function toCodeAction(
  root: string,
  raw: LspCodeAction | Command,
): CodeAction | undefined {
  if (!isObject(raw) || typeof raw.title !== "string") return undefined;
  if (typeof raw.command === "string")
    return { title: raw.title, command: raw, resolved: true, data: raw };
  const a = raw as LspCodeAction;
  const action: CodeAction = {
    title: a.title,
    resolved: a.edit !== undefined,
    data: a,
  };
  if (typeof a.kind === "string") action.kind = a.kind;
  if (a.edit !== undefined) action.edit = toCodeEdit(root, a.edit);
  if (a.command !== undefined) action.command = a.command;
  return action;
}

export function toCodeActions(
  root: string,
  r: (LspCodeAction | Command)[] | null | undefined,
): LspResult {
  const items: CodeAction[] = [];
  for (const raw of r ?? []) {
    const a = toCodeAction(root, raw);
    if (a !== undefined) items.push(a);
  }
  return { kind: "actions", items };
}

const has = (v: unknown) => v !== undefined && v !== null && v !== false;
const option = (v: unknown, key: string) => isObject(v) && v[key] === true;
const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];

/** A ready server's view: the features its capabilities declare. */
export function toServerView(
  name: string,
  root: string | undefined,
  caps: ServerCapabilities,
): ServerView {
  const features: LspFeature[] = [];
  const add = (f: LspFeature, on: boolean) => {
    if (on) features.push(f);
  };
  add("hover", has(caps.hoverProvider));
  add("definition", has(caps.definitionProvider));
  add("declaration", has(caps.declarationProvider));
  add("typeDefinition", has(caps.typeDefinitionProvider));
  add("workspaceSymbols", has(caps.workspaceSymbolProvider));
  add("implementation", has(caps.implementationProvider));
  add("references", has(caps.referencesProvider));
  add("symbols", has(caps.documentSymbolProvider));
  add("completion", has(caps.completionProvider));
  add("completionResolve", option(caps.completionProvider, "resolveProvider"));
  add("signature", has(caps.signatureHelpProvider));
  add("rename", has(caps.renameProvider));
  add("prepareRename", option(caps.renameProvider, "prepareProvider"));
  add("codeActions", has(caps.codeActionProvider));
  add("codeActionResolve", option(caps.codeActionProvider, "resolveProvider"));
  add("format", has(caps.documentFormattingProvider));
  add("rangeFormat", has(caps.documentRangeFormattingProvider));
  add("executeCommand", has(caps.executeCommandProvider));
  add("inlayHints", has(caps.inlayHintProvider));
  add("documentHighlight", has(caps.documentHighlightProvider));
  return {
    name,
    ...(root === undefined ? {} : { root }),
    state: "ready",
    features,
    pullDiagnostics: has(caps.diagnosticProvider),
    completionTriggers: strings(caps.completionProvider?.triggerCharacters),
    signatureTriggers: strings(caps.signatureHelpProvider?.triggerCharacters),
  };
}

/** An error response as a result; ContentModified and RequestCancelled are quiet. */
export function toErrorResult(
  e: unknown,
): Extract<LspResult, { kind: "error" }> {
  if (e instanceof ResponseError) {
    const quiet =
      e.code === LSPErrorCodes.ContentModified ||
      e.code === LSPErrorCodes.RequestCancelled;
    return quiet
      ? { kind: "error", message: e.message, quiet: true }
      : { kind: "error", message: e.message };
  }
  return {
    kind: "error",
    message: e instanceof Error ? e.message : String(e),
  };
}
