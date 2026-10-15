import { cellWidth, clusters } from "../../../kernel/text/cells";
import type { Decoration } from "../../../kernel/view/decorations";
import type { Span } from "../../../kernel/view/types";
import { displayWidth, wrapLine } from "../../../kernel/view/wrap";
import { nodeRange, rootOf } from "../block-text";
import type { BlockRenderer } from "../live-preview";
import type { MdNode } from "../mdast";
import { RenderCache } from "../render-cache";
import { replaceLine, textWidget } from "./rows";

/** Inline content as plain text, without Markdown markers. */
function plainText(node: MdNode): string {
  switch (node.type) {
    case "text":
    case "inlineCode":
    case "inlineMath":
      return String(node.value ?? "");
    case "wikiLink":
    case "embed":
      return String(node.alias ?? `${node.target ?? ""}${node.subpath ?? ""}`);
    case "image":
      return String(node.alt ?? "");
    case "comment":
      return "";
    case "footnoteReference":
      return `[${node.label ?? node.identifier ?? ""}]`;
    case "break":
      return " ";
    default:
      return (node.children ?? []).map(plainText).join("");
  }
}

type Align = "left" | "right" | "center" | null;

/** Fewest cells a wrapped column gets; with less, rows show as records. */
const MIN_COLUMN = 8;

const width = (text: string) => displayWidth(text, 1);
const sum = (ns: readonly number[]) => ns.reduce((a, b) => a + b, 0);

function pad(text: string, w: number, align: Align): string {
  const gap = Math.max(0, w - width(text));
  if (align === "right") return " ".repeat(gap) + text;
  if (align === "center") {
    const left = Math.floor(gap / 2);
    return " ".repeat(left) + text + " ".repeat(gap - left);
  }
  return text + " ".repeat(gap);
}

/** `text` in rows of at most `w` cells, broken after spaces where it can. */
function wrapCell(text: string, w: number): string[] {
  const starts = wrapLine(text, w, 1);
  const rows: string[] = [];
  let row = "";
  let v = 0;
  let next = 1;
  for (const ch of clusters(text)) {
    while (v === starts[next]) {
      rows.push(row.trim());
      row = "";
      next++;
    }
    row += ch;
    v += cellWidth(ch, v, 1);
  }
  rows.push(row.trim());
  return rows;
}

/**
 * Column widths summing to at most `budget`, or undefined when a column
 * would get fewer than `MIN_COLUMN` cells or its own width, whichever is
 * smaller. Columns no wider than an even
 * share keep their width; the others split the rest by their width.
 */
function fitWidths(wanted: number[], budget: number): number[] | undefined {
  if (sum(wanted) <= budget) return wanted;
  if (sum(wanted.map((w) => Math.min(w, MIN_COLUMN))) > budget)
    return undefined;
  const out = [...wanted];
  let open = wanted.map((_, c) => c);
  let left = budget;
  for (;;) {
    const share = Math.floor(left / open.length);
    const narrow = open.filter((c) => (wanted[c] ?? 0) <= share);
    if (narrow.length === 0) break;
    for (const c of narrow) left -= wanted[c] ?? 0;
    open = open.filter((c) => (wanted[c] ?? 0) > share);
  }
  const wide = sum(open.map((c) => wanted[c] ?? 0));
  for (const c of open)
    out[c] = Math.max(MIN_COLUMN, Math.floor((left * (wanted[c] ?? 0)) / wide));
  while (sum(out) > budget) {
    const widest = out.indexOf(Math.max(...out));
    out[widest] = (out[widest] ?? 0) - 1;
  }
  return out;
}

const border = (text: string): Span => ({ text, style: "mdMarker" });

const rule = (widths: number[]): Span =>
  border(`├${widths.map((w) => "─".repeat(w + 2)).join("┼")}┤`);

/** One table row as screen rows, each cell wrapped to its column. */
function gridRow(
  row: string[],
  widths: number[],
  align: Align[],
  header: boolean,
): Span[][] {
  const parts = widths.map((w, c) => wrapCell(row[c] ?? "", w));
  const height = Math.max(...parts.map((p) => p.length));
  return Array.from({ length: height }, (_, r) => {
    const spans: Span[] = [border("│")];
    widths.forEach((w, c) => {
      spans.push(
        {
          text: ` ${pad(parts[c]?.[r] ?? "", w, align[c] ?? null)} `,
          style: header ? "mdBold" : "text",
        },
        border("│"),
      );
    });
    return spans;
  });
}

/** Box-drawn rows by source line, a rule between rows once any row wraps. */
function grid(rows: string[][], widths: number[], align: Align[]): Span[][][] {
  const [head = [], ...body] = rows;
  const drawn = body.map((r) => gridRow(r, widths, align, false));
  const wraps = drawn.some((r) => r.length > 1);
  return [
    gridRow(head, widths, align, true),
    [[rule(widths)]],
    ...drawn.map((r, i) =>
      wraps && i < drawn.length - 1 ? [...r, [rule(widths)]] : r,
    ),
  ];
}

/** Each body row as `Header: value` records; the header and rule lines hide. */
function records(rows: string[][], w: number): Span[][][] {
  const [head = [], ...body] = rows;
  const room = Math.max(1, w - 2);
  return [
    [],
    [],
    ...body.map((row, i) => {
      const out: Span[][] = [];
      head.forEach((h, c) => {
        const key = h === "" ? "" : `${h}:`;
        const text = key === "" ? (row[c] ?? "") : `${key} ${row[c] ?? ""}`;
        let at = 0;
        for (const part of wrapCell(text, room)) {
          at = text.indexOf(part, at);
          const bold = Math.min(part.length, Math.max(0, key.length - at));
          out.push(
            [
              border("▌ "),
              { text: part.slice(0, bold), style: "mdBold" },
              { text: part.slice(bold), style: "text" },
            ].filter((s) => s.text !== ""),
          );
          at += part.length;
        }
      });
      return i < body.length - 1 ? [...out, []] : out;
    }),
  ];
}

/**
 * Screen rows by source line offset from the table's first line: the
 * natural grid when it fits `w` cells, else a grid whose cells wrap (header
 * words included), else records when a column would get too few cells.
 */
function tableRows(table: MdNode, w: number): Span[][][] {
  const rows = (table.children ?? []).map((r) =>
    (r.children ?? []).map(plainText).map((t) => t.trim()),
  );
  const align = (table.align as Align[] | undefined) ?? [];
  const columns = Math.max(...rows.map((r) => r.length));
  const natural = Array.from({ length: columns }, (_, c) =>
    Math.max(1, ...rows.map((r) => width(r[c] ?? ""))),
  );
  const budget = w - (3 * columns + 1);
  if (sum(natural) <= budget) return grid(rows, natural, align);
  const [head = [], ...body] = rows;
  const squeezed = natural.map((_, c) =>
    Math.max(
      1,
      ...(head[c] ?? "").split(/\s+/).map(width),
      ...body.map((r) => width(r[c] ?? "")),
    ),
  );
  const widths = fitWidths(squeezed, budget);
  return widths === undefined ? records(rows, w) : grid(rows, widths, align);
}

const tables = new RenderCache<Span[][][]>();

/** A table fitted to the window, its rows drawn in place of its source lines. */
export const tableRenderer: BlockRenderer = (block, v, { doc }) => {
  const table = rootOf(doc, block, v.buf).children?.[0];
  const range = table && nodeRange(block, table);
  if (table === undefined || range === undefined) return [];
  const rows = tables.get(`${block.hash}|${v.width}`, () =>
    tableRows(table, v.width),
  );
  return rows.map((screen, i): Decoration => {
    const line = range.start.line + i;
    if (screen.length <= 1) return replaceLine(v.buf, line, screen[0]);
    return {
      kind: "replace",
      range: {
        start: { line, col: 0 },
        end: { line, col: v.buf.line(line).length },
      },
      block: true,
      widget: textWidget(screen),
    };
  });
};
