import { expect, test } from "bun:test";
import { oneStatement, pageable, quoteIdent } from "./statement";

test("one statement keeps its text without the trailing semicolon", () => {
  expect(oneStatement("select 1")).toEqual({ sql: "select 1" });
  expect(oneStatement("  select 1 ;  \n")).toEqual({ sql: "select 1" });
});

test("a second statement is refused", () => {
  expect(oneStatement("select 1; select 2")).toEqual({
    error: "Run one statement at a time",
  });
  expect(oneStatement("select 1;;")).toEqual({ sql: "select 1" });
});

test("semicolons in quotes and comments do not end the statement", () => {
  for (const sql of [
    "select ';' as a",
    'select 1 as ";"',
    "select [a;b] from t",
    "select `a;b` from t",
    "select 1 -- ; trailing\n",
    "select /* ; */ 1",
    "select 'it''s; fine'",
  ])
    expect(oneStatement(sql)).toEqual({ sql: sql.trim() });
});

test("nothing to run", () => {
  expect(oneStatement(" ; ")).toEqual({ error: "Nothing to run" });
  expect(oneStatement("")).toEqual({ error: "Nothing to run" });
});

test("only row-returning queries are read a page at a time", () => {
  expect(pageable("SELECT * FROM t")).toBe(true);
  expect(pageable("with x as (select 1) select * from x")).toBe(true);
  expect(pageable("values (1), (2)")).toBe(true);
  expect(pageable("-- note\n/* x */ select 1")).toBe(true);
  expect(pageable("pragma table_info(t)")).toBe(false);
  expect(pageable("explain query plan select 1")).toBe(false);
  expect(pageable("selected")).toBe(false);
});

test("identifiers are quoted with doubled quotes", () => {
  expect(quoteIdent('a"b')).toBe('"a""b"');
});
