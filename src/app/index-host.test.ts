import { expect, test } from "bun:test";
import { workerUrl } from "./index-host";

test("the worker entry resolves from source and from a compiled binary", () => {
  expect(workerUrl("file:///repo/src/app/index-host.ts").href).toBe(
    "file:///repo/src/workspace/index-worker.ts",
  );
  expect(workerUrl("file:///$bunfs/root/so").href).toBe(
    "file:///$bunfs/root/workspace/index-worker.ts",
  );
});
