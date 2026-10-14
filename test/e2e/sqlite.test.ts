import { Database } from "bun:sqlite";
import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ready, runInPty, statusRow } from "./pty";

const MAIN = join(import.meta.dir, "../../src/app/main.ts");

let root = "";

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "so-sqlite-e2e-"));
  const db = new Database(join(root, "app.db"));
  db.run(
    "CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL, meta TEXT)",
  );
  db.run(
    `INSERT INTO users (email, meta) VALUES ('a@x.dev', '{"plan":"pro"}'), ('b@x.dev', NULL), ('c@x.dev', '')`,
  );
  db.close();
  await writeFile(join(root, "junk.db"), "this is not a database");
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

test("a database shows its first table, its schema, a value, and a query", async () => {
  const r = await runInPty([process.execPath, MAIN, join(root, "app.db")], {
    async script(p) {
      await ready(p);
      await p.waitFor(() => p.screen().includes("rows 1–3 of 3"), 10_000);
      expect(p.screen()).toContain("app.db › users");
      expect(p.screen()).toContain("a@x.dev");
      expect(p.screen()).toContain("NULL");
      expect(statusRow(p)).toContain("DB");
      expect(statusRow(p)).toContain("row 1/3");

      p.type("\t");
      await p.waitFor(() => p.screen().includes("Columns (3)"));
      expect(p.screen()).toContain("CREATE TABLE users");
      p.type("\t");
      await p.waitFor(() => p.screen().includes("rows 1–3 of 3"));

      p.type("ll\r");
      await p.waitFor(() => p.screen().includes("JSON, 14 chars"));
      expect(p.screen()).toContain('"plan": "pro"');
      p.type("q");
      await p.waitFor(() => p.screen().includes("rows 1–3 of 3"));

      // The dialog checks the query as it is typed; Enter waits for a fix.
      p.type("s");
      await p.waitFor(() => p.screen().includes("Query · app.db"));
      p.type("select emial from users");
      await p.waitFor(() => p.screen().includes("✗ no such column: emial"));
      p.type("\r");
      expect(p.screen()).toContain("Query · app.db");
      // Ctrl-U clears it. Longer than the toolbar: the query is cut, and the rows still show.
      p.type(
        `\x15select email from users where id = 2 and email <> '${"x".repeat(200)}'`,
      );
      await p.waitFor(() => p.screen().includes("✓ 1 column: email"));
      p.type("\r");
      await p.waitFor(() => p.screen().includes("rows 1–1 of 1"));
      expect(p.screen()).toContain("app.db › select email from users");
      expect(p.screen()).toContain("b@x.dev");
      expect(p.screen()).not.toContain("a@x.dev");

      p.type("s\x15delete from users");
      await p.waitFor(() => p.screen().includes("✗ Returns no rows"));
      // A pasted query keeps its line break.
      p.type("\x15\x1b[200~select id -- every id\nfrom users\x1b[201~");
      await p.waitFor(() => p.screen().includes("✓ 1 column: id"));
      p.type("\r");
      await p.waitFor(() => p.screen().includes("rows 1–3 of 3"));
      expect(p.screen()).toContain("app.db › select id -- every id from users");
      p.type("\x1b");
      await p.waitFor(() => p.screen().includes("app.db › users"));
      p.type(":q\r");
    },
  });
  expect(r.exitCode).toBe(0);
}, 30_000);

test("a .db file that is not SQLite says so", async () => {
  const r = await runInPty([process.execPath, MAIN, join(root, "junk.db")], {
    async script(p) {
      await ready(p);
      await p.waitFor(
        () => p.screen().includes("junk.db is not a SQLite database."),
        10_000,
      );
      p.type(":q\r");
    },
  });
  expect(r.exitCode).toBe(0);
}, 30_000);
