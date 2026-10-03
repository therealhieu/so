import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { xdgDir } from "./config-file";

type Fields = Record<string, string | number | boolean>;

/**
 * The debug log. Fields are scalars; callers pass paths, counts, durations,
 * and reasons, never note text.
 */
export type Logger = {
  info(event: string, fields?: Fields): void;
  error(event: string, fields?: Fields): void;
};

const quiet: Logger = { info() {}, error() {} };

/**
 * With `SO_LOG=debug`, a logger that appends JSON lines to
 * `$XDG_STATE_HOME/so/so.log` (or `~/.local/state/so/so.log`), created
 * with mode 0600. Otherwise every call does nothing and no file is created.
 * A failed write is dropped: logging never stops the editor.
 */
export function createLogger(
  env: Record<string, string | undefined>,
  home: string,
): Logger {
  if (env.SO_LOG !== "debug") return quiet;
  const dir = join(
    xdgDir(env, "XDG_STATE_HOME", join(home, ".local/state")),
    "so",
  );
  const file = join(dir, "so.log");
  const write = (level: "info" | "error", event: string, fields?: Fields) => {
    try {
      mkdirSync(dir, { recursive: true, mode: 0o700 });
      const line = { ...fields, time: new Date().toISOString(), level, event };
      appendFileSync(file, `${JSON.stringify(line)}\n`, { mode: 0o600 });
    } catch {}
  };
  return {
    info: (event, fields) => write("info", event, fields),
    error: (event, fields) => write("error", event, fields),
  };
}
