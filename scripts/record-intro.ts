// Records the README intro (docs/intro.gif). macOS only: it needs Ghostty,
// ffmpeg, rust-analyzer, Poppler, Chrome, and the Swift toolchain.
//
//   bun run record:intro          stage, record, and cut
//   bun run record:intro --cut    cut the last recording again
//
// Ghostty runs scripts/intro/play.ts, which drives so; SoRecorder.app records
// that window. The recorder is its own app so Screen Recording is granted to
// it once (the first run asks), not to the terminal running this script.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { PlaySettings } from "./intro/play";
import { intro } from "./sandbox/profiles/intro";

const ROOT = join(import.meta.dir, "..");
const WORK = join(ROOT, ".tmp/intro");
/** Short, so the path so shows in its tab line reads well in the video. */
const STAGE = "/tmp/so-intro";
const OUT_GIF = join(ROOT, "docs/intro.gif");
const TITLE = "so-intro";
const COLS = 100;
const ROWS = 30;

const files = {
  app: join(WORK, "SoRecorder.app"),
  raw: join(WORK, "raw.mov"),
  cfr: join(WORK, "cfr.mp4"),
  mp4: join(WORK, "intro.mp4"),
  marks: join(WORK, "marks.jsonl"),
  start: join(WORK, "start.json"),
  settings: join(WORK, "play.json"),
  status: join(WORK, "status"),
  go: join(WORK, "go"),
  stop: join(WORK, "stop"),
};

/** A span of the recording between two marks, played to fit `seconds`. */
type Cut = { from: string; to: string; seconds: number; caption: string };

const CUTS: Cut[] = [
  {
    from: "picker",
    to: "notes",
    seconds: 1.5,
    caption: "so: Markdown notes and code, with Vim keys",
  },
  {
    from: "notes",
    to: "notes.end",
    seconds: 9.2,
    caption:
      "Obsidian Markdown: callouts, tables, tasks, math, Mermaid, embeds",
  },
  {
    from: "themes",
    to: "themes.end",
    seconds: 5,
    caption: "Themes, previewed as you pick",
  },
  {
    from: "base",
    to: "base.end",
    seconds: 3.5,
    caption: "Obsidian Bases that write back to frontmatter",
  },
  {
    from: "pdf",
    to: "pdf.end",
    seconds: 4,
    caption: "PDFs in the terminal: select, highlight, take notes",
  },
  {
    from: "image",
    to: "image.end",
    seconds: 3,
    caption: "Images: zoom and pan",
  },
  {
    from: "html",
    to: "html.end",
    seconds: 2.5,
    caption: "HTML pages, drawn by headless Chrome",
  },
  {
    from: "sqlite",
    to: "sqlite.end",
    seconds: 5.5,
    caption: "SQLite tables and read-only queries",
  },
  {
    from: "code",
    to: "git.end",
    seconds: 2.5,
    caption: "Language servers and Git",
  },
  {
    from: "code.ready",
    to: "code.end",
    seconds: 3,
    caption: "Language servers and Git",
  },
];

const OUTRO_SECONDS = 2.5;
const WIDTH = 1000;
const MARGIN = 16;
const CAPTION_BAND = 48;
const FPS = 15;
const BG = "#16161e";
const FG = "#c0caf5";
const DIM = "#737aa2";
const SANS = "/System/Library/Fonts/SFNS.ttf";
const MONO = "/System/Library/Fonts/SFNSMono.ttf";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function run(cmd: string[], cwd = ROOT): void {
  const proc = Bun.spawnSync(cmd, {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  if (proc.exitCode !== 0) throw new Error(`${cmd[0]} exited ${proc.exitCode}`);
}

function readStatus(): string {
  return existsSync(files.status)
    ? readFileSync(files.status, "utf8").trim()
    : "";
}

async function waitFor(
  check: () => boolean,
  ms: number,
  what: string,
): Promise<void> {
  const until = Date.now() + ms;
  while (!check()) {
    if (Date.now() > until) throw new Error(`timed out waiting for ${what}`);
    await sleep(50);
  }
}

/**
 * Build the recorder app once. A rebuild changes its signature, and macOS
 * then asks for Screen Recording again, so an existing app is kept.
 */
function ensureRecorder(): void {
  const binary = join(files.app, "Contents/MacOS/SoRecorder");
  if (existsSync(binary)) return;
  mkdirSync(join(files.app, "Contents/MacOS"), { recursive: true });
  writeFileSync(
    join(files.app, "Contents/Info.plist"),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key><string>SoRecorder</string>
  <key>CFBundleIdentifier</key><string>dev.so.intro-recorder</string>
  <key>CFBundleName</key><string>SoRecorder</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSUIElement</key><true/>
</dict>
</plist>
`,
  );
  run([
    "swiftc",
    "-O",
    "-o",
    binary,
    join(import.meta.dir, "intro/recorder.swift"),
  ]);
  run([
    "codesign",
    "--force",
    "--sign",
    "-",
    "--identifier",
    "dev.so.intro-recorder",
    files.app,
  ]);
}

/** A fresh vault and so's config, state, and cache under STAGE. */
async function stage(): Promise<PlaySettings["env"]> {
  rmSync(STAGE, { recursive: true, force: true });
  const vault = join(STAGE, "notes");
  const config = join(STAGE, "xdg/config");
  mkdirSync(vault, { recursive: true });
  mkdirSync(join(config, "so"), { recursive: true });
  await intro.stage(vault);
  writeFileSync(join(config, "so/config.toml"), intro.config ?? "");
  return {
    // Ghostty starts from launchd, whose PATH lacks rust-analyzer and Poppler.
    PATH: process.env.PATH ?? "/usr/bin:/bin",
    XDG_CONFIG_HOME: config,
    XDG_STATE_HOME: join(STAGE, "xdg/state"),
    XDG_CACHE_HOME: join(STAGE, "xdg/cache"),
    GIT_CEILING_DIRECTORIES: STAGE,
  };
}

async function record(): Promise<void> {
  ensureRecorder();
  mkdirSync(WORK, { recursive: true });
  for (const f of [files.raw, files.marks, files.status, files.go, files.stop])
    rmSync(f, { force: true });
  const settings: PlaySettings = {
    title: TITLE,
    workspace: join(STAGE, "notes"),
    env: await stage(),
    marks: files.marks,
    go: files.go,
    stop: files.stop,
  };
  writeFileSync(files.settings, JSON.stringify(settings, null, 2));

  run([
    "open",
    "-na",
    "Ghostty",
    "--args",
    "--config-default-files=false",
    `--title=${TITLE}`,
    `--window-width=${COLS}`,
    `--window-height=${ROWS}`,
    "--font-size=15",
    "--background=#1a1b26",
    "--foreground=#c0caf5",
    "--window-padding-x=14",
    "--window-padding-y=10",
    "--window-padding-color=extend",
    "--window-decoration=none",
    // Otherwise macOS restores the last Ghostty window's frame over the size above.
    "--window-save-state=never",
    "--cursor-style-blink=false",
    "--confirm-close-surface=false",
    "--quit-after-last-window-closed=true",
    `--working-directory=${ROOT}`,
    // Ghostty quits at once when -e names bun directly; through sh it runs.
    "-e",
    "/bin/sh",
    "-c",
    `exec '${process.execPath}' '${join(import.meta.dir, "intro/play.ts")}' '${files.settings}' 2>> '${join(WORK, "play.log")}'`,
  ]);
  run([
    "open",
    "-n",
    files.app,
    "--args",
    "--title",
    TITLE,
    "--out",
    files.raw,
    "--status",
    files.status,
    "--stop",
    files.stop,
  ]);
  await waitFor(() => readStatus() !== "", 20000, "the recorder");
  const status = readStatus();
  if (status === "permission")
    throw new Error(
      "Allow SoRecorder under System Settings → Privacy & Security → Screen & System Audio Recording, then run again",
    );
  if (status !== "recording") throw new Error(`recorder: ${status}`);
  writeFileSync(files.start, JSON.stringify({ at: Date.now() }));
  writeFileSync(files.go, "");
  await waitFor(
    () => readStatus() === "done" || readStatus().startsWith("error"),
    300000,
    "the tour",
  );
  if (readStatus() !== "done") throw new Error(`recorder: ${readStatus()}`);
}

type Span = { start: number; end: number; speed: number; caption: string };

/** Each cut as seconds into the recording, and the speed that fits it to its length. */
function spans(): Span[] {
  const start = (
    JSON.parse(readFileSync(files.start, "utf8")) as { at: number }
  ).at;
  const marks = new Map<string, number>();
  for (const line of readFileSync(files.marks, "utf8").trim().split("\n")) {
    const m = JSON.parse(line) as { name: string; at: number };
    marks.set(m.name, (m.at - start) / 1000);
  }
  const at = (name: string) => {
    const t = marks.get(name);
    if (t === undefined) throw new Error(`no mark "${name}"`);
    return t;
  };
  return CUTS.map((c) => {
    const s = at(c.from);
    const e = at(c.to);
    return {
      start: s,
      end: e,
      speed: Math.max(1, (e - s) / c.seconds),
      caption: c.caption,
    };
  });
}

function cut(): void {
  const list = spans();
  for (const s of list)
    console.error(
      `${s.caption.padEnd(52)} ${(s.end - s.start).toFixed(2)}s → ${((s.end - s.start) / s.speed).toFixed(2)}s (×${s.speed.toFixed(2)})`,
    );

  const inner = WIDTH - 2 * MARGIN;
  // One constant-rate pass first: the recorder only writes frames on change.
  run([
    "ffmpeg",
    "-y",
    "-loglevel",
    "error",
    "-i",
    files.raw,
    "-vf",
    `fps=30,scale=${inner}:-2:flags=lanczos`,
    "-c:v",
    "libx264",
    "-crf",
    "12",
    "-pix_fmt",
    "yuv444p",
    files.cfr,
  ]);
  const probe = Bun.spawnSync([
    "ffprobe",
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=height",
    "-of",
    "csv=p=0",
    files.cfr,
  ]);
  const termHeight = Number(probe.stdout.toString().trim());
  const height = termHeight + MARGIN + CAPTION_BAND;

  const captions: string[] = [];
  const graph: string[] = [];
  list.forEach((s, i) => {
    const text = join(WORK, `caption-${i}.txt`);
    writeFileSync(text, s.caption);
    captions.push(text);
    graph.push(
      `[0:v]trim=start=${s.start.toFixed(3)}:end=${s.end.toFixed(3)},` +
        `setpts=(PTS-STARTPTS)/${s.speed.toFixed(4)},fps=${FPS},` +
        `pad=${WIDTH}:${height}:${MARGIN}:${MARGIN}:color=${BG},` +
        `drawtext=fontfile=${SANS}:textfile=${text}:fontsize=22:fontcolor=${FG}:` +
        `x=(w-tw)/2:y=h-${CAPTION_BAND / 2}-th/2,setsar=1[s${i}]`,
    );
  });
  const lines = [
    { text: "so", font: MONO, size: 84, color: FG, y: `h/2-110` },
    {
      text: "Vim keys for Markdown notes and code",
      font: SANS,
      size: 28,
      color: FG,
      y: `h/2+10`,
    },
    { text: "so [path]", font: MONO, size: 24, color: DIM, y: `h/2+64` },
  ];
  const outro = lines
    .map((l, i) => {
      const file = join(WORK, `outro-${i}.txt`);
      writeFileSync(file, l.text);
      return `drawtext=fontfile=${l.font}:textfile=${file}:fontsize=${l.size}:fontcolor=${l.color}:x=(w-tw)/2:y=${l.y}`;
    })
    .join(",");
  graph.push(
    `color=c=${BG}:s=${WIDTH}x${height}:d=${OUTRO_SECONDS}:r=${FPS},${outro},fade=in:d=0.4,setsar=1[outro]`,
  );
  graph.push(
    `${list.map((_, i) => `[s${i}]`).join("")}[outro]concat=n=${list.length + 1}:v=1[v]`,
  );

  run([
    "ffmpeg",
    "-y",
    "-loglevel",
    "error",
    "-i",
    files.cfr,
    "-filter_complex",
    graph.join(";"),
    "-map",
    "[v]",
    "-c:v",
    "libx264",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    files.mp4,
  ]);

  mkdirSync(join(ROOT, "docs"), { recursive: true });
  run([
    "ffmpeg",
    "-y",
    "-loglevel",
    "error",
    "-i",
    files.mp4,
    "-filter_complex",
    "split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle",
    "-loop",
    "0",
    OUT_GIF,
  ]);
  const size = Bun.file(OUT_GIF).size;
  console.error(`docs/intro.gif ${(size / 1e6).toFixed(2)} MB · ${files.mp4}`);
}

async function main(): Promise<void> {
  if (!process.argv.includes("--cut")) await record();
  cut();
}

if (import.meta.main) await main();
