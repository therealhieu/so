// biome-ignore-all lint/suspicious/noTemplateCurlyInString: these strings are LSP snippets, not templates.
import { expect, test } from "bun:test";
import { ResponseError } from "vscode-jsonrpc";
import type {
  CompletionItem,
  WorkspaceEdit,
} from "vscode-languageserver-protocol";
import { clientCapabilities } from "./capabilities";
import {
  flattenSnippet,
  pathToUri,
  toCodeActions,
  toCodeEdit,
  toCompletion,
  toDiagnostic,
  toErrorResult,
  toFormatEdit,
  toHighlights,
  toHover,
  toInlayHints,
  toLocations,
  toLspDiagnostic,
  toPrepareRename,
  toServerView,
  toSignature,
  toSymbols,
  toWorkspaceSymbols,
  uriToPath,
} from "./convert";

const root = "/work/space";
const range = (line: number, col: number, endCol: number) => ({
  start: { line, character: col },
  end: { line, character: endCol },
});

test("workspace paths and file URIs convert both ways, and outside paths do not", () => {
  const uri = pathToUri(root, "src/a b.ts");
  expect(uri).toBe("file:///work/space/src/a%20b.ts");
  expect(uriToPath(root, uri)).toBe("src/a b.ts");
  expect(uriToPath(root, "file:///work/other/x.ts")).toBeUndefined();
  expect(uriToPath(root, "file:///work/space")).toBeUndefined();
  expect(uriToPath(root, "untitled:Untitled-1")).toBeUndefined();
  expect(
    toLocations(root, [
      { uri: pathToUri(root, "a.ts"), range: range(1, 2, 3) },
      { uri: "file:///usr/lib/std.rs", range: range(0, 0, 1) },
    ]),
  ).toEqual({
    kind: "locations",
    items: [
      {
        path: "a.ts",
        range: { start: { line: 1, col: 2 }, end: { line: 1, col: 3 } },
      },
    ],
    outside: 1,
  });
});

test("versioned document changes keep their versions and files outside the workspace are counted", () => {
  const edit: WorkspaceEdit = {
    documentChanges: [
      {
        textDocument: { uri: pathToUri(root, "a.ts"), version: 4 },
        edits: [{ range: range(0, 0, 3), newText: "foo" }],
      },
      {
        textDocument: { uri: pathToUri(root, "b.ts"), version: null },
        edits: [{ range: range(2, 1, 1), newText: "x" }],
      },
      {
        textDocument: { uri: "file:///elsewhere/c.ts", version: 1 },
        edits: [{ range: range(0, 0, 0), newText: "y" }],
      },
    ],
  };
  expect(toCodeEdit(root, edit)).toEqual({
    files: [
      {
        path: "a.ts",
        version: 4,
        edits: [
          {
            range: { start: { line: 0, col: 0 }, end: { line: 0, col: 3 } },
            text: "foo",
          },
        ],
      },
      {
        path: "b.ts",
        edits: [
          {
            range: { start: { line: 2, col: 1 }, end: { line: 2, col: 1 } },
            text: "x",
          },
        ],
      },
    ],
    outside: 1,
  });
  expect(
    toCodeEdit(root, {
      changes: {
        [pathToUri(root, "d.ts")]: [{ range: range(0, 0, 1), newText: "" }],
      },
    }).files,
  ).toEqual([
    {
      path: "d.ts",
      edits: [
        {
          range: { start: { line: 0, col: 0 }, end: { line: 0, col: 1 } },
          text: "",
        },
      ],
    },
  ]);
});

test("client capabilities advertise only supported features", () => {
  for (const snippets of [false, true]) {
    const c = clientCapabilities({ snippets });
    expect(c.textDocument?.completion?.completionItem?.snippetSupport).toBe(
      snippets,
    );
    expect(c.workspace?.workspaceEdit?.resourceOperations).toEqual([]);
    expect(c.workspace?.workspaceEdit?.documentChanges).toBe(true);
    expect(c.workspace?.workspaceEdit?.failureHandling).toBeUndefined();
    expect(c.workspace?.workspaceEdit?.changeAnnotationSupport).toBeUndefined();
    expect(c.textDocument?.codeAction?.resolveSupport?.properties).toEqual([
      "edit",
    ]);
    expect(c.textDocument?.diagnostic?.dynamicRegistration).toBe(false);
    expect(c.workspace?.diagnostics?.refreshSupport).toBe(true);
    expect(c.textDocument?.synchronization?.willSaveWaitUntil).toBeUndefined();
    expect(c.textDocument?.synchronization?.didSave).toBe(true);
    expect(c.general?.positionEncodings).toEqual(["utf-16"]);
    expect(c.workspace?.didChangeWatchedFiles?.dynamicRegistration).toBe(true);
  }
});

test("snippets become plain text with the cursor at the final stop", () => {
  expect(flattenSnippet("foo(${1:a}, $2)$0")).toEqual({
    text: "foo(a, )",
    cursor: 8,
  });
  expect(flattenSnippet("${1|x,y|}")).toEqual({ text: "x" });
  expect(flattenSnippet("\\$1")).toEqual({ text: "$1" });
  expect(flattenSnippet("$TM_FILENAME")).toEqual({ text: "" });
  expect(flattenSnippet("${1:outer ${2:inner}} $0end")).toEqual({
    text: "outer inner end",
    cursor: 12,
  });
  expect(flattenSnippet("${TM_SELECTED_TEXT:default}")).toEqual({
    text: "default",
  });
  expect(flattenSnippet("a $ b } c")).toEqual({ text: "a $ b } c" });

  const item: CompletionItem = {
    label: "push",
    kind: 2,
    insertTextFormat: 2,
    textEdit: { range: range(3, 4, 6), newText: "push(${1:value})$0" },
  };
  const r = toCompletion([item]);
  expect(r.kind).toBe("completion");
  expect(r.items[0]).toMatchObject({
    label: "push",
    kind: "Method",
    edit: {
      range: { start: { line: 3, col: 4 }, end: { line: 3, col: 6 } },
      text: "push(value)",
    },
    cursor: 11,
    resolved: false,
  });
  expect(
    toCompletion({
      isIncomplete: true,
      items: [{ label: "x", insertText: "x($1)", insertTextFormat: 2 }],
    }),
  ).toMatchObject({
    incomplete: true,
    items: [{ insertText: "x()", filterText: "x", sortText: "x" }],
  });
});

test("content-modified and cancelled errors are quiet", () => {
  expect(toErrorResult(new ResponseError(-32801, "content modified"))).toEqual({
    kind: "error",
    message: "content modified",
    quiet: true,
  });
  expect(toErrorResult(new ResponseError(-32800, "cancelled"))).toEqual({
    kind: "error",
    message: "cancelled",
    quiet: true,
  });
  expect(toErrorResult(new ResponseError(-32603, "internal"))).toEqual({
    kind: "error",
    message: "internal",
  });
  expect(toErrorResult(new Error("broken pipe"))).toEqual({
    kind: "error",
    message: "broken pipe",
  });
});

test("markdown hover text drops code fences", () => {
  expect(
    toHover({
      contents: {
        kind: "markdown",
        value: "```rust\nfn main()\n```\n\nRuns first.",
      },
    }),
  ).toEqual({ kind: "hover", text: "fn main()\n\nRuns first." });
  expect(
    toHover({ contents: [{ language: "ts", value: "let x: number" }, "doc"] }),
  ).toEqual({ kind: "hover", text: "let x: number\n\ndoc" });
  expect(toHover(null)).toEqual({ kind: "none" });
  expect(toHover({ contents: "" })).toEqual({ kind: "none" });
});

test("diagnostics keep severity, source, and code, and malformed ones are dropped", () => {
  const d = toDiagnostic({
    range: range(2, 1, 4),
    severity: 2,
    message: "unused",
    source: "ts",
    code: 6133,
  });
  expect(d).toEqual({
    range: { start: { line: 2, col: 1 }, end: { line: 2, col: 4 } },
    severity: 2,
    message: "unused",
    source: "ts",
    code: "6133",
  });
  expect(toDiagnostic({ range: range(0, 0, 1), message: "m" })?.severity).toBe(
    1,
  );
  expect(
    toDiagnostic({
      range: { start: { line: -1, character: 0 }, end: range(0, 0, 0).end },
      message: "m",
    }),
  ).toBeUndefined();
  if (d !== undefined)
    expect(toLspDiagnostic(d)).toEqual({
      range: range(2, 1, 4),
      severity: 2,
      message: "unused",
      source: "ts",
      code: "6133",
    });
});

test("symbol trees flatten with their depth", () => {
  expect(
    toSymbols([
      {
        name: "Outer",
        kind: 5,
        range: range(0, 0, 9),
        selectionRange: range(0, 6, 11),
        children: [
          {
            name: "run",
            kind: 6,
            range: range(1, 2, 9),
            selectionRange: range(1, 2, 5),
          },
        ],
      },
    ]),
  ).toEqual({
    kind: "symbols",
    items: [
      {
        name: "Outer",
        kind: "Class",
        range: { start: { line: 0, col: 6 }, end: { line: 0, col: 11 } },
        depth: 0,
      },
      {
        name: "run",
        kind: "Method",
        range: { start: { line: 1, col: 2 }, end: { line: 1, col: 5 } },
        depth: 1,
      },
    ],
  });
});

test("signature help marks the active parameter in the label", () => {
  expect(
    toSignature({
      signatures: [
        {
          label: "f(a: number, b: string)",
          parameters: [{ label: "a: number" }, { label: [13, 22] }],
        },
      ],
      activeSignature: 0,
      activeParameter: 1,
    }),
  ).toEqual({
    kind: "signature",
    label: "f(a: number, b: string)",
    active: { start: 13, end: 22 },
  });
  expect(toSignature({ signatures: [] })).toEqual({ kind: "none" });
});

test("rename preparation, formatting, and code actions convert to results", () => {
  const textOf = (r: unknown) => (r === undefined ? "word" : "ranged");
  expect(toPrepareRename(range(0, 0, 3), textOf)).toEqual({
    kind: "prepareRename",
    placeholder: "ranged",
  });
  expect(
    toPrepareRename({ range: range(0, 0, 3), placeholder: "p" }, textOf),
  ).toEqual({ kind: "prepareRename", placeholder: "p" });
  expect(toPrepareRename({ defaultBehavior: true }, textOf)).toEqual({
    kind: "prepareRename",
    placeholder: "word",
  });
  expect(toPrepareRename(null, textOf)).toEqual({ kind: "none" });

  expect(toFormatEdit("a.ts", [])).toEqual({ kind: "none" });
  expect(
    toFormatEdit("a.ts", [{ range: range(0, 0, 2), newText: "" }]),
  ).toEqual({
    kind: "edit",
    edit: {
      files: [
        {
          path: "a.ts",
          edits: [
            {
              range: { start: { line: 0, col: 0 }, end: { line: 0, col: 2 } },
              text: "",
            },
          ],
        },
      ],
      outside: 0,
    },
  });

  const command = { title: "Organize", command: "organize", arguments: [1] };
  const r = toCodeActions(root, [
    command,
    { title: "Fix", kind: "quickfix", data: { id: 3 } },
  ]);
  expect(r).toEqual({
    kind: "actions",
    items: [
      { title: "Organize", command, resolved: true, data: command },
      {
        title: "Fix",
        kind: "quickfix",
        resolved: false,
        data: { title: "Fix", kind: "quickfix", data: { id: 3 } },
      },
    ],
  });
});

test("a server's capabilities become its features and triggers", () => {
  const v = toServerView("fake", "/work/space", {
    hoverProvider: true,
    definitionProvider: { workDoneProgress: false },
    referencesProvider: false,
    completionProvider: {
      triggerCharacters: [".", ":"],
      resolveProvider: true,
    },
    signatureHelpProvider: { triggerCharacters: ["("] },
    renameProvider: { prepareProvider: true },
    codeActionProvider: true,
    documentFormattingProvider: true,
    diagnosticProvider: {
      interFileDependencies: false,
      workspaceDiagnostics: false,
    },
  });
  expect(v).toEqual({
    name: "fake",
    root: "/work/space",
    state: "ready",
    features: [
      "hover",
      "definition",
      "completion",
      "completionResolve",
      "signature",
      "rename",
      "prepareRename",
      "codeActions",
      "format",
    ],
    pullDiagnostics: true,
    completionTriggers: [".", ":"],
    signatureTriggers: ["("],
  });
  expect(toServerView("json", undefined, {}).root).toBeUndefined();
});

test("inlay hints join label parts and turn padding into spaces", () => {
  expect(
    toInlayHints([
      { position: { line: 1, character: 5 }, label: "f64", paddingLeft: true },
      {
        position: { line: 2, character: 9 },
        label: [{ value: "a" }, { value: ":" }],
        paddingRight: true,
      },
      { position: { line: 3, character: 0 }, label: "" },
      { label: "no position" },
      { position: { line: 4, character: 1 }, label: "multi\n  line" },
    ]),
  ).toEqual([
    { pos: { line: 1, col: 5 }, label: " f64" },
    { pos: { line: 2, col: 9 }, label: "a: " },
    { pos: { line: 4, col: 1 }, label: "multi line" },
  ]);
  expect(toInlayHints(null)).toEqual([]);
});

test("a server with an inlay hint provider offers inlay hints", () => {
  const view = toServerView("rs", undefined, {
    inlayHintProvider: { resolveProvider: false },
  });
  expect(view.features).toContain("inlayHints");
});

test("document highlights become ranges, and none when there are no uses", () => {
  expect(
    toHighlights([{ range: range(1, 4, 10), kind: 2 }, { kind: 1 }]),
  ).toEqual({
    kind: "highlights",
    ranges: [{ start: { line: 1, col: 4 }, end: { line: 1, col: 10 } }],
  });
  expect(toHighlights([])).toEqual({ kind: "none" });
  expect(toHighlights(null)).toEqual({ kind: "none" });
});

test("workspace symbols keep those inside the workspace with a range", () => {
  expect(
    toWorkspaceSymbols(root, [
      {
        name: "Point",
        kind: 23,
        location: {
          uri: pathToUri(root, "src/geo.rs"),
          range: range(2, 11, 16),
        },
      },
      {
        name: "Vec",
        kind: 23,
        location: { uri: "file:///rust/vec.rs", range: range(0, 0, 3) },
      },
      { name: "NoRange", kind: 12, location: { uri: pathToUri(root, "a.rs") } },
    ]),
  ).toEqual({
    kind: "workspaceSymbols",
    items: [
      {
        name: "Point",
        kind: "Struct",
        path: "src/geo.rs",
        range: { start: { line: 2, col: 11 }, end: { line: 2, col: 16 } },
      },
    ],
  });
});
