import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  bunExec,
  commandProvider,
  detectClipboard,
  detectFileClipboard,
  type Exec,
  parseGnomeCopied,
  parseUriList,
  type SysDeps,
} from "./system";

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

test("a write returns when its tool exits, though a child it leaves holds stdout", async () => {
  const dir = await mkdtemp(join(tmpdir(), "so-exec-"));
  const pidFile = join(dir, "pid");
  try {
    // Like `xclip -i`: read stdin, leave a child serving it, and exit.
    const script = `cat >/dev/null; sleep 8 & echo $! > "${pidFile}"`;
    const started = performance.now();
    expect(await bunExec(["sh", "-c", script], "text")).toEqual({
      code: 0,
      stdout: "",
    });
    expect(performance.now() - started).toBeLessThan(5000);
    expect(await bunExec(["printf", "read"])).toEqual({
      code: 0,
      stdout: "read",
    });
  } finally {
    const pid = Number(
      (await readFile(pidFile, "utf8").catch(() => "")).trim(),
    );
    if (pid > 0) process.kill(pid);
    await rm(dir, { recursive: true, force: true });
  }
});

test.each([
  ["macOS", deps("darwin", {}, ["osascript", "xclip"]), "osascript"],
  [
    "Wayland",
    deps("linux", { WAYLAND_DISPLAY: "wayland-0", DISPLAY: ":0" }, [
      "wl-copy",
      "wl-paste",
      "xclip",
    ]),
    "wl-copy",
  ],
  ["X11", deps("linux", { DISPLAY: ":0" }, ["xclip", "xsel"]), "xclip"],
  ["X11 with only xsel", deps("linux", { DISPLAY: ":0" }, ["xsel"]), "none"],
  ["tmux only", deps("linux", { TMUX: "/tmp/tmux" }, ["tmux"]), "none"],
])("file clipboard for %s", (_, d, expected) => {
  expect(detectFileClipboard(d).name).toBe(expected);
});

test("GNOME's copied-files list says copy or cut and keeps only file URLs", () => {
  expect(
    parseGnomeCopied(
      "cut\nfile:///home/u/My%20Notes/a.md\nhttps://example.com\nfile:///tmp/b",
    ),
  ).toEqual({ op: "cut", paths: ["/home/u/My Notes/a.md", "/tmp/b"] });
  expect(parseGnomeCopied("copy\nfile:///tmp/%C3%A9.md\n")).toEqual({
    op: "copy",
    paths: ["/tmp/é.md"],
  });
  expect(parseGnomeCopied("hello\nfile:///tmp/a")).toBeNull();
  expect(parseGnomeCopied("copy\nhttps://example.com")).toBeNull();
});

test("a URI list skips comments and blank lines", () => {
  expect(
    parseUriList("# from Dolphin\r\nfile:///tmp/a.md\r\n\r\n", "copy"),
  ).toEqual({ op: "copy", paths: ["/tmp/a.md"] });
  expect(parseUriList("just text", "copy")).toBeNull();
});

/** An exec double answering by argv, recording every call. */
function fakeExec(answers: Record<string, { code?: number; stdout?: string }>) {
  const calls: { argv: string[]; input?: string }[] = [];
  const exec: Exec = async (argv, input) => {
    calls.push(input === undefined ? { argv } : { argv, input });
    const a = answers[argv.join(" ")] ?? { code: 1 };
    return { code: a.code ?? 0, stdout: a.stdout ?? "" };
  };
  return { exec, calls };
}

const wayland = (env: Record<string, string> = {}) =>
  deps("linux", { WAYLAND_DISPLAY: "w", ...env }, ["wl-copy", "wl-paste"]);

test("Wayland reads GNOME's list before a URI list", async () => {
  const { exec } = fakeExec({
    "wl-paste --list-types": {
      stdout: "text/uri-list\nx-special/gnome-copied-files\ntext/plain\n",
    },
    "wl-paste --no-newline --type x-special/gnome-copied-files": {
      stdout: "cut\nfile:///tmp/a.md",
    },
  });
  expect(await detectFileClipboard(wayland(), exec).read()).toEqual({
    op: "cut",
    paths: ["/tmp/a.md"],
  });
});

test("a URI list marked by KDE as cut reads as a cut", async () => {
  const { exec } = fakeExec({
    "xclip -o -selection clipboard -t TARGETS": {
      stdout: "TARGETS\ntext/uri-list\napplication/x-kde-cutselection\n",
    },
    "xclip -o -selection clipboard -t text/uri-list": {
      stdout: "file:///tmp/a.md\n",
    },
    "xclip -o -selection clipboard -t application/x-kde-cutselection": {
      stdout: "1",
    },
  });
  const x11 = deps("linux", { DISPLAY: ":0" }, ["xclip"]);
  expect(await detectFileClipboard(x11, exec).read()).toEqual({
    op: "cut",
    paths: ["/tmp/a.md"],
  });
});

test("a clipboard with only text, or an empty one, holds no files", async () => {
  const text = fakeExec({
    "wl-paste --list-types": { stdout: "text/plain\n" },
  });
  expect(await detectFileClipboard(wayland(), text.exec).read()).toBeNull();
  const empty = fakeExec({});
  expect(await detectFileClipboard(wayland(), empty.exec).read()).toBeNull();
});

test("Linux writes GNOME's list, or a URI list under KDE", async () => {
  const clip = { op: "cut" as const, paths: ["/tmp/My Notes/a.md"] };
  const gnome = fakeExec({
    "wl-copy --type x-special/gnome-copied-files": {},
  });
  await detectFileClipboard(wayland(), gnome.exec).write(clip);
  expect(gnome.calls).toEqual([
    {
      argv: ["wl-copy", "--type", "x-special/gnome-copied-files"],
      input: "cut\nfile:///tmp/My%20Notes/a.md",
    },
  ]);
  const kde = fakeExec({ "wl-copy --type text/uri-list": {} });
  const kdeDeps = wayland({ XDG_CURRENT_DESKTOP: "KDE" });
  await detectFileClipboard(kdeDeps, kde.exec).write(clip);
  expect(kde.calls[0]?.input).toBe("file:///tmp/My%20Notes/a.md\r\n");
  const failing = fakeExec({});
  await expect(
    detectFileClipboard(wayland(), failing.exec).write(clip),
  ).rejects.toThrow("wl-copy failed");
});

test("macOS passes paths to osascript as argv and reads them back as a copy", async () => {
  const { exec, calls } = fakeExec({});
  const mac = detectFileClipboard(deps("darwin", {}, ["osascript"]), (argv) =>
    argv.length > 5
      ? exec(argv).then(() => ({ code: 0, stdout: "" }))
      : Promise.resolve({ code: 0, stdout: '["/tmp/a b.md"]\n' }),
  );
  await mac.write({ op: "cut", paths: ["/tmp/a b.md", "/tmp/c"] });
  expect(calls[0]?.argv.slice(0, 3)).toEqual(["osascript", "-l", "JavaScript"]);
  expect(calls[0]?.argv.slice(5)).toEqual(["/tmp/a b.md", "/tmp/c"]);
  expect(await mac.read()).toEqual({ op: "copy", paths: ["/tmp/a b.md"] });
});
