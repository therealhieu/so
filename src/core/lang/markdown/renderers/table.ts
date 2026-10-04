import type { Span } from "../../../kernel/view/types";
import { nodeRange, rootOf } from "../block-text";
import type { BlockRenderer } from "../live-preview";
import type { MdNode } from "../mdast";
import { RenderCache } from "../render-cache";
import { cells, replaceLine } from "./rows";

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

function pad(text: string, width: number, align: Align): string {
  const gap = width - cells(text);
  if (align === "right") return " ".repeat(gap) + text;
  if (align === "center") {
    const left = Math.floor(gap / 2);
    return " ".repeat(left) + text + " ".repeat(gap - left);
  }
  return text + " ".repeat(gap);
}

/** Box-drawn rows by source line offset from the table's first line. */
function tableRows(table: MdNode): Span[][] {
  const rows = (table.children ?? []).map((r) =>
    (r.children ?? []).map(plainText).map((t) => t.trim()),
  );
  const align = (table.align as Align[] | undefined) ?? [];
  const columns = Math.max(...rows.map((r) => r.length));
  const widths = Array.from({ length: columns }, (_, c) =>
    Math.max(1, ...rows.map((r) => cells(r[c] ?? ""))),
  );
  const border = (text: string): Span => ({ text, style: "mdMarker" });
  const row = (cellsOf: string[], header: boolean): Span[] => {
    const spans: Span[] = [border("│")];
    widths.forEach((w, c) => {
      spans.push(
        {
          text: ` ${pad(cellsOf[c] ?? "", w, align[c] ?? null)} `,
          style: header ? "mdBold" : "text",
        },
        border("│"),
      );
    });
    return spans;
  };
  const rule = border(`├${widths.map((w) => "─".repeat(w + 2)).join("┼")}┤`);
  const [head = [], ...body] = rows;
  return [row(head, true), [rule], ...body.map((r) => row(r, false))];
}

const tables = new RenderCache<Span[][]>();

/** A table as aligned, box-drawn rows, one per source line. */
export const tableRenderer: BlockRenderer = (block, v, { doc }) => {
  const table = rootOf(doc, block, v.buf).children?.[0];
  const range = table && nodeRange(block, table);
  if (table === undefined || range === undefined) return [];
  const rows = tables.get(`${block.hash}|${v.width}`, () => tableRows(table));
  return rows.map((spans, i) =>
    replaceLine(v.buf, range.start.line + i, spans),
  );
};
