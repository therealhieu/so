import { afterEach, expect, test } from "bun:test";
import { TextAttributes } from "@opentui/core";
import type { Diagnostic } from "../../src/core/kernel/view/diagnostics";
import { cellStyle, type Mounted, mountShell } from "../support/ui";

let m: Mounted | undefined;
afterEach(() => {
  m?.destroy();
  m = undefined;
});

const RUST = "fn main() {\n    let x = 1;\n    let y = z;\n}\n";

const error = (line: number, start: number, end: number): Diagnostic => ({
  range: { start: { line, col: start }, end: { line, col: end } },
  severity: 1,
  message: "cannot find value `z` in this scope",
  source: "rustc",
});

/** foo.rs open in the only window, with one error published for line 3. */
async function withError(): Promise<Mounted> {
  const x = await mountShell({ cols: 100, rows: 24 });
  x.open("foo.rs", RUST);
  x.store.dispatch({
    type: "lspDiagnostics",
    key: "fake@/ws",
    path: "foo.rs",
    source: "push",
    items: [error(2, 12, 13)],
  });
  return x;
}

/** The cell left of a line's text: the sign cell of the gutter. */
async function signBefore(x: Mounted, text: string): Promise<string> {
  const lines = (await x.frame()).split("\n");
  const row = lines.find((l) => l.includes(text)) ?? "";
  const cells = [...row];
  const at = cells.join("").indexOf(text);
  return cells[at - 1] ?? "";
}

test("a window paints an error sign in the gutter for a shown diagnostic", async () => {
  m = await withError();
  expect(await signBefore(m, "    let y = z;")).toBe("E");
  expect(await signBefore(m, "    let x = 1;")).toBe(" ");
});

test("a shown diagnostic underlines its range and nothing else", async () => {
  m = await withError();
  const lines = (await m.frame()).split("\n");
  const y = lines.findIndex((l) => l.includes("let y = z;"));
  const x = (lines[y] ?? "").indexOf("z;");
  const spans = m.t.captureSpans().lines;
  const underlined = (cx: number) =>
    ((cellStyle(spans, cx, y)?.attrs ?? 0) & TextAttributes.UNDERLINE) !== 0;
  expect(underlined(x)).toBe(true);
  expect(underlined(x + 1)).toBe(false);
  expect(underlined(x - 2)).toBe(false);
});
