import type { SqliteColumn, SqliteTable } from "./types";

/** A line of the schema pane: a heading, a plain line, or a line of SQL to highlight. */
export type SchemaLine = { text: string; kind: "heading" | "text" | "sql" };

const pad = (t: string, w: number) =>
  t + " ".repeat(Math.max(0, w - [...t].length));

function columnFlags(c: SqliteColumn): string {
  const flags: string[] = [];
  if (c.pk > 0) flags.push("PRIMARY KEY");
  if (c.notNull) flags.push("NOT NULL");
  if (c.default !== null) flags.push(`DEFAULT ${c.default}`);
  if (c.generated !== undefined)
    flags.push(`GENERATED ${c.generated.toUpperCase()}`);
  return flags.join("  ");
}

/** The schema pane for `t`: its columns, its indexes, then its `CREATE` statement. */
export function schemaLines(t: SqliteTable): SchemaLine[] {
  const out: SchemaLine[] = [
    { text: `Columns (${t.columns.length})`, kind: "heading" },
  ];
  const nameW = Math.max(0, ...t.columns.map((c) => [...c.name].length));
  const typeW = Math.max(0, ...t.columns.map((c) => [...c.type].length));
  for (const c of t.columns)
    out.push({
      text: `  ${pad(c.name, nameW)}  ${pad(c.type, typeW)}  ${columnFlags(c)}`.trimEnd(),
      kind: "text",
    });
  if (t.kind === "table") {
    out.push({ text: "", kind: "text" });
    out.push({ text: `Indexes (${t.indexes.length})`, kind: "heading" });
    for (const i of t.indexes)
      out.push({
        text: `  ${i.name}${i.unique ? "  UNIQUE" : ""}  (${i.columns.join(", ")})`,
        kind: "text",
      });
  }
  out.push({ text: "", kind: "text" });
  out.push({ text: "SQL", kind: "heading" });
  for (const line of t.sql.split(/\r?\n/))
    out.push({ text: line, kind: "sql" });
  return out;
}
