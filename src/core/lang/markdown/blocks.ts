export type BlockKind =
  | "frontmatter"
  | "fence"
  | "math"
  | "indentedCode"
  | "heading"
  | "list"
  | "html"
  | "comment"
  | "paragraph";

/** Lines `startLine … endLine` (inclusive); trailing blank lines belong to the block before them. */
export type BlockSpan = { kind: BlockKind; startLine: number; endLine: number };

/** The read-only line view of a `TextBuffer`; the worker passes an array-backed one. */
export type LineSource = { line(i: number): string; lineCount: number };

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;
const MATH_OPEN = /^ {0,3}(\${2,})([^$]*)$/;
const MATH_CLOSE = /^ {0,3}(\${2,})[ \t]*$/;
const ATX = /^ {0,3}#{1,6}(?:[ \t]|$)/;
const LIST_ITEM = /^ {0,3}(?:[-+*]|\d{1,9}[.)])(?:[ \t]|$)/;
/** A list item that may interrupt a paragraph: a bullet or `1.` with content. */
const LIST_INTERRUPT = /^ {0,3}(?:[-+*]|1[.)])[ \t]+\S/;
const LIST_MARKER = /^(?:[-+*]|\d{1,9}[.)])[ \t]+/;
const THEMATIC = /^ {0,3}(?:(?:-[ \t]*){3,}|(?:\*[ \t]*){3,}|(?:_[ \t]*){3,})$/;
const SETEXT = /^ {0,3}(?:=+|-+)[ \t]*$/;
const INDENTED = /^(?: {4}|\t)/;
const COMMENT_OPEN = /^ {0,3}%%/;
const HTML_COMMENT = /^ {0,3}<!--/;
const HTML_RAW = /^ {0,3}<(?:script|pre|style|textarea)(?:[\s>]|$)/i;
const HTML_RAW_CLOSE = /<\/(?:script|pre|style|textarea)>/i;
const HTML_BLOCK =
  /^ {0,3}<\/?(?:address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?:[\s/>]|$)/i;
const HTML_TAG_LINE =
  /^ {0,3}(?:<[A-Za-z][A-Za-z0-9-]*(?:\s[^<>]*)?\/?>|<\/[A-Za-z][A-Za-z0-9-]*\s*>)\s*$/;

const isBlank = (text: string) => text.trim() === "";

type Fence = { char: string; length: number; close: RegExp };

/** A ``` / ~~~ or `$$` opener on `text`, or nothing. */
export function openFence(text: string): Fence | undefined {
  const code = FENCE_OPEN.exec(text);
  if (code !== undefined && code !== null) {
    const run = code[1] ?? "";
    const info = code[2] ?? "";
    if (run[0] === "`" && info.includes("`")) return undefined;
    return { char: run[0] ?? "`", length: run.length, close: FENCE_CLOSE };
  }
  const math = MATH_OPEN.exec(text);
  if (math === null) return undefined;
  return { char: "$", length: (math[1] ?? "").length, close: MATH_CLOSE };
}

/** True when `text` closes `fence`: the same marker, at least as long. */
export function closesFence(fence: Fence, text: string): boolean {
  const run = fence.close.exec(text)?.[1];
  return (
    run !== undefined && run[0] === fence.char && run.length >= fence.length
  );
}

const opensComment = (text: string) => {
  const m = COMMENT_OPEN.exec(text);
  return m !== null && !text.slice(m[0].length).includes("%%");
};

const indentOf = (text: string): number => {
  let width = 0;
  for (const ch of text) {
    if (ch === " ") width++;
    else if (ch === "\t") width += 4 - (width % 4);
    else break;
  }
  return width;
};

/** Lines that end a paragraph or a list without a blank line. */
const interrupts = (text: string) =>
  ATX.test(text) ||
  openFence(text) !== undefined ||
  THEMATIC.test(text) ||
  opensComment(text) ||
  HTML_COMMENT.test(text) ||
  HTML_RAW.test(text) ||
  HTML_BLOCK.test(text);

/**
 * Blank-line-bounded blocks in one pass. Frontmatter (first line `---`), fences (``` or ~~~ with matching
 * close), `$$` math, `%%` comments, and lists are kept whole; an unclosed fence runs to the end.
 */
export function splitBlocks(src: LineSource): BlockSpan[] {
  const n = src.lineCount;
  const line = (i: number) => src.line(i);
  const lastLine = n - 1;

  /** The first line at or after `from` that satisfies `test`, or the last line. */
  const findLine = (from: number, test: (text: string) => boolean) => {
    for (let j = from; j < n; j++) if (test(line(j))) return j;
    return lastLine;
  };
  const nextNonBlank = (from: number) => {
    let j = from;
    while (j < n && isBlank(line(j))) j++;
    return j;
  };

  const fenceEnd = (
    start: number,
    fence: Fence,
    strip: (t: string) => string,
  ) => findLine(start + 1, (t) => closesFence(fence, strip(t)));

  /** The last line before the next blank line. */
  const untilBlank = (start: number) => {
    let j = start;
    while (j + 1 < n && !isBlank(line(j + 1))) j++;
    return j;
  };

  const paragraphEnd = (start: number) => {
    let j = start;
    while (j + 1 < n) {
      const next = line(j + 1);
      if (isBlank(next)) break;
      if (!SETEXT.test(next) && (interrupts(next) || LIST_INTERRUPT.test(next)))
        break;
      j++;
    }
    return j;
  };

  const listContent = (text: string) =>
    text.trimStart().replace(LIST_MARKER, "");

  const listEnd = (start: number) => {
    let j = start;
    for (;;) {
      const fence = openFence(listContent(line(j)));
      if (fence !== undefined) j = fenceEnd(j, fence, (t) => t.trimStart());
      if (j + 1 >= n) return j;
      const next = line(j + 1);
      if (isBlank(next)) {
        const m = nextNonBlank(j + 1);
        if (m >= n) return j;
        const text = line(m);
        if (
          !THEMATIC.test(text) &&
          (LIST_ITEM.test(text) || indentOf(text) >= 2)
        )
          j = m;
        else return j;
      } else if (THEMATIC.test(next)) return j;
      else if (LIST_ITEM.test(next) || indentOf(next) >= 1) j++;
      else if (interrupts(next)) return j;
      else j++;
    }
  };

  const indentedEnd = (start: number) => {
    let j = start;
    while (j + 1 < n) {
      if (INDENTED.test(line(j + 1)) && !isBlank(line(j + 1))) j++;
      else if (isBlank(line(j + 1))) {
        const m = nextNonBlank(j + 1);
        if (m < n && INDENTED.test(line(m))) j = m;
        else break;
      } else break;
    }
    return j;
  };

  /** The kind and last content line of the block starting at non-blank line `s`. */
  const blockAt = (s: number): [BlockKind, number] => {
    const text = line(s);
    if (s === 0 && text.trimEnd() === "---") {
      for (let j = 1; j < n; j++)
        if (line(j).trimEnd() === "---") return ["frontmatter", j];
    }
    if (INDENTED.test(text)) return ["indentedCode", indentedEnd(s)];
    const fence = openFence(text);
    if (fence !== undefined)
      return [
        fence.char === "$" ? "math" : "fence",
        fenceEnd(s, fence, (t) => t),
      ];
    if (opensComment(text))
      return ["comment", findLine(s + 1, (t) => t.includes("%%"))];
    if (HTML_COMMENT.test(text))
      return ["html", findLine(s, (t) => t.includes("-->"))];
    if (HTML_RAW.test(text))
      return ["html", findLine(s, (t) => HTML_RAW_CLOSE.test(t))];
    if (HTML_BLOCK.test(text) || HTML_TAG_LINE.test(text))
      return ["html", untilBlank(s)];
    if (ATX.test(text)) return ["heading", s];
    if (THEMATIC.test(text)) return ["paragraph", s];
    if (LIST_ITEM.test(text)) return ["list", listEnd(s)];
    return ["paragraph", paragraphEnd(s)];
  };

  const spans: BlockSpan[] = [];
  let start = 0;
  let s = nextNonBlank(0);
  if (s >= n) return [{ kind: "paragraph", startLine: 0, endLine: lastLine }];
  while (s < n) {
    const [kind, contentEnd] = blockAt(s);
    let end = contentEnd;
    while (end + 1 < n && isBlank(line(end + 1))) end++;
    spans.push({ kind, startLine: start, endLine: end });
    start = end + 1;
    s = start;
  }
  return spans;
}
