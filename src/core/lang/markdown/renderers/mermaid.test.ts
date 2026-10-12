import { expect, spyOn, test } from "bun:test";
import * as library from "beautiful-mermaid";
import {
  layoutNote,
  noteView,
  rowText,
} from "../../../../../test/support/markdown";
import { parseDoc } from "../doc";
import { registerBlockRenderer } from "../live-preview";
import {
  mermaidLines,
  mermaidRenderer,
  mermaidSvg,
  mermaidText,
} from "./mermaid";

const FLOWCHART = [
  "flowchart LR",
  "  Capture --> Triage --> Plan --> Ship",
  "  Triage -->|someday| Archive",
].join("\n");

test("a flowchart becomes box-drawing lines", () => {
  const r = mermaidText(FLOWCHART, 100);
  if (r.kind !== "text") throw new Error(`expected text, got ${r.label}`);
  expect(r.lines.join("\n")).toContain("│ Capture ├");
  expect(r.lines.join("\n")).toMatch(/[┌┐└┘─►]/);
});

test("an edge leaves its box even when a sibling edge has a label", () => {
  for (const spacing of ["loose", "tight"] as const) {
    const drawn = mermaidLines(FLOWCHART, spacing)?.join("\n");
    expect(drawn).toMatch(/Triage *├─+►│ *Plan/);
  }
});

test("every line of a drawing has the same width", () => {
  const lines = mermaidLines(FLOWCHART, "loose") ?? [];
  expect(new Set(lines.map((l) => l.length)).size).toBe(1);
});

test("unsupported mermaid diagrams fall back to labelled source", () => {
  expect(mermaidText("gantt\n  title x", 80)).toEqual({
    kind: "source",
    label: "mermaid: gantt shown as source",
  });
});

test("a malformed diagram falls back to labelled source", () => {
  expect(mermaidText("flowchart SIDEWAYS\n  A --> B", 80)).toEqual({
    kind: "source",
    label: "mermaid: invalid diagram shown as source",
  });
});

test("typing outside a diagram does not lay it out again", () => {
  registerBlockRenderer("mermaid", mermaidRenderer);
  const calls = spyOn(library, "renderMermaidASCII");
  const note = [
    "Typing here",
    "",
    "```mermaid",
    "flowchart LR",
    "  Unique --> Diagram",
    "```",
    "",
  ].join("\n");
  const view = noteView(note, { cursor: { line: 0, col: 0 }, width: 77 });
  let { v, doc } = view;
  for (let i = 0; i < 50; i++) {
    const rows = layoutNote({ v, doc });
    expect(rows.map(rowText).join("\n")).not.toContain("flowchart LR");
    const { buffer } = v.buf.apply({
      range: { start: { line: 0, col: 0 }, end: { line: 0, col: 0 } },
      text: "x",
    });
    v = { ...v, buf: buffer };
    doc = parseDoc(buffer, doc);
  }
  expect(calls).toHaveBeenCalledTimes(1);
  calls.mockRestore();
});

test("a diagram drawn at any width is wider with the default spacing than the tight one", () => {
  const widest = (lines: string[] | undefined) =>
    Math.max(...(lines ?? []).map((l) => l.length));
  const loose = mermaidLines(FLOWCHART, "loose");
  expect(loose?.join("\n")).toContain("│ Capture ├");
  expect(widest(loose)).toBeGreaterThan(
    widest(mermaidLines(FLOWCHART, "tight")),
  );
  expect(mermaidLines("gantt\n  title x", "loose")).toBeUndefined();
  expect(
    mermaidLines("flowchart SIDEWAYS\n  A --> B", "loose"),
  ).toBeUndefined();
});

test("a diagram as SVG carries plain colours and generic fonts a rasterizer can draw", () => {
  const dark = mermaidSvg(FLOWCHART, "dark");
  if (dark === undefined) throw new Error("expected an SVG");
  expect(dark.svg).toContain(">Capture</text>");
  expect(dark.svg).not.toMatch(/var\(|color-mix\(|@import/);
  expect(dark.svg).toContain("font-family: sans-serif");
  expect(dark.width).toBeGreaterThan(dark.height);
  expect(dark.background).toBe("#1a1b26");
  expect(mermaidSvg(FLOWCHART, "light")?.background).not.toBe(dark.background);
  expect(mermaidSvg("gantt\n  title x", "dark")).toBeUndefined();
  expect(mermaidSvg("flowchart SIDEWAYS\n  A --> B", "dark")).toBeUndefined();
});

test("a diagram as SVG sits on each catppuccin flavor's base colour", () => {
  expect(
    (
      [
        "catppuccin-latte",
        "catppuccin-frappe",
        "catppuccin-macchiato",
        "catppuccin-mocha",
      ] as const
    ).map((theme) => mermaidSvg(FLOWCHART, theme)?.background),
  ).toEqual(["#eff1f5", "#303446", "#24273a", "#1e1e2e"]);
});

test("a diagram as SVG sits on each warm theme's page colour", () => {
  expect(
    (["paper", "sepia", "rose-pine-dawn"] as const).map(
      (theme) => mermaidSvg(FLOWCHART, theme)?.background,
    ),
  ).toEqual(["#fbf8f1", "#f2e8d0", "#faf4ed"]);
});
