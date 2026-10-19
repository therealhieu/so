import { expect, test } from "bun:test";
import { fresh, openBuffer, testRegistries } from "../../../test/support/state";
import type { PreviewCtx } from "../lang/markdown/live-preview";
import { markdownViewContextFor } from "./markdown-view";
import { ViewContextRegistry, type ViewHost } from "./view-context";

const markdownViewContext = markdownViewContextFor(testRegistries());

const host = (over: Partial<ViewHost> = {}): ViewHost => ({
  width: 80,
  rows: 40,
  cell: { width: 8, height: 16 },
  sizedText: false,
  imageSize: (p) =>
    p === "img/a.png" ? { width: 1600, height: 900 } : undefined,
  ...over,
});

test("a second builder for one file type is rejected", () => {
  const r = new ViewContextRegistry();
  r.register("markdown", markdownViewContext);
  expect(() => r.register("markdown", markdownViewContext)).toThrow();
});

test("a file type without a builder gets no context", () => {
  const s = fresh();
  expect(
    new ViewContextRegistry().build("typescript", s, s.windows.active, host()),
  ).toBeUndefined();
});

test("image rows follow the window width and cell aspect", () => {
  const s = openBuffer(fresh(), "notes/a.md", "![[a.png]]\n");
  const ctx = markdownViewContext(s, s.windows.active, host()) as PreviewCtx;
  expect(ctx.image("img/a.png")).toEqual({ rows: 23 });
  expect(ctx.image("img/b.png")).toBe("unknown");
});

test("tall images are capped at most of the window", () => {
  const s = openBuffer(fresh(), "notes/a.md", "");
  const ctx = markdownViewContext(
    s,
    s.windows.active,
    host({ imageSize: () => ({ width: 100, height: 1000 }) }),
  ) as PreviewCtx;
  expect(ctx.image("tall.png")).toEqual({ rows: 32 });
});
