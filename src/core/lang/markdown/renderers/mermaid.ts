import type * as BeautifulMermaid from "beautiful-mermaid";
import { fenceBody, wholeBlock } from "../block-text";
import type { BlockRenderer } from "../live-preview";
import { RenderCache } from "../render-cache";
import { labelAbove, textWidget } from "./rows";

/** A Mermaid fence as box-drawing lines, or why it shows as source. */
export type MermaidResult =
  | { kind: "text"; lines: string[] }
  | { kind: "source"; label: string };

/** Diagram types beautiful-mermaid lays out as text. */
const TEXT_LAYOUT = new Set([
  "flowchart",
  "graph",
  "stateDiagram",
  "stateDiagram-v2",
  "sequenceDiagram",
  "classDiagram",
  "erDiagram",
  "xychart",
  "xychart-beta",
]);

/** Types whose parsed graph needs at least one node to count as drawn. */
const GRAPHS = new Set([
  "flowchart",
  "graph",
  "stateDiagram",
  "stateDiagram-v2",
]);

/** Other Mermaid diagram types, shown as source under their name. */
const SOURCE_ONLY = new Set([
  "flowchart-elk",
  "classDiagram-v2",
  "journey",
  "gantt",
  "pie",
  "quadrantChart",
  "requirement",
  "requirementDiagram",
  "gitGraph",
  "C4Context",
  "C4Container",
  "C4Component",
  "C4Dynamic",
  "C4Deployment",
  "mindmap",
  "timeline",
  "sankey",
  "sankey-beta",
  "block",
  "block-beta",
  "packet",
  "packet-beta",
  "kanban",
  "architecture",
  "architecture-beta",
  "radar-beta",
  "treemap",
  "treemap-beta",
  "info",
]);

type Spacing = { paddingX: number; paddingY: number; boxBorderPadding: number };
/** The library's default spacing, then the tightest one for narrow windows. */
const SPACINGS: readonly Spacing[] = [
  { paddingX: 5, paddingY: 5, boxBorderPadding: 1 },
  { paddingX: 1, paddingY: 1, boxBorderPadding: 0 },
];

/** The library, loaded on the first diagram so startup does not pay for it. */
let library: typeof BeautifulMermaid | undefined;
const mermaid = (): typeof BeautifulMermaid =>
  (library ??= require("beautiful-mermaid") as typeof BeautifulMermaid);

const INVALID: MermaidResult = {
  kind: "source",
  label: "mermaid: invalid diagram shown as source",
};

function draw(
  source: string,
  needsNodes: boolean,
  spacing: Spacing,
): string[] | undefined {
  try {
    if (needsNodes && mermaid().parseMermaid(source).nodes.size === 0)
      return undefined;
    const lines = mermaid()
      .renderMermaidASCII(source, {
        useAscii: false,
        colorMode: "none",
        ...spacing,
      })
      .split("\n")
      .map((line) => line.trimEnd());
    while (lines.at(-1) === "") lines.pop();
    const first = lines.findIndex((line) => line !== "");
    return first === -1 ? undefined : lines.slice(first);
  } catch {
    return undefined;
  }
}

/**
 * The diagram type and the source the library accepts, which rejects the
 * `graph TD;` header form that Mermaid accepts.
 */
function prepare(source: string): { type: string; source: string } {
  const lines = source.split("\n");
  const at = lines.findIndex(
    (l) => l.trim() !== "" && !l.trim().startsWith("%%"),
  );
  const header = lines[at]?.trim() ?? "";
  const type = header.split(/[\s;]/, 1)[0] ?? "";
  if (at !== -1) lines[at] = header.replace(/;+$/, "");
  return { type, source: lines.join("\n") };
}

/** Box-drawing lines no wider than `width`, or a label saying why the source is shown. */
export function mermaidText(source: string, width: number): MermaidResult {
  const p = prepare(source);
  if (!TEXT_LAYOUT.has(p.type))
    return SOURCE_ONLY.has(p.type)
      ? { kind: "source", label: `mermaid: ${p.type} shown as source` }
      : INVALID;
  for (const spacing of SPACINGS) {
    const drawn = draw(p.source, GRAPHS.has(p.type), spacing);
    if (drawn === undefined) return INVALID;
    if (Math.max(...drawn.map((l) => l.length)) <= width)
      return { kind: "text", lines: drawn };
  }
  return {
    kind: "source",
    label: `mermaid: wider than ${width} columns, shown as source`,
  };
}

/** Box-drawing lines at any width, with the default or the tightest spacing; undefined when it cannot be drawn. */
export function mermaidLines(
  source: string,
  spacing: "loose" | "tight",
): string[] | undefined {
  const p = prepare(source);
  if (!TEXT_LAYOUT.has(p.type)) return undefined;
  const chosen = SPACINGS[spacing === "loose" ? 0 : 1];
  return chosen && draw(p.source, GRAPHS.has(p.type), chosen);
}

const drawings = new RenderCache<MermaidResult>();

/** A Mermaid fence as one text widget of its drawing, or its source under a label. */
export const mermaidRenderer: BlockRenderer = (block, v) => {
  const r = drawings.get(`${block.hash}|${v.width}`, () =>
    mermaidText(fenceBody(v.buf, block).join("\n"), v.width),
  );
  const range = wholeBlock(v.buf, block);
  return r.kind === "text"
    ? [
        {
          kind: "replace",
          range,
          block: true,
          widget: textWidget(
            r.lines.map((text) => [{ text, style: "mdCode" }]),
          ),
        },
      ]
    : [labelAbove(range.start.line, r.label)];
};
