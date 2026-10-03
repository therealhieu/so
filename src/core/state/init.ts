import { defaults } from "../config/schema";
import { Registers } from "../kernel/editor/registers";
import type { AppState, TerminalState } from "./types";

/** Startup state: one empty window and the explorer focused on the root. */
export function initialState(boot: {
  root: string;
  cols: number;
  rows: number;
  color: TerminalState["color"];
}): AppState {
  return {
    workspace: { root: boot.root },
    buffers: {},
    nextBufferId: 1,
    windows: {
      tree: { kind: "leaf", id: 1 },
      byId: {},
      active: 1,
      nextWindowId: 2,
    },
    vim: {
      mode: "normal",
      pending: [],
      cmdline: "",
      registers: new Registers(),
    },
    panels: {
      explorer: {
        open: true,
        focused: true,
        entries: {},
        expanded: [],
        cursor: "",
        trash: "unknown",
      },
    },
    overlay: { kind: "none" },
    notifications: { toasts: [] },
    config: defaults,
    terminal: { cols: boot.cols, rows: boot.rows, color: boot.color },
  };
}
