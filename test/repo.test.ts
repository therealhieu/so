import { expect, test } from "bun:test";

const pkg = await Bun.file("package.json").json();

async function loadWorkflows(): Promise<Map<string, string>> {
  const workflows = new Map<string, string>();
  for await (const path of new Bun.Glob(".github/workflows/*.yml").scan({
    dot: true,
  })) {
    workflows.set(
      path.slice(".github/workflows/".length),
      await Bun.file(path).text(),
    );
  }
  return workflows;
}

const workflows = await loadWorkflows();

test("exact npm pins", () => {
  const versions = Object.values({
    ...pkg.dependencies,
    ...pkg.devDependencies,
  });
  expect(versions.length).toBeGreaterThan(0);
  for (const version of versions)
    expect(version).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
  expect(pkg.packageManager).toBe("bun@1.4.2");
});

test("SHA-pinned actions", () => {
  expect([...workflows.keys()]).toContain("ci.yml");
  for (const [name, text] of workflows) {
    for (const line of text.split("\n")) {
      const uses = line.match(/^\s*(?:-\s+)?uses:\s*(\S+)/)?.[1];
      if (uses === undefined || uses.startsWith("./")) continue;
      expect(`${name}: ${line.trim()}`).toMatch(
        /uses:\s+[\w.-]+\/[\w.-]+(\/[\w.-]+)*@[0-9a-f]{40}\s+#\s*v\S+/,
      );
    }
  }
});

test("CI runs on pull_request only", () => {
  const ci = Bun.YAML.parse(workflows.get("ci.yml") ?? "") as {
    on: Record<string, unknown>;
    concurrency: { group: string; "cancel-in-progress": boolean };
  };
  expect(Object.keys(ci.on)).toEqual(["pull_request"]);
  expect(ci.concurrency.group).toContain("github.event.pull_request.number");
  expect(ci.concurrency["cancel-in-progress"]).toBe(true);
});

test("compile includes the workers", () => {
  const sources = [
    ...Object.values(pkg.scripts as Record<string, string>),
    ...workflows.values(),
  ];
  const compiles = sources
    .flatMap((text) => text.split("\n"))
    .filter((line) => /\bbun build\b.*--compile/.test(line));
  expect(compiles.length).toBeGreaterThanOrEqual(3);
  for (const line of compiles)
    expect(line).toContain(
      "src/app/main.ts src/workspace/index-worker.ts src/workspace/sqlite-worker.ts",
    );
});

/** Replaced code that must not come back: what to forbid, and where. */
const OBSOLETE: { name: string; pattern: RegExp; under: string[] }[] = [
  { name: "Bun.TOML", pattern: /Bun\.TOML/, under: ["src/", "test/"] },
  {
    name: '"buffer.write"',
    pattern: /"buffer\.write"/,
    under: ["src/", "test/"],
  },
  {
    name: '"<leader>": " "',
    pattern: /"<leader>":\s*" "/,
    under: ["src/", "test/"],
  },
  { name: "TABSTOP", pattern: /\bTABSTOP\b/, under: ["src/", "test/"] },
  { name: "ft.analyze(", pattern: /\bft\.analyze\(/, under: ["src/ui/"] },
  { name: "analyses", pattern: /\banalyses\b/, under: ["src/ui/"] },
];

test("no obsolete references remain", async () => {
  const self = "test/repo.test.ts";
  const found: string[] = [];
  for await (const path of new Bun.Glob("{src,test}/**/*.ts").scan()) {
    if (path === self) continue;
    const text = await Bun.file(path).text();
    for (const o of OBSOLETE)
      if (o.under.some((dir) => path.startsWith(dir)) && o.pattern.test(text))
        found.push(`${path}: ${o.name}`);
  }
  expect(found).toEqual([]);
});
