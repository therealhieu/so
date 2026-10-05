import { afterEach, expect, test } from "bun:test";
import { TextAttributes } from "@opentui/core";
import type { Diagnostic } from "../../src/core/kernel/view/diagnostics";
import type { LspResult } from "../../src/core/state/lsp-types";
import type { Effect } from "../../src/core/state/types";
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

/** foo.rs attached to a ready server, then `keys` and the answer to the request they send. */
async function answered(
  keys: string,
  result: LspResult,
  cols = 100,
): Promise<Mounted> {
  const x = await mountShell({ cols, rows: 24 });
  x.open("foo.rs", RUST);
  x.store.dispatch({
    type: "lspServer",
    key: "fake@/ws",
    view: {
      name: "fake",
      root: "/ws",
      state: "ready",
      features: ["hover", "signature", "completion"],
      pullDiagnostics: false,
      completionTriggers: [],
      signatureTriggers: ["("],
    },
  });
  x.store.dispatch({ type: "lspAttached", path: "foo.rs", keys: ["fake@/ws"] });
  x.keys(keys);
  const sent = x.effects.find(
    (e): e is Extract<Effect, { kind: "lsp" }> => e.kind === "lsp",
  );
  if (sent === undefined) throw new Error("no request sent");
  x.store.dispatch({ type: "lspResult", id: sent.id, result, now: x.now() });
  return x;
}

/** The cursor on `z`, and a hover answered with `text`. */
const withHover = (text: string, cols?: number) =>
  answered("2j12lK", { kind: "hover", text }, cols);

test("a hover float paints below the cursor and ignores a click", async () => {
  m = await withHover("let z: i32\n\nThe answer.");
  expect(m.store.get().lsp.float?.kind).toBe("hover");
  const lines = (await m.frame()).split("\n");
  const cursorRow = lines.findIndex((l) => l.includes("let y = z;"));
  const below = lines.slice(cursorRow + 1, cursorRow + 6).join("\n");
  expect(below).toContain("let z: i32");
  expect(below).toContain("The answer.");
  const y = lines.findIndex((l) => l.includes("let z: i32"));
  const x = (lines[y] ?? "").indexOf("let z: i32");
  const before = m.store.get();
  await m.mouse.click(x + 2, y);
  expect(m.store.get()).toBe(before);
});

test("a long hover is wrapped within 80 columns and 12 rows", async () => {
  const long = Array.from({ length: 40 }, (_, i) => `word${i}`).join(" ");
  m = await withHover(Array.from({ length: 20 }, () => long).join("\n"));
  const lines = (await m.frame()).split("\n");
  const top = lines.findIndex((l) => l.includes("╭"));
  const bottom = lines.findIndex((l, i) => i > top && l.includes("╰"));
  expect(top).toBeGreaterThan(0);
  expect(bottom - top + 1).toBeLessThanOrEqual(12);
  const row = lines[top] ?? "";
  const width = row.lastIndexOf("╮") - row.indexOf("╭") + 1;
  expect(width).toBeLessThanOrEqual(80);
  expect(width).toBeGreaterThan(40);
});

test("signature help marks the active parameter", async () => {
  const label = "add(a: i32, b: i32) -> i32";
  m = await answered("2jA(", {
    kind: "signature",
    label,
    active: { start: 12, end: 18 },
  });
  expect(m.store.get().lsp.float?.kind).toBe("signature");
  const lines = (await m.frame()).split("\n");
  const y = lines.findIndex((l) => l.includes(label));
  const x = (lines[y] ?? "").indexOf(label);
  const spans = m.t.captureSpans().lines;
  const bg = (cx: number) => cellStyle(spans, cx, y)?.bg;
  expect(bg(x + 12)).not.toBe(bg(x + 4));
  expect(bg(x + 17)).toBe(bg(x + 12));
  expect(bg(x + 18)).toBe(bg(x + 4));
});

test("the statusline shows a ready server attached to the buffer", async () => {
  m = await withHover("x");
  expect(await m.row(-2)).toContain("│ ◆ fake");
});

test("a narrow terminal drops the server segment", async () => {
  m = await withHover("x", 80);
  const row = await m.row(-2);
  expect(row).toContain("foo.rs");
  expect(row).not.toContain("fake");
});

test("the command line shows the cursor diagnostic in Normal mode only", async () => {
  m = await withError();
  m.keys("2j12l");
  expect((await m.row(-1)).trim()).toBe(
    "E rustc: cannot find value `z` in this scope",
  );
  m.keys("i");
  expect(await m.row(-1)).not.toContain("cannot find");
  m.keys("<Esc>:");
  expect((await m.row(-1)).trim()).toBe(":");
});

test("code completion rows show kind, label, and detail", async () => {
  const item = (label: string, kind: string, detail: string) => ({
    label,
    kind,
    detail,
    filterText: label,
    sortText: kind,
    additional: [],
    resolved: true,
    data: undefined,
  });
  m = await answered("2jA<C-Space>", {
    kind: "completion",
    items: [
      item("len", "Method", "fn(&self) -> usize"),
      item("Vec", "Struct", "alloc::vec"),
    ],
    incomplete: false,
  });
  expect(m.store.get().overlay.kind).toBe("completion");
  const frame = await m.frame();
  expect(frame).toMatch(/▸ Method len +fn\(&self\) -> usize/);
  expect(frame).toMatch(/ {3}Struct Vec +alloc::vec/);
  expect(frame).toContain("─ fake ─");
});
