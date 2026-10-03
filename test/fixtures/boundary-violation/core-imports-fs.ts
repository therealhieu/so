// Checked as if at src/core/state/x.ts: core must not import I/O.
import { readFileSync } from "node:fs";

export const read = readFileSync;
