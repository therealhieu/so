import type { GitState } from "./types";

/** No repository until discovery answers. */
export const initialGit: GitState = { repo: null, status: null, files: {} };
