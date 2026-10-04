import { contentEnd } from "../block-text";
import type { BlockRenderer } from "../live-preview";
import { lineStyle, replaceCols } from "./rows";

const ITEM = /^([ \t]*)([-+*]|\d{1,9}[.)])([ \t]+)(\[([ xX])\][ \t]+)?/;
const BULLETS = ["•", "◦", "▪"];

/** Bullets as `•` `◦` `▪` by depth, tasks as `☐`/`☑` with done items dimmed, and ordered markers styled. */
export const listRenderer: BlockRenderer = (block, v) => {
  const out = [];
  const last = Math.min(contentEnd(v.buf, block), v.visible.to - 1);
  for (let l = Math.max(block.startLine, v.visible.from); l <= last; l++) {
    const m = ITEM.exec(v.buf.line(l));
    if (m === null) continue;
    const indent = m[1]?.length ?? 0;
    const marker = m[2] ?? "";
    const end = m[0].length;
    if (m[4] !== undefined) {
      const done = m[5] !== " ";
      out.push(
        replaceCols(l, indent, end, [
          { text: done ? "☑ " : "☐ ", style: "mdMarker" },
        ]),
      );
      if (done) out.push(lineStyle(l, "dim"));
    } else if (/\d/.test(marker))
      out.push({
        kind: "mark" as const,
        range: {
          start: { line: l, col: indent },
          end: { line: l, col: indent + marker.length },
        },
        style: "mdMarker",
      });
    else {
      const bullet = BULLETS[Math.floor(indent / 2) % BULLETS.length];
      out.push(
        replaceCols(l, indent, end, [
          { text: `${bullet} `, style: "mdMarker" },
        ]),
      );
    }
  }
  return out;
};
