import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createTextBuffer } from "../../kernel/text/text-buffer";
import { parseDoc } from "./doc";
import { escapeHtml, type HtmlCtx, renderHtml } from "./html";

const TOUR = readFileSync(
  new URL("../../../../test/fixtures/tour.md", import.meta.url),
  "utf8",
);

const NOTES: Record<string, string> = {
  "so-roadmap": "so-roadmap.md",
  "diagram.png": "images/diagram.png",
};
const ROADMAP =
  "# Roadmap\n\n## Goals\n\nShip the preview.\n\n## Later\n\nMore.\n";

/** Links resolve through a fixed table; `so-roadmap.md` is the only note that can be embedded. */
const ctx: HtmlCtx = {
  href: (t) => (NOTES[t] === undefined ? undefined : `/${NOTES[t]}`),
  asset: (t) => (NOTES[t] === undefined ? undefined : `/file/${NOTES[t]}`),
  embed: (t) => {
    if (t !== "so-roadmap") return undefined;
    const text = createTextBuffer(ROADMAP);
    return { doc: parseDoc(text), text };
  },
};

const render = (note: string, c: HtmlCtx = ctx) => {
  const text = createTextBuffer(note);
  const doc = parseDoc(text);
  return { doc, html: renderHtml(doc, text, c) };
};

test("every block becomes a section tagged with its line and hash", () => {
  const { doc, html } = render(TOUR);
  const sections = [
    ...html.matchAll(/<section data-line="(\d+)" data-hash="([^"]*)">/g),
  ];
  expect(sections.length).toBe(doc.blocks.length);
  sections.forEach((m, i) => {
    expect(Number(m[1])).toBe(doc.blocks[i]?.startLine as number);
    expect(m[2]).toBe(escapeHtml(doc.blocks[i]?.hash as string));
  });
  expect(html.match(/<section/g)?.length).toBe(doc.blocks.length);
});

test("wikilinks point at their note and unresolved links are marked", () => {
  const { html } = render(TOUR);
  expect(html).toContain(
    '<a class="wikilink" href="/so-roadmap.md">the roadmap</a>',
  );
  expect(html).toMatch(/<a class="wikilink unresolved"[^>]*>missing-note<\/a>/);
  expect(html).toContain('<a href="https://opentui.com">OpenTUI docs</a>');
});

test("local images load through the file route and web images keep their address", () => {
  const { html } = render(
    `${TOUR}\n![chart](https://example.com/chart.png)\n\n![x](javascript:alert(1))\n`,
  );
  expect(html).toContain('src="/file/images/diagram.png"');
  expect(html).toContain('src="https://example.com/chart.png"');
  expect(html).not.toContain("javascript:");
  expect(html).toMatch(/<img alt="x">/);
});

test("task checkboxes are read-only", () => {
  const { html } = render(TOUR);
  expect(html).toContain('<input type="checkbox" disabled>');
  expect(html).toContain('<input type="checkbox" disabled checked>');
  expect(html).not.toMatch(/<input(?![^>]*disabled)[^>]*>/);
});

test("diagrams and math keep their escaped source for the page to render", () => {
  const { html } = render(TOUR);
  expect(html).toContain(
    '<pre class="mermaid">flowchart LR\n  Capture --&gt; Triage --&gt; Plan --&gt; Ship\n  Triage --&gt;|someday| Archive</pre>',
  );
  expect(html).toContain(
    '<span class="math" data-tex="E = mc^2">E = mc^2</span>',
  );
  expect(html).toMatch(
    /<div class="math" data-tex="\\sum_\{i=1\}\^\{n\} x_i \\le \\frac\{a\}\{b\}">/,
  );
});

test("callouts, highlights, tags, and tables render as their own elements", () => {
  const { html } = render(TOUR);
  expect(html).toContain('<aside class="callout" data-type="note">');
  expect(html).toContain('<p class="callout-title">Reveal rule</p>');
  expect(html).toContain("<mark>highlighted</mark>");
  expect(html).toContain('<span class="tag">#so/ui</span>');
  expect(html).toContain('<div class="table-wrap"><table>');
  expect(html).not.toContain("This comment is hidden");
});

test("a note embed shows the target section once", () => {
  const { html } = render(TOUR);
  expect(html).toContain("Ship the preview.");
  expect(html).not.toContain("More.");
});

test("embeds inside an embedded note become links", () => {
  const self = "Intro\n\n![[so-roadmap]]\n";
  const nested: HtmlCtx = {
    ...ctx,
    embed: (t) => {
      if (t !== "so-roadmap") return undefined;
      const text = createTextBuffer("Inner\n\n![[so-roadmap]]\n");
      return { doc: parseDoc(text), text };
    },
  };
  const { html } = render(self, nested);
  expect(html.match(/<div class="embed"/g)?.length).toBe(1);
  expect(html).toContain(
    '<a class="wikilink" href="/so-roadmap.md">so-roadmap</a>',
  );
});

test("note text cannot inject markup into the page", () => {
  const note = [
    "<script>alert(1)</script>",
    "",
    'A [link](https://a.test "x\\" onerror=\\"alert(1)") and <img src=x onerror=alert(1)>.',
    "",
    '<div onclick="alert(1)">raw block</div>',
    "",
    '[[a" onmouseover="y|b" onfocus="z]]',
    "",
    '![["><svg onload=alert(1)>]]',
  ].join("\n");
  const html = renderHtml(
    parseDoc(createTextBuffer(note)),
    createTextBuffer(note),
    {
      href: (t) => `/${t}`,
      asset: (t) => `/file/${t}`,
      embed: () => undefined,
    },
  );
  expect(html).not.toContain("<script");
  expect(html).not.toContain("<img src=x");
  expect(html).not.toContain("<div onclick");
  expect(html).not.toContain("<svg");
  expect(html).not.toMatch(/title="[^"]*"[^>]*onerror/);
  const attributes = (html.match(/<[a-z][^>]*>/g) ?? []).map((tag) =>
    tag.replace(/"[^"]*"/g, '""'),
  );
  for (const tag of attributes) expect(tag).not.toMatch(/\son\w+=/);
  expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
});

test("escaping covers every character that can end text or an attribute", () => {
  expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
    "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;",
  );
});
