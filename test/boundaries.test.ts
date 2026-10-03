import { expect, test } from "bun:test";
import { isBuiltin } from "node:module";
import { dirname, join } from "node:path";

// Layer rules of the four-layer architecture. The longest matching `from` prefix wins.
// `allow`: src prefixes a relative import may resolve into.
// `packages`: "any" (ui only), "no-ui" (no @opentui), "pure" (no @opentui, runtime, or I/O), "none".
type PackagePolicy = "any" | "no-ui" | "pure" | "none";
const PURE_CORE = [
  "src/core/kernel/",
  "src/core/filetypes/",
  "src/core/lang/",
  "src/core/features/",
  "src/core/time/",
];
const LAYER_RULES: {
  from: string;
  allow: string[];
  packages: PackagePolicy;
}[] = [
  { from: "src/app/", allow: ["src/", "package.json"], packages: "no-ui" },
  { from: "src/ui/", allow: ["src/ui/", "src/core/"], packages: "any" },
  {
    from: "src/workspace/",
    allow: ["src/workspace/", "src/core/"],
    packages: "no-ui",
  },
  {
    from: "src/preview/",
    allow: ["src/preview/", "src/core/"],
    packages: "no-ui",
  },
  { from: "src/core/", allow: PURE_CORE, packages: "pure" },
  { from: "src/core/state/", allow: ["src/core/"], packages: "pure" },
  { from: "src/core/config/", allow: ["src/core/"], packages: "pure" },
  {
    from: "src/core/filetypes/",
    allow: ["src/core/kernel/", "src/core/filetypes/"],
    packages: "none",
  },
  { from: "src/core/kernel/", allow: ["src/core/kernel/"], packages: "none" },
];

const transpiler = new Bun.Transpiler({ loader: "ts" });
// scanImports drops type-only imports, which still couple layers.
const TYPE_IMPORT =
  /\b(?:import|export)\s+type\b[^;]*?\bfrom\s*["']([^"']+)["']/g;

function packageViolation(
  specifier: string,
  policy: PackagePolicy,
): string | undefined {
  const opentui = specifier.startsWith("@opentui/");
  const runtime =
    specifier === "bun" || specifier.startsWith("bun:") || isBuiltin(specifier);
  if (policy === "none") return "no packages allowed";
  if (policy === "pure" && runtime) return "no runtime or I/O APIs in core";
  if (policy !== "any" && opentui) return "only src/ui imports @opentui/*";
  return undefined;
}

function checkImports(source: string, path: string): string[] {
  const rule = LAYER_RULES.filter((r) => path.startsWith(r.from)).sort(
    (a, b) => b.from.length - a.from.length,
  )[0];
  if (rule === undefined) return [];
  const specifiers = new Set([
    ...transpiler.scanImports(source).map((i) => i.path),
    ...[...source.matchAll(TYPE_IMPORT)].map((m) => m[1] ?? ""),
  ]);
  const violations: string[] = [];
  for (const specifier of specifiers) {
    let reason: string | undefined;
    if (specifier.startsWith(".")) {
      const target = `${join(dirname(path), specifier)}/`;
      if (!rule.allow.some((prefix) => target.startsWith(prefix)))
        reason = `${rule.from} may import only ${rule.allow.join(", ")}`;
    } else {
      reason = packageViolation(specifier, rule.packages);
    }
    if (reason !== undefined)
      violations.push(`${path}: ${specifier} violates ${reason}`);
  }
  return violations;
}

const fixture = (name: string) =>
  Bun.file(`test/fixtures/boundary-violation/${name}`).text();

test("src respects LAYER_RULES", async () => {
  const violations: string[] = [];
  for await (const path of new Bun.Glob("src/**/*.ts").scan()) {
    if (path.endsWith(".test.ts")) continue;
    violations.push(...checkImports(await Bun.file(path).text(), path));
  }
  expect(violations).toEqual([]);
});

test("violation fixtures are reported", async () => {
  expect(
    checkImports(await fixture("core-imports-fs.ts"), "src/core/state/x.ts"),
  ).toHaveLength(1);
  expect(
    checkImports(
      await fixture("kernel-imports-markdown.ts"),
      "src/core/kernel/x.ts",
    ),
  ).toHaveLength(1);
});
