import { contentEnd, contentStart } from "../block-text";
import type { BlockRenderer } from "../live-preview";
import { nestedFences } from "./code";
import { markCols, replaceCols, replaceLine, wrapPrefix } from "./rows";

type Look = { icon: string; style: string };

/** Callout types by look: an icon and a style token. Unknown types look like notes. */
const LOOKS = new Map<string, Look>();
const GROUPS: readonly [string, string, string][] = [
  ["●", "mdCalloutNote", "note info abstract summary tldr"],
  ["☐", "mdCalloutNote", "todo"],
  ["❝", "mdCalloutNote", "quote cite example"],
  ["★", "mdCalloutTip", "tip hint important success check done"],
  ["?", "mdCalloutTip", "question help faq"],
  ["▲", "mdCalloutWarning", "warning caution attention"],
  ["✗", "mdCalloutDanger", "danger error failure fail missing bug"],
];
for (const [icon, style, types] of GROUPS)
  for (const type of types.split(" ")) LOOKS.set(type, { icon, style });
const NOTE: Look = { icon: "●", style: "mdCalloutNote" };
const QUOTE: Look = { icon: "", style: "mdQuote" };

const TITLE = /^ {0,3}>[ \t]?\[!([\w-]+)\]([+-]?)[ \t]*(.*)$/;
const PREFIX = /^(?: {0,3}>[ \t]?)+/;

/**
 * A callout's title row (icon, title, and `▸`/`▾` when foldable) and its body
 * in plain text behind a `▎` bar repeated on every wrap row, or the body
 * hidden when folded; `[!x]-` starts folded and a block id in `folds` flips
 * that. A click on the marker flips it too. Plain quotes get the bar and
 * quote text only. Fenced code in either is rendered like a top-level fence.
 */
export const calloutRenderer: BlockRenderer = (block, v, { ctx }) => {
  const first = contentStart(v.buf, block);
  const last = contentEnd(v.buf, block);
  const title = TITLE.exec(v.buf.line(first));
  const type = title?.[1]?.toLowerCase() ?? "";
  const { icon, style } = title ? (LOOKS.get(type) ?? NOTE) : QUOTE;
  const out = [];
  let body = first;
  if (title) {
    const fold = title[2] ?? "";
    const folded = (fold === "-") !== ctx.folds.has(block.id);
    const name = title[3]?.trim() || type[0]?.toUpperCase() + type.slice(1);
    const marker = fold === "" && !folded ? "" : folded ? " ▸" : " ▾";
    out.push(
      replaceLine(v.buf, first, [
        { text: `${icon} ${name}`, style },
        ...(marker === "" ? [] : [{ text: marker, style, fold: block.id }]),
      ]),
    );
    body = first + 1;
    if (folded) {
      if (last > first)
        out.push({
          kind: "replace" as const,
          range: {
            start: { line: body, col: 0 },
            end: { line: last, col: v.buf.line(last).length },
          },
          block: true,
        });
      return out;
    }
  }
  const fences = nestedFences(
    v.buf,
    body,
    last,
    (text) => PREFIX.exec(text)?.[0].length ?? 0,
  );
  for (
    let l = Math.max(body, v.visible.from);
    l <= last && l < v.visible.to;
    l++
  ) {
    const prefix = PREFIX.exec(v.buf.line(l));
    if (prefix === null) continue;
    const from = prefix[0].length;
    const bar = [{ text: "▎ ", style }];
    const textStyle = fences.lines.has(l)
      ? "mdCode"
      : title
        ? "text"
        : "mdQuote";
    out.push(
      replaceCols(l, 0, from, bar),
      markCols(l, from, v.buf.line(l).length, textStyle),
      wrapPrefix(l, bar),
    );
  }
  // After the body marks, so code colours win over them.
  out.push(...fences.decorations);
  return out;
};
