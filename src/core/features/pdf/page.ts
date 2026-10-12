const PAGE = /^#?page=(\d+)$/;
const PAGE_REF = /^(.+\.pdf)#page=(\d+)$/i;

/** The page a `#page=N` subpath names; anything else is page 1. */
export function pageOf(subpath?: string): number {
  const n = Number(PAGE.exec(subpath ?? "")?.[1] ?? 1);
  return Math.max(1, n);
}

/** The image reference for one page of a workspace PDF: `docs/a.pdf#page=3`. */
export const pdfPageRef = (path: string, page: number): string =>
  `${path}#page=${page}`;

export function parsePdfPageRef(
  ref: string,
): { path: string; page: number } | undefined {
  const m = PAGE_REF.exec(ref);
  if (m?.[1] === undefined || m[2] === undefined) return undefined;
  return { path: m[1], page: Math.max(1, Number(m[2])) };
}

/** One page of a workspace PDF drawn `width` pixels wide. */
export type PdfPageRequest = { path: string; page: number; width: number };

export const PAGE_WIDTH = { min: 64, max: 2048, step: 64 } as const;

/** Widths snap to steps of 64 pixels, so a small resize reuses the page it has. */
export function pageWidth(width: number): number {
  const w = Math.round(width / PAGE_WIDTH.step) * PAGE_WIDTH.step;
  return Math.max(PAGE_WIDTH.min, Math.min(w, PAGE_WIDTH.max));
}
