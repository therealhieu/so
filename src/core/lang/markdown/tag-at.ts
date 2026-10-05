import type { Pos } from "../../kernel/text/pos";
import type { TextBuffer } from "../../kernel/text/text-buffer";
import { contentEnd, contentStart } from "./block-text";
import type { Doc } from "./doc";

const KEY = /^([^\s:#][^:]*):[ \t]*(.*)$/;
const ITEM = /^(\s*-\s+)(.*)$/;

const bare = (s: string) =>
  s
    .trim()
    .replace(/^(["'])(.*)\1$/, "$2")
    .replace(/^#/, "");

const covers = (at: Pos, r: { start: Pos; end: Pos }) =>
  (at.line > r.start.line ||
    (at.line === r.start.line && at.col >= r.start.col)) &&
  (at.line < r.end.line || (at.line === r.end.line && at.col < r.end.col));

/** The item of `value` (starting at column `from`) that column `col` is on: one of a `[a, b]` list, else the whole value. */
function itemAt(value: string, from: number, col: number): string | undefined {
  const list = /^(\s*\[)(.*)\]\s*$/.exec(value);
  if (list === null) {
    const tag = bare(value);
    return col >= from && tag !== "" ? tag : undefined;
  }
  let start = from + (list[1]?.length ?? 0);
  for (const part of (list[2] ?? "").split(",")) {
    const end = start + part.length;
    if (col >= start && col <= end) {
      const tag = bare(part);
      return tag === "" ? undefined : tag;
    }
    start = end + 1;
  }
  return undefined;
}

/** The tag in frontmatter `tags` under `at`, as `tags: [a, b]`, `tags: a`, or a `- a` item line. */
function frontmatterTagAt(
  doc: Doc,
  text: TextBuffer,
  at: Pos,
): string | undefined {
  const block = doc.blocks[0];
  if (block?.kind !== "frontmatter") return undefined;
  const first = contentStart(text, block);
  const last = contentEnd(text, block);
  if (at.line <= first || at.line >= last) return undefined;
  let key = "";
  for (let l = first + 1; l <= at.line; l++) {
    const m = KEY.exec(text.line(l));
    if (m) key = (m[1] ?? "").trim();
  }
  if (key !== "tags") return undefined;
  const line = text.line(at.line);
  const m = KEY.exec(line);
  if (m) {
    const value = m[2] ?? "";
    return itemAt(value, line.length - value.length, at.col);
  }
  const item = ITEM.exec(line);
  if (item === null) return undefined;
  const tag = bare(item[2] ?? "");
  return at.col >= (item[1]?.length ?? 0) && tag !== "" ? tag : undefined;
}

/** The tag at `at`, without its `#`: an inline `#tag`, or an item of the frontmatter `tags`. */
export function tagAt(doc: Doc, text: TextBuffer, at: Pos): string | undefined {
  const inline = doc.scan.tags.find((t) => covers(at, t.range));
  return inline?.tag ?? frontmatterTagAt(doc, text, at);
}
