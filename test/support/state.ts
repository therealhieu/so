import { baseEmbedRenderer } from "../../src/core/features/bases/embed";
import {
  baseEditorKind,
  baseFileType,
} from "../../src/core/features/bases/file-type";
import { KANBAN_TYPE } from "../../src/core/features/bases/types";
import {
  BaseLayoutRegistry,
  boardLayout,
  tableLayout,
} from "../../src/core/features/bases/views";
import {
  pdfEditorKind,
  pdfFileType,
} from "../../src/core/features/pdf/file-type";
import {
  sqliteEditorKind,
  sqliteFileType,
} from "../../src/core/features/sqlite/file-type";
import {
  EditorKindRegistry,
  FileTypeRegistry,
  textFileType,
} from "../../src/core/filetypes/registry";
import {
  defaultBindings,
  defaultGroups,
} from "../../src/core/kernel/commands/defaults";
import { CommandRegistry } from "../../src/core/kernel/commands/registry";
import { UndoHistory } from "../../src/core/kernel/editor/undo";
import { createTextBuffer } from "../../src/core/kernel/text/text-buffer";
import { codeFileTypes } from "../../src/core/lang/code/file-types";
import { markdownFileType } from "../../src/core/lang/markdown/file-type";
import { registerBlockRenderer } from "../../src/core/lang/markdown/live-preview";
import { builtinRenderers } from "../../src/core/lang/markdown/renderers/index";
import { baseBindings, baseCommands } from "../../src/core/state/base-commands";
import { baseEmbedModel, baseViewModel } from "../../src/core/state/base-model";
import { bufferBindings } from "../../src/core/state/buffer-commands";
import { registerBuiltins } from "../../src/core/state/commands";
import { EmbedModelRegistry } from "../../src/core/state/embed-models";
import {
  gitBindings,
  gitCommands,
  gitGroups,
} from "../../src/core/state/git-commands";
import { initialState } from "../../src/core/state/init";
import { editorBindings, nextLineCommand } from "../../src/core/state/keys";
import {
  linkBindings,
  linkCommands,
  linkGroups,
} from "../../src/core/state/link-commands";
import {
  lspBindings,
  lspCommands,
  lspGroups,
} from "../../src/core/state/lsp-commands";
import {
  markdownBindings,
  markdownCommands,
} from "../../src/core/state/markdown-commands";
import { markdownViewContextFor } from "../../src/core/state/markdown-view";
import {
  noteBindings,
  noteCommands,
  noteGroups,
} from "../../src/core/state/note-commands";
import { pdfBindings, pdfCommands } from "../../src/core/state/pdf";
import {
  pdfAnnotateBindings,
  pdfAnnotateCommands,
} from "../../src/core/state/pdf-annotate";
import {
  pdfSelectBindings,
  pdfSelectCommands,
} from "../../src/core/state/pdf-select";
import {
  pdfGroups,
  pdfToolBindings,
  pdfToolCommands,
} from "../../src/core/state/pdf-tools";
import { sqliteBindings, sqliteCommands } from "../../src/core/state/sqlite";
import type { AppState, Stamp, TextFile } from "../../src/core/state/types";
import type { Registries } from "../../src/core/state/update";
import { ViewContextRegistry } from "../../src/core/state/view-context";

export const boot = {
  root: "/ws",
  cols: 100,
  rows: 24,
  color: "color",
} as const;

/** The registries `main` builds, with every built-in command and binding. */
export function testRegistries(): Registries {
  const fileTypes = new FileTypeRegistry(textFileType);
  for (const ft of codeFileTypes) fileTypes.register(ft);
  fileTypes.register(markdownFileType);
  fileTypes.register(baseFileType);
  fileTypes.register(pdfFileType);
  fileTypes.register(sqliteFileType);
  const editorKinds = new EditorKindRegistry();
  editorKinds.register(baseEditorKind);
  editorKinds.register(pdfEditorKind);
  editorKinds.register(sqliteEditorKind);
  const commands: Registries["commands"] = new CommandRegistry();
  registerBuiltins(commands);
  for (const c of linkCommands) commands.register(c);
  for (const c of markdownCommands) commands.register(c);
  for (const c of noteCommands) commands.register(c);
  for (const c of baseCommands) commands.register(c);
  for (const c of pdfCommands) commands.register(c);
  for (const c of pdfToolCommands) commands.register(c);
  for (const c of pdfSelectCommands) commands.register(c);
  for (const c of pdfAnnotateCommands) commands.register(c);
  for (const c of sqliteCommands) commands.register(c);
  for (const c of lspCommands) commands.register(c);
  for (const c of gitCommands) commands.register(c);
  commands.register(nextLineCommand);
  const viewContexts = new ViewContextRegistry();
  const embedModels = new EmbedModelRegistry();
  builtinRenderers();
  const layouts = new BaseLayoutRegistry(tableLayout);
  if (KANBAN_TYPE !== undefined) layouts.register(KANBAN_TYPE, boardLayout);
  layouts.register("kanban-test", boardLayout);
  const reg: Registries = {
    fileTypes,
    editorKinds,
    commands,
    bindings: [
      ...defaultBindings,
      ...bufferBindings,
      ...editorBindings,
      ...linkBindings,
      ...markdownBindings,
      ...noteBindings,
      ...baseBindings,
      ...pdfBindings,
      ...pdfToolBindings,
      ...pdfSelectBindings,
      ...pdfAnnotateBindings,
      ...sqliteBindings,
      ...lspBindings,
      ...gitBindings,
    ],
    groups: {
      ...defaultGroups,
      ...linkGroups,
      ...noteGroups,
      ...lspGroups,
      ...gitGroups,
      ...pdfGroups,
    },
    viewContexts,
    embedModels,
    layouts,
  };
  viewContexts.register("markdown", markdownViewContextFor(reg));
  viewContexts.register("base", (s, id) => baseViewModel(s, id, reg));
  embedModels.register("base", baseEmbedModel);
  registerBlockRenderer("base", baseEmbedRenderer);
  return reg;
}

export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

export const stamp = (n: number): Stamp => ({
  mtimeMs: n,
  size: n,
  hash: `h${n}`,
});

export const textFile = (text: string, n = 1): TextFile => ({
  text,
  bom: false,
  eol: text.includes("\r\n") ? "\r\n" : "\n",
  stamp: stamp(n),
});

/** `s` with notes opening in the editable `live` view, which most suites type into. */
export const editingNotes = (s: AppState): AppState => ({
  ...s,
  config: { ...s.config, preview: { ...s.config.preview, mode: "live" } },
});

/**
 * `config` with the explorer docked left, the layout most suites measure
 * columns against; suites about the edge set `position` themselves.
 */
export const explorerLeft = <C extends AppState["config"]>(config: C): C => ({
  ...config,
  explorer: { ...config.explorer, position: "left" },
});

/**
 * The state most suites start from: notes editable, the explorer left, and
 * yanks and puts kept in so's registers (suites about the clipboard turn
 * `editor.clipboard` back on).
 */
export const fresh = (): AppState => {
  const s = editingNotes(initialState(boot));
  const config = explorerLeft(s.config);
  return {
    ...s,
    config: { ...config, editor: { ...config.editor, clipboard: false } },
  };
};

/** A fresh state with the shipped config, where notes open in `reading`. */
export const freshDefaults = (): AppState => initialState(boot);

/**
 * Open `text` as a clean buffer saved with `stamp(1)` and show it in the
 * active window; `text` gets a final newline on disk.
 */
export function openBuffer(s: AppState, path: string, text: string): AppState {
  const id = s.nextBufferId;
  return {
    ...s,
    buffers: {
      ...s.buffers,
      [id]: {
        id,
        path,
        fileType: "markdown",
        view: "source",
        text: createTextBuffer(text),
        undo: new UndoHistory(),
        bom: false,
        eol: "\n",
        finalNewline: true,
        stamp: stamp(1),
        savedVersion: 0,
        dirty: false,
        disk: "present",
        save: { kind: "idle" },
      },
    },
    nextBufferId: id + 1,
    windows: {
      ...s.windows,
      byId: {
        ...s.windows.byId,
        [s.windows.active]: {
          id: s.windows.active,
          content: {
            editor: "text",
            bufferId: id,
            cursor: { line: 0, col: 0 },
            scroll: 0,
          },
        },
      },
    },
  };
}
