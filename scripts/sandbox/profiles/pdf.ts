import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { createSvgRasterizer } from "../../../src/workspace/svg";
import { makeBookPdf } from "../../../test/support/pdf";
import { type Profile, writeFiles } from "../profile";

const PAGES = 12;

const W = 612;
const H = 792;
/** Pixels per PDF point in the page images. */
const SCALE = 2;

const esc = (s: string) =>
  s.replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c,
  );

/** One US Letter page: a large heading, a band whose height grows with `n`, numbered lines, and a footer. */
function pageSvg(n: number, pages: number): string {
  const lines = Array.from(
    { length: 30 },
    (_, i) =>
      `<text x="72" y="${270 + i * 16}" font-size="12">${esc(`Page ${n}, line ${i + 1}: the quick brown fox jumps over the lazy dog.`)}</text>`,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="sans-serif">
<text x="72" y="100" font-size="40" font-weight="bold">${esc(`Page ${n} of ${pages}`)}</text>
<rect x="72" y="130" width="468" height="${20 + n * 8}" fill="#d9e6ff"/>
${lines.join("\n")}
<text x="306" y="760" font-size="10" text-anchor="middle">- ${n} -</text>
</svg>`;
}

/**
 * A US Letter PDF of `pages` pages, each one image drawn by the app's SVG
 * rasterizer, so navigation checks never depend on fonts; font handling has
 * its own file (`fontPdf`).
 */
async function imagePdf(pages: number): Promise<Uint8Array> {
  const rasterize = createSvgRasterizer();
  const parts: (string | Uint8Array)[] = [];
  const objects: (string | [string, Uint8Array])[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
  ];
  const kids: number[] = [];
  for (let n = 1; n <= pages; n++) {
    const img = await rasterize({
      svg: pageSvg(n, pages),
      background: "#ffffff",
      crop: { x: 0, y: 0, w: W, h: H },
      width: W * SCALE,
      height: H * SCALE,
    });
    const rgb = new Uint8Array(img.width * img.height * 3);
    for (let i = 0, j = 0; i < img.rgba.length; i += 4, j += 3) {
      rgb[j] = img.rgba[i] ?? 255;
      rgb[j + 1] = img.rgba[i + 1] ?? 255;
      rgb[j + 2] = img.rgba[i + 2] ?? 255;
    }
    const data = deflateSync(rgb);
    objects.push([
      `<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${data.length} >>`,
      data,
    ]);
    const imageId = objects.length;
    const content = `q ${W} 0 0 ${H} 0 0 cm /Im${n} Do Q`;
    objects.push(
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    );
    const contentId = objects.length;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im${n} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    kids.push(objects.length);
  }
  objects[1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${pages} >>`;
  const enc = new TextEncoder();
  let at = 0;
  const put = (x: string | Uint8Array) => {
    const bytes = typeof x === "string" ? enc.encode(x) : x;
    parts.push(bytes);
    at += bytes.length;
  };
  put("%PDF-1.4\n");
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(at);
    put(`${i + 1} 0 obj\n`);
    if (typeof body === "string") put(body);
    else {
      put(`${body[0]}\nstream\n`);
      put(body[1]);
      put("\nendstream");
    }
    put("\nendobj\n");
  });
  const xref = at;
  put(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  for (const o of offsets) put(`${String(o).padStart(10, "0")} 00000 n \n`);
  put(
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`,
  );
  return Buffer.concat(
    parts.map((x) => (typeof x === "string" ? enc.encode(x) : x)),
  );
}

/**
 * One page writing a line in each of Helvetica, Times, and Courier without
 * embedding them, as simple exporters do, so the viewer must find the fonts.
 */
function fontPdf(): Uint8Array {
  const fonts = ["Helvetica", "Times-Roman", "Courier"];
  const content = fonts
    .map(
      (f, i) =>
        `BT /F${i + 1} 28 Tf 72 ${700 - i * 60} Td (${f}: the quick brown fox) Tj ET`,
    )
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << ${fonts.map((_, i) => `/F${i + 1} ${5 + i} 0 R`).join(" ")} >> >> /Contents 4 0 R >>`,
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    ...fonts.map((f) => `<< /Type /Font /Subtype /Type1 /BaseFont /${f} >>`),
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

/** A short text PDF with a table of contents, for search and contents. */
const book = () =>
  makeBookPdf(
    [
      ["A Short Book", "", "Chapter 1 sets out the attention budget."],
      [
        "Chapter 1: Attention",
        "Attention is limited; spend it on",
        "one page at a time.",
      ],
      ["Chapter 2: Method", "We read, then link the page we read."],
      ["Chapter 2.1: Notes", "Notes keep the attention we paid."],
      ["Chapter 3: End", "Nothing more here."],
    ],
    [
      { title: "Chapter 1: Attention", page: 2 },
      {
        title: "Chapter 2: Method",
        page: 3,
        children: [{ title: "2.1 Notes", page: 4 }],
      },
      { title: "Chapter 3: End", page: 5 },
    ],
  );

const READING = `# Reading notes

The cover page:

![[paper.pdf]]

Page 3, where the argument starts:

![[paper.pdf#page=3]]

A missing file:

![[gone.pdf#page=2]]

The end.
`;

export const pdf: Profile = {
  name: "pdf",
  summary:
    "PDFs: page view, navigation, fit modes, search, text selection, contents, dark page, zoom, page links, embeds, missing Poppler",
  journeys: [
    {
      title: "Open and read",
      steps: [
        "Open docs/paper.pdf from the explorer",
        "Press j a few times, then <C-d>, then keep going past the bottom",
      ],
      expect: [
        "The page draws in the window; the statusline shows PDF and 1/12",
        "j/<C-d> scroll down the page; past its bottom page 2 starts at its top",
        "k at the top of a page goes back to the previous page's bottom",
      ],
    },
    {
      title: "Page navigation",
      steps: [
        "Press J, K, G, gg",
        "Run :Page 7, :Page, and :Page 99; then <leader>pg 4 Enter",
        "Press <leader>p and read the which-key list",
      ],
      expect: [
        "J/K turn pages; G shows 12/12, gg shows 1/12",
        ":Page 7 shows page 7; :Page says page 7/12; :Page 99 says no page 99 (1–12)",
        "<leader>pg opens :Page and shows page 4",
        "The pdf group lists contents, go to page, zoom, dark page, and copy link",
      ],
    },
    {
      title: "Fit modes and the wheel",
      steps: [
        "Press a, then scroll the wheel",
        "Press s, then scroll the wheel",
      ],
      expect: [
        "a shows the whole page centred; one notch turns one page",
        "s fills the width again; the wheel scrolls rows, and one scroll turns at most one page",
      ],
    },
    {
      title: "Search",
      steps: [
        "Open docs/book.pdf; type /attention and Enter",
        "Press n a few times, then N; then search /nowhere",
      ],
      expect: [
        '"attention": page 1 · 1 hit; the statusline shows [1/3]',
        "n goes to pages 2, 4, then wraps to 1 (· wrapped); N goes back",
        "not found: nowhere; the page stays",
      ],
    },
    {
      title: "Contents",
      steps: ["In docs/book.pdf press <leader>po, type notes, Enter"],
      expect: [
        "The picker lists the chapters with 2.1 Notes indented and p. N beside each",
        "Enter shows page 4",
      ],
    },
    {
      title: "Select and copy text",
      steps: [
        "Open docs/book.pdf on page 2; drag from the middle of Attention in the first body line to the middle of time. on the next, then press y",
        "Double-click limited; press y. Triple-click the heading; press y. Press <Esc>",
        "Zoom in with <leader>pz, drag across a few words, press y; then <leader>pi and drag again",
        "Open docs/paper.pdf (its pages are pictures); drag across a line, press y",
      ],
      expect: [
        "The characters under the drag tint in place as it moves, starting and ending inside the words; letting go floats h Highlight  n Note  y Copy under them; y says copied 2 lines and p in a note pastes them",
        "The double click selects only limited;, the triple click the whole heading; <Esc> clears the tint",
        "Selection lands on the words under the pointer when zoomed and on the dark page",
        "y says no text on this page (scanned?)",
      ],
    },
    {
      title: "Highlight and note",
      steps: [
        "Open docs/book.pdf on page 2; drag across a few words of the first body line and let go; press h",
        "Drag across words of the next line, let go, and click Note in the float; type a note, press <Esc>, run :w, then <C-^>",
        "Rest the pointer on the noted words, then move it away",
        "Click the highlighted words and press d; then press ga with nothing selected",
        "Run :qa, start the sandbox again, and open docs/book.pdf on page 2",
        "In the explorer, rename docs/book.pdf to docs/book2.pdf with r, and open it",
      ],
      expect: [
        "The float sits just under the words with the page drawn around it (no image over it); h tints the words amber and says highlighted",
        "Note opens a prompt titled Note on page 2 quoting the selection; typing and Enter says noted and tints the words green; a click on them shows e Edit  d Delete  y Copy",
        "Resting on them floats the note's text in a box titled note; moving away hides it",
        "The click floats a box titled highlight with d Delete  y Copy; d removes the tint and says deleted the highlight; ga says no selection",
        "The note is still drawn, read back from .so/annotations/docs/book.pdf.json in the vault",
        "docs/book2.pdf shows the note; .so/annotations/docs/book2.pdf.json holds it and book.pdf.json is gone",
      ],
    },
    {
      title: "Copy a page link",
      steps: [
        "In docs/paper.pdf go to page 5 and press <leader>py",
        "Open reading.md, press <leader>m for live view, go to an empty line, and press p",
      ],
      expect: [
        "copied ![[paper.pdf#page=5]]",
        "The link pastes into the note and draws page 5 in live view",
      ],
    },
    {
      title: "Dark page and zoom",
      steps: [
        "In docs/paper.pdf press <leader>pi, then J, then <leader>pi",
        "Press <leader>pz, then + and -, h/l and j/k, a sideways wheel, then 0",
      ],
      expect: [
        "The page turns to the theme's background and text colours, stays dark on the next page, then goes back",
        "The page zooms in its own window (statusline 1/12 200%) around the window's centre; h/l and the sideways wheel pan, j/k scroll and cross pages at the same zoom; 0 fits the width again",
      ],
    },
    {
      title: "Switch away and back",
      steps: ["On page 5, open reading.md, then press <C-^>"],
      expect: ["The PDF is back on page 5"],
    },
    {
      title: "Read-only",
      steps: ["In the PDF, run :w"],
      expect: ["read-only file; paper.pdf is unchanged"],
    },
    {
      title: "Embeds",
      steps: ["Open reading.md; cycle views with <leader>m"],
      expect: [
        "Page 1 and page 3 draw inline in live and reading views",
        "gone.pdf shows [pdf: gone.pdf · p. 2]",
      ],
    },
    {
      title: "Fonts the PDF leaves out",
      steps: ["Open docs/no-embedded-fonts.pdf"],
      expect: [
        "All three lines draw (Helvetica, Times, Courier); none is blank",
      ],
    },
    {
      title: "Your own PDFs",
      steps: [
        "Copy one or two real PDFs into the vault (papers, invoices, exported docs) and open them",
      ],
      expect: [
        "Text and images draw as in a PDF viewer; the sandbox's own PDFs prove only the basics",
      ],
    },
    {
      title: "A broken PDF",
      steps: ["Open docs/broken.pdf"],
      expect: ["Cannot show broken.pdf: <Poppler's reason>; so keeps running"],
    },
    {
      title: "Without Poppler",
      steps: [
        'Quit, then run: env PATH=/usr/bin:/bin "$(which bun)" run sandbox --profile pdf',
        "Open docs/paper.pdf, then run :Open",
      ],
      expect: [
        "The window says PDF view needs Poppler with install hints",
        ":Open shows the PDF in the system viewer",
      ],
    },
  ],
  stage: async (vault) => {
    writeFiles(vault, {
      "reading.md": READING,
      "docs/broken.pdf": "%PDF-1.4\nnot really a PDF\n",
    });
    writeFileSync(join(vault, "docs/paper.pdf"), await imagePdf(PAGES));
    writeFileSync(join(vault, "docs/no-embedded-fonts.pdf"), fontPdf());
    writeFileSync(join(vault, "docs/book.pdf"), book());
  },
};
