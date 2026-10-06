import { expect, test } from "bun:test";
import { createTextBuffer } from "../text/text-buffer";
import { inlayHintMarks } from "./inlay-hints";
import { layoutText } from "./text-view";
import type { TextView } from "./types";
import { wrapText } from "./wrap";

const view = (lines: string[]): TextView => ({
  buf: createTextBuffer(lines.join("\n")),
  width: 80,
  topRow: 0,
  rows: lines.length,
  cursor: { line: 0, col: 0 },
  folds: new Set(),
  visible: { from: 0, to: lines.length },
});

const hint = (line: number, col: number, label: string) => ({
  pos: { line, col },
  label,
});

test("hints sit before their characters and leave the source text alone", () => {
  const rows = layoutText(
    view(["let d = distance(a, b);"]),
    [
      inlayHintMarks([
        hint(0, 5, ": f64"),
        hint(0, 17, "a: "),
        hint(0, 20, "b: "),
      ]),
    ],
    undefined,
  );
  expect(wrapText(rows[0]?.spans ?? [])).toBe(
    "let d: f64 = distance(a: a, b: b);",
  );
  expect(rows[0]?.spans.filter((sp) => sp.virtual === "inline")).toHaveLength(
    3,
  );
});

test("hints on the hidden line, off screen, or past the end are handled", () => {
  const rows = layoutText(
    view(["ab", "cd"]),
    [inlayHintMarks([hint(0, 1, "x"), hint(1, 99, "!"), hint(5, 0, "y")], 0)],
    undefined,
  );
  expect(wrapText(rows[0]?.spans ?? [])).toBe("ab");
  expect(wrapText(rows[1]?.spans ?? [])).toBe("cd!");
});
