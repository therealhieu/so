import type { AppState, Result } from "./types";
import type { Registries } from "./update";

/** What a built-in command reads; commands are pure. */
export type CommandContext = {
  state: AppState;
  now: number;
  args?: string;
  reg: Registries;
};
export type CommandResult = Result;
