import type { Store } from "../core/state/store";
import type { Action } from "../core/state/types";
import { type PreviewServer, startPreviewServer } from "../preview/server";
import type { Logger } from "../workspace/log";

/** The app's one preview server: started and stopped by effects, stopped on exit. `stop` resolves once pages are told. */
export type PreviewHost = { start(): void; stop(): Promise<void> };

/**
 * Own at most one preview server and report its start as an action. Logs
 * carry the port or the failure reason, never note text.
 */
export function createPreviewHost(d: {
  root: string;
  store: () => Store;
  isExcluded: (rel: string) => boolean;
  dispatch: (a: Action) => void;
  logger: Logger;
}): PreviewHost {
  let server: PreviewServer | undefined;
  return {
    start() {
      if (server !== undefined) {
        d.dispatch({
          type: "previewStarted",
          port: server.port,
          token: server.token,
        });
        return;
      }
      try {
        server = startPreviewServer({
          root: d.root,
          store: d.store(),
          isExcluded: d.isExcluded,
        });
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        d.logger.error("preview.failed", { reason });
        d.dispatch({ type: "previewFailed", reason });
        return;
      }
      d.logger.info("preview.started", { port: server.port });
      d.dispatch({
        type: "previewStarted",
        port: server.port,
        token: server.token,
      });
    },
    async stop() {
      if (server === undefined) return;
      const { port } = server;
      const stopped = server.stop();
      server = undefined;
      d.logger.info("preview.stopped", { port });
      await stopped;
    },
  };
}
