/** One message Chrome sent that is not the answer to a call. */
export type CdpEvent = {
  method: string;
  params: Record<string, unknown>;
  sessionId?: string;
};

/**
 * A DevTools Protocol connection: `send` resolves with the call's result or
 * rejects with Chrome's error message; once the connection closes, every
 * call still waiting and every later one rejects with the close reason.
 */
export type Cdp = {
  send<T = Record<string, unknown>>(
    method: string,
    params?: Record<string, unknown>,
    sessionId?: string,
  ): Promise<T>;
  /** Follow events; the returned function stops following. */
  on(listener: (e: CdpEvent) => void): () => void;
  close(reason?: string): void;
  /** Resolves with the reason once the connection is closed. */
  closed: Promise<string>;
};

/** How messages travel: whole JSON texts out, whole JSON texts in. */
export type CdpTransport = {
  write(message: string): void;
  onMessage(cb: (message: string) => void): void;
  onClose(cb: (reason: string) => void): void;
  close(): void;
};

type Pending = {
  resolve: (v: Record<string, unknown>) => void;
  reject: (e: Error) => void;
};

export function createCdp(t: CdpTransport): Cdp {
  let next = 0;
  let closedWith: string | undefined;
  const pending = new Map<number, Pending>();
  const listeners = new Set<(e: CdpEvent) => void>();
  let settle: (reason: string) => void = () => {};
  const closed = new Promise<string>((resolve) => {
    settle = resolve;
  });
  const finish = (reason: string) => {
    if (closedWith !== undefined) return;
    closedWith = reason;
    for (const p of pending.values()) p.reject(new Error(reason));
    pending.clear();
    listeners.clear();
    settle(reason);
  };
  t.onMessage((text) => {
    let m: {
      id?: number;
      result?: Record<string, unknown>;
      error?: { message?: string };
      method?: string;
      params?: Record<string, unknown>;
      sessionId?: string;
    };
    try {
      m = JSON.parse(text);
    } catch {
      return;
    }
    if (typeof m.id === "number") {
      const p = pending.get(m.id);
      if (p === undefined) return;
      pending.delete(m.id);
      if (m.error !== undefined)
        p.reject(new Error(m.error.message ?? "DevTools error"));
      else p.resolve(m.result ?? {});
      return;
    }
    if (typeof m.method !== "string") return;
    const e: CdpEvent =
      m.sessionId === undefined
        ? { method: m.method, params: m.params ?? {} }
        : { method: m.method, params: m.params ?? {}, sessionId: m.sessionId };
    for (const l of listeners) l(e);
  });
  t.onClose(finish);
  return {
    send<T>(
      method: string,
      params: Record<string, unknown> = {},
      sessionId?: string,
    ) {
      if (closedWith !== undefined)
        return Promise.reject(new Error(closedWith));
      const id = ++next;
      const message = JSON.stringify(
        sessionId === undefined
          ? { id, method, params }
          : { id, method, params, sessionId },
      );
      return new Promise<T>((resolve, reject) => {
        pending.set(id, {
          resolve: resolve as (v: Record<string, unknown>) => void,
          reject,
        });
        try {
          t.write(message);
        } catch (err) {
          pending.delete(id);
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
    },
    on(listener) {
      if (closedWith !== undefined) return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close(reason = "closed") {
      finish(reason);
      t.close();
    },
    closed,
  };
}

/**
 * Chrome's `--remote-debugging-pipe` framing: each message is one JSON text
 * followed by a NUL byte, written to the browser's fd 3 and read from its fd 4.
 */
export function pipeTransport(
  out: { write(chunk: string): unknown; end(): unknown },
  input: {
    on(event: "data", cb: (chunk: Buffer) => void): unknown;
    on(event: "close", cb: () => void): unknown;
  },
): CdpTransport {
  let onMessage: (m: string) => void = () => {};
  let onClose: (r: string) => void = () => {};
  // A frame is a message of a megabyte or more in many chunks: each chunk is
  // searched once and the parts joined once, at the message's end.
  let parts: Buffer[] = [];
  input.on("data", (chunk) => {
    let rest = chunk;
    let at = rest.indexOf(0);
    while (at >= 0) {
      parts.push(rest.subarray(0, at));
      const text = Buffer.concat(parts).toString("utf8");
      parts = [];
      rest = rest.subarray(at + 1);
      onMessage(text);
      at = rest.indexOf(0);
    }
    if (rest.length > 0) parts.push(rest);
  });
  input.on("close", () => onClose("Chrome closed the connection"));
  return {
    write: (m) => {
      out.write(`${m}\0`);
    },
    onMessage: (cb) => {
      onMessage = cb;
    },
    onClose: (cb) => {
      onClose = cb;
    },
    close: () => {
      out.end();
    },
  };
}
