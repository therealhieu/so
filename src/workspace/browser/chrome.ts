import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Cdp, createCdp, pipeTransport } from "./cdp";

/** Chrome-family programs looked up on PATH, in this order. */
export const CHROME_NAMES = [
  "google-chrome",
  "google-chrome-stable",
  "chromium",
  "chromium-browser",
  "chrome",
  "microsoft-edge",
  "brave-browser",
] as const;

/** macOS app bundles, checked in `/Applications` then `~/Applications`. */
export const MAC_APPS = [
  "Google Chrome.app/Contents/MacOS/Google Chrome",
  "Chromium.app/Contents/MacOS/Chromium",
  "Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "Brave Browser.app/Contents/MacOS/Brave Browser",
] as const;

export type ChromeLookup =
  | { kind: "found"; path: string }
  | { kind: "missing"; configured?: string };

/**
 * The browser to run: the configured path when one is set (and nothing else),
 * else the first Chrome-family program on PATH, else on macOS the first
 * installed app bundle.
 */
export function findChrome(d: {
  configured: string;
  which: (name: string) => string | null;
  exists: (path: string) => boolean;
  platform: NodeJS.Platform;
  home: string;
}): ChromeLookup {
  if (d.configured !== "")
    return d.exists(d.configured)
      ? { kind: "found", path: d.configured }
      : { kind: "missing", configured: d.configured };
  for (const name of CHROME_NAMES) {
    const path = d.which(name);
    if (path !== null) return { kind: "found", path };
  }
  if (d.platform === "darwin")
    for (const dir of ["/Applications", join(d.home, "Applications")])
      for (const app of MAC_APPS) {
        const path = join(dir, app);
        if (d.exists(path)) return { kind: "found", path };
      }
  return { kind: "missing" };
}

/** Command-line switches for a headless browser driven over a pipe. */
export function chromeArgs(profileDir: string): string[] {
  return [
    "--headless=new",
    "--remote-debugging-pipe",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-sync",
    "--mute-audio",
    "--hide-scrollbars",
    `--user-data-dir=${profileDir}`,
    "about:blank",
  ];
}

/** A running browser; it exits when `so` does, because its pipe closes. */
export type ChromeProcess = {
  cdp: Cdp;
  pid: number | undefined;
  /** Resolves once the process has exited. */
  exited: Promise<void>;
  /** Close the connection, kill the process, and delete its profile. */
  stop(): Promise<void>;
};

export const CHROME_LIMITS = {
  startTimeoutMs: 15_000,
  stopBoundMs: 500,
  stderrTailBytes: 4096,
} as const;

/**
 * Start `path` headless with a fresh profile in the temporary folder and
 * wait until it answers; rejects with Chrome's last error output when it
 * exits or stays silent past the start timeout.
 */
export async function launchChrome(
  path: string,
  o: { extraArgs?: string[]; startTimeoutMs?: number } = {},
): Promise<ChromeProcess> {
  const profile = mkdtempSync(join(tmpdir(), "so-chrome-"));
  const removeProfile = () => {
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {}
  };
  const child = spawn(path, [...chromeArgs(profile), ...(o.extraArgs ?? [])], {
    stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr?.on("data", (chunk: Buffer) => {
    stderr = (stderr + chunk.toString("utf8")).slice(
      -CHROME_LIMITS.stderrTailBytes,
    );
  });
  const exited = new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    child.once("error", () => resolve());
  });
  let spawnError: string | undefined;
  child.once("error", (e) => {
    spawnError = e.message;
  });
  const out = child.stdio[3] as NodeJS.WritableStream | null;
  const input = child.stdio[4] as NodeJS.ReadableStream | null;
  if (out === null || input === null) {
    child.kill("SIGKILL");
    removeProfile();
    throw new Error("could not open the DevTools pipe");
  }
  // A write after Chrome exits fails on the stream; the closed connection reports it.
  out.on("error", () => {});
  const cdp = createCdp(
    pipeTransport(out, input as unknown as Parameters<typeof pipeTransport>[1]),
  );
  void exited.then(() => cdp.close("Chrome exited"));
  let stopping: Promise<void> | undefined;
  const stop = () => {
    stopping ??= (async () => {
      cdp.close("Chrome stopped");
      child.kill("SIGTERM");
      const bound = Bun.sleep(CHROME_LIMITS.stopBoundMs).then(() => "late");
      if ((await Promise.race([exited, bound])) === "late") {
        child.kill("SIGKILL");
        await exited;
      }
      removeProfile();
    })();
    return stopping;
  };
  const stderrDone = new Promise<void>((resolve) => {
    if (child.stderr === null) resolve();
    else child.stderr.once("close", () => resolve());
  });
  const why = (fallback: string) => {
    const line = stderr
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "" && !l.startsWith("DevTools"))
      .at(-1);
    return spawnError ?? line ?? fallback;
  };
  const timeoutMs = o.startTimeoutMs ?? CHROME_LIMITS.startTimeoutMs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let late = false;
  try {
    await Promise.race([
      cdp.send("Browser.getVersion"),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          late = true;
          reject(new Error("Chrome did not answer in time"));
        }, timeoutMs);
      }),
    ]);
  } catch (e) {
    await stop();
    if (late) throw e;
    // Chrome that exits closes its pipe first: its last error line says why.
    await Promise.race([stderrDone, Bun.sleep(CHROME_LIMITS.stopBoundMs)]);
    throw new Error(why("Chrome did not start"));
  } finally {
    clearTimeout(timer);
  }
  return { cdp, pid: child.pid, exited, stop };
}
