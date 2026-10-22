import type { ToolResult } from "../core/state/types";
import type { Logger } from "../workspace/log";

/** Runs one argv (never through a shell) on the shared terminal until it exits. */
export type ToolSpawn = (
  argv: string[],
  cwd: string,
) => Promise<{ code: number; signal?: string }>;

/** Runs an interactive program that takes over the terminal while it runs. */
export type ToolHost = {
  run(argv: string[], cwd: string): Promise<ToolResult>;
};

/** What the tool host needs from the screen: the shell, by structure. */
type Screen = {
  flush(): Promise<void>;
  suspend(): Promise<void>;
  resume(): Promise<void>;
  resetForeignModes(): void;
};

/** Bun's spawn with the terminal's stdin, stdout, and stderr. */
export const bunToolSpawn: ToolSpawn = async (argv, cwd) => {
  const p = Bun.spawn(argv, { cwd, stdio: ["inherit", "inherit", "inherit"] });
  const code = await p.exited;
  return p.signalCode === null
    ? { code }
    : { code, signal: String(p.signalCode) };
};

/**
 * A missing program never takes the terminal. Otherwise the current frame
 * is written first, interrupts are held, and the screen is suspended while
 * the program runs; whatever happens to it, the foreign modes are reset, the
 * screen resumes, and interrupts are released exactly once. A failed restore
 * step is logged and rejects the run.
 */
export function createToolHost(d: {
  screen: Screen;
  holdInterrupts: () => () => void;
  spawn?: ToolSpawn;
  which: (command: string) => string | null;
  logger: Logger;
}): ToolHost {
  const spawn = d.spawn ?? bunToolSpawn;
  return {
    async run(argv, cwd) {
      const tool = argv[0] ?? "";
      if (d.which(tool) === null) return { kind: "missing", tool };
      await d.screen.flush();
      const release = d.holdInterrupts();
      await d.screen.suspend();
      try {
        const { code, signal } = await spawn(argv, cwd);
        d.logger.info(
          "git.tool.exit",
          signal === undefined ? { code } : { code, signal },
        );
        return signal === undefined
          ? { kind: "exited", code }
          : { kind: "exited", code, signal };
      } catch (x) {
        const reason = message(x);
        d.logger.error("git.tool.exit", { reason });
        return { kind: "failed", reason };
      } finally {
        await restore(release);
      }
    },
  };

  /** Each step runs even when an earlier one throws; the error still surfaces. */
  async function restore(release: () => void): Promise<void> {
    try {
      try {
        d.screen.resetForeignModes();
      } finally {
        try {
          await d.screen.resume();
        } finally {
          release();
        }
      }
    } catch (x) {
      d.logger.error("git.tool.restore", { reason: message(x) });
      throw x;
    }
  }
}

const message = (x: unknown): string =>
  x instanceof Error ? x.message : String(x);
