import { afterEach, expect, test } from "bun:test";
import { rm } from "node:fs/promises";
import { lspConfig } from "../support/lsp";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

let app: App | undefined;

afterEach(async () => {
  const root = app?.root;
  await app?.stop();
  app = undefined;
  if (root !== undefined) await rm(root, { recursive: true, force: true });
});

/** Polls `ok` every 200 ms until it holds; throws after `ms`. */
async function eventually(ok: () => boolean, ms: number): Promise<void> {
  const until = performance.now() + ms;
  while (!ok()) {
    if (performance.now() > until) throw new Error("timed out");
    await Bun.sleep(200);
  }
}

/** True when `argv` runs and exits 0. */
function runs(argv: string[]): boolean {
  try {
    return (
      Bun.spawnSync(argv, { stdout: "ignore", stderr: "ignore" }).exitCode === 0
    );
  } catch {
    return false;
  }
}

/**
 * rust-analyzer runs here. CI runners have rustup's proxy on PATH without
 * the component, and the proxy fails `--version`.
 */
const rustAnalyzer = runs(["rust-analyzer", "--version"]);
const terraformLs = runs(["terraform-ls", "version"]);

// Runs only where rust-analyzer is installed; CI has none.
test.skipIf(!rustAnalyzer)(
  "a real rust-analyzer becomes ready and answers hover",
  async () => {
    const root = await tmpWorkspace({
      "Cargo.toml":
        '[package]\nname = "probe"\nversion = "0.1.0"\nedition = "2021"\n',
      "src/main.rs": "fn main() {\n    let total = 1 + 2;\n}\n",
    });
    app = await startApp(root, {
      lsp: {
        config: lspConfig(true, '[lsp.servers."rust-analyzer"]\n'),
      },
    });
    await app.open("src/main.rs");
    await waitFor(
      () =>
        Object.values(app?.store.get().lsp.servers ?? {}).some(
          (v) => v.name === "rust-analyzer" && v.state === "ready",
        ),
      30_000,
    );
    // Move onto `total`, then ask until indexing has finished.
    app.keys("j8l");
    await eventually(() => {
      if (app?.store.get().lsp.float !== undefined) return true;
      app?.keys("K");
      return false;
    }, 50_000);
    expect(app.store.get().lsp.float?.lines.join("\n")).toContain("i32");
  },
  90_000,
);

// Runs only where terraform-ls is installed; CI has none.
test.skipIf(!terraformLs)(
  "a real terraform-ls formats a Terraform file",
  async () => {
    const root = await tmpWorkspace({
      "main.tf":
        'variable "region" {\n  type = string\n  default = "eu-west-1"\n}\n',
    });
    app = await startApp(root, {
      lsp: { config: lspConfig(true, '[lsp.servers."terraform-ls"]\n') },
    });
    await app.open("main.tf");
    await waitFor(
      () =>
        Object.values(app?.store.get().lsp.servers ?? {}).some(
          (v) => v.name === "terraform-ls" && v.state === "ready",
        ),
      30_000,
    );
    app.keys(":Format<CR>");
    await waitFor(() => app?.text("main.tf")?.includes("type    =") ?? false);
    expect(app.text("main.tf")).toBe(
      'variable "region" {\n  type    = string\n  default = "eu-west-1"\n}',
    );
  },
  60_000,
);
