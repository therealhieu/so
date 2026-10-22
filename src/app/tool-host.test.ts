import { expect, test } from "bun:test";
import type { Logger } from "../workspace/log";
import { bunToolSpawn, createToolHost, type ToolSpawn } from "./tool-host";

/**
 * A tool host over recording doubles. `flush` resolves on the next tick,
 * so a step that does not wait for it is recorded before `flushed`.
 */
function host(o: {
  spawn: ToolSpawn;
  which?: (c: string) => string | null;
  failing?: "reset" | "resume";
}) {
  const calls: string[] = [];
  const logs: { event: string; fields?: unknown }[] = [];
  const logger: Logger = {
    info: (event, fields) => logs.push({ event, fields }),
    error: (event, fields) => logs.push({ event, fields }),
  };
  const tool = createToolHost({
    screen: {
      flush: () =>
        new Promise<void>((r) =>
          process.nextTick(() => {
            calls.push("flushed");
            r();
          }),
        ),
      suspend: async () => {
        calls.push("suspend");
      },
      resume: async () => {
        calls.push("resume");
        if (o.failing === "resume") throw new Error("renderer gone");
      },
      resetForeignModes: () => {
        calls.push("reset");
        if (o.failing === "reset") throw new Error("EAGAIN: write");
      },
    },
    holdInterrupts: () => {
      calls.push("hold");
      return () => calls.push("release");
    },
    spawn: (argv, cwd) => {
      calls.push(`spawn ${argv.join(" ")} @ ${cwd}`);
      return o.spawn(argv, cwd);
    },
    which: o.which ?? ((c) => `/usr/bin/${c}`),
    logger,
  });
  return { tool, calls, logs };
}

const RESTORE = ["reset", "resume", "release"];

test("the hand-off runs in order and always restores the terminal", async () => {
  const h = host({ spawn: async () => ({ code: 0 }) });
  expect(await h.tool.run(["lazygit", "-p", "x"], "/repo")).toEqual({
    kind: "exited",
    code: 0,
  });
  expect(h.calls).toEqual([
    "flushed",
    "hold",
    "suspend",
    "spawn lazygit -p x @ /repo",
    ...RESTORE,
  ]);
  expect(h.logs).toEqual([{ event: "git.tool.exit", fields: { code: 0 } }]);
});

test("a crashing or killed tool still restores the terminal once", async () => {
  const thrown = host({
    spawn: () => {
      throw new Error("posix_spawn failed");
    },
  });
  expect(await thrown.tool.run(["lazygit"], "/repo")).toEqual({
    kind: "failed",
    reason: "posix_spawn failed",
  });
  expect(thrown.calls.slice(-3)).toEqual(RESTORE);
  for (const step of RESTORE)
    expect(thrown.calls.filter((c) => c === step)).toHaveLength(1);

  const rejected = host({
    spawn: () => Promise.reject(new Error("lost the child")),
  });
  expect(await rejected.tool.run(["lazygit"], "/repo")).toEqual({
    kind: "failed",
    reason: "lost the child",
  });
  expect(rejected.calls.slice(-3)).toEqual(RESTORE);

  const killed = host({
    spawn: async () => ({ code: 137, signal: "SIGKILL" }),
  });
  expect(await killed.tool.run(["lazygit"], "/repo")).toEqual({
    kind: "exited",
    code: 137,
    signal: "SIGKILL",
  });
  expect(killed.calls.slice(-3)).toEqual(RESTORE);
  for (const step of RESTORE)
    expect(killed.calls.filter((c) => c === step)).toHaveLength(1);
});

test("a failing restore step still resumes and releases once", async () => {
  for (const [failing, reason] of [
    ["reset", "EAGAIN: write"],
    ["resume", "renderer gone"],
  ] as const) {
    const h = host({ spawn: async () => ({ code: 0 }), failing });
    await expect(h.tool.run(["lazygit"], "/repo")).rejects.toThrow(reason);
    expect(h.calls.slice(-3)).toEqual(RESTORE);
    for (const step of RESTORE)
      expect(h.calls.filter((c) => c === step)).toHaveLength(1);
    expect(h.logs).toContainEqual({
      event: "git.tool.restore",
      fields: { reason },
    });
  }
});

test("a missing tool never suspends", async () => {
  const h = host({ spawn: async () => ({ code: 0 }), which: () => null });
  expect(await h.tool.run(["gitui", "-l"], "/repo")).toEqual({
    kind: "missing",
    tool: "gitui",
  });
  expect(h.calls).toEqual([]);
});

test("the default spawn reports a real child's exit code and signal", async () => {
  const h = host({ spawn: bunToolSpawn });
  expect(await h.tool.run(["sh", "-c", "exit 3"], "/")).toEqual({
    kind: "exited",
    code: 3,
  });
  expect(await h.tool.run(["sh", "-c", "kill -9 $$"], "/")).toMatchObject({
    kind: "exited",
    signal: "SIGKILL",
  });
});
