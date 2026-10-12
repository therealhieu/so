import { expect, test } from "bun:test";
import { fresh } from "../../test/support/state";
import type { AppState } from "../core/state/types";
import type { ToWorker } from "../workspace/index-worker";
import { createIndexHost, workerUrl } from "./index-host";

test("the worker entry resolves from source and from a compiled binary", () => {
  expect(workerUrl("file:///repo/src/app/index-host.ts").href).toBe(
    "file:///repo/src/workspace/index-worker.ts",
  );
  expect(workerUrl("file:///$bunfs/root/so").href).toBe(
    "file:///$bunfs/root/workspace/index-worker.ts",
  );
});

test("a change to dotfiles or index.exclude rescans; other changes do not", () => {
  const sent: ToWorker[] = [];
  const worker = {
    postMessage: (m: ToWorker) => sent.push(m),
    addEventListener() {},
    terminate() {},
  } as unknown as Worker;
  const host = createIndexHost({
    dispatch: () => {},
    logger: { info() {}, error() {} },
    spawn: () => worker,
  });
  const s = fresh();
  const withConfig = (patch: Partial<AppState["config"]>): AppState => ({
    ...s,
    config: { ...s.config, ...patch },
  });

  host.observe(s);
  expect(sent).toEqual([]);
  host.start("/ws", s.config);
  expect(sent).toEqual([
    {
      t: "scan",
      root: "/ws",
      dotfiles: s.config.explorer.dotfiles,
      exclude: s.config.index.exclude,
    },
  ]);

  host.observe(withConfig({ theme: "light" }));
  host.observe(withConfig({ index: { exclude: [...s.config.index.exclude] } }));
  expect(sent).toHaveLength(1);

  const shown = withConfig({
    explorer: { ...s.config.explorer, dotfiles: true },
  });
  host.observe(shown);
  host.observe(shown);
  host.observe(
    withConfig({
      explorer: { ...s.config.explorer, dotfiles: true },
      index: { exclude: ["archive"] },
    }),
  );
  expect(sent.slice(1)).toEqual([
    { t: "scan", root: "/ws", dotfiles: true, exclude: s.config.index.exclude },
    { t: "scan", root: "/ws", dotfiles: true, exclude: ["archive"] },
  ]);
});
