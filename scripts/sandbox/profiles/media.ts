import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { createSvgRasterizer } from "../../../src/workspace/svg";
import { copyFixture, type Profile, writeFiles } from "../profile";

const PHOTO = { width: 2400, height: 1600 };
const COLS = 6;
const ROWS = 4;

/** A landscape with a lettered grid over it, so zoom and pan show where they are. */
function photoSvg(): string {
  const { width: w, height: h } = PHOTO;
  const tiles: string[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const x = (c * w) / COLS;
      const y = (r * h) / ROWS;
      tiles.push(
        `<rect x="${x}" y="${y}" width="${w / COLS}" height="${h / ROWS}" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="3"/>`,
        `<text x="${x + 24}" y="${y + 72}" font-size="56" fill="#ffffff">${"ABCDEF"[c]}${r + 1}</text>`,
      );
    }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="sans-serif">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e3a8a"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#sky)"/>
<circle cx="1750" cy="520" r="170" fill="#fde68a"/>
<polygon points="0,1250 520,620 980,1150 1450,700 2000,1200 2400,900 2400,1600 0,1600" fill="#334155"/>
<polygon points="0,1450 700,1050 1300,1400 1900,1100 2400,1380 2400,1600 0,1600" fill="#0f172a"/>
${tiles.join("\n")}
</svg>`;
}

const crc = (bytes: Uint8Array) => Bun.hash.crc32(bytes);

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  out.set(data, 8);
  out.writeUInt32BE(crc(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/** RGBA pixels as a PNG file. */
export function png(
  rgba: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const row = width * 4;
  const rows = Buffer.alloc(height * (1 + row));
  for (let y = 0; y < height; y++)
    rows.set(rgba.subarray(y * row, (y + 1) * row), y * (1 + row) + 1);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", new Uint8Array()),
  ]);
}

/** Run ffmpeg quietly; false when it is not installed or fails. */
export function ffmpeg(args: string[]): boolean {
  const bin = Bun.which("ffmpeg");
  if (bin === null) return false;
  const p = Bun.spawnSync([bin, "-v", "error", "-nostdin", "-y", ...args], {
    stdout: "ignore",
    stderr: "ignore",
  });
  return p.exitCode === 0;
}

/** ffmpeg's moving test pattern with a tone: `seconds` long, `size` pixels. */
const testClip = (seconds: number, size: string, out: string) => [
  "-f",
  "lavfi",
  "-i",
  `testsrc2=duration=${seconds}:size=${size}:rate=24`,
  "-f",
  "lavfi",
  "-i",
  `sine=frequency=440:duration=${seconds}`,
  "-pix_fmt",
  "yuv420p",
  "-preset",
  "ultrafast",
  "-crf",
  "35",
  "-shortest",
  out,
];

export const media: Profile = {
  name: "media",
  summary: "Images, SVG, and video windows: zoom, pan, source, embeds, seeking",
  journeys: [
    {
      title: "Picture",
      steps: [
        "Open photo.png",
        "Press + three times, then l l j; press 0",
        "Press + twice and drag the picture; turn the wheel up and down",
        "Open broken.png",
      ],
      expect: [
        "The landscape fills the window, centred; the statusline shows IMAGE and 2400×1600",
        "It grows to 175% and moves right and down past the tiles' letters; 0 fits it again",
        "The picture follows the pointer and stops at its edges; the wheel zooms in and out",
        "It says broken.png could not be drawn and that :Open shows it",
      ],
    },
    {
      title: "SVG and its source",
      steps: [
        "Open logo.svg",
        "Press Space m; change fill to #ea4335; :w; press Space m",
        "Open note.md",
      ],
      expect: [
        "A blue circle, sharp at + zoom; the statusline shows 64×64",
        "The XML source with text keys; after the save the circle draws red",
        "The note shows the red circle embedded under its heading",
      ],
    },
    {
      title: "Animated GIF",
      steps: ["Open pattern.gif"],
      expect: ["Its first frame shows, still"],
    },
    {
      title: "Video",
      steps: [
        "Open clip.mp4",
        "Press l three times, L, H; press G, then gg; turn the wheel",
        "Press Enter",
        "Open broken.mp4",
      ],
      expect: [
        "A frame over clip.mp4 · 640×360 · h264 · 24 fps · aac · and its size; VIDEO and 0:00 / 1:30",
        "The frame and the timeline reach 0:27; L and H nudge the frame under a second; G shows 1:29, gg 0:00; each wheel notch nudges it",
        "The system player opens clip.mp4 with sound",
        "It says Cannot show broken.mp4: Invalid data found when processing input, and that Enter plays it",
      ],
    },
    {
      title: "Prompt over a video",
      steps: [
        "With clip.mp4 shown, press Space e, then d on clip.mp4; press Esc",
      ],
      expect: ["The delete prompt shows whole, with the frame drawn around it"],
    },
    {
      title: "Without ffmpeg",
      steps: [
        "Quit; run PATH=/usr/bin:/bin ~/.bun/bin/bun scripts/sandbox.ts --profile media",
        "Open clip.mp4; press Enter",
      ],
      expect: [
        "The window says video view needs ffmpeg and how to install it",
        "The system player still plays it",
      ],
    },
    {
      title: "Inside herdr",
      steps: ["Repeat Picture and Video in a herdr pane"],
      expect: [
        "Images draw as in plain Ghostty; seeking redraws the frame within a second",
      ],
    },
  ],
  async stage(vault) {
    const rasterize = createSvgRasterizer();
    const photo = await rasterize({
      svg: photoSvg(),
      background: "#000000",
      crop: { x: 0, y: 0, w: PHOTO.width, h: PHOTO.height },
      ...PHOTO,
    });
    writeFileSync(
      join(vault, "photo.png"),
      png(photo.rgba, photo.width, photo.height),
    );
    copyFixture("images/broken.png", join(vault, "broken.png"));
    writeFiles(vault, {
      "logo.svg":
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><title>Logo</title><circle cx="32" cy="32" r="28" fill="#4285f4"/></svg>\n',
      "note.md": "# Embeds\n\nThe logo, drawn from its SVG:\n\n![[logo.svg]]\n",
      "broken.mp4": "not really a video\n",
    });
    const videos =
      ffmpeg(testClip(90, "640x360", join(vault, "clip.mp4"))) &&
      ffmpeg([
        "-f",
        "lavfi",
        "-i",
        "testsrc=duration=2:size=320x240:rate=8",
        join(vault, "pattern.gif"),
      ]);
    writeFiles(vault, {
      "README.md": `# Media\n\nOpen \`photo.png\`, \`logo.svg\`, \`note.md\`, and \`clip.mp4\` from the explorer.\n${
        videos
          ? ""
          : "\nffmpeg was not found when this vault was staged, so `clip.mp4` and `pattern.gif` are missing: install ffmpeg and run the sandbox again with `--reset`.\n"
      }`,
    });
  },
};
