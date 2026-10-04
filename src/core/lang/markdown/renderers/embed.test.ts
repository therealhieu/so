import { beforeEach, expect, test } from "bun:test";
import {
  layoutNote,
  noteView,
  stubCtx,
} from "../../../../../test/support/markdown";
import { createTextBuffer } from "../../../kernel/text/text-buffer";
import type { Span } from "../../../kernel/view/types";
import { parseDoc } from "../doc";
import { type PreviewCtx, registerBlockRenderer } from "../live-preview";
import { type EmbedData, embedRenderer } from "./embed";

beforeEach(() => registerBlockRenderer("embed", embedRenderer));

const target = (text: string) => {
  const buf = createTextBuffer(text);
  return { doc: parseDoc(buf), text: buf };
};

const ROADMAP = target(
  [
    "# Roadmap",
    "",
    "## Goals",
    ...Array.from({ length: 25 }, (_, i) => `Goal line ${i + 1}`),
    "",
    "## Next",
    "Later work",
  ].join("\n"),
);

const NOTE = "Intro\n\n![[so-roadmap#Goals]]\n";

/** The embed widget of a note laid out with `ctx`. */
function embedOf(note: string, ctx: PreviewCtx) {
  const view = noteView(note, { cursor: { line: 0, col: 0 } });
  const rows = layoutNote(view, "live", ctx);
  const widget = rows.find((r) => r.widget?.type === "embed")?.widget;
  if (widget === undefined) throw new Error("no embed widget");
  return { rows: widget.rows, data: widget.data as EmbedData };
}

const text = (spans: Span[]) => spans.map((s) => s.text).join("");

test("an embedded section is capped with a more-lines row", () => {
  const { rows, data } = embedOf(
    NOTE,
    stubCtx({ embed: (p) => (p === "so-roadmap" ? ROADMAP : "missing") }),
  );
  expect(data.state).toBe("ok");
  expect(data.rows.map(text)).toEqual(
    Array.from({ length: 10 }, (_, i) => `Goal line ${i + 1}`),
  );
  expect(data.more).toBe(15);
  expect(rows).toBe(1 + 10 + 1);
});

test("a toggled embed expands fully", () => {
  const view = noteView(NOTE);
  const id = view.doc.blocks.find((b) => b.startLine === 2)?.id as number;
  const { rows, data } = embedOf(
    NOTE,
    stubCtx({ embed: () => ROADMAP, folds: new Set([id]) }),
  );
  expect(data.rows).toHaveLength(25);
  expect(data.more).toBe(0);
  expect(rows).toBe(1 + 25);
});

test("a loading embed reserves its rows", () => {
  const { rows, data } = embedOf(NOTE, stubCtx({ embed: () => "loading" }));
  expect(data.state).toBe("loading");
  expect(rows).toBe(3);
});

test("a missing embed shows only its title", () => {
  const { rows, data } = embedOf(NOTE, stubCtx({ embed: () => "missing" }));
  expect(data).toEqual({
    title: "so-roadmap#Goals",
    rows: [],
    more: 0,
    state: "missing",
  });
  expect(rows).toBe(1);
});

test("an embed whose target does not resolve is missing", () => {
  const { data } = embedOf(
    NOTE,
    stubCtx({ resolve: () => undefined, embed: () => ROADMAP }),
  );
  expect(data.state).toBe("missing");
});

test("embeds stop at one level", () => {
  const self = target("Self intro\n\n![[self]]\n");
  const { data } = embedOf(
    "Outer\n\n![[self]]\n",
    stubCtx({ embed: (p) => (p === "self" ? self : "missing") }),
  );
  expect(data.rows.map(text)).toEqual(["Self intro", "", "self"]);
  expect(data.rows[2]).toEqual([
    { text: "self", style: "mdLink", link: "self" },
  ]);
});
