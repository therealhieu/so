import type { TextBuffer } from "../../kernel/text/text-buffer";
import { fenceBody, rootOf } from "./block-text";
import type { Block, Doc } from "./doc";
import { blocksIn } from "./live-preview";
import type { MdNode } from "./mdast";
import { embedOnly, renderKey } from "./render-key";
import { sectionLines } from "./renderers/embed";
import { isWebUrl } from "./renderers/image";
import { isExternal } from "./syntax";

/** Link targets, image sources, and embedded notes for the HTML of one note. */
export type HtmlCtx = {
  /** The page address of the note or file a link target names, or nothing when it does not resolve. */
  href(target: string): string | undefined;
  /** The address of a workspace file an image target names, or nothing. */
  asset(target: string): string | undefined;
  /** The analysis and text of the note an embed target names, or nothing. */
  embed(target: string): { doc: Doc; text: TextBuffer } | undefined;
};

const ENTITY: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Text safe inside an element or a quoted attribute. */
export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ENTITY[c] ?? c);

const attr = (name: string, value: string | undefined) =>
  value === undefined ? "" : ` ${name}="${escapeHtml(value)}"`;

/** Only web and mail links leave the page; any other scheme renders as text. */
const SAFE_EXTERNAL = /^(?:https?|mailto):/i;

const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

/** An image's `src`: web addresses as written, workspace files through `ctx.asset`, nothing for other schemes. */
function imageSrc(target: string, ctx: HtmlCtx): string | undefined {
  if (isWebUrl(target)) return target;
  if (isExternal(target)) return undefined;
  return ctx.asset(decode(target));
}

const CALLOUT_TITLE = /^\[!([\w-]+)\][+-]?[ \t]*([^\n]*)\n?/;

type Out = { ctx: HtmlCtx; depth: number; tight: boolean };

const children = (node: MdNode, o: Out) =>
  (node.children ?? []).map((c) => nodeHtml(c, o)).join("");

function wikiHtml(node: MdNode, o: Out): string {
  const target = String(node.target ?? "");
  const subpath = node.subpath === undefined ? "" : String(node.subpath);
  const label = String(node.alias ?? `${target}${subpath}`);
  const href = o.ctx.href(target);
  return href === undefined
    ? `<a class="wikilink unresolved" title="create it in so with gd">${escapeHtml(label)}</a>`
    : `<a class="wikilink"${attr("href", href)}>${escapeHtml(label)}</a>`;
}

function embedHtml(node: MdNode, o: Out): string {
  const target = String(node.target ?? "");
  const kind = embedOnly(target);
  if (kind === "image") {
    const alias = node.alias === undefined ? undefined : String(node.alias);
    const alt =
      alias === undefined || /^\d+(x\d+)?$/.test(alias) ? target : alias;
    return `<img${attr("src", imageSrc(target, o.ctx))}${attr("alt", alt)}>`;
  }
  if (kind !== "embed" || o.depth > 0) return wikiHtml(node, o);
  const got = o.ctx.embed(target);
  const lines =
    got === undefined
      ? undefined
      : sectionLines(
          got.doc,
          got.text,
          node.subpath === undefined ? undefined : String(node.subpath),
        );
  if (got === undefined || lines === undefined)
    return `<div class="embed missing">${wikiHtml(node, o)}</div>`;
  const inner = blocksIn(got.doc, lines)
    .map((b) => blockHtml(b, got.doc, got.text, o.ctx, o.depth + 1))
    .join("");
  return `<div class="embed"><p class="embed-title">${wikiHtml(node, o)}</p>${inner}</div>`;
}

function linkHtml(node: MdNode, o: Out): string {
  const url = String(node.url ?? "");
  const title = node.title == null ? undefined : String(node.title);
  const body = children(node, o);
  if (SAFE_EXTERNAL.test(url))
    return `<a${attr("href", url)}${attr("title", title)}>${body}</a>`;
  if (isExternal(url) || url === "") return `<span class="link">${body}</span>`;
  const hash = url.indexOf("#");
  const href = o.ctx.href(decode(hash === -1 ? url : url.slice(0, hash)));
  return href === undefined
    ? `<a class="unresolved"${attr("title", title)}>${body}</a>`
    : `<a${attr("href", href)}${attr("title", title)}>${body}</a>`;
}

function calloutHtml(node: MdNode, o: Out): string {
  const type = String(node.kind ?? "note");
  const [first, ...rest] = node.children ?? [];
  const lead = first?.children?.[0];
  const m = CALLOUT_TITLE.exec(lead?.type === "text" ? (lead.value ?? "") : "");
  const title =
    m?.[2]?.trim() || `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
  const leadRest =
    lead === undefined ? "" : (lead.value ?? "").slice(m?.[0].length ?? 0);
  const firstBody =
    first === undefined
      ? ""
      : children(
          {
            ...first,
            children: [
              ...(leadRest === "" ? [] : [{ type: "text", value: leadRest }]),
              ...(first.children ?? [])
                .slice(1)
                .filter((c, i) => i > 0 || c.type !== "break"),
            ],
          },
          o,
        );
  const body = `${firstBody === "" ? "" : `<p>${firstBody}</p>`}${rest.map((c) => nodeHtml(c, o)).join("")}`;
  return `<aside class="callout"${attr("data-type", type)}><p class="callout-title">${escapeHtml(title)}</p>${body}</aside>`;
}

function tableHtml(node: MdNode, o: Out): string {
  const align = (node.align as (string | null)[] | undefined) ?? [];
  const rows = (node.children ?? []).map((row, r) => {
    const tag = r === 0 ? "th" : "td";
    const cells = (row.children ?? []).map((cell, c) => {
      const a = align[c] ?? undefined;
      return `<${tag}${attr("style", a == null ? undefined : `text-align: ${a}`)}>${children(cell, o)}</${tag}>`;
    });
    return `<tr>${cells.join("")}</tr>`;
  });
  const [head, ...body] = rows;
  return `<div class="table-wrap"><table><thead>${head ?? ""}</thead><tbody>${body.join("")}</tbody></table></div>`;
}

function listItemHtml(node: MdNode, o: Out): string {
  const inner = children(node, { ...o, tight: node.spread !== true });
  if (typeof node.checked !== "boolean") return `<li>${inner}</li>`;
  const box = `<input type="checkbox" disabled${node.checked ? " checked" : ""}>`;
  return `<li class="task">${box} ${inner}</li>`;
}

function nodeHtml(node: MdNode, o: Out): string {
  const value = node.value ?? "";
  switch (node.type) {
    case "root":
      return children(node, o);
    case "text":
      return escapeHtml(value);
    case "paragraph":
      return o.tight ? children(node, o) : `<p>${children(node, o)}</p>`;
    case "heading": {
      const depth = Math.min(6, Math.max(1, Number(node.depth) || 1));
      return `<h${depth}>${children(node, o)}</h${depth}>`;
    }
    case "emphasis":
      return `<em>${children(node, o)}</em>`;
    case "strong":
      return `<strong>${children(node, o)}</strong>`;
    case "delete":
      return `<del>${children(node, o)}</del>`;
    case "highlight":
      return `<mark>${children(node, o)}</mark>`;
    case "inlineCode":
      return `<code>${escapeHtml(value)}</code>`;
    case "code": {
      const lang =
        node.lang == null ? undefined : `language-${String(node.lang)}`;
      return `<pre><code${attr("class", lang)}>${escapeHtml(value)}</code></pre>`;
    }
    case "inlineMath":
      return `<span class="math"${attr("data-tex", value)}>${escapeHtml(value)}</span>`;
    case "math":
      return `<div class="math"${attr("data-tex", value)}>${escapeHtml(value)}</div>`;
    case "break":
      return "<br>";
    case "thematicBreak":
      return "<hr>";
    case "blockquote":
      return `<blockquote>${children(node, { ...o, tight: false })}</blockquote>`;
    case "callout":
      return calloutHtml(node, { ...o, tight: false });
    case "list": {
      const start =
        node.ordered && Number(node.start) !== 1
          ? attr("start", String(node.start))
          : "";
      const tag = node.ordered ? "ol" : "ul";
      return `<${tag}${start}>${children(node, o)}</${tag}>`;
    }
    case "listItem":
      return listItemHtml(node, o);
    case "table":
      return tableHtml(node, o);
    case "link":
      return linkHtml(node, o);
    case "linkReference":
    case "imageReference":
      return `<span class="link">${children(node, o) || escapeHtml(String(node.label ?? ""))}</span>`;
    case "image":
      return `<img${attr("src", imageSrc(String(node.url ?? ""), o.ctx))}${attr("alt", String(node.alt ?? ""))}>`;
    case "wikiLink":
      return wikiHtml(node, o);
    case "embed":
      return embedHtml(node, o);
    case "tag":
      return `<span class="tag">${escapeHtml(value)}</span>`;
    case "inlineFootnote":
      return `<span class="footnote">${escapeHtml(value)}</span>`;
    case "footnoteReference":
      return `<sup class="footnote-ref">${escapeHtml(String(node.label ?? node.identifier ?? ""))}</sup>`;
    case "footnoteDefinition":
      return `<div class="footnote"><sup>${escapeHtml(String(node.label ?? node.identifier ?? ""))}</sup>${children(node, { ...o, tight: false })}</div>`;
    case "html":
      return `<span class="raw-html">${escapeHtml(value)}</span>`;
    case "yaml":
      return `<pre class="frontmatter"><code>${escapeHtml(value)}</code></pre>`;
    case "comment":
    case "blockId":
    case "definition":
      return "";
    default:
      return node.children === undefined
        ? escapeHtml(value)
        : children(node, o);
  }
}

function blockHtml(
  block: Block,
  doc: Doc,
  text: TextBuffer,
  ctx: HtmlCtx,
  depth: number,
): string {
  const key = renderKey(block, doc, text);
  if (key === "mermaid")
    return `<pre class="mermaid">${escapeHtml(fenceBody(text, block).join("\n"))}</pre>`;
  return nodeHtml(rootOf(doc, block, text), { ctx, depth, tight: false });
}

/**
 * The note as an HTML fragment: one `section` per block carrying its first
 * line and hash. Every text node and attribute is escaped and raw HTML is
 * shown as text, so note content cannot add markup or script to the page.
 * Embeds show their target note once; embeds inside it are links.
 */
export function renderHtml(
  doc: Doc,
  text: TextBuffer,
  ctx: HtmlCtx,
  depth = 0,
): string {
  return doc.blocks
    .map(
      (b) =>
        `<section data-line="${b.startLine}" data-hash="${escapeHtml(b.hash)}">${blockHtml(b, doc, text, ctx, depth)}</section>`,
    )
    .join("");
}
