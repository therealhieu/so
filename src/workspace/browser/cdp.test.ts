import { expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import { type CdpTransport, createCdp, pipeTransport } from "./cdp";

function fakeTransport() {
  const sent: string[] = [];
  let deliver: (m: string) => void = () => {};
  let close: (r: string) => void = () => {};
  let ended = false;
  const t: CdpTransport = {
    write: (m) => sent.push(m),
    onMessage: (cb) => {
      deliver = cb;
    },
    onClose: (cb) => {
      close = cb;
    },
    close: () => {
      ended = true;
    },
  };
  return {
    t,
    sent: () => sent.map((m) => JSON.parse(m)),
    deliver: (m: unknown) => deliver(JSON.stringify(m)),
    drop: (r: string) => close(r),
    ended: () => ended,
  };
}

test("a call resolves with the result that carries its id, whatever the order", async () => {
  const f = fakeTransport();
  const cdp = createCdp(f.t);
  const a = cdp.send("A.one");
  const b = cdp.send("B.two", { x: 1 }, "S1");
  expect(f.sent()).toEqual([
    { id: 1, method: "A.one", params: {} },
    { id: 2, method: "B.two", params: { x: 1 }, sessionId: "S1" },
  ]);
  f.deliver({ id: 2, result: { two: true } });
  f.deliver({ id: 1, result: { one: true } });
  expect(await a).toEqual({ one: true });
  expect(await b).toEqual({ two: true });
});

test("an error answer rejects with Chrome's message", async () => {
  const f = fakeTransport();
  const cdp = createCdp(f.t);
  const a = cdp.send("Page.navigate");
  f.deliver({ id: 1, error: { code: -32000, message: "Cannot navigate" } });
  await expect(a).rejects.toThrow("Cannot navigate");
});

test("events reach listeners with their session until unsubscribed", () => {
  const f = fakeTransport();
  const cdp = createCdp(f.t);
  const seen: unknown[] = [];
  const off = cdp.on((e) => seen.push(e));
  f.deliver({
    method: "Page.loadEventFired",
    params: { t: 1 },
    sessionId: "S",
  });
  f.deliver("not json at all");
  off();
  f.deliver({ method: "Page.loadEventFired", params: {} });
  expect(seen).toEqual([
    { method: "Page.loadEventFired", params: { t: 1 }, sessionId: "S" },
  ]);
});

test("closing rejects waiting and later calls with the reason", async () => {
  const f = fakeTransport();
  const cdp = createCdp(f.t);
  const waiting = cdp.send("Browser.getVersion");
  f.drop("Chrome exited");
  await expect(waiting).rejects.toThrow("Chrome exited");
  await expect(cdp.send("Page.enable")).rejects.toThrow("Chrome exited");
  expect(await cdp.closed).toBe("Chrome exited");
});

test("close ends the transport and keeps the first reason", async () => {
  const f = fakeTransport();
  const cdp = createCdp(f.t);
  cdp.close("Chrome stopped");
  f.drop("Chrome closed the connection");
  expect(f.ended()).toBe(true);
  expect(await cdp.closed).toBe("Chrome stopped");
});

test("the pipe framing splits NUL-terminated messages across chunks", () => {
  const input = new EventEmitter();
  const written: string[] = [];
  const t = pipeTransport(
    { write: (c: string) => written.push(c), end: () => {} },
    input as never,
  );
  const got: string[] = [];
  t.onMessage((m) => got.push(m));
  t.write('{"id":1}');
  input.emit("data", Buffer.from('{"a":1}\0{"b":'));
  input.emit("data", Buffer.from('2}\0{"c"'));
  input.emit("data", Buffer.from(":3}\0"));
  expect(written).toEqual(['{"id":1}\0']);
  expect(got).toEqual(['{"a":1}', '{"b":2}', '{"c":3}']);
});

test("a message over many chunks comes whole, a character split between chunks too", () => {
  const input = new EventEmitter();
  const t = pipeTransport({ write: () => {}, end: () => {} }, input as never);
  const got: string[] = [];
  t.onMessage((m) => got.push(m));
  const bytes = Buffer.from('{"t":"café"}\0');
  for (let i = 0; i < bytes.length; i += 3)
    input.emit("data", bytes.subarray(i, i + 3));
  expect(got).toEqual(['{"t":"café"}']);
});
