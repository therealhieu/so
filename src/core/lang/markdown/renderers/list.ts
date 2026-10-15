import type { Decoration } from "../../../kernel/view/decorations";
import { contentEnd } from "../block-text";
import type { BlockRenderer } from "../live-preview";
import { nestedFences } from "./code";
import { lineStyle, replaceCols } from "./rows";

const ITEM = /^([ \t]*)([-+*]|\d{1,9}[.)])([ \t]+)(\[([ xX])\][ \t]+)?/;
const BULLETS = ["•", "◦", "▪"];

const indentOf = (text: string) => text.length - text.trimStart().length;

/**
 * Bullets as `•` `◦` `▪` by depth, tasks as `☐`/`☑` with done items dimmed,
 * ordered markers styled, and fenced code in items rendered like top-level
 * fences, its indent kept off the code band.
 */
export const listRenderer: BlockRenderer = (block, v) => {
  const out: Decoration[] = [];
  const stop = contentEnd(v.buf, block);
  const fences = nestedFences(v.buf, block.startLine, stop, indentOf);
  out.push(...fences.decorations);
  const last = Math.min(stop, v.visible.to - 1);
  for (let l = Math.max(block.startLine, v.visible.from); l <= last; l++) {
    const text = v.buf.line(l);
    const indent = fences.lines.get(l);
    if (indent !== undefined) {
      if (indent > 0)
        out.push(
          replaceCols(l, 0, indent, [
            { text: text.slice(0, indent), style: "text" },
          ]),
        );
      continue;
    }
    const m = ITEM.exec(text);
    if (m === null) continue;
    const depth = m[1]?.length ?? 0;
    const marker = m[2] ?? "";
    const end = m[0].length;
    if (m[4] !== undefined) {
      const done = m[5] !== " ";
      out.push(
        replaceCols(l, depth, end, [
          { text: done ? "☑ " : "☐ ", style: "mdMarker" },
        ]),
      );
      if (done) out.push(lineStyle(l, "dim"));
    } else if (/\d/.test(marker))
      out.push({
        kind: "mark" as const,
        range: {
          start: { line: l, col: depth },
          end: { line: l, col: depth + marker.length },
        },
        style: "mdMarker",
      });
    else {
      const bullet = BULLETS[Math.floor(depth / 2) % BULLETS.length];
      out.push(
        replaceCols(l, depth, end, [{ text: `${bullet} `, style: "mdMarker" }]),
      );
    }
  }
  return out;
};
