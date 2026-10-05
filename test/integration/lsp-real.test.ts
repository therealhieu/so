import { afterEach, expect, test } from "bun:test";
import { lspConfig } from "../support/lsp";
import { type App, startApp, tmpWorkspace, waitFor } from "./helpers";

let app: App | undefined;

afterEach(async () => {
  await app?.stop();
  app = undefined;
});

/** Polls `ok` every 200 ms until it holds; throws after `ms`. */
async function eventually(ok: () => boolean, ms: number): Promise<void> {
  const until = performance.now() + ms;
  while (!ok()) {
    if (performance.now() > until) throw new Error("timed out");
    await Bun.sleep(200);
  }
}

// Runs only where rust-analyzer is installed; CI has none.
test.skipIf(Bun.which("rust-analyzer") === null)(
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
