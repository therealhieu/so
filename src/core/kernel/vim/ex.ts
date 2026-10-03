/** A parsed command line. `:s` and `:%s` carry their parts; core/state executes them. */
export type ExCommand =
  | { cmd: string; bang: boolean; arg: string }
  | {
      cmd: "substitute";
      bang: false;
      arg: string;
      /** `:s` = current line, `:%s` = whole buffer. */
      range: "line" | "all";
      pattern: string;
      replacement: string;
      global: boolean;
    };

const SUBSTITUTE = /^s(u(b(s(t(i(t(u(te?)?)?)?)?)?)?)?)?$/;

/** Parse a command line (without ":"), e.g. "w", "q!", "e notes/a.md", "%s/a/b/g". */
export function parseEx(line: string): ExCommand | undefined {
  const m = line.trim().match(/^(%?)([a-zA-Z]+)(!?)(.*)$/s);
  if (m === null) return undefined;
  const [, range = "", cmd = "", bang = "", rest = ""] = m;
  if (SUBSTITUTE.test(cmd) && bang === "") {
    const sub = parseSubstitute(rest);
    if (sub !== undefined)
      return {
        cmd: "substitute",
        bang: false,
        arg: rest,
        range: range === "%" ? "all" : "line",
        ...sub,
      };
  }
  if (range !== "") return undefined;
  return { cmd, bang: bang === "!", arg: rest.trim() };
}

// "/pat/rep/flags" with any non-alphanumeric delimiter; "\<delim>" escapes it.
function parseSubstitute(
  rest: string,
): { pattern: string; replacement: string; global: boolean } | undefined {
  const delim = rest[0];
  if (delim === undefined || /[\w\s\\"|]/.test(delim)) return undefined;
  const parts: string[] = [""];
  for (let i = 1; i < rest.length; i++) {
    const c = rest[i] as string;
    if (c === "\\" && rest[i + 1] === delim) {
      parts[parts.length - 1] += delim;
      i++;
    } else if (c === "\\" && i + 1 < rest.length) {
      parts[parts.length - 1] += c + rest[i + 1];
      i++;
    } else if (c === delim && parts.length < 3) parts.push("");
    else parts[parts.length - 1] += c;
  }
  const [pattern = "", replacement = "", flags = ""] = parts;
  if (!/^[gcei&]*$/.test(flags.trim())) return undefined;
  return { pattern, replacement, global: flags.includes("g") };
}

/** Candidates that complete `typed`, in candidate order (ex names first, then command ids). */
export function exCompletions(
  typed: string,
  candidates: readonly string[],
): string[] {
  return candidates.filter((c) => c.startsWith(typed));
}
