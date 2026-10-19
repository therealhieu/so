import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createSvgRasterizer } from "../../../src/workspace/svg";
import { type Profile, writeFiles } from "../profile";
import { ffmpeg, png } from "./media";

type Picture = { file: string; caption: string };

/** ffmpeg test sources (with their options) that draw quickly at photo sizes, cycled through. */
const SOURCES = [
  "testsrc2=",
  "gradients=n=5:speed=0.1:",
  "cellauto=rule=110:",
  "smptehdbars=",
  "life=ratio=0.2:mold=10:",
  "rgbtestsrc=",
];

/** Phone photos, Retina screenshots, and small diagrams, each `n`th of its kind. */
function shapes(): {
  name: string;
  size: string;
  ext: string;
  caption: string;
}[] {
  const out = [];
  for (let n = 1; n <= 30; n++) {
    const kind = n % 5;
    if (kind === 0)
      out.push({
        name: `diagram-${n}`,
        size: "640x400",
        ext: "png",
        caption: "A small diagram, narrower than the window.",
      });
    else if (kind === 3)
      out.push({
        name: `screenshot-${n}`,
        size: "2880x1800",
        ext: "png",
        caption: "A Retina screenshot, as a PNG file.",
      });
    else
      out.push({
        name: `photo-${n}`,
        size: "4032x3024",
        ext: "jpg",
        caption: "A 12-megapixel phone photo, as a JPEG file.",
      });
  }
  return out;
}

/** A landscape in hue `hue`, for when ffmpeg is missing. */
const landscape = (hue: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 1600" width="2400" height="1600">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},60%,30%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},80%,60%)"/></linearGradient></defs>
<rect width="2400" height="1600" fill="url(#sky)"/>
<circle cx="${600 + ((hue * 7) % 1200)}" cy="520" r="170" fill="#fde68a"/>
<polygon points="0,1250 520,620 980,1150 1450,700 2000,1200 2400,900 2400,1600 0,1600" fill="hsl(${hue},30%,20%)"/>
</svg>`;

async function stagePictures(
  dir: string,
): Promise<{ pictures: Picture[]; drawn: boolean }> {
  const made: Picture[] = [];
  let i = 0;
  for (const s of shapes()) {
    const file = `${s.name}.${s.ext}`;
    const source = SOURCES[i++ % SOURCES.length];
    const args = [
      "-f",
      "lavfi",
      "-i",
      `${source}size=${s.size}:rate=1`,
      "-frames:v",
      "1",
    ];
    if (
      !ffmpeg([
        ...args,
        ...(s.ext === "jpg" ? ["-q:v", "3"] : []),
        join(dir, file),
      ])
    )
      return { pictures: await drawnPictures(dir), drawn: true };
    made.push({ file, caption: s.caption });
  }
  return { pictures: made, drawn: false };
}

/** Twelve landscapes drawn by the app's SVG rasterizer. */
async function drawnPictures(dir: string): Promise<Picture[]> {
  const rasterize = createSvgRasterizer();
  const made: Picture[] = [];
  for (let n = 1; n <= 12; n++) {
    const img = await rasterize({
      svg: landscape(n * 29),
      background: "#000000",
      crop: { x: 0, y: 0, w: 2400, h: 1600 },
      width: 2400,
      height: 1600,
    });
    const file = `landscape-${n}.png`;
    writeFileSync(join(dir, file), png(img.rgba, img.width, img.height));
    made.push({ file, caption: "A 2400×1600 landscape, as a PNG file." });
  }
  return made;
}

export const pictures: Profile = {
  name: "pictures",
  summary:
    "A long note of large photos and screenshots: wheel scrolling on kitty terminals",
  journeys: [
    {
      title: "Fast wheel scroll",
      steps: [
        "Open gallery.md",
        "Flick the wheel or trackpad down to the end, then back up to the top",
      ],
      expect: [
        "The text and the pictures move together with every notch, without stalls",
        "A picture coming into view first shows ◌ and its name, then the picture within a moment",
        "Pictures seen a moment ago show again at once on the way back",
      ],
    },
    {
      title: "Cut by the window",
      steps: ["Scroll one notch at a time past a tall photo"],
      expect: [
        "The window's bottom cuts the photo cleanly, its top part showing, and it never flickers",
      ],
    },
    {
      title: "Resize",
      steps: ["Make the window narrower, then wider again"],
      expect: [
        "Pictures redraw to the new width within a moment, at their aspect ratio",
      ],
    },
    {
      title: "Over pictures",
      steps: [
        "With a picture on screen, press Space f f, then Esc",
        "Press Space m to the source view and back",
      ],
      expect: [
        "The picker shows whole over the picture, and the picture is back after Esc",
        "The source view shows ![[…]] lines and no pictures; the reading view shows them again",
      ],
    },
    {
      title: "Inside herdr",
      steps: ["Repeat Fast wheel scroll in a herdr pane"],
      expect: [
        "It scrolls as in plain Ghostty, and keys answer at once after the last notch",
      ],
    },
  ],
  async stage(vault) {
    const dir = join(vault, "pictures");
    writeFiles(vault, { "pictures/.keep": "" });
    const { pictures, drawn } = await stagePictures(dir);
    const body = pictures
      .map(
        (p, i) =>
          `## Picture ${i + 1}\n\n${p.caption} Wheel past it and back: it should keep up with the text.\n\n![[${p.file}]]\n`,
      )
      .join("\n");
    writeFiles(vault, {
      "gallery.md": `# Gallery\n\n${pictures.length} pictures, large ones first scaled to their shown size off the main thread.\n${
        drawn
          ? "\nffmpeg was not found when this vault was staged, so these are drawn landscapes, not photos: install ffmpeg and run the sandbox again with `--reset`.\n"
          : ""
      }\n${body}`,
    });
  },
};
