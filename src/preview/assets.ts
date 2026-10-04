/// <reference path="./assets.d.ts" />
import fontAMSRegular from "katex/dist/fonts/KaTeX_AMS-Regular.woff2" with {
  type: "file",
};
import fontCaligraphicBold from "katex/dist/fonts/KaTeX_Caligraphic-Bold.woff2" with {
  type: "file",
};
import fontCaligraphicRegular from "katex/dist/fonts/KaTeX_Caligraphic-Regular.woff2" with {
  type: "file",
};
import fontFrakturBold from "katex/dist/fonts/KaTeX_Fraktur-Bold.woff2" with {
  type: "file",
};
import fontFrakturRegular from "katex/dist/fonts/KaTeX_Fraktur-Regular.woff2" with {
  type: "file",
};
import fontMainBold from "katex/dist/fonts/KaTeX_Main-Bold.woff2" with {
  type: "file",
};
import fontMainBoldItalic from "katex/dist/fonts/KaTeX_Main-BoldItalic.woff2" with {
  type: "file",
};
import fontMainItalic from "katex/dist/fonts/KaTeX_Main-Italic.woff2" with {
  type: "file",
};
import fontMainRegular from "katex/dist/fonts/KaTeX_Main-Regular.woff2" with {
  type: "file",
};
import fontMathBoldItalic from "katex/dist/fonts/KaTeX_Math-BoldItalic.woff2" with {
  type: "file",
};
import fontMathItalic from "katex/dist/fonts/KaTeX_Math-Italic.woff2" with {
  type: "file",
};
import fontSansSerifBold from "katex/dist/fonts/KaTeX_SansSerif-Bold.woff2" with {
  type: "file",
};
import fontSansSerifItalic from "katex/dist/fonts/KaTeX_SansSerif-Italic.woff2" with {
  type: "file",
};
import fontSansSerifRegular from "katex/dist/fonts/KaTeX_SansSerif-Regular.woff2" with {
  type: "file",
};
import fontScriptRegular from "katex/dist/fonts/KaTeX_Script-Regular.woff2" with {
  type: "file",
};
import fontSize1Regular from "katex/dist/fonts/KaTeX_Size1-Regular.woff2" with {
  type: "file",
};
import fontSize2Regular from "katex/dist/fonts/KaTeX_Size2-Regular.woff2" with {
  type: "file",
};
import fontSize3Regular from "katex/dist/fonts/KaTeX_Size3-Regular.woff2" with {
  type: "file",
};
import fontSize4Regular from "katex/dist/fonts/KaTeX_Size4-Regular.woff2" with {
  type: "file",
};
import fontTypewriterRegular from "katex/dist/fonts/KaTeX_Typewriter-Regular.woff2" with {
  type: "file",
};
import katexCss from "katex/dist/katex.min.css" with { type: "file" };
import katexJs from "katex/dist/katex.min.js" with { type: "file" };
import mermaidJs from "mermaid/dist/mermaid.min.js" with { type: "file" };
import pageCss from "./page.css" with { type: "file" };
import pageHtml from "./page.html" with { type: "file" };
import pageJs from "./page.js" with { type: "file" };

/** A file the browser may load: its path (embedded in a compiled binary) and exact content type. */
export type PreviewAsset = { path: string; type: string };

const JS = "text/javascript; charset=utf-8";
const CSS = "text/css; charset=utf-8";
const WOFF2 = "font/woff2";

/** The page shell, served at `/` and at every note path. */
export const PAGE: PreviewAsset = {
  path: String(pageHtml),
  type: "text/html; charset=utf-8",
};

/**
 * Every file served under `/assets/`, by its name after that prefix. KaTeX's
 * stylesheet loads `url(fonts/…)`, which resolves to the `fonts/` entries
 * because the stylesheet itself is served from `/assets/`.
 */
export const ASSETS: ReadonlyMap<string, PreviewAsset> = new Map([
  ["page.js", { path: pageJs, type: JS }],
  ["page.css", { path: pageCss, type: CSS }],
  ["katex.min.js", { path: katexJs, type: JS }],
  ["katex.min.css", { path: katexCss, type: CSS }],
  ["fonts/KaTeX_AMS-Regular.woff2", { path: fontAMSRegular, type: WOFF2 }],
  [
    "fonts/KaTeX_Caligraphic-Bold.woff2",
    { path: fontCaligraphicBold, type: WOFF2 },
  ],
  [
    "fonts/KaTeX_Caligraphic-Regular.woff2",
    { path: fontCaligraphicRegular, type: WOFF2 },
  ],
  ["fonts/KaTeX_Fraktur-Bold.woff2", { path: fontFrakturBold, type: WOFF2 }],
  [
    "fonts/KaTeX_Fraktur-Regular.woff2",
    { path: fontFrakturRegular, type: WOFF2 },
  ],
  ["fonts/KaTeX_Main-Bold.woff2", { path: fontMainBold, type: WOFF2 }],
  [
    "fonts/KaTeX_Main-BoldItalic.woff2",
    { path: fontMainBoldItalic, type: WOFF2 },
  ],
  ["fonts/KaTeX_Main-Italic.woff2", { path: fontMainItalic, type: WOFF2 }],
  ["fonts/KaTeX_Main-Regular.woff2", { path: fontMainRegular, type: WOFF2 }],
  [
    "fonts/KaTeX_Math-BoldItalic.woff2",
    { path: fontMathBoldItalic, type: WOFF2 },
  ],
  ["fonts/KaTeX_Math-Italic.woff2", { path: fontMathItalic, type: WOFF2 }],
  [
    "fonts/KaTeX_SansSerif-Bold.woff2",
    { path: fontSansSerifBold, type: WOFF2 },
  ],
  [
    "fonts/KaTeX_SansSerif-Italic.woff2",
    { path: fontSansSerifItalic, type: WOFF2 },
  ],
  [
    "fonts/KaTeX_SansSerif-Regular.woff2",
    { path: fontSansSerifRegular, type: WOFF2 },
  ],
  [
    "fonts/KaTeX_Script-Regular.woff2",
    { path: fontScriptRegular, type: WOFF2 },
  ],
  ["fonts/KaTeX_Size1-Regular.woff2", { path: fontSize1Regular, type: WOFF2 }],
  ["fonts/KaTeX_Size2-Regular.woff2", { path: fontSize2Regular, type: WOFF2 }],
  ["fonts/KaTeX_Size3-Regular.woff2", { path: fontSize3Regular, type: WOFF2 }],
  ["fonts/KaTeX_Size4-Regular.woff2", { path: fontSize4Regular, type: WOFF2 }],
  [
    "fonts/KaTeX_Typewriter-Regular.woff2",
    { path: fontTypewriterRegular, type: WOFF2 },
  ],
  ["mermaid.min.js", { path: mermaidJs, type: JS }],
]);
