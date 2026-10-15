import { expect, test } from "bun:test";
import type { Cdp, CdpEvent } from "./cdp";
import { openPage, type PageInfo } from "./page";

/** A DevTools connection that answers every call and records it. */
function fakeCdp() {
  const calls: { method: string; params: Record<string, unknown> }[] = [];
  let listener: (e: CdpEvent) => void = () => {};
  const RESULTS: Record<string, unknown> = {
    "Target.createTarget": { targetId: "T" },
    "Target.attachToTarget": { sessionId: "S" },
    "Page.getFrameTree": { frameTree: { frame: { id: "F" } } },
    "Runtime.evaluate": { result: { value: "A title" } },
  };
  const cdp: Cdp = {
    send: <T>(method: string, params: Record<string, unknown> = {}) => {
      calls.push({ method, params });
      return Promise.resolve((RESULTS[method] ?? {}) as T);
    },
    on: (l) => {
      listener = l;
      return () => {};
    },
    close: () => {},
    closed: new Promise<string>(() => {}),
  };
  return {
    cdp,
    calls: (method: string) =>
      calls.filter((c) => c.method === method).map((c) => c.params),
    emit: (method: string, params: Record<string, unknown>) =>
      listener({ method, params, sessionId: "S" }),
  };
}

const open = async () => {
  const f = fakeCdp();
  const infos: PageInfo[] = [];
  const page = await openPage(f.cdp, {
    size: { width: 800, height: 600, dpr: 2 },
    onFrame: () => {},
    onInfo: (i) => infos.push(i),
  });
  return { f, page, infos };
};

test("a key carries no native key code: macOS would read Home's code as Return", async () => {
  const { f, page } = await open();
  await page.key({ key: "Home", code: "Home", keyCode: 36, modifiers: 0 });
  const sent = f.calls("Input.dispatchKeyEvent");
  expect(sent.map((p) => p.type)).toEqual(["rawKeyDown", "keyUp"]);
  for (const p of sent) {
    expect(p.windowsVirtualKeyCode).toBe(36);
    expect(p).not.toHaveProperty("nativeVirtualKeyCode");
  }
});

test("a title a script sets after a key is read without a new frame", async () => {
  const { page, infos } = await open();
  await page.key({
    key: "a",
    code: "KeyA",
    keyCode: 65,
    modifiers: 0,
    text: "a",
  });
  expect(infos).toEqual([]);
  await Bun.sleep(300);
  expect(infos.at(-1)?.title).toBe("A title");
});

test("a jump to an anchor ends loading without a load event", async () => {
  const { f, infos } = await open();
  f.emit("Page.frameStartedLoading", { frameId: "F" });
  expect(infos.at(-1)?.loading).toBe(true);
  f.emit("Page.frameStoppedLoading", { frameId: "F" });
  await Bun.sleep(0);
  expect(infos.at(-1)).toEqual({
    url: "about:blank",
    title: "A title",
    loading: false,
  });
});
