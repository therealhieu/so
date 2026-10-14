/**
 * The one statement in `sql`, without a trailing `;`, or why it cannot run:
 * empty, or more than one statement. Quotes (`'…'`, `"…"`, `` `…` ``,
 * `[…]`) and comments (`-- …`, `/* … *\/`) are skipped, so a `;` inside them
 * does not end the statement.
 */
export function oneStatement(sql: string): { sql: string } | { error: string } {
  let end: number | undefined;
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    const close =
      c === "'" || c === '"' || c === "`" ? c : c === "[" ? "]" : undefined;
    if (close !== undefined) {
      const j = sql.indexOf(close, i + 1);
      i = j < 0 ? sql.length : j + 1;
      continue;
    }
    if (c === "-" && sql[i + 1] === "-") {
      const j = sql.indexOf("\n", i);
      i = j < 0 ? sql.length : j + 1;
      continue;
    }
    if (c === "/" && sql[i + 1] === "*") {
      const j = sql.indexOf("*/", i + 2);
      i = j < 0 ? sql.length : j + 2;
      continue;
    }
    if (c === ";") {
      end ??= i;
    } else if (end !== undefined && !/\s/.test(c ?? "")) {
      return { error: "Run one statement at a time" };
    }
    i++;
  }
  const one = sql.slice(0, end).trim();
  return one === "" ? { error: "Nothing to run" } : { sql: one };
}

/**
 * Whether `sql` can be read a page at a time by wrapping it:
 * `SELECT * FROM (sql) LIMIT … OFFSET …`. `PRAGMA` and `EXPLAIN` cannot.
 */
export const pageable = (sql: string): boolean =>
  /^(select|with|values)\b/i.test(stripLead(sql));

/** `sql` without the comments and blanks before its first word. */
function stripLead(sql: string): string {
  let s = sql.trimStart();
  for (;;) {
    if (s.startsWith("--")) {
      const j = s.indexOf("\n");
      s = j < 0 ? "" : s.slice(j + 1).trimStart();
    } else if (s.startsWith("/*")) {
      const j = s.indexOf("*/");
      s = j < 0 ? "" : s.slice(j + 2).trimStart();
    } else return s;
  }
}

/** `name` as a quoted SQL identifier. */
export const quoteIdent = (name: string): string =>
  `"${name.replaceAll('"', '""')}"`;
