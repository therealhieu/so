import type { TableCell } from "../bases/table";
import { BLOB_HEX_MAX, type SqliteCell } from "./types";

/** `n` bytes or characters, short: `512 B`, `2.3 KB`, `1.2 MB`. */
export function sizeText(n: number, unit = "B"): string {
  if (n < 1024) return `${n} ${unit}`;
  const k = n / 1024;
  if (k < 1024) return `${k < 10 ? k.toFixed(1) : Math.round(k)} K${unit}`;
  const m = k / 1024;
  return `${m < 10 ? m.toFixed(1) : Math.round(m)} M${unit}`;
}

const chars = (n: number) =>
  `${n < 1024 ? n : sizeText(n, "").trimEnd()} chars`;

/** The first line of `text`, with `…` when more follows. */
function firstLine(text: string): string {
  const nl = text.search(/\r?\n/);
  const line = nl < 0 ? text : `${text.slice(0, nl)}…`;
  return line.replaceAll("\t", " ");
}

/** A cell as the grid shows it. */
export function gridText(c: SqliteCell): string {
  switch (c.t) {
    case "null":
      return "NULL";
    case "int":
    case "real":
      return c.text;
    case "text":
      return firstLine(c.text);
    case "blob":
      return `‹blob ${sizeText(c.size)}›`;
  }
}

/** A cell for the shared table painter: numbers right-aligned, NULL, empty text, and BLOBs dim. */
export function tableCell(c: SqliteCell): TableCell {
  const text = gridText(c);
  switch (c.t) {
    case "null":
      return { text, value: { type: "null", value: null }, dim: true };
    case "int":
    case "real":
      return { text, value: { type: "number", value: Number(c.text) } };
    case "text":
      return c.text === ""
        ? { text, value: { type: "string", value: "" }, dim: true }
        : { text, value: { type: "string", value: text } };
    case "blob":
      return { text, value: { type: "string", value: text }, dim: true };
  }
}

/** The text `y` copies: a BLOB as hex, NULL as nothing. */
export function copyText(c: SqliteCell): string {
  switch (c.t) {
    case "null":
      return "";
    case "blob":
      return c.hex;
    default:
      return c.text;
  }
}

/** Text that parses as a JSON object or array, indented by two spaces. */
function prettyJson(text: string): string | undefined {
  const t = text.trim();
  if (!(t.startsWith("{") || t.startsWith("["))) return undefined;
  try {
    return JSON.stringify(JSON.parse(t), null, 2);
  } catch {
    return undefined;
  }
}

/** 16 bytes a line: offset, hex, and the printable characters. */
function hexDump(hex: string): string[] {
  const out: string[] = [];
  for (let at = 0; at < hex.length / 2; at += 16) {
    const bytes: number[] = [];
    for (let i = at; i < Math.min(at + 16, hex.length / 2); i++)
      bytes.push(Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16));
    const cols = bytes
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ")
      .padEnd(47);
    const chars = bytes
      .map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : "."))
      .join("");
    out.push(`${at.toString(16).padStart(8, "0")}  ${cols}  ${chars}`);
  }
  return out;
}

/**
 * The whole value as the cell pane shows it: a heading saying what it is,
 * then JSON indented, text as its lines, or a BLOB's hex dump.
 */
export function cellLines(c: SqliteCell): { head: string; lines: string[] } {
  switch (c.t) {
    case "null":
      return { head: "NULL", lines: [] };
    case "int":
      return { head: "integer", lines: [c.text] };
    case "real":
      return { head: "real", lines: [c.text] };
    case "text": {
      const cut = c.size > c.text.length;
      const json = cut ? undefined : prettyJson(c.text);
      return {
        head: `${json === undefined ? "text" : "JSON"}, ${chars(c.size)}${cut ? `, first ${chars(c.text.length)} shown` : ""}`,
        lines: (json ?? c.text).split(/\r?\n/),
      };
    }
    case "blob":
      return {
        head: `BLOB, ${sizeText(c.size)}${c.size > BLOB_HEX_MAX ? `, first ${sizeText(BLOB_HEX_MAX)} shown` : ""}`,
        lines: hexDump(c.hex),
      };
  }
}
