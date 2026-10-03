import type {
  EditorKindRegistry,
  FileTypeRegistry,
} from "../filetypes/registry";
import type { Binding } from "../kernel/commands/defaults";
import type { CommandRegistry } from "../kernel/commands/registry";
import { onFileLoaded, onFileRefused } from "./buffers";
import type { CommandContext, CommandResult } from "./commands";
import { onConfigLoaded } from "./config";
import { onFileChanged } from "./disk";
import { onDirListed, onFsResult, withTrash } from "./explorer";
import { onIndexBatch, onIndexFailed, onIndexReady } from "./index";
import { handleKeyAction, onClipboardText } from "./keys";
import { onEditsApplied } from "./link-edits";
import { none, notifyError } from "./result";
import { onSaved, onSaveFailed, onTimer } from "./save";
import {
  onStateLoaded,
  SAVE_STATE_MS,
  sessionChanged,
  snapshotSession,
} from "./session";
import type { Action, AppState, Effect, MouseEvent, Result } from "./types";

export type Update = (
  state: AppState,
  action: Action,
) => { state: AppState; effects: Effect[] };

export type Registries = {
  fileTypes: FileTypeRegistry;
  editorKinds: EditorKindRegistry;
  commands: CommandRegistry<CommandContext, CommandResult>;
  /** Built-in and registered bindings; config overrides are merged per config by `keymapFor`. */
  bindings: readonly Binding[];
  /** Which-key group labels by prefix sequence ("<leader>f" → "find"). */
  groups: Readonly<Record<string, string>>;
};

/**
 * A pure reducer over the given registries; a thrown error keeps the
 * previous state. A change to the persisted session (re)starts the save
 * debounce.
 */
export function createUpdate(reg: Registries): Update {
  const step = (state: AppState, action: Action): Result => {
    switch (action.type) {
      case "key":
        return handleKeyAction(state, action, reg);
      case "clipboardText":
        return onClipboardText(state, action, reg);
      case "fileLoaded":
        return onFileLoaded(state, action, reg);
      case "fileRefused":
        return onFileRefused(state, action);
      case "fileChanged":
        return onFileChanged(state, action.event);
      case "dirListed":
        return onDirListed(state, action);
      case "fsResult":
        return onFsResult(state, action, reg);
      case "trashAvailable":
        return none(withTrash(state, action.available));
      case "timer":
        return onTimerAction(state, action);
      case "saved":
        return onSaved(state, action);
      case "saveFailed":
        return onSaveFailed(state, action);
      case "resize":
        return onResize(state, action);
      case "mouse":
        return onMouse(state, action.event);
      case "configLoaded":
        return onConfigLoaded(state, action, reg);
      case "indexBatch":
        return onIndexBatch(state, action);
      case "indexReady":
        return onIndexReady(state);
      case "indexFailed":
        return onIndexFailed(state, action);
      case "editsApplied":
        return onEditsApplied(state, action);
      case "stateLoaded":
        return onStateLoaded(state, action);
    }
    const unhandled: never = action;
    return unhandled;
  };
  return (state, action) => {
    try {
      const r = step(state, action);
      return action.type !== "stateLoaded" && sessionChanged(state, r.state)
        ? {
            state: r.state,
            effects: [
              ...r.effects,
              { kind: "startTimer", id: "saveState", ms: SAVE_STATE_MS },
            ],
          }
        : r;
    } catch (e) {
      return { state: notifyError(state, e), effects: [] };
    }
  };
}

/** A timer fired: the session save, or a buffer or toast timer. */
function onTimerAction(
  s: AppState,
  a: Extract<Action, { type: "timer" }>,
): Result {
  if (a.id === "saveState")
    return {
      state: s,
      effects: [{ kind: "saveState", state: snapshotSession(s) }],
    };
  return onTimer(s, a);
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
