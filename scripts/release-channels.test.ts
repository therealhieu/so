import { afterAll, expect, test } from "bun:test";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  formula,
  parseSums,
  TARGETS,
  writeNpmPackages,
} from "./release-channels";

const tmp = mkdtempSync(join(tmpdir(), "so-release-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const sha = (i: number) => String(i).repeat(64);
const SUMS = TARGETS.map((t, i) => `${sha(i + 1)}  so-${t}`).join("\n");

test("SHA256SUMS lines map file names to hashes", () => {
  const sums = parseSums(`${SUMS}\n${sha(9)} *so-other\n\n`);
  expect(sums.get("so-darwin-arm64")).toBe(sha(1));
  expect(sums.get("so-other")).toBe(sha(9));
  expect(sums.size).toBe(5);
});

test("the formula downloads each platform's binary with its hash", () => {
  const rb = formula(
    "1.2.3",
    "https://github.com/therealhieu/so/releases/download/v1.2.3",
    parseSums(SUMS),
  );
  expect(rb).not.toMatch(/^\s+version "/m);
  const blocks = [
    ...rb.matchAll(/on_(arm|intel) do\n\s+url "(\S+)"\n\s+sha256 "(\w+)"/g),
  ];
  expect(blocks.map((m) => [m[1], m[2]?.split("/").at(-1), m[3]])).toEqual([
    ["arm", "so-darwin-arm64", sha(1)],
    ["intel", "so-darwin-x64", sha(2)],
    ["arm", "so-linux-arm64", sha(4)],
    ["intel", "so-linux-x64", sha(3)],
  ]);
  expect(rb.indexOf("on_macos")).toBeLessThan(rb.indexOf("so-darwin-arm64"));
  expect(rb.indexOf("on_linux")).toBeLessThan(rb.indexOf("so-linux-arm64"));
});

test("a URL without the version gets a version line", () => {
  const rb = formula("0.0.0-dev+abc1234", "file:///dist", parseSums(SUMS));
  expect(rb).toContain(
    '  homepage "https://github.com/therealhieu/so"\n  version "0.0.0-dev+abc1234"\n  license "MIT"',
  );
});

test("a formula without every platform's hash is refused", () => {
  expect(() =>
    formula("1.2.3", "https://x", parseSums(`${sha(1)}  so-darwin-arm64`)),
  ).toThrow("SHA256SUMS has no so-darwin-x64");
});

const host = `${process.platform}-${process.arch}`;

/** npm packages built from fake binaries that print their arguments. */
async function packages(): Promise<Map<string, string>> {
  const dist = join(tmp, "dist");
  mkdirSync(dist, { recursive: true });
  for (const t of TARGETS)
    writeFileSync(join(dist, `so-${t}`), `#!/bin/sh\necho ${t} "$@"\n`);
  const dirs = await writeNpmPackages("1.2.3", dist, join(tmp, "out"));
  return new Map(dirs.map((d) => [d.split("/").at(-1) as string, d]));
}
const built = await packages();

test("packages publish targets first and the launcher last", async () => {
  expect([...built.keys()]).toEqual([...TARGETS.map((t) => `so-${t}`), "so"]);
  const launcher = await Bun.file(
    join(built.get("so") ?? "", "package.json"),
  ).json();
  expect(launcher.name).toBe("@therealhieu/so");
  expect(launcher.bin).toEqual({ so: "bin/so" });
  expect(launcher.optionalDependencies).toEqual(
    Object.fromEntries(TARGETS.map((t) => [`@therealhieu/so-${t}`, "1.2.3"])),
  );
  const linux = await Bun.file(
    join(built.get("so-linux-arm64") ?? "", "package.json"),
  ).json();
  expect([linux.name, linux.os, linux.cpu, linux.libc]).toEqual([
    "@therealhieu/so-linux-arm64",
    ["linux"],
    ["arm64"],
    ["glibc"],
  ]);
});

/** Places a package folder at `at` inside a fake install. */
function place(name: string, at: string): void {
  mkdirSync(join(at, ".."), { recursive: true });
  cpSync(built.get(name) ?? "", at, { recursive: true });
}

/** Runs `node_modules/.bin/so` the way npm and bun link it. */
async function runLinked(modules: string): Promise<[number, string, string]> {
  mkdirSync(join(modules, ".bin"), { recursive: true });
  symlinkSync("../@therealhieu/so/bin/so", join(modules, ".bin", "so"));
  const p = Bun.spawn([join(modules, ".bin", "so"), "--version", "a b"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const out = await new Response(p.stdout).text();
  const err = await new Response(p.stderr).text();
  return [await p.exited, out, err];
}

test.each([
  [
    "hoisted",
    (m: string) => {
      place("so", join(m, "@therealhieu/so"));
      place(`so-${host}`, join(m, `@therealhieu/so-${host}`));
    },
  ],
  [
    "nested",
    (m: string) => {
      place("so", join(m, "@therealhieu/so"));
      place(
        `so-${host}`,
        join(m, `@therealhieu/so/node_modules/@therealhieu/so-${host}`),
      );
    },
  ],
  [
    "isolated",
    (m: string) => {
      const store = join(m, ".store/so@1.2.3/node_modules/@therealhieu");
      place("so", join(store, "so"));
      place(`so-${host}`, join(store, `so-${host}`));
      symlinkSync(join(store, "so"), join(m, "@therealhieu/so"));
    },
  ],
])(
  "the launcher runs the host binary in a %s install",
  async (layout, setup) => {
    const modules = join(tmp, layout, "node_modules");
    mkdirSync(join(modules, "@therealhieu"), { recursive: true });
    setup(modules);
    expect(await runLinked(modules)).toEqual([
      0,
      `${host} --version a b\n`,
      "",
    ]);
  },
);

test("the launcher names the missing platform package", async () => {
  const modules = join(tmp, "missing", "node_modules");
  place("so", join(modules, "@therealhieu/so"));
  const [code, out, err] = await runLinked(modules);
  expect([code, out]).toEqual([1, ""]);
  expect(err).toContain(`@therealhieu/so-${host} is not installed`);
});
