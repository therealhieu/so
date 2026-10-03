import { expect, test } from "bun:test";
import { createTextBuffer } from "../../kernel/text/text-buffer";
import { type Block, type Doc, parseDoc } from "./doc";
import { blockNode, type MdNode } from "./mdast";
import { isExternal, markdownTarget } from "./syntax";

type Facts = {
  links: {
    kind: string;
    target: string;
    subpath?: string;
    alias?: string;
    line: number;
  }[];
  tags: { tag: string; line: number }[];
  headings: { text: string; level: number; line: number }[];
  blockIds: { id: string; line: number }[];
};

/** Differences the two levels are allowed to have, as "file: fact". */
const ALLOWED_DIFFERENCES: string[] = [];

const CORPUS = "test/fixtures/markdown-corpus";

async function corpus(): Promise<{ name: string; text: string }[]> {
  const files: { name: string; text: string }[] = [];
  for await (const name of new Bun.Glob("*.md").scan(CORPUS))
    files.push({ name, text: await Bun.file(`${CORPUS}/${name}`).text() });
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

const optional = <K extends string>(key: K, value: string | undefined) =>
  (value === undefined ? {} : { [key]: value }) as Partial<Record<K, string>>;

function scanFacts(doc: Doc): Facts {
  return {
    links: doc.scan.links
      .filter((l) => l.inFrontmatter === undefined)
      .map((l) => ({
        kind: l.kind,
        target: l.target,
        ...optional("subpath", l.subpath),
        ...optional("alias", l.alias),
        line: l.range.start.line,
      })),
    tags: doc.scan.tags.map((t) => ({ tag: t.tag, line: t.range.start.line })),
    headings: doc.scan.headings,
    blockIds: doc.scan.blockIds,
  };
}

const startLine = (node: MdNode) =>
  ((node.position as { start?: { line?: number } } | undefined)?.start?.line ??
    1) - 1;

/** The source-like text of a node: values of its leaves, in order. */
const plain = (node: MdNode): string =>
  node.children === undefined
    ? (node.value ?? "")
    : node.children.map(plain).join("");

function mdastFacts(
  doc: Doc,
  text: (from: number, to: number) => string,
): Facts {
  const facts: Facts = { links: [], tags: [], headings: [], blockIds: [] };
  const visit = (node: MdNode, block: Block) => {
    const line = block.startLine + startLine(node);
    switch (node.type) {
      case "wikiLink":
      case "embed":
        facts.links.push({
          kind: node.type === "embed" ? "embed" : "wiki",
          target: String(node.target),
          ...optional("subpath", node.subpath as string | undefined),
          ...optional("alias", node.alias as string | undefined),
          line,
        });
        break;
      case "link":
      case "image": {
        const url = String(node.url);
        if (url !== "" && !isExternal(url)) {
          const { target, subpath } = markdownTarget(url);
          facts.links.push({
            kind: "md",
            target,
            ...optional("subpath", subpath),
            line,
          });
        }
        break;
      }
      case "tag":
        facts.tags.push({ tag: String(node.tag), line });
        break;
      case "blockId":
        facts.blockIds.push({ id: String(node.id), line });
        break;
      case "heading":
        facts.headings.push({
          text: plain(node).trim(),
          level: Number(node.depth),
          line,
        });
        break;
    }
    for (const child of node.children ?? []) visit(child, block);
  };
  for (const block of doc.blocks) visit(blockNode(doc, block, text), block);
  const byLine = <T extends { line: number }>(list: T[]) =>
    list.sort((a, b) => a.line - b.line);
  byLine(facts.links);
  byLine(facts.tags);
  return facts;
}

test("scan and mdast agree on every corpus note", async () => {
  const files = await corpus();
  expect(files.length).toBeGreaterThanOrEqual(5);
  for (const { name, text } of files) {
    const buf = createTextBuffer(text.replace(/\n$/, ""));
    const doc = parseDoc(buf);
    const lines = (from: number, to: number) => {
      const out: string[] = [];
      for (let i = from; i <= to; i++) out.push(buf.line(i));
      return out.join("\n");
    };
    const scan = scanFacts(doc);
    const mdast = mdastFacts(doc, lines);
    const differences = (
      ["links", "tags", "headings", "blockIds"] as const
    ).flatMap((k) =>
      JSON.stringify(scan[k]) === JSON.stringify(mdast[k])
        ? []
        : [`${name}: ${k}`],
    );
    expect({
      name,
      differences: differences.filter((d) => !ALLOWED_DIFFERENCES.includes(d)),
    }).toEqual({ name, differences: [] });
    expect({ name, ...mdast }).toEqual({ name, ...scan });
  }
});

test("a cached block tree equals a freshly parsed one", () => {
  const text = "Some [[cached]] text #tag ^id";
  const doc = parseDoc(createTextBuffer(text));
  const block = doc.blocks[0] as Block;
  const first = blockNode(doc, block, () => text);
  const again = blockNode(doc, block, () => text);
  expect(again).toBe(first);
  const uncached = blockNode(
    doc,
    { ...block, hash: `${block.hash}:miss` },
    () => text,
  );
  expect(uncached).not.toBe(first);
  expect(uncached).toEqual(first);
});
