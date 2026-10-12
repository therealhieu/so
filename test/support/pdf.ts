/**
 * A valid PDF of `pages` 200×300 pt pages, each filled with its own grey,
 * with exact xref offsets, so Poppler reads it without repairs.
 */
export function makePdf(pages: number): Uint8Array {
  const objects: string[] = [];
  const pageIds = Array.from({ length: pages }, (_, i) => 3 + i * 2);
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages} >>`,
  );
  for (let i = 0; i < pages; i++) {
    const grey = ((i + 1) / (pages + 1)).toFixed(2);
    const content = `${grey} g 0 0 200 300 re f`;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 300] /Contents ${4 + i * 2} 0 R >>`,
    );
    objects.push(
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    );
  }
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

/**
 * A one-page PDF writing `text` in the standard font `font` without
 * embedding it, as simple exporters do, so the viewer must find the font.
 */
export function makeTextPdf(font: string, text: string): Uint8Array {
  const content = `BT /F1 48 Tf 20 120 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    `<< /Type /Font /Subtype /Type1 /BaseFont /${font} >>`,
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
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

/** An entry in `makeBookPdf`'s table of contents. */
export type OutlineEntry = {
  title: string;
  page: number;
  children?: OutlineEntry[];
};

const pdfString = (s: string) => `(${s.replace(/[\\()]/g, (c) => `\\${c}`)})`;

/**
 * A PDF whose page `i` writes the lines `pages[i]` in Helvetica, with
 * `outline` as its table of contents, so text and contents tools have
 * something to read.
 */
export function makeBookPdf(
  pages: readonly string[][],
  outline: readonly OutlineEntry[] = [],
): Uint8Array {
  const objects: string[] = [];
  const add = (body: string) => {
    objects.push(body);
    return objects.length;
  };
  const catalog = add("");
  const tree = add("");
  const font = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds = pages.map((lines) => {
    const content = lines
      .map((l, i) => `BT /F1 14 Tf 40 ${740 - i * 20} Td ${pdfString(l)} Tj ET`)
      .join("\n");
    const contents = add(
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    );
    return add(
      `<< /Type /Page /Parent ${tree} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${contents} 0 R >>`,
    );
  });
  objects[tree - 1] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  const outlines = add("");
  const level = (
    entries: readonly OutlineEntry[],
    parent: number,
  ): number[] => {
    const ids = entries.map(() => add(""));
    entries.forEach((e, i) => {
      const kids = level(e.children ?? [], ids[i] as number);
      const links = [
        i > 0 ? `/Prev ${ids[i - 1]} 0 R` : "",
        i < ids.length - 1 ? `/Next ${ids[i + 1]} 0 R` : "",
        kids.length > 0
          ? `/First ${kids[0]} 0 R /Last ${kids.at(-1)} 0 R /Count ${kids.length}`
          : "",
      ].join(" ");
      objects[(ids[i] as number) - 1] =
        `<< /Title ${pdfString(e.title)} /Parent ${parent} 0 R ${links} /Dest [${pageIds[e.page - 1]} 0 R /Fit] >>`;
    });
    return ids;
  };
  const top = level(outline, outlines);
  objects[outlines - 1] =
    top.length === 0
      ? "<< /Type /Outlines /Count 0 >>"
      : `<< /Type /Outlines /First ${top[0]} 0 R /Last ${top.at(-1)} 0 R /Count ${top.length} >>`;
  objects[catalog - 1] =
    `<< /Type /Catalog /Pages ${tree} 0 R /Outlines ${outlines} 0 R >>`;
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}
