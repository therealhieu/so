import { expect, test } from "bun:test";
import { OptimizedBuffer } from "@opentui/core";
import { cellWidth, clusters } from "../core/kernel/text/cells";
import { drawCells, themes } from "./theme";

const SAMPLES = [
  "中a",
  "👍b",
  "éx",
  "👨‍👩‍👧z",
  "🇻🇳q",
  "☺️w",
  "ｱｲ",
  "Ａ",
  "─│",
  "👍🏽",
  "#️⃣",
  "क्ष",
  "กำ",
  "가",
];

const coreWidths = (text: string) => {
  const out: number[] = [];
  let v = 0;
  for (const ch of clusters(text)) {
    const w = cellWidth(ch, v, 4);
    out.push(w);
    v += w;
  }
  return out;
};

test("the core measures each character as wide as OpenTUI's unicode width method draws it", () => {
  const buf = OptimizedBuffer.create(8, 1, "unicode");
  try {
    for (const text of SAMPLES) {
      const encoded = buf.encodeUnicode(text);
      if (encoded === null) throw new Error(`could not encode ${text}`);
      const widths = encoded.data.map((d) => d.width);
      buf.freeUnicode(encoded);
      expect({ text, widths: coreWidths(text) }).toEqual({ text, widths });
    }
  } finally {
    buf.destroy();
  }
});

test("a wide character that would cross the drawn width leaves a blank cell", () => {
  const buf = OptimizedBuffer.create(8, 1, "unicode");
  try {
    const s = themes.dark.style("text");
    drawCells(buf, s, 0, 0, "x".repeat(8), 8);
    drawCells(buf, s, 0, 0, "中文字", 5);
    const chars = [...buf.buffers.char];
    // 中 and 文 take cells 0-3, 字 does not fit in cell 4, and cells 5+ stay.
    expect(chars[4]).toBe(" ".charCodeAt(0));
    expect(chars.slice(5)).toEqual([..."xxx"].map((c) => c.charCodeAt(0)));
  } finally {
    buf.destroy();
  }
});
