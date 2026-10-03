// Records Neovim 0.11 results for every case in test/vim/cases.ts into
// test/vim/expected.json. Local only: `NVIM=/path/to/nvim bun run record:vim`.
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cases, type VimCase } from "../test/vim/cases";

type Recorded = VimCase & {
  after: {
    lines: string[];
    /** Neovim's 1-based line and 1-based byte column. */
    cursor: [number, number];
    /** `mode(1)`: "n", "i", "v", "V", "no", … */
    mode: string;
    /** Non-empty registers; `type` is `getregtype()`: "v" or "V". */
    regs: Record<string, { text: string; type: string }>;
  };
};

const REGISTERS = '"0123456789abcdefghijklmnopqrstuvwxyz-';
const STATE_EXPR = `json_encode({"lines": getline(1, "$"), "pos": getcurpos(), "mode": mode(1), "regs": map(split('${REGISTERS}', '\\zs'), {_, r -> [r, getreg(r), getregtype(r)]})})`;
const CONCURRENCY = 8;
const servers = new Set<Bun.Subprocess>();

/** Vim single-quoted string literal. */
const vimString = (s: string) => `'${s.replaceAll("'", "''")}'`;

/** Exits 1 unless `nvim --version` reports 0.11.x; returns the version. */
function assertNvim011(nvim: string): string {
  let first = "";
  try {
    first =
      Bun.spawnSync([nvim, "--version"]).stdout.toString().split("\n")[0] ?? "";
  } catch {
    first = "not found";
  }
  if (!first.startsWith("NVIM v0.11.")) {
    console.error(
      `record-vim requires Neovim 0.11.x (${nvim}: ${first || "no version output"}); set NVIM to a 0.11 binary`,
    );
    process.exit(1);
  }
  return first.slice("NVIM v".length).trim();
}

/** Runs one case in a fresh `nvim --clean --headless -n --listen` server over RPC (`-n`: no swap file). */
async function recordCase(nvim: string, c: VimCase): Promise<Recorded> {
  const sock = join(tmpdir(), `so-rec-${process.pid}-${c.id}.sock`);
  const server = Bun.spawn(
    [nvim, "--clean", "--headless", "-n", "--listen", sock],
    { stdout: "ignore", stderr: "ignore" },
  );
  servers.add(server);
  const expr = (e: string) =>
    Bun.$`${nvim} --server ${sock} --remote-expr ${e}`.quiet().text();
  try {
    for (let i = 0; ; i++) {
      if (existsSync(sock) && (await expr("1").catch(() => "")) === "1") break;
      if (i > 200) throw new Error(`${c.id}: server did not start`);
      await Bun.sleep(10);
    }
    // Setting lines with undolevels=-1 leaves an empty undo history; redraw
    // computes the window's bottom line, which Ctrl-d and L depend on.
    await expr(
      `[execute('set undolevels=-1'), setline(1, json_decode(${vimString(JSON.stringify(c.before.lines))})), execute('set undolevels=1000'), cursor(${c.before.cursor.line + 1}, ${c.before.cursor.col + 1}), execute('redraw')]`,
    );
    await expr(`nvim_input(${vimString(c.keys)})`);
    let previous = "";
    for (let i = 0; ; i++) {
      if (i > 100) throw new Error(`${c.id}: Neovim is still waiting for keys`);
      await Bun.sleep(30);
      const mode = JSON.parse(await expr("json_encode(nvim_get_mode())"));
      if (mode.blocking) continue;
      const state = await expr(STATE_EXPR);
      if (state === previous) break;
      previous = state;
    }
    const raw = JSON.parse(previous) as {
      lines: string[];
      pos: number[];
      mode: string;
      regs: [string, string, string][];
    };
    const regs: Recorded["after"]["regs"] = {};
    for (const [name, text, type] of raw.regs)
      if (text !== "") regs[name] = { text, type };
    return {
      ...c,
      after: {
        lines: raw.lines,
        cursor: [raw.pos[1] ?? 0, raw.pos[2] ?? 0],
        mode: raw.mode,
        regs,
      },
    };
  } finally {
    servers.delete(server);
    server.kill();
    await rm(sock, { force: true });
  }
}

async function main() {
  const nvim = process.env.NVIM ?? "nvim";
  const version = assertNvim011(nvim);
  const recorded: Recorded[] = new Array(cases.length);
  let next = 0;
  process.on("exit", () => {
    for (const s of servers) s.kill();
  });
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < cases.length) {
        const i = next++;
        recorded[i] = await recordCase(nvim, cases[i] as VimCase);
      }
    }),
  );
  await Bun.write(
    "test/vim/expected.json",
    `${JSON.stringify({ nvim: version, recordedAt: new Date().toISOString(), cases: recorded }, null, 2)}\n`,
  );
  console.log(`recorded ${recorded.length} cases with Neovim ${version}`);
}

await main();
