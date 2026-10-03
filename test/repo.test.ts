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

test("compile includes the worker", () => {
  const sources = [
    ...Object.values(pkg.scripts as Record<string, string>),
    ...workflows.values(),
  ];
  const compiles = sources
    .flatMap((text) => text.split("\n"))
    .filter((line) => /\bbun build\b.*--compile/.test(line));
  expect(compiles.length).toBeGreaterThanOrEqual(3);
  for (const line of compiles)
    expect(line).toContain("src/app/main.ts src/workspace/index-worker.ts");
});
