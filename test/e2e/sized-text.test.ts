import { afterAll, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ready, runInPty, statusRow } from "./pty";

const MAIN = join(import.meta.dir, "../../src/app/main.ts");
const ESC = String.fromCharCode(0x1b);
const NOTE = [
  "# Raft",
  "",
  "## Guarantees",
  "",
  "$$",
  "Q_{w} + Q_{r} > N",
  "$$",
  "",
  "Quorums overlap.[^1]",
  "",
  "[^1]: Every pair shares a node.",
  "",
  "End.",
  "",
].join("\n");
/** OpenTUI's startup probe for text sizing: one space at 2×, never note text. */
const PROBE = new RegExp(`${ESC}\\]66;s=2; (${ESC}\\\\|\\x07)`, "g");

const temps: string[] = [];
afterAll(async () => {
  for (const dir of temps) await rm(dir, { recursive: true, force: true });
});

test("a terminal without text sizing shows headings, math, and footnotes as today and gets no sizing bytes", async () => {
  const root = await mkdtemp(join(tmpdir(), "so-sized-"));
  temps.push(root);
  const path = join(root, "raft.md");
  await writeFile(path, NOTE);
  let screen = "";
  const r = await runInPty([process.execPath, MAIN, path], {
    async script(p) {
      await ready(p);
      // The cursor leaves the heading, so it shows rendered rather than as source.
      p.type("G");
      await p.waitFor(() => statusRow(p).includes("13:1"));
      await p.waitFor(() => p.screen().includes("█ Raft"));
      screen = p.screen();
      p.type(":q\r");
    },
  });
  expect(r.exitCode).toBe(0);
  const rows = screen.split("\n");
  const h1 = rows.findIndex((l) => l.includes("█ Raft"));
  expect(rows.findIndex((l) => l.includes("▊ Guarantees"))).toBe(h1 + 2);
  expect(screen).toContain("math: unsupported TeX shown as source");
  const output = r.probe.text.replace(PROBE, "");
  expect(output).not.toContain(`${ESC}]66;s=`);
  expect(output).not.toContain(`${ESC}]66;n=`);
});

test("with text zoom set, a terminal without text sizing shows the reading view as today and gets no sizing bytes", async () => {
  const root = await mkdtemp(join(tmpdir(), "so-zoom-"));
  temps.push(root);
  const path = join(root, "raft.md");
  await writeFile(path, NOTE);
  let screen = "";
  const r = await runInPty([process.execPath, MAIN, path], {
    config: "zoom = 2\n",
    async script(p) {
      await ready(p);
      // live → source → reading
      p.type(" m");
      await p.waitFor(() => p.screen().includes("mode: source"));
      p.type(" m");
      await p.waitFor(() => p.screen().includes("mode: reading"));
      await p.waitFor(() => p.screen().includes("Quorums overlap."));
      screen = p.screen();
      p.type(":q\r");
    },
  });
  expect(r.exitCode).toBe(0);
  expect(screen).toContain("█ Raft");
  const output = r.probe.text.replace(PROBE, "");
  expect(output).not.toContain(`${ESC}]66;s=`);
  expect(output).not.toContain(`${ESC}]66;n=`);
});
