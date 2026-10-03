import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import xterm from "@xterm/headless";
import type { Terminal as PtyTerminal, Subprocess } from "bun";

const ESC = String.fromCharCode(0x1b);
const KITTY_QUERY = `${ESC}[?u`;
// CSI parameters of SGR sequences; colour codes are 30–37, 38, 40–47, 48, 90–97, 100–107.
const SGR = new RegExp(`${ESC}\\[([0-9;:]*)m`, "g");

/**
 * What the raw output stream did, which the emulator does not expose: the
 * last cursor show/hide, kitty keyboard push/pop, and any colour SGR.
 */
export class TerminalProbe {
  /** "h" (shown) or "l" (hidden) from the last `CSI ? 25 h/l`. */
  lastCursor: "h" | "l" | undefined;
  /** The last kitty keyboard push (`CSI > n u`) or pop (`CSI < u`). */
  lastKitty: "push" | "pop" | undefined;
  kittyPushed = false;
  /** SGR colour parameters other than the defaults 39 and 49. */
  colours: string[] = [];
  text = "";

  feed(s: string): void {
    this.text += s;
    for (const m of s.matchAll(new RegExp(`${ESC}\\[\\?25([hl])`, "g")))
      this.lastCursor = m[1] as "h" | "l";
    for (const m of s.matchAll(new RegExp(`${ESC}\\[([<>])[0-9]*u`, "g"))) {
      this.lastKitty = m[1] === ">" ? "push" : "pop";
      if (m[1] === ">") this.kittyPushed = true;
    }
    for (const m of s.matchAll(SGR)) {
      const params = (m[1] ?? "").split(/[;:]/);
      for (let i = 0; i < params.length; i++) {
        const p = Number(params[i]);
        if (p === 38 || p === 48) {
          this.colours.push(m[0]);
          break;
        }
        if (
          (p >= 30 && p <= 37) ||
          (p >= 40 && p <= 47) ||
          (p >= 90 && p <= 97) ||
          (p >= 100 && p <= 107)
        )
          this.colours.push(m[0]);
      }
    }
  }
}

export type PtyOptions = {
  env?: Record<string, string>;
  cols?: number;
  rows?: number;
  /** Drives the process: type keys, send signals, wait. */
  script: (p: PtyProcess) => Promise<void>;
};

export type PtyProcess = {
  proc: Subprocess;
  probe: TerminalProbe;
  /** Write bytes to the terminal as typed input. */
  type(s: string): void;
  /** The emulator's visible screen as text. */
  screen(): string;
  /** Resolve once `pred` holds, polling every 10 ms. */
  waitFor(pred: () => boolean, ms?: number): Promise<void>;
  /** Whether the process has exited. */
  exited(): boolean;
};

export type PtyRun = {
  exitCode: number;
  probe: TerminalProbe;
  screen: {
    buffer: "normal" | "alternate";
    mouse: "none" | "x10" | "vt200" | "drag" | "any";
    text: string;
  };
};

const decoder = new TextDecoder();

/** Every line of the active buffer, including scrollback. */
function screenText(term: xterm.Terminal): string {
  const buf = term.buffer.active;
  const lines: string[] = [];
  for (let i = 0; i < buf.length; i++)
    lines.push(buf.getLine(i)?.translateToString(true) ?? "");
  return lines.join("\n");
}

/** Run `argv` in a pseudo-terminal rendered by a headless xterm. */
export async function runInPty(argv: string[], o: PtyOptions): Promise<PtyRun> {
  const cols = o.cols ?? 100;
  const rows = o.rows ?? 30;
  const term = new xterm.Terminal({ cols, rows, allowProposedApi: true });
  const probe = new TerminalProbe();
  let done = false;
  // The session state file goes to a private folder, never the user's.
  const state = await mkdtemp(join(tmpdir(), "so-pty-state-"));
  const proc = Bun.spawn(argv, {
    env: {
      ...process.env,
      TERM: "xterm-256color",
      XDG_STATE_HOME: state,
      ...o.env,
    },
    terminal: {
      cols,
      rows,
      data(t: PtyTerminal, bytes: Uint8Array) {
        const s = decoder.decode(bytes, { stream: true });
        probe.feed(s);
        term.write(s);
        // Answer the kitty keyboard query, as a kitty-capable terminal does.
        if (s.includes(KITTY_QUERY)) t.write(`${ESC}[?0u`);
      },
    },
  });
  void proc.exited.then(() => {
    done = true;
  });
  const pty: PtyProcess = {
    proc,
    probe,
    type: (s) => proc.terminal?.write(s),
    screen: () => screenText(term),
    async waitFor(pred, ms = 5000) {
      const until = performance.now() + ms;
      while (!pred()) {
        if (performance.now() > until) throw new Error("timed out waiting");
        await Bun.sleep(10);
      }
    },
    exited: () => done,
  };
  try {
    await o.script(pty);
  } catch (e) {
    proc.kill("SIGKILL");
    await rm(state, { recursive: true, force: true });
    throw e;
  }
  const exitCode = await proc.exited;
  await Bun.sleep(50);
  // Flush pending writes into the emulator before reading its state.
  await new Promise<void>((r) => term.write("", r));
  const text = screenText(term);
  const buffer = term.buffer.active.type;
  proc.terminal?.close();
  term.dispose();
  await rm(state, { recursive: true, force: true });
  return {
    exitCode,
    probe,
    screen: {
      buffer,
      mouse: term.modes.mouseTrackingMode,
      text,
    },
  };
}

/** The first frame is painted and the kitty keyboard mode is on. */
export const ready = (p: PtyProcess): Promise<void> =>
  p.waitFor(() => p.probe.kittyPushed && p.screen().includes("NOTES"));
