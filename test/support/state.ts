import {
  EditorKindRegistry,
  FileTypeRegistry,
  textFileType,
} from "../../src/core/filetypes/registry";
import { defaultBindings } from "../../src/core/kernel/commands/defaults";
import { Keymap } from "../../src/core/kernel/commands/keymap";
import { CommandRegistry } from "../../src/core/kernel/commands/registry";
import { UndoHistory } from "../../src/core/kernel/editor/undo";
import { createTextBuffer } from "../../src/core/kernel/text/text-buffer";
import { codeFileTypes } from "../../src/core/lang/code/file-types";
import { markdownFileType } from "../../src/core/lang/markdown/file-type";
import { initialState } from "../../src/core/state/init";
import type { AppState, Stamp, TextFile } from "../../src/core/state/types";
import type { Registries } from "../../src/core/state/update";

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
  const commands: Registries["commands"] = new CommandRegistry();
  const keymap = new Keymap();
  for (const b of defaultBindings) keymap.bind(b.scope, b.seq, b.id);
  return {
    fileTypes,
    editorKinds: new EditorKindRegistry(),
    commands,
    keymap,
  };
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

export const fresh = (): AppState => initialState(boot);

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
