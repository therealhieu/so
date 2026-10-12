/** One entry of a PDF's table of contents; `depth` 0 is the top level. */
export type PdfOutlineItem = { title: string; page: number; depth: number };

const ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/** `text` with XML entities and character references replaced. */
export function decodeXml(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (whole, name: string) => {
    if (name.startsWith("#")) {
      const code =
        name[1] === "x" || name[1] === "X"
          ? Number.parseInt(name.slice(2), 16)
          : Number(name.slice(1));
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : whole;
    }
    return ENTITIES[name] ?? whole;
  });
}

const TAG = /<outline>|<\/outline>|<item\b([^>]*)>([\s\S]*?)<\/item>/g;

/**
 * The table of contents in `pdftohtml -xml` output: nested `<outline>`
 * lists of `<item page="N">title</item>`. Entries without a page (links to
 * other files) are left out.
 */
export function parsePdfOutline(xml: string): PdfOutlineItem[] {
  const items: PdfOutlineItem[] = [];
  let depth = -1;
  for (const m of xml.matchAll(TAG)) {
    if (m[0] === "<outline>") depth++;
    else if (m[0] === "</outline>") depth--;
    else {
      const page = Number(/\bpage="(\d+)"/.exec(m[1] ?? "")?.[1]);
      const title = decodeXml((m[2] ?? "").replace(/<[^>]*>/g, ""))
        .replace(/\s+/g, " ")
        .trim();
      if (Number.isInteger(page) && page > 0 && title !== "")
        items.push({ title, page, depth: Math.max(0, depth) });
    }
  }
  return items;
}
