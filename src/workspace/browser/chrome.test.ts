import { expect, test } from "bun:test";
import { chromeArgs, findChrome, launchChrome } from "./chrome";

const none = () => null;

test("a configured path is the only one tried", () => {
  const which = () => "/usr/bin/chromium";
  expect(
    findChrome({
      configured: "/opt/chrome",
      which,
      exists: (p) => p === "/opt/chrome",
      platform: "linux",
      home: "/home/u",
    }),
  ).toEqual({ kind: "found", path: "/opt/chrome" });
  expect(
    findChrome({
      configured: "/nonexistent",
      which,
      exists: () => false,
      platform: "linux",
      home: "/home/u",
    }),
  ).toEqual({ kind: "missing", configured: "/nonexistent" });
});

test("PATH names come first, in order, before app bundles", () => {
  const onPath: Record<string, string> = {
    chromium: "/usr/bin/chromium",
    "google-chrome-stable": "/usr/bin/google-chrome-stable",
  };
  expect(
    findChrome({
      configured: "",
      which: (n) => onPath[n] ?? null,
      exists: () => true,
      platform: "darwin",
      home: "/Users/u",
    }),
  ).toEqual({ kind: "found", path: "/usr/bin/google-chrome-stable" });
});

test("on macOS an app bundle is found in /Applications, then ~/Applications", () => {
  const edge =
    "/Users/u/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge";
  expect(
    findChrome({
      configured: "",
      which: none,
      exists: (p) => p === edge,
      platform: "darwin",
      home: "/Users/u",
    }),
  ).toEqual({ kind: "found", path: edge });
  expect(
    findChrome({
      configured: "",
      which: none,
      exists: () => true,
      platform: "linux",
      home: "/home/u",
    }),
  ).toEqual({ kind: "missing" });
});

test("the browser runs headless over a pipe with its own profile", () => {
  const args = chromeArgs("/tmp/p");
  expect(args).toContain("--headless=new");
  expect(args).toContain("--remote-debugging-pipe");
  expect(args).toContain("--user-data-dir=/tmp/p");
  expect(args).not.toContain("--no-sandbox");
});

test("a program that is not a browser fails to launch with its last error line", async () => {
  // Bun takes Chrome's start page for a script to run.
  await expect(
    launchChrome(process.execPath, { startTimeoutMs: 5_000 }),
  ).rejects.toThrow('Script not found "about:blank"');
});
