import type { Span } from "../../../kernel/view/types";
import { contentEnd, contentStart } from "../block-text";
import type { BlockRenderer } from "../live-preview";
import { cells, replaceLine } from "./rows";

const KEY = /^([^\s:#][^:]*):[ \t]*(.*)$/;
const ITEM = /^\s*-\s+(.*)$/;

const unquote = (s: string) => s.trim().replace(/^(["'])(.*)\1$/, "$2");

/** A flow list `[a, b]` as its items; other values as one item written as is. */
const items = (value: string): string[] => {
  const list = /^\[(.*)\]$/.exec(value.trim());
  return list
    ? (list[1] ?? "")
        .split(",")
        .map(unquote)
        .filter((s) => s !== "")
    : [value];
};

/** Values as spans: tags as `#tag` chips, list items two spaces apart. */
const valueSpans = (key: string, values: string[]): Span[] =>
  values.flatMap((value, i) => {
    const sep: Span[] = i === 0 ? [] : [{ text: "  ", style: "text" }];
    return key === "tags" && value !== ""
      ? [...sep, { text: `#${value.replace(/^#/, "")}`, style: "mdTag" }]
      : [...sep, { text: value, style: "text" }];
  });

/**
 * Frontmatter as a properties block: a `Properties` row, aligned keys and
 * values with tags as chips, and the closing fence drawn as a rule.
 */
export const frontmatterRenderer: BlockRenderer = (block, v) => {
  const first = contentStart(v.buf, block);
  const last = contentEnd(v.buf, block);
  const lines: string[] = [];
  for (let l = first + 1; l < last; l++) lines.push(v.buf.line(l));
  const width = Math.max(
    0,
    ...lines.map((t) => cells(KEY.exec(t)?.[1]?.trim() ?? "")),
  );
  const out = [
    replaceLine(v.buf, first, [{ text: "Properties", style: "mdProperty" }]),
    replaceLine(v.buf, last, [
      {
        text: "─".repeat(Math.max(1, Math.min(48, v.width - 2))),
        style: "dim",
      },
    ]),
  ];
  let key = "";
  lines.forEach((t, i) => {
    const m = KEY.exec(t);
    if (m) key = (m[1] ?? "").trim();
    const tag = m || key !== "tags" ? undefined : ITEM.exec(t);
    const spans: Span[] = m
      ? [
          { text: key.padEnd(width), style: "mdProperty" },
          { text: "  ", style: "text" },
          ...valueSpans(key, items(m[2] ?? "")),
        ]
      : [
          { text: `${" ".repeat(width)}  `, style: "text" },
          ...(tag
            ? valueSpans(key, [unquote(tag[1] ?? "")])
            : [{ text: t.trim(), style: "text" }]),
        ];
    out.push(replaceLine(v.buf, first + 1 + i, spans));
  });
  return out;
};
