import { wholeBlock } from "../block-text";
import { registerBlockRenderer } from "../live-preview";
import { calloutRenderer } from "./callout";
import { codeRenderer } from "./code";
import { embedRenderer } from "./embed";
import { footnoteRenderer } from "./footnote";
import { frontmatterRenderer } from "./frontmatter";
import { headingRenderer } from "./heading";
import { imageRenderer } from "./image";
import { listRenderer } from "./list";
import { mathRenderer } from "./math";
import { mermaidRenderer } from "./mermaid";
import { pdfRenderer } from "./pdf";
import { ruleRenderer } from "./rule";
import { tableRenderer } from "./table";

/** Register every built-in block renderer; called once at startup. */
export function builtinRenderers(): void {
  registerBlockRenderer("heading", headingRenderer);
  registerBlockRenderer("list", listRenderer);
  registerBlockRenderer("table", tableRenderer);
  registerBlockRenderer("callout", calloutRenderer);
  registerBlockRenderer("quote", calloutRenderer);
  registerBlockRenderer("code", codeRenderer);
  registerBlockRenderer("math", mathRenderer);
  registerBlockRenderer("mermaid", mermaidRenderer);
  registerBlockRenderer("frontmatter", frontmatterRenderer);
  registerBlockRenderer("rule", ruleRenderer);
  registerBlockRenderer("footnote", footnoteRenderer);
  registerBlockRenderer("comment", (block, v) => [
    { kind: "replace", range: wholeBlock(v.buf, block), block: true },
  ]);
  registerBlockRenderer("embed", embedRenderer);
  registerBlockRenderer("image", imageRenderer);
  registerBlockRenderer("pdf", pdfRenderer);
}
