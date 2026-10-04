import { afterEach, expect, test } from "bun:test";
import {
  layoutNote,
  noteView,
  rowText,
} from "../../../../test/support/markdown";
import type { Block } from "./doc";
import { type BlockRenderer, registerBlockRenderer } from "./live-preview";

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
