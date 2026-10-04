import { expect, test } from "bun:test";
import { ASSETS, PAGE } from "./assets";

const text = (name: string) => {
  const asset = ASSETS.get(name);
  if (asset === undefined) throw new Error(`${name} is not an asset`);
  return Bun.file(asset.path).text();
};

test("the page loads only its own embedded files", async () => {
  const html = await Bun.file(PAGE.path).text();
  const pageFiles = [html, await text("page.js"), await text("page.css")];
  for (const source of pageFiles) {
    expect(source).not.toMatch(/https?:\/\//);
    expect(source).not.toMatch(/\son[a-z]+\s*=/i);
  }
  for (const [, body] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))
    expect(body?.trim()).toBe("");
  expect(html).not.toMatch(/<style\b/);
  const refs = [...html.matchAll(/\b(?:src|href)="([^"]*)"/g)].map(
    (m) => m[1] as string,
  );
  expect(refs.length).toBeGreaterThan(0);
  for (const ref of refs) {
    expect(ref.startsWith("/assets/")).toBe(true);
    expect(ASSETS.has(ref.slice("/assets/".length))).toBe(true);
  }
});

test("the page is a read-only document with an announced connection badge", async () => {
  const html = await Bun.file(PAGE.path).text();
  for (const landmark of ["<header", "<main", "<article"])
    expect(html).toContain(landmark);
  expect(html).toMatch(
    /<[^>]*data-badge[^>]*aria-live="polite"|<[^>]*aria-live="polite"[^>]*data-badge/,
  );
  expect(html).not.toMatch(/<form|<textarea|<input|contenteditable/i);
});

test("every KaTeX font the stylesheet references is served", async () => {
  const css = await text("katex.min.css");
  const fonts = [...css.matchAll(/url\((fonts\/[^)]+\.woff2)\)/g)].map(
    (m) => m[1] as string,
  );
  expect(fonts.length).toBeGreaterThan(0);
  for (const font of fonts) expect(ASSETS.has(font)).toBe(true);
});

test("every page and asset path is a readable file", async () => {
  for (const asset of [PAGE, ...ASSETS.values()]) {
    const file = Bun.file(asset.path);
    expect(await file.exists()).toBe(true);
    expect(file.size).toBeGreaterThan(0);
  }
});
