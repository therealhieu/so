// Turns the release binaries in a dist folder (so-<target> and SHA256SUMS)
// into a Homebrew formula and npm packages.
//
//   bun scripts/release-channels.ts formula <version> <base-url> <dist-dir>
//     prints Formula/so.rb, downloading each binary from <base-url>/so-<target>
//   bun scripts/release-channels.ts npm <version> <dist-dir> <out-dir>
//     writes one package folder per target plus @therealhieu/so, and prints
//     the folders in publish order (the targets first, the launcher last)
import { chmod, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const TARGETS = [
  "darwin-arm64",
  "darwin-x64",
  "linux-x64",
  "linux-arm64",
] as const;
type Target = (typeof TARGETS)[number];

const SCOPE = "@therealhieu";
const HOMEPAGE = "https://github.com/therealhieu/so";
const DESCRIPTION =
  "Fast terminal editor with Vim keys, for Markdown notes and code";
const root = join(import.meta.dir, "..");

const osOf = (t: Target) => t.split("-")[0] as "darwin" | "linux";
const cpuOf = (t: Target) => t.split("-")[1] as "arm64" | "x64";

/** File name → SHA-256, from `sha256sum` output. */
export function parseSums(text: string): Map<string, string> {
  const sums = new Map<string, string>();
  for (const line of text.split("\n")) {
    const m = line.match(/^([0-9a-f]{64})\s+\*?(\S+)$/);
    if (m) sums.set(m[2] as string, m[1] as string);
  }
  return sums;
}

export function formula(
  version: string,
  baseUrl: string,
  sums: Map<string, string>,
): string {
  const source = (t: Target, indent: string) => {
    const sha = sums.get(`so-${t}`);
    if (sha === undefined) throw new Error(`SHA256SUMS has no so-${t}`);
    return `${indent}url "${baseUrl}/so-${t}"\n${indent}sha256 "${sha}"`;
  };
  const platform = (os: "macos" | "linux", arm: Target, intel: Target) =>
    `  on_${os} do
    on_arm do
${source(arm, "      ")}
    end
    on_intel do
${source(intel, "      ")}
    end
  end`;
  // Homebrew reads the version from a release URL (`.../download/v1.2.3/`),
  // and its audit rejects a `version` line that repeats it.
  const versionLine = baseUrl.includes(`/v${version}`)
    ? ""
    : `\n  version "${version}"`;
  return `class So < Formula
  desc "${DESCRIPTION}"
  homepage "${HOMEPAGE}"${versionLine}
  license "MIT"

  livecheck do
    url :homepage
    strategy :github_latest
  end

${platform("macos", "darwin-arm64", "darwin-x64")}
${platform("linux", "linux-arm64", "linux-x64")}

  def install
    bin.install Dir["so-*"].first => "so"
  end

  def caveats
    <<~EOS
      Reading PDFs needs Poppler:
        brew install poppler
    EOS
  end

  test do
    assert_equal "so #{version}", shell_output("#{bin}/so --version").strip
  end
end
`;
}

const common = (version: string) => ({
  version,
  license: "MIT",
  homepage: HOMEPAGE,
  repository: { type: "git", url: `git+${HOMEPAGE}.git` },
});

async function writePackage(dir: string, manifest: object): Promise<void> {
  await mkdir(join(dir, "bin"), { recursive: true });
  await writeFile(
    join(dir, "package.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await copyFile(join(root, "LICENSE"), join(dir, "LICENSE"));
}

/** Writes the package folders and returns them in publish order. */
export async function writeNpmPackages(
  version: string,
  distDir: string,
  outDir: string,
): Promise<string[]> {
  const dirs: string[] = [];
  for (const t of TARGETS) {
    const dir = join(outDir, `so-${t}`);
    await writePackage(dir, {
      name: `${SCOPE}/so-${t}`,
      description: `The so binary for ${osOf(t)} ${cpuOf(t)}`,
      ...common(version),
      os: [osOf(t)],
      cpu: [cpuOf(t)],
      ...(osOf(t) === "linux" ? { libc: ["glibc"] } : {}),
    });
    await copyFile(join(distDir, `so-${t}`), join(dir, "bin", "so"));
    await chmod(join(dir, "bin", "so"), 0o755);
    dirs.push(dir);
  }
  const dir = join(outDir, "so");
  await writePackage(dir, {
    name: `${SCOPE}/so`,
    description: DESCRIPTION,
    ...common(version),
    keywords: ["editor", "terminal", "vim", "markdown", "notes", "obsidian"],
    bin: { so: "bin/so" },
    os: ["darwin", "linux"],
    cpu: ["arm64", "x64"],
    optionalDependencies: Object.fromEntries(
      TARGETS.map((t) => [`${SCOPE}/so-${t}`, version]),
    ),
  });
  await copyFile(join(root, "README.md"), join(dir, "README.md"));
  await copyFile(join(import.meta.dir, "npm-shim.sh"), join(dir, "bin", "so"));
  await chmod(join(dir, "bin", "so"), 0o755);
  dirs.push(dir);
  return dirs;
}

const USAGE = `usage: bun scripts/release-channels.ts formula <version> <base-url> <dist-dir>
       bun scripts/release-channels.ts npm <version> <dist-dir> <out-dir>`;

export async function main(args: string[]): Promise<number> {
  const [command, version, a, b] = args;
  if (version === undefined || a === undefined || b === undefined) {
    console.error(USAGE);
    return 2;
  }
  if (command === "formula") {
    const sums = parseSums(await readFile(join(b, "SHA256SUMS"), "utf8"));
    process.stdout.write(formula(version, a, sums));
    return 0;
  }
  if (command === "npm") {
    for (const dir of await writeNpmPackages(version, a, b)) console.log(dir);
    return 0;
  }
  console.error(USAGE);
  return 2;
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
