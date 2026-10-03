import type { Mode } from "../commands/keymap";
import { type RegisterName, Registers } from "../editor/registers";
import type { Key } from "./keys";
import { motions } from "./motions";
import { textObjects } from "./text-objects";

/**
 * A complete command. `target` is a motion ("w", "gg", "f"), a text object
 * ("iw"), an action ("x", "p", "."), or the operator itself for "dd"/"yy".
 * Visual-mode operators have no target. `keys` omit counts, for `.`.
 */
export type ParsedCommand = {
  count?: number;
  register?: RegisterName;
  op?: string;
  target?: string;
  char?: string;
  keys: Key[];
};

export type ParseResult =
  | { kind: "incomplete" }
  | { kind: "invalid" }
  | { kind: "command"; command: ParsedCommand };

const OPERATORS = new Set(["d", "c", "y", ">", "<"]);
const FINDS = new Set(["f", "F", "t", "T"]);
const NORMAL_ACTIONS = new Set([
  "x",
  "X",
  "p",
  "P",
  "J",
  "~",
  "o",
  "O",
  "A",
  "I",
  "i",
  "a",
  "Y",
  "u",
  "<C-r>",
  ".",
  "v",
  "V",
  ":",
  "/",
  "?",
  "<Esc>",
]);
const VISUAL_ACTIONS = new Set([
  "x",
  "p",
  "P",
  "J",
  "~",
  "o",
  "v",
  "V",
  "<Esc>",
]);

const INCOMPLETE = { kind: "incomplete" } as const;
const INVALID = { kind: "invalid" } as const;

/** A key usable as a character argument (f, t, r): one character, or <Tab>. */
const charOf = (k: Key): string | undefined =>
  k === "<Tab>" ? "\t" : [...k].length === 1 ? k : undefined;

/** Parse pending keys into a command for Normal or Visual mode. */
export function parseKeys(keys: readonly Key[], mode: Mode): ParseResult {
  const visual = mode === "visual" || mode === "visualLine";
  const body: Key[] = [];
  let i = 0;
  let register: RegisterName | undefined;
  let count: number | undefined;
  const readCount = () => {
    let n: number | undefined;
    for (let k = keys[i]; k !== undefined; k = keys[i]) {
      if (!/^[0-9]$/.test(k) || (k === "0" && n === undefined)) break;
      n = Math.min((n ?? 0) * 10 + Number(k), 99999);
      i++;
    }
    return n;
  };
  for (;;) {
    const n = readCount();
    if (n !== undefined) count = (count ?? 1) * n;
    if (keys[i] !== '"') break;
    const name = keys[i + 1];
    if (name === undefined) return INCOMPLETE;
    if (!Registers.isName(name)) return INVALID;
    register = name;
    body.push('"', name);
    i += 2;
  }
  const k = keys[i++];
  if (k === undefined) return INCOMPLETE;
  const done = (
    rest: Omit<ParsedCommand, "keys" | "count" | "register">,
    used: Key[],
  ) => {
    const command: ParsedCommand = { ...rest, keys: [...body, ...used] };
    if (count !== undefined) command.count = count;
    if (register !== undefined) command.register = register;
    return { kind: "command", command } as const;
  };
  const withChar = (
    rest: Omit<ParsedCommand, "keys" | "count" | "register" | "char">,
    used: Key[],
  ) => {
    const c = keys[i];
    if (c === undefined) return INCOMPLETE;
    const char = charOf(c);
    return char === undefined ? INVALID : done({ ...rest, char }, [...used, c]);
  };
  const object = (rest: { op?: string }, used: Key[]) => {
    const c = keys[i];
    if (c === undefined) return INCOMPLETE;
    const target = (used.at(-1) ?? "") + c;
    return textObjects[target]
      ? done({ ...rest, target }, [...used, c])
      : INVALID;
  };
  const motion = (m: Key, rest: { op?: string }, used: Key[]): ParseResult => {
    if (m === "g") {
      const g = keys[i];
      if (g === undefined) return INCOMPLETE;
      return g === "g"
        ? done({ ...rest, target: "gg" }, [...used, "g"])
        : INVALID;
    }
    if (FINDS.has(m)) return withChar({ ...rest, target: m }, used);
    return motions[m] ? done({ ...rest, target: m }, used) : INVALID;
  };

  if (visual) {
    if (k === "i" || k === "a") return object({}, [k]);
    if (k === "r") return withChar({ target: "r" }, [k]);
    if (OPERATORS.has(k)) return done({ op: k }, [k]);
    if (VISUAL_ACTIONS.has(k)) return done({ target: k }, [k]);
    return motion(k, {}, [k]);
  }
  if (OPERATORS.has(k)) {
    const n = readCount();
    if (n !== undefined) count = (count ?? 1) * n;
    const t = keys[i++];
    if (t === undefined) return INCOMPLETE;
    if (t === k) return done({ op: k, target: k }, [k, t]);
    if (t === "i" || t === "a") return object({ op: k }, [k, t]);
    return motion(t, { op: k }, [k, t]);
  }
  if (k === "r") return withChar({ target: "r" }, [k]);
  if (NORMAL_ACTIONS.has(k)) return done({ target: k }, [k]);
  return motion(k, {}, [k]);
}
