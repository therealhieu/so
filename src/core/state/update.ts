import type {
  EditorKindRegistry,
  FileTypeRegistry,
} from "../filetypes/registry";
import type { Keymap } from "../kernel/commands/keymap";
import type { CommandRegistry } from "../kernel/commands/registry";
import type { CommandContext, CommandResult } from "./commands";
import { none, notifyError } from "./result";
import { onSaved, onSaveFailed, onTimer } from "./save";
import type { Action, AppState, Effect, MouseEvent, Result } from "./types";

export type Update = (
  state: AppState,
  action: Action,
) => { state: AppState; effects: Effect[] };

export type Registries = {
  fileTypes: FileTypeRegistry;
  editorKinds: EditorKindRegistry;
  commands: CommandRegistry<CommandContext, CommandResult>;
  keymap: Keymap;
};

/** A pure reducer over the given registries; a thrown error keeps the previous state. */
export function createUpdate(_reg: Registries): Update {
  return (state, action) => {
    try {
      switch (action.type) {
        case "timer":
          return onTimer(state, action);
        case "saved":
          return onSaved(state, action);
        case "saveFailed":
          return onSaveFailed(state, action);
        case "resize":
          return onResize(state, action);
        case "mouse":
          return onMouse(state, action.event);
        default:
          return none(state);
      }
    } catch (e) {
      return { state: notifyError(state, e), effects: [] };
    }
  };
}

function onResize(s: AppState, a: Extract<Action, { type: "resize" }>): Result {
  return none({
    ...s,
    terminal: { ...s.terminal, cols: a.cols, rows: a.rows },
  });
}

/** Scroll the active window, keeping at least its last line on screen. */
function onMouse(s: AppState, e: MouseEvent): Result {
  const w = s.windows.byId[s.windows.active];
  const b = w && s.buffers[w.content.bufferId];
  if (w === undefined || b === undefined) return none(s);
  const scroll = Math.max(
    0,
    Math.min(w.content.scroll + e.delta, b.text.lineCount - 1),
  );
  return none({
    ...s,
    windows: {
      ...s.windows,
      byId: {
        ...s.windows.byId,
        [w.id]: { ...w, content: { ...w.content, scroll } },
      },
    },
  });
}
