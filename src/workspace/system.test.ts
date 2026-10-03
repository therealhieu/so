import { expect, test } from "bun:test";
import { commandProvider, detectClipboard, type SysDeps } from "./system";

const deps = (
  platform: string,
  env: Record<string, string>,
  tools: string[],
  xselExit = 0,
): SysDeps => ({
  platform,
  env,
  which: (c) => (tools.includes(c) ? `/usr/bin/${c}` : null),
  run: async () => xselExit,
});

const noOsc52 = () => {};

test.each([
  ["macOS with pbcopy", deps("darwin", {}, ["pbcopy", "tmux"]), "pbcopy"],
  [
    "Wayland",
    deps("linux", { WAYLAND_DISPLAY: "wayland-0", DISPLAY: ":0" }, [
      "wl-copy",
      "wl-paste",
      "xsel",
    ]),
    "wl-copy",
  ],
  [
    "X11 with a working xsel",
    deps("linux", { DISPLAY: ":0" }, ["xsel", "xclip"], 0),
    "xsel",
  ],
  [
    "X11 with a failing xsel",
    deps("linux", { DISPLAY: ":0" }, ["xsel", "xclip"], 1),
    "xclip",
  ],
  ["tmux only", deps("linux", { TMUX: "/tmp/tmux" }, ["tmux"]), "tmux"],
  ["nothing available", deps("linux", {}, ["xsel", "tmux"]), "osc52"],
])("clipboard provider for %s", async (_, d, expected) => {
  expect((await detectClipboard(d, noOsc52)).name).toBe(expected);
});

test("the OSC 52 fallback copies through the terminal and cannot paste", async () => {
  const sent: string[] = [];
  const p = await detectClipboard(deps("linux", {}, []), (t) => sent.push(t));
  await p.copy("héllo");
  expect(sent).toEqual(["héllo"]);
  expect(p.paste).toBeUndefined();
});

test("a command provider pipes text through argv commands and reports failures", async () => {
  const ok = commandProvider("cat", ["cat"], ["printf", "pasted"]);
  await ok.copy("text");
  expect(await ok.paste?.()).toBe("pasted");
  const failing = commandProvider("false", ["false"], ["false"]);
  await expect(failing.copy("text")).rejects.toThrow();
  await expect(failing.paste?.()).rejects.toThrow();
});
