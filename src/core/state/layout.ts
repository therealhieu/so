import type { TerminalState } from "./types";

type Rows = Pick<TerminalState, "rows">;

/** The statusline: the last row. */
export const statusRow = (t: Rows): number => Math.max(0, t.rows - 1);

/** Rows between the bufferline (row 0) and the statusline. */
export const bodyRows = (t: Rows): number => Math.max(0, t.rows - 2);
