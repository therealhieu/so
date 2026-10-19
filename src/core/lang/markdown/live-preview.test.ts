import { afterEach, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  layoutNote,
  noteView,
  rowText,
  stubCtx,
} from "../../../../test/support/markdown";
import { baseEmbedRenderer } from "../../features/bases/embed";
import { createTextBuffer } from "../../kernel/text/text-buffer";
import type { DecorationProvider } from "../../kernel/view/decorations";
import { highlightMarks } from "../../kernel/view/marks";
import { layoutText } from "../../kernel/view/text-view";
import type { RenderLine, Span, Widget } from "../../kernel/view/types";
import { wrapLine } from "../../kernel/view/wrap";
import { type Block, parseDoc } from "./doc";
import { markdownFileType } from "./file-type";
import {
  type BlockRenderer,
  blocksIn,
  livePreview,
  registerBlockRenderer,
} from "./live-preview";
import type { EmbedData } from "./renderers/embed";
import { builtinRenderers } from "./renderers/index";

const none: BlockRenderer = () => [];

afterEach(() => {
  registerBlockRenderer("callout", none);
  registerBlockRenderer("paragraph", none);
});

const CALLOUT_NOTE = [
  "Before **bold** text",
  "",
  "> [!note] Title",
  "> Body line",
  "",
  "After *italic* text",
  "",
].join("\n");

test("a throwing renderer leaves its block as source with a warning sign", () => {
  const view = noteView(CALLOUT_NOTE, { cursor: { line: 6, col: 0 } });
  registerBlockRenderer("callout", none);
  const healthy = layoutNote(view);
  registerBlockRenderer("callout", () => {
    throw new Error("boom");
  });
  const rows = layoutNote(view);
  const callout = rows.filter((r) => r.sourceLine >= 2 && r.sourceLine <= 3);
  expect(callout.map(rowText)).toEqual(["> [!note] Title", "> Body line"]);
  expect(callout[0]?.sign).toEqual({ text: "⚠", style: "signError" });
  expect(callout[1]?.sign).toBeUndefined();
  const others = (rs: typeof rows) =>
    rs.filter((r) => r.sourceLine < 2 || r.sourceLine > 3);
  expect(others(rows)).toEqual(others(healthy));
});

test("a renderer registered for a new embed extension is used without provider changes", () => {
  registerBlockRenderer("xbase", (block) => [
    {
      kind: "replace",
      range: {
        start: { line: block.startLine, col: 0 },
        end: { line: block.startLine, col: 12 },
      },
      block: true,
      spans: [{ text: "table view", style: "text" }],
    },
  ]);
  const rows = layoutNote(
    noteView("Intro\n\n![[t.xbase]]\n", { cursor: { line: 3, col: 0 } }),
  );
  expect(rows.map(rowText)).toContain("table view");
  expect(rows.map(rowText)).not.toContain("![[t.xbase]]");
});

test("only blocks in the visible range are rendered", () => {
  const lines: string[] = [];
  for (let i = 0; i < 2500; i++) lines.push(`Paragraph ${i}`, "");
  const visible = { from: 1000, to: 1030 };
  const view = noteView(lines.join("\n"), {
    visible,
    cursor: { line: 1001, col: 0 },
  });
  const seen: Block[] = [];
  registerBlockRenderer("paragraph", (block) => {
    seen.push(block);
    return [];
  });
  layoutNote(view);
  expect(seen.length).toBe(15);
  for (const b of seen) {
    expect(b.endLine).toBeGreaterThanOrEqual(visible.from);
    expect(b.startLine).toBeLessThan(visible.to);
  }
});

test("a selection over a long note reads only the visible blocks", () => {
  const lines: string[] = [];
  for (let i = 0; i < 2500; i++) lines.push(`Selected paragraph ${i}`, "");
  const visible = { from: 1000, to: 1030 };
  const { v, doc } = noteView(lines.join("\n"), {
    visible,
    cursor: { line: 4999, col: 0 },
    selection: { start: { line: 0, col: 0 }, end: { line: 4999, col: 0 } },
  });
  const read = new Set<number>();
  const buf = {
    ...v.buf,
    line(i: number) {
      read.add(i);
      return v.buf.line(i);
    },
  };
  const rows = layoutNote({ v: { ...v, buf }, doc });
  const near = blocksIn(doc, visible);
  const first = near[0]?.startLine ?? visible.from;
  const last = near.at(-1)?.endLine ?? visible.to;
  for (const l of read) {
    expect(l).toBeGreaterThanOrEqual(first);
    expect(l).toBeLessThanOrEqual(last);
  }
  expect(
    rows.filter((r) => r.sign?.text === "▕").map((r) => r.sourceLine),
  ).toEqual(Array.from({ length: 15 }, (_, i) => visible.from + 2 * i));
});

test("a multi-line comment shows its whole source while the cursor is inside", () => {
  builtinRenderers();
  const note = "Intro\n\n%%\nhidden one\nhidden two\n%%\n\nAfter";
  const at = (line: number) =>
    layoutNote(noteView(note, { cursor: { line, col: 0 } }));
  const inside = at(3);
  expect(
    inside.filter((r) => r.sourceLine >= 2 && r.sourceLine <= 5).map(rowText),
  ).toEqual(["%%", "hidden one", "hidden two", "%%"]);
  expect(
    inside.filter((r) => r.sign?.text === "▕").map((r) => r.sourceLine),
  ).toEqual([2, 3, 4, 5]);
  const outside = at(7);
  expect(outside.some((r) => r.sourceLine >= 2 && r.sourceLine <= 5)).toBe(
    false,
  );
});

const TOUR = readFileSync("test/fixtures/tour.md", "utf8");

const ROADMAP = (() => {
  const text = createTextBuffer(
    [
      "# so roadmap",
      "",
      "## Goals",
      ...Array.from({ length: 12 }, (_, i) => `- Goal ${i + 1}`),
      "",
      "## Later",
      "Not shown",
    ].join("\n"),
  );
  return { doc: parseDoc(text), text };
})();

const PATHS: Readonly<Record<string, string>> = {
  "so-roadmap": "so-roadmap.md",
  "diagram.png": "diagram.png",
  "tasks.base": "tasks.base",
};

/** The tour's embeds: the roadmap note is open, the base is still loading. */
const tourCtx = stubCtx({
  resolve: (t) => PATHS[t],
  isResolved: (t) => PATHS[t] !== undefined,
  embed: (p) => (p === "so-roadmap.md" ? ROADMAP : "missing"),
  embedModel: (p) => (p === "tasks.base" ? "loading" : "missing"),
  image: (p) => (p === "diagram.png" ? { rows: 6 } : "unknown"),
});

/** The built-in renderers and the base embed renderer the app registers. */
function tourRenderers() {
  builtinRenderers();
  registerBlockRenderer("base", baseEmbedRenderer);
}

const spansText = (spans: Span[]) => spans.map((s) => s.text).join("");

function widgetText(w: Widget): string[] {
  switch (w.type) {
    case "text":
      return (w.data as Span[][]).map(spansText);
    case "embed": {
      const d = w.data as EmbedData;
      return [
        `${d.title} (${d.state}, ${d.more} more)`,
        ...d.rows.map(spansText),
      ];
    }
    default:
      return [JSON.stringify(w.data)];
  }
}

/** Rows as `line sign │ text  ⟦style@col+len …⟧`, with widget content indented below. */
function serialize(rows: RenderLine[]): string {
  const out: string[] = [];
  for (const r of rows) {
    const styles: string[] = [];
    let col = 0;
    for (const s of r.spans) {
      if (s.style !== "text") styles.push(`${s.style}@${col}+${s.text.length}`);
      col += s.text.length;
    }
    const line = `${String(r.sourceLine + 1).padStart(3)} ${r.sign?.text ?? " "} │${spansText(r.spans)}`;
    out.push(styles.length === 0 ? line : `${line}  ⟦${styles.join(" ")}⟧`);
    if (r.widget !== undefined) {
      out.push(`      ↳ ${r.widget.type} ×${r.widget.rows}`);
      for (const t of widgetText(r.widget)) out.push(`      │${t}`);
    }
  }
  return out.join("\n");
}

/** Cursor positions in `tour.md` (0-based lines). */
const CURSORS = [
  { name: "on a blank line", line: 7 },
  { name: "on a bold line", line: 8 },
  { name: "inside the table", line: 41 },
  { name: "inside a callout", line: 28 },
  { name: "inside a code fence", line: 48 },
  { name: "inside the frontmatter", line: 2 },
  { name: "inside the mermaid diagram", line: 70 },
];

const tour = (width: number, line: number) =>
  noteView(TOUR, { width, cursor: { line, col: 2 } });

for (const width of [60, 100]) {
  for (const cursor of CURSORS)
    test(`tour note at width ${width} with the cursor ${cursor.name}`, () => {
      tourRenderers();
      const rows = layoutNote(tour(width, cursor.line), "live", tourCtx);
      expect(serialize(rows)).toMatchSnapshot();
    });

  test(`tour note at width ${width} in reading view`, () => {
    tourRenderers();
    const rows = layoutNote(tour(width, 8), "reading", tourCtx);
    expect(serialize(rows)).toMatchSnapshot();
  });

  test(`tour note at width ${width} in source view`, () => {
    const { v } = tour(width, 8);
    expect(serialize(layoutText(v, [], undefined))).toMatchSnapshot();
  });
}

test("headings start with their level glyph and comments are hidden", () => {
  builtinRenderers();
  const rows = layoutNote(tour(100, 7), "live", tourCtx);
  const textOf = (line: number) =>
    rowText(rows.find((r) => r.sourceLine === line));
  expect(textOf(6)).toBe("█ Markdown tour");
  expect(textOf(14)).toBe("▊ Lists and tasks");
  expect(textOf(36)).toBe("▌ Table");
  expect(textOf(44)).toBe("▏ Code");
  expect(rows.some((r) => r.sourceLine === 12)).toBe(false);
  expect(rows.map(rowText).join("\n")).not.toContain("%%");
});

test("frontmatter tags render as tag chips", () => {
  builtinRenderers();
  const rows = layoutNote(tour(100, 7), "live", tourCtx);
  const tags = rows.find((r) => r.sourceLine === 2)?.spans ?? [];
  expect(tags.filter((s) => s.style === "mdTag").map((s) => s.text)).toEqual([
    "#reference",
    "#so",
  ]);
  const block = layoutNote(
    noteView("---\ntags:\n  - daily\n---\n", { cursor: { line: 5, col: 0 } }),
  );
  expect(block.find((r) => r.sourceLine === 2)?.spans).toContainEqual({
    text: "#daily",
    style: "mdTag",
    tag: "daily",
  });
});

test("a warning callout icon differs from the render-error sign", () => {
  builtinRenderers();
  const rows = layoutNote(
    noteView("> [!warning] Careful\n> Body\n\nAfter", {
      cursor: { line: 3, col: 0 },
    }),
  );
  expect(rowText(rows[0])).toBe("▲ Careful");
});

test("callout and quote bodies keep their text styles over source highlighting and repeat the bar on wrap rows", () => {
  builtinRenderers();
  const { v, doc } = noteView(
    "> [!note]\n> Body with [a link](https://x.y).\n\n> Plain quote\n\nAfter",
    { cursor: { line: 5, col: 0 } },
  );
  const rows = layoutText(
    v,
    [
      highlightMarks(markdownFileType.highlighter),
      livePreview as DecorationProvider,
    ],
    { doc, view: "reading", ctx: stubCtx() },
  );
  const styles = (line: number) =>
    rows
      .find((r) => r.sourceLine === line)
      ?.spans.map((s) => [s.style, s.text]);
  expect(styles(1)).toEqual([
    ["mdCalloutNote", "▎ "],
    ["text", "Body with "],
    ["mdLink", "a link"],
    ["text", "."],
  ]);
  expect(styles(3)).toEqual([
    ["mdQuote", "▎ "],
    ["mdQuote", "Plain quote"],
  ]);
  const prefix = (line: number) =>
    rows.find((r) => r.sourceLine === line)?.wrapPrefix;
  expect(prefix(1)).toEqual([{ text: "▎ ", style: "mdCalloutNote" }]);
  expect(prefix(3)).toEqual([{ text: "▎ ", style: "mdQuote" }]);
  expect(prefix(5)).toBeUndefined();
});

test("code bodies, done tasks, and footnotes keep their line styles over source highlighting", () => {
  builtinRenderers();
  const note = [
    "```sh",
    "./run start",
    "```",
    "",
    "```ts",
    "const a = 1;",
    "```",
    "",
    "    indented",
    "",
    "- [x] done",
    "",
    "[^1]: a note",
    "",
    "After",
  ].join("\n");
  const { v, doc } = noteView(note, { cursor: { line: 14, col: 0 } });
  const rows = layoutText(
    v,
    [
      highlightMarks(markdownFileType.highlighter),
      livePreview as DecorationProvider,
    ],
    { doc, view: "live", ctx: stubCtx() },
  );
  const styles = (line: number) =>
    rows
      .find((r) => r.sourceLine === line)
      ?.spans.map((s) => [s.style, s.text]);
  expect(styles(1)).toEqual([["mdCode", "./run start"]]);
  expect(styles(5)).toEqual([
    ["codeKeyword", "const"],
    ["mdCode", " a = "],
    ["codeNumber", "1"],
    ["mdCode", ";"],
  ]);
  expect(styles(8)).toEqual([["mdCode", "    indented"]]);
  expect(styles(10)).toEqual([
    ["mdMarker", "☑ "],
    ["dim", "done"],
  ]);
  expect(styles(12)).toEqual([
    ["mdFootnote", "¹ "],
    ["mdFootnote", "a note"],
  ]);
});

test("fences in list items, callouts, and quotes render like top-level fences", () => {
  builtinRenderers();
  const note = [
    "1. Build",
    "",
    "   ```sh",
    "   echo hi",
    "   - not an item",
    "   ```",
    "",
    "2. Configure",
    "",
    "   ```toml",
    '   a = "x"',
    "   ```",
    "",
    "> [!note] Run",
    "> ```ts",
    "> const b = 1;",
    "> ```",
    "",
    "> Quoted",
    "> ```",
    "> plain",
    "",
    "After",
  ].join("\n");
  const { v, doc } = noteView(note, { cursor: { line: 22, col: 0 } });
  const rows = layoutText(
    v,
    [
      highlightMarks(markdownFileType.highlighter),
      livePreview as DecorationProvider,
    ],
    { doc, view: "live", ctx: stubCtx() },
  );
  const styles = (line: number) =>
    rows
      .find((r) => r.sourceLine === line)
      ?.spans.map((s) => [s.style, s.text]);
  const shown = new Set(rows.map((r) => r.sourceLine));
  for (const fence of [2, 5, 9, 11, 14, 16, 19])
    expect(shown).not.toContain(fence);
  expect(styles(3)).toEqual([
    ["text", "   "],
    ["codeBuiltin", "echo"],
    ["mdCode", " hi"],
  ]);
  expect(styles(4)).toEqual([
    ["text", "   "],
    ["mdCode", "- not an item"],
  ]);
  expect(styles(10)).toEqual([
    ["text", "   "],
    ["codeAttribute", "a"],
    ["mdCode", " = "],
    ["codeString", '"x"'],
  ]);
  expect(styles(15)).toEqual([
    ["mdCalloutNote", "▎ "],
    ["codeKeyword", "const"],
    ["mdCode", " b = "],
    ["codeNumber", "1"],
    ["mdCode", ";"],
  ]);
  // An unclosed fence runs to the end of its quote.
  expect(styles(20)).toEqual([
    ["mdQuote", "▎ "],
    ["mdCode", "plain"],
  ]);
});

test("a fence opening on a list item's line keeps the bullet and the items after it", () => {
  builtinRenderers();
  const note = [
    "- ```sh",
    "  - echo hi",
    "  ```",
    "- next item",
    "",
    "After",
  ].join("\n");
  const { v, doc } = noteView(note, { cursor: { line: 5, col: 0 } });
  const rows = layoutText(
    v,
    [
      highlightMarks(markdownFileType.highlighter),
      livePreview as DecorationProvider,
    ],
    { doc, view: "live", ctx: stubCtx() },
  );
  const styles = (line: number) =>
    rows
      .find((r) => r.sourceLine === line)
      ?.spans.map((s) => [s.style, s.text]);
  expect(styles(0)).toEqual([["mdMarker", "• "]]);
  expect(styles(1)).toEqual([
    ["text", "  "],
    ["mdCode", "- "],
    ["codeBuiltin", "echo"],
    ["mdCode", " hi"],
  ]);
  expect(rows.map((r) => r.sourceLine)).not.toContain(2);
  expect(styles(3)).toEqual([
    ["mdMarker", "• "],
    ["text", "next item"],
  ]);
});

test("the reveal sign marks exactly the revealed rows", () => {
  builtinRenderers();
  const signed = (line: number) =>
    layoutNote(tour(100, line), "live", tourCtx)
      .filter((r) => r.sign?.text === "▕")
      .map((r) => r.sourceLine);
  expect(signed(7)).toEqual([]);
  expect(signed(8)).toEqual([8]);
  expect(signed(41)).toEqual([38, 39, 40, 41, 42]);
  expect(
    layoutNote(tour(100, 41), "reading", tourCtx).some((r) => r.sign),
  ).toBe(false);
});

test("justify marks rendered paragraph, list, and callout and quote body lines, not titles, revealed lines, or other blocks", () => {
  builtinRenderers();
  const note = [
    "# Title",
    "",
    "First paragraph line",
    "second line",
    "",
    "- item one",
    "- item two",
    "",
    "```",
    "code",
    "```",
    "",
    "> [!note] Title",
    "> Body line",
    "",
    "> A plain quote",
    "",
    "| a | b |",
    "| - | - |",
    "| 1 | 2 |",
  ].join("\n");
  const justified = (view: "live" | "reading", line: number, on = true) =>
    layoutNote(
      noteView(note, { cursor: { line, col: 0 } }),
      view,
      stubCtx({ justify: on }),
    )
      .filter((r) => r.justify)
      .map((r) => r.sourceLine);
  expect(justified("reading", 0)).toEqual([2, 3, 5, 6, 13, 15]);
  // The live cursor reveals its line, which keeps its source ragged.
  expect(justified("live", 3)).toEqual([2, 5, 6, 13, 15]);
  expect(justified("reading", 0, false)).toEqual([]);
});

test("in live view a sized heading on the cursor's line shows its source and keeps its rows", () => {
  builtinRenderers();
  const sized = stubCtx({ sizedText: true });
  const screenRows = (rows: RenderLine[], width: number) =>
    rows.reduce(
      (n, r) =>
        n +
        (r.widget !== undefined && r.spans.length === 0
          ? r.widget.rows
          : wrapLine(rowText(r), width, 1).length),
      0,
    );
  const at = (note: string, line: number, width = 80) =>
    layoutNote(
      noteView(note, { cursor: { line, col: 0 }, width }),
      "live",
      sized,
    );
  const keepsRows = (note: string, line: number, width = 80) => {
    const off = at(note, 0, width);
    expect(off.some((r) => r.widget?.type === "sizedText")).toBe(true);
    expect(screenRows(at(note, line, width), width)).toBe(
      screenRows(off, width),
    );
  };

  const note = "Intro\n\n# Raft\n\nBody";
  keepsRows(note, 2);
  const heading = at(note, 2).filter((r) => r.sourceLine === 2);
  expect(heading.map(rowText)).toEqual(["# Raft", ""]);
  expect(heading[1]?.widget).toEqual({ type: "text", data: [[]], rows: 1 });

  // The 46-cell source wraps to two rows at width 30, so the spacer takes one less.
  const long =
    "Intro\n\n# Consensus guarantees for distributed leaders\n\nBody";
  keepsRows(long, 2, 30);
  const spacers = at(long, 2, 30).filter((r) => r.widget?.type === "text");
  expect(spacers.map((r) => r.widget?.rows)).toEqual([6]);

  // A setext heading reveals its text and its underline: two source rows.
  const setext = "Intro\n\nRaft\n====\n\nBody";
  keepsRows(setext, 2);
  keepsRows(setext, 3);
  const revealed = at(setext, 2).filter(
    (r) => r.sourceLine === 2 || r.sourceLine === 3,
  );
  expect(revealed.map(rowText)).toEqual(["Raft", "===="]);
});

test("with sized text, inline math scripts and footnote labels are half-size pairs", () => {
  builtinRenderers();
  const note = "Lease $Q_{w}$ holds[^note]\n\n[^note]: why";
  const rows = (sizedText: boolean) =>
    layoutNote(
      noteView(note, { cursor: { line: 1, col: 0 } }),
      "live",
      stubCtx({ sizedText }),
    );
  const scripts = (row: RenderLine | undefined) =>
    (row?.spans ?? []).map((s) =>
      s.script === undefined ? s.text : [s.text, s.script.text, s.script.place],
    );
  const [para, , def] = rows(true);
  expect(scripts(para)).toEqual([
    "Lease ",
    "Q",
    ["w", "w", "sub"],
    " holds",
    ["n", "no", "sup"],
    ["t", "te", "sup"],
  ]);
  expect(scripts(def).slice(0, 3)).toEqual([
    ["n", "no", "sup"],
    ["t", "te", "sup"],
    " ",
  ]);
  const [plainPara, , plainDef] = rows(false);
  expect(rowText(plainPara)).toBe("Lease Q_{w} holds[note]");
  expect(rowText(plainDef)).toBe("[note] why");
});
