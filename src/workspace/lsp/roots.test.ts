import { expect, test } from "bun:test";
import { findRoot } from "./roots";

const fs = (...files: string[]) => {
  const set = new Set(files);
  return (p: string) => set.has(p);
};

test("project roots follow marker priority and search mode", () => {
  const cargo = fs("/ws/repo/Cargo.toml", "/ws/repo/a/Cargo.toml");
  expect(
    findRoot("/ws/repo/a/src", ["Cargo.toml"], "topmost", "/ws", cargo),
  ).toBe("/ws/repo");
  expect(
    findRoot("/ws/repo/a/src", ["Cargo.toml"], "nearest", "/ws", cargo),
  ).toBe("/ws/repo/a");

  const go = ["go.work", "go.mod", ".git"];
  expect(
    findRoot(
      "/ws/repo/m",
      go,
      "nearest",
      "/ws",
      fs("/ws/repo/go.work", "/ws/repo/m/go.mod"),
    ),
  ).toBe("/ws/repo");
  expect(
    findRoot("/ws/repo/m", go, "nearest", "/ws", fs("/ws/repo/m/go.mod")),
  ).toBe("/ws/repo/m");

  const nested = [["x", "y"], ".git"];
  expect(
    findRoot(
      "/ws/p/q",
      nested,
      "nearest",
      "/ws",
      fs("/ws/x", "/ws/p/y", "/ws/p/q/.git"),
    ),
  ).toBe("/ws/p");

  expect(
    findRoot("/ws/p", ["Cargo.toml"], "topmost", "/ws", fs("/Cargo.toml")),
  ).toBeUndefined();
  expect(
    findRoot("/ws/p", ["Cargo.toml"], "nearest", "/ws", fs("/Cargo.toml")),
  ).toBeUndefined();
  expect(findRoot("/ws/p", [], "nearest", "/ws", fs())).toBeUndefined();
  expect(
    findRoot("/ws", ["package.json"], "nearest", "/ws", fs("/ws/package.json")),
  ).toBe("/ws");
});
