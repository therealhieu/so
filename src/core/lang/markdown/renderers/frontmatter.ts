import type { Span } from "../../../kernel/view/types";
import { contentEnd, contentStart } from "../block-text";
import type { BlockRenderer } from "../live-preview";
import { cells, replaceLine } from "./rows";

const KEY = /^([^\s:#][^:]*):[ \t]*(.*)$/;

/** A flow list `[a, b]` as `a · b`; other values as written. */
const valueText = (value: string) => {
  const list = /^\[(.*)\]$/.exec(value.trim());
  return list
    ? (list[1] ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "")
        .join(" · ")
    : value;
};

/** Frontmatter as a properties block: a `Properties` row, aligned keys and values, and the closing fence hidden. */
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
    replaceLine(v.buf, last),
  ];
  lines.forEach((t, i) => {
    const m = KEY.exec(t);
    const spans: Span[] = m
      ? [
          { text: (m[1] ?? "").trim().padEnd(width), style: "mdProperty" },
          { text: `  ${valueText(m[2] ?? "")}`, style: "text" },
        ]
      : [{ text: `${" ".repeat(width)}  ${t.trim()}`, style: "text" }];
    out.push(replaceLine(v.buf, first + 1 + i, spans));
  });
  return out;
};
