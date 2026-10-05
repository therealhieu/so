import type { ClientCapabilities } from "vscode-languageserver-protocol";

/**
 * What `so` tells a server it can do. Snippet completions are offered only
 * to servers configured with `snippets`; workspace edits never create,
 * rename, or delete files; pull diagnostics use static registration only.
 */
export function clientCapabilities(o: {
  snippets: boolean;
}): ClientCapabilities {
  return {
    general: { positionEncodings: ["utf-16"] },
    textDocument: {
      synchronization: { dynamicRegistration: false, didSave: true },
      completion: {
        completionItem: {
          snippetSupport: o.snippets,
          resolveSupport: {
            properties: ["additionalTextEdits", "detail", "documentation"],
          },
        },
        contextSupport: true,
      },
      hover: { contentFormat: ["plaintext", "markdown"] },
      signatureHelp: {
        signatureInformation: {
          parameterInformation: { labelOffsetSupport: true },
          activeParameterSupport: true,
        },
      },
      definition: {},
      declaration: {},
      typeDefinition: {},
      implementation: {},
      references: {},
      documentHighlight: {},
      documentSymbol: { hierarchicalDocumentSymbolSupport: true },
      rename: { prepareSupport: true },
      codeAction: {
        resolveSupport: { properties: ["edit"] },
        dataSupport: true,
        codeActionLiteralSupport: {
          codeActionKind: {
            valueSet: [
              "",
              "quickfix",
              "refactor",
              "refactor.extract",
              "refactor.inline",
              "refactor.rewrite",
              "source",
              "source.organizeImports",
            ],
          },
        },
      },
      formatting: {},
      rangeFormatting: {},
      publishDiagnostics: {},
      diagnostic: { dynamicRegistration: false },
      inlayHint: {},
    },
    workspace: {
      applyEdit: true,
      workspaceEdit: { documentChanges: true, resourceOperations: [] },
      configuration: true,
      didChangeConfiguration: {},
      didChangeWatchedFiles: { dynamicRegistration: true },
      workspaceFolders: true,
      symbol: {},
      diagnostics: { refreshSupport: true },
      inlayHint: { refreshSupport: true },
    },
    window: { workDoneProgress: true, showMessage: {} },
  };
}
