import { Database } from "bun:sqlite";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Profile } from "../profile";

const ROWS = 100_000;

/** `shop.db`: customers, orders, a view, JSON, BLOBs, NULLs, and 64-bit ids. */
function stageShop(path: string): void {
  const db = new Database(path);
  db.run("PRAGMA journal_mode = WAL");
  db.run(`CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  plan TEXT DEFAULT 'free',
  meta TEXT,
  avatar BLOB,
  external_id INTEGER
)`);
  db.run(`CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers (id),
  total REAL NOT NULL,
  note TEXT,
  placed_at TEXT NOT NULL
)`);
  db.run("CREATE INDEX orders_customer ON orders (customer_id)");
  db.run(`CREATE VIEW big_spenders AS
  SELECT c.email, sum(o.total) AS spent, count(*) AS orders
  FROM customers c JOIN orders o ON o.customer_id = c.id
  GROUP BY c.id HAVING spent > 2000`);
  db.run("CREATE TABLE settings (key TEXT PRIMARY KEY, value) WITHOUT ROWID");
  const customer = db.prepare(
    "INSERT INTO customers (email, name, plan, meta, avatar, external_id) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const order = db.prepare(
    "INSERT INTO orders (customer_id, total, note, placed_at) VALUES (?, ?, ?, ?)",
  );
  db.transaction(() => {
    for (let i = 1; i <= 500; i++)
      customer.run(
        `user${i}@example.com`,
        i % 7 === 0 ? null : `User ${i}`,
        ["free", "pro", "team"][i % 3] ?? "free",
        i % 5 === 0 ? JSON.stringify({ tags: ["vip"], seats: i % 9 }) : "",
        i % 11 === 0 ? new Uint8Array([0x89, 0x50, 0x4e, 0x47, i % 256]) : null,
        9007199254740993n + BigInt(i),
      );
    for (let i = 1; i <= ROWS; i++)
      order.run(
        (i % 500) + 1,
        Math.round(((i * 37) % 10_000) + 0.99) / 100,
        i % 13 === 0 ? "gift wrap\nleave at the door" : null,
        `2026-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
      );
  })();
  db.run(
    `INSERT INTO settings VALUES ('theme', 'dark'), ('limits', '{"orders": 100}')`,
  );
  db.close();
}

export const sqlite: Profile = {
  name: "sqlite",
  summary: "SQLite: tables, a view, a schema, values, and the query dialog",
  journeys: [
    {
      title: "Browse",
      steps: [
        "Open shop.db; press t and pick orders; hold j, then G",
        "Press H/L, then > and < on a column; drag a header edge",
      ],
      expect: [
        "customers shows first with NULL dim and BLOBs as ‹blob 5 B›",
        "orders pages without a stall; the statusline counts row N/100,000",
        "Columns scroll after the pinned id column; widths change",
      ],
    },
    {
      title: "Schema and values",
      steps: [
        "On customers press Tab; Tab again",
        "Focus a meta cell with JSON and press Enter; press y; press q",
      ],
      expect: [
        "The schema lists columns, the unique index, and the CREATE TABLE",
        "The value shows indented JSON; y copies it",
      ],
    },
    {
      title: "Queries",
      steps: [
        "Press s; type select plan, count(*) from custo, press Tab, then type group by plan",
        "Make it select plnn: wait for the check, then press Enter",
        "Fix it and press Enter; press Esc",
        "Press s, Ctrl-U, type delete from customers",
        "Press s, Ctrl-U, then ↑ twice",
      ],
      expect: [
        "Tab writes customers; the dialog shows ✓ 2 columns: plan, count(*)",
        "✗ no such column: plnn shows and Enter keeps the dialog open",
        "Three rows, one per plan; Esc returns to customers",
        "✗ Returns no rows: only reading statements run here",
        "↑ brings back the earlier queries",
      ],
    },
    {
      title: "Not a database",
      steps: ["Open Thumbs.db"],
      expect: ["It says Thumbs.db is not a SQLite database"],
    },
  ],
  stage(vault) {
    stageShop(join(vault, "shop.db"));
    writeFileSync(join(vault, "Thumbs.db"), "not a database");
    writeFileSync(
      join(vault, "README.md"),
      "# SQLite\n\nOpen `shop.db` from the explorer.\n",
    );
  },
};
