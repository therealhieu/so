// @ts-nocheck — checked as if at src/core/state/x.ts; a subpath import must not bypass yaml's home.
import { parse } from "yaml/dist/index.js";

export const value = parse("a: 1");
