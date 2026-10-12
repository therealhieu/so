import type * as BeautifulMermaid from "beautiful-mermaid";
import { fenceBody, wholeBlock } from "../block-text";
import type { BlockRenderer } from "../live-preview";
import { RenderCache } from "../render-cache";
import { labelAbove, textWidget } from "./rows";
import { inlineCssVars } from "./svg-css";

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

/**
 * Run `f` with no global `window`. The library's SVG layout (elkjs) binds to
 * `window` when one exists and to the runtime's `global` otherwise; the
 * terminal renderer defines a bare `window` for `requestAnimationFrame`,
 * which breaks that layout.
 */
function withoutWindow<T>(f: () => T): T {
  const g = globalThis as { window?: unknown };
  if (!("window" in g)) return f();
  const window = g.window;
  delete g.window;
  try {
    return f();
  } finally {
    g.window = window;
  }
}

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
    if (first === -1) return undefined;
    // Equal widths, so the drawing's background is one rectangle.
    const width = Math.max(...lines.map((line) => line.length));
    return lines.slice(first).map((line) => line.padEnd(width));
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

/** A diagram as self-contained SVG: its size in user units and its background colour. */
export type MermaidSvg = {
  svg: string;
  width: number;
  height: number;
  background: string;
};

/** Diagram colours per theme: a beautiful-mermaid theme name, or colours for a flavor it lacks. */
const DIAGRAM_COLORS = {
  dark: "tokyo-night",
  light: "tokyo-night-light",
  "catppuccin-latte": "catppuccin-latte",
  "catppuccin-frappe": {
    bg: "#303446",
    fg: "#c6d0f5",
    line: "#626880",
    accent: "#ca9ee6",
    muted: "#737994",
  },
  "catppuccin-macchiato": {
    bg: "#24273a",
    fg: "#cad3f5",
    line: "#5b6078",
    accent: "#c6a0f6",
    muted: "#6e738d",
  },
  "catppuccin-mocha": "catppuccin-mocha",
  paper: {
    bg: "#fbf8f1",
    fg: "#2f2a24",
    line: "#a39a8a",
    accent: "#8a5a2b",
    muted: "#6f6658",
  },
  sepia: {
    bg: "#f2e8d0",
    fg: "#3d2f20",
    line: "#a08c6c",
    accent: "#8b5e34",
    muted: "#776448",
  },
  "rose-pine-dawn": {
    bg: "#faf4ed",
    fg: "#575279",
    line: "#9893a5",
    accent: "#907aa9",
    muted: "#797593",
  },
} satisfies Record<string, string | BeautifulMermaid.DiagramColors>;

/** A colour theme a diagram can be drawn in. */
export type DiagramTheme = keyof typeof DIAGRAM_COLORS;

/**
 * A diagram as SVG that a plain SVG rasterizer draws as the browser would:
 * the theme's colours written out in place of CSS variables, web font
 * imports dropped, and font lists reduced to `sans-serif` or `monospace`.
 * Undefined when it cannot be drawn.
 */
export function mermaidSvg(
  source: string,
  theme: DiagramTheme,
): MermaidSvg | undefined {
  const p = prepare(source);
  if (!TEXT_LAYOUT.has(p.type)) return undefined;
  try {
    if (GRAPHS.has(p.type) && mermaid().parseMermaid(p.source).nodes.size === 0)
      return undefined;
    const chosen: string | BeautifulMermaid.DiagramColors =
      DIAGRAM_COLORS[theme];
    const colors =
      typeof chosen === "string" ? mermaid().THEMES[chosen] : chosen;
    const drawn = withoutWindow(() =>
      mermaid().renderMermaidSVG(p.source, colors),
    );
    const svg = inlineCssVars(drawn)
      .replace(/@import[^;]*;/g, "")
      .replace(
        /font-family\s*:\s*([^;"}]+)/g,
        (_, list: string) =>
          `font-family: ${/monospace/.test(list) ? "monospace" : "sans-serif"}`,
      );
    const box = /viewBox="[\d.-]+ [\d.-]+ ([\d.]+) ([\d.]+)"/.exec(svg);
    const width = Number(box?.[1]);
    const height = Number(box?.[2]);
    if (!(width > 0 && height > 0)) return undefined;
    return { svg, width, height, background: colors?.bg ?? "#000000" };
  } catch {
    return undefined;
  }
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
