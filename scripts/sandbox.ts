// Launches so on a sandbox profile: a named demo vault staged under
// .sandbox/<profile>/, with its own config and state. A vault persists between
// runs; `--reset` restages it. `--list` names the profiles, `--journeys` prints
// a profile's manual checks. Other arguments go to so.
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { Profile } from "./sandbox/profile";
import { DEFAULT_PROFILE, PROFILES } from "./sandbox/profiles";

type SandboxArgs = {
  profile: string;
  reset: boolean;
  list: boolean;
  journeys: boolean;
  /** Arguments for so, in their original order. */
  passthrough: string[];
};

/** Sandbox flags out of `argv`; everything else is left for so. Throws on a bad flag. */
export function parseSandboxArgs(argv: readonly string[]): SandboxArgs {
  const args: SandboxArgs = {
    profile: DEFAULT_PROFILE,
    reset: false,
    list: false,
    journeys: false,
    passthrough: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] as string;
    // A `--` separator is dropped, as `bun run` does.
    if (a === "--") continue;
    if (a === "--reset") args.reset = true;
    else if (a === "--list") args.list = true;
    else if (a === "--journeys") args.journeys = true;
    else if (a.startsWith("--profile=")) args.profile = a.slice(10);
    else if (a === "--profile") {
      const name = argv[++i];
      if (name === undefined || name.startsWith("-"))
        throw new Error("--profile needs a name");
      args.profile = name;
    } else args.passthrough.push(a);
  }
  if (args.profile === "") throw new Error("--profile needs a name");
  return args;
}

/** Where a profile lives: the vault, so's config and state, and the staged marker. */
export function profilePaths(sandbox: string, name: string) {
  const dir = join(sandbox, name);
  return {
    dir,
    vault: join(dir, "vault"),
    xdgConfig: join(dir, "xdg/config"),
    xdgState: join(dir, "xdg/state"),
    config: join(dir, "xdg/config/so/config.toml"),
    staged: join(dir, ".staged"),
  };
}

/**
 * Stage `profile` unless a complete stage exists. The marker is written last,
 * so an interrupted stage is redone from scratch on the next run.
 */
export async function ensureStaged(
  profile: Profile,
  paths: ReturnType<typeof profilePaths>,
): Promise<void> {
  if (existsSync(paths.staged)) return;
  rmSync(paths.dir, { recursive: true, force: true });
  mkdirSync(paths.vault, { recursive: true });
  mkdirSync(join(paths.xdgConfig, "so"), { recursive: true });
  mkdirSync(paths.xdgState, { recursive: true });
  await profile.stage(paths.vault);
  if (profile.config !== undefined) writeFileSync(paths.config, profile.config);
  writeFileSync(paths.staged, "");
}

function formatList(): string {
  const width = Math.max(...PROFILES.map((p) => p.name.length));
  return PROFILES.map(
    (p) =>
      `  ${p.name.padEnd(width)}  ${p.summary}${p.name === DEFAULT_PROFILE ? " (default)" : ""}`,
  ).join("\n");
}

function formatJourneys(profile: Profile): string {
  return profile.journeys
    .map((j, n) =>
      [
        `${n + 1}. ${j.title}`,
        ...j.steps.map((s) => `   - ${s}`),
        ...j.expect.map((e) => `   ✓ ${e}`),
      ].join("\n"),
    )
    .join("\n\n");
}

async function main(): Promise<number> {
  let args: SandboxArgs;
  try {
    args = parseSandboxArgs(process.argv.slice(2));
  } catch (e) {
    console.error(
      `sandbox: ${(e as Error).message}\nprofiles:\n${formatList()}`,
    );
    return 2;
  }
  if (args.list) {
    console.log(formatList());
    return 0;
  }
  const profile = PROFILES.find((p) => p.name === args.profile);
  if (profile === undefined) {
    console.error(
      `sandbox: unknown profile "${args.profile}"\nprofiles:\n${formatList()}`,
    );
    return 2;
  }
  if (args.journeys) {
    console.log(
      `${profile.name} — ${profile.summary}\n\n${formatJourneys(profile)}`,
    );
    return 0;
  }

  const root = join(import.meta.dir, "..");
  const paths = profilePaths(join(root, ".sandbox"), profile.name);
  if (args.reset) rmSync(paths.dir, { recursive: true, force: true });
  await ensureStaged(profile, paths);

  const rel = (p: string) => relative(root, p);
  console.error(
    `sandbox: ${profile.name} → ${rel(paths.vault)} · config ${rel(paths.config)}\n` +
      `  --journeys for the checks, --reset to restage`,
  );
  const proc = Bun.spawn(
    [process.execPath, "src/app/main.ts", paths.vault, ...args.passthrough],
    {
      cwd: root,
      stdio: ["inherit", "inherit", "inherit"],
      env: {
        ...process.env,
        XDG_CONFIG_HOME: paths.xdgConfig,
        XDG_STATE_HOME: paths.xdgState,
        // Git stops at the profile folder instead of finding this repository.
        GIT_CEILING_DIRECTORIES: paths.dir,
      },
    },
  );
  // so is a grandchild of the terminal; pass on signals the wrapper receives.
  for (const signal of ["SIGHUP", "SIGTERM"] as const)
    process.on(signal, () => proc.kill(signal));
  return await proc.exited;
}

if (import.meta.main) process.exit(await main());
