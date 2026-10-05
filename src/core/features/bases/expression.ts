import type { BaseDiagnostic } from "./types";

export type ExpressionContext = {
  readonly note: Readonly<Record<string, unknown>>;
  readonly file: Readonly<Record<string, unknown>> & {
    readonly folder?: string;
    readonly tags?: readonly string[];
  };
  readonly formula?: Readonly<Record<string, unknown>>;
};

type ExpressionResult = {
  readonly value: unknown;
  readonly diagnostics: readonly BaseDiagnostic[];
};

type Token =
  | { readonly type: "number"; readonly value: number }
  | { readonly type: "string"; readonly value: string }
  | { readonly type: "identifier"; readonly value: string }
  | { readonly type: "operator"; readonly value: string }
  | { readonly type: "punctuation"; readonly value: "(" | ")" | "." | "," }
  | { readonly type: "eof" };

type FileMethod = "hasTag" | "inFolder" | "hasProperty";

const blockedIdentifiers = new Set([
  "process",
  "globalThis",
  "window",
  "document",
  "Function",
  "eval",
  "import",
]);

export function evaluateExpression(
  expression: string,
  context: ExpressionContext,
): ExpressionResult {
  try {
    const parser = new ExpressionParser(tokenize(expression), context);
    return { value: parser.parse(), diagnostics: [] };
  } catch (error) {
    return {
      value: null,
      diagnostics: [
        {
          severity: "warning",
          code: "unsupported_expression",
          message:
            error instanceof Error ? error.message : "Unsupported expression",
        },
      ],
    };
  }
}

class ExpressionParser {
  private index = 0;

  constructor(
    private readonly tokens: readonly Token[],
    private readonly context: ExpressionContext,
  ) {}

  parse(): unknown {
    const value = this.parseOr();
    this.expect("eof");
    return value;
  }

  private parseOr(): unknown {
    let value = this.parseAnd();
    while (this.matchOperator("||")) {
      const right = this.parseAnd();
      value = Boolean(value) || Boolean(right);
    }
    return value;
  }

  private parseAnd(): unknown {
    let value = this.parseComparison();
    while (this.matchOperator("&&")) {
      const right = this.parseComparison();
      value = Boolean(value) && Boolean(right);
    }
    return value;
  }

  private parseComparison(): unknown {
    let value = this.parseAddition();
    while (true) {
      const operator = this.matchAnyOperator([
        "==",
        "!=",
        ">=",
        "<=",
        ">",
        "<",
      ]);
      if (operator === undefined) {
        return value;
      }
      const right = this.parseAddition();
      value = compareValues(value, operator, right);
    }
  }

  private parseAddition(): unknown {
    let value = this.parseMultiplication();
    while (true) {
      const operator = this.matchAnyOperator(["+", "-"]);
      if (operator === undefined) {
        return value;
      }
      value = applyArithmetic(value, operator, this.parseMultiplication());
    }
  }

  private parseMultiplication(): unknown {
    let value = this.parseUnary();
    while (true) {
      const operator = this.matchAnyOperator(["*", "/", "%"]);
      if (operator === undefined) {
        return value;
      }
      value = applyArithmetic(value, operator, this.parseUnary());
    }
  }

  private parseUnary(): unknown {
    if (this.matchOperator("!")) {
      return !this.parseUnary();
    }
    if (this.matchOperator("-")) {
      return -toNumber(this.parseUnary());
    }
    return this.parsePrimary();
  }

  private parsePrimary(): unknown {
    const token = this.advance();
    if (token.type === "number" || token.type === "string") {
      return token.value;
    }
    if (token.type === "identifier") {
      return this.parseIdentifier(token.value);
    }
    if (token.type === "punctuation" && token.value === "(") {
      const value = this.parseOr();
      this.expectPunctuation(")");
      return value;
    }
    throw new Error("Unsupported expression syntax");
  }

  private parseIdentifier(identifier: string): unknown {
    if (blockedIdentifiers.has(identifier)) {
      throw new Error(`Unsupported identifier: ${identifier}`);
    }
    if (identifier === "true") return true;
    if (identifier === "false") return false;
    if (identifier === "null") return null;

    if (this.matchPunctuation(".")) {
      const property = this.expectIdentifier();
      if (this.matchPunctuation("(")) {
        return this.callMethod(identifier, property);
      }
      return this.resolveScopedProperty(identifier, property);
    }

    return this.context.note[identifier];
  }

  private callMethod(scope: string, method: string): unknown {
    if (scope !== "file" || !isFileMethod(method)) {
      throw new Error(`Unsupported function: ${scope}.${method}`);
    }
    const args = this.parseArguments();
    const firstArg = args[0];
    if (method === "hasTag") {
      const tags = (this.context.file.tags ?? []).map(normalizeTag);
      return args.some((arg) => {
        const tag = normalizeTag(String(arg));
        return tags.some((t) => t === tag || t.startsWith(`${tag}/`));
      });
    }
    if (method === "inFolder") {
      const folder = this.context.file.folder ?? "";
      const target = String(firstArg).replace(/\/+$/, "");
      return folder === target || folder.startsWith(`${target}/`);
    }
    return Object.hasOwn(this.context.note, String(firstArg));
  }

  private parseArguments(): unknown[] {
    const args: unknown[] = [];
    if (this.matchPunctuation(")")) {
      return args;
    }
    do {
      args.push(this.parseOr());
    } while (this.matchPunctuation(","));
    this.expectPunctuation(")");
    return args;
  }

  private resolveScopedProperty(scope: string, property: string): unknown {
    if (blockedIdentifiers.has(property)) {
      throw new Error(`Unsupported identifier: ${property}`);
    }
    if (scope === "note") return this.context.note[property];
    if (scope === "file") return this.context.file[property];
    if (scope === "formula") return this.context.formula?.[property];
    throw new Error(`Unsupported scope: ${scope}`);
  }

  private matchAnyOperator(operators: readonly string[]): string | undefined {
    const token = this.peek();
    if (token.type === "operator" && operators.includes(token.value)) {
      this.index += 1;
      return token.value;
    }
    return undefined;
  }

  private matchOperator(operator: string): boolean {
    return this.matchAnyOperator([operator]) !== undefined;
  }

  private matchPunctuation(value: "(" | ")" | "." | ","): boolean {
    const token = this.peek();
    if (token.type === "punctuation" && token.value === value) {
      this.index += 1;
      return true;
    }
    return false;
  }

  private expectIdentifier(): string {
    const token = this.advance();
    if (token.type !== "identifier") {
      throw new Error("Expected identifier");
    }
    if (blockedIdentifiers.has(token.value)) {
      throw new Error(`Unsupported identifier: ${token.value}`);
    }
    return token.value;
  }

  private expectPunctuation(value: "(" | ")" | "." | ","): void {
    if (!this.matchPunctuation(value)) {
      throw new Error(`Expected ${value}`);
    }
  }

  private expect(type: Token["type"]): void {
    if (this.peek().type !== type) {
      throw new Error("Unexpected expression input");
    }
  }

  private advance(): Token {
    const token = this.tokens[this.index];
    if (token === undefined) {
      return { type: "eof" };
    }
    this.index += 1;
    return token;
  }

  private peek(): Token {
    return this.tokens[this.index] ?? { type: "eof" };
  }
}

function tokenize(expression: string): readonly Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const character = expression[index];
    if (character === undefined) break;
    if (/\s/.test(character)) {
      index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      const result = readString(expression, index, character);
      tokens.push({ type: "string", value: result.value });
      index = result.next;
      continue;
    }
    if (/\d/.test(character)) {
      const result = readNumber(expression, index);
      tokens.push({ type: "number", value: result.value });
      index = result.next;
      continue;
    }
    if (/[A-Za-z_]/.test(character)) {
      const result = readIdentifier(expression, index);
      tokens.push({ type: "identifier", value: result.value });
      index = result.next;
      continue;
    }
    const twoCharacter = expression.slice(index, index + 2);
    if (["&&", "||", "==", "!=", ">=", "<="].includes(twoCharacter)) {
      tokens.push({ type: "operator", value: twoCharacter });
      index += 2;
      continue;
    }
    if (["+", "-", "*", "/", "%", ">", "<", "!"].includes(character)) {
      tokens.push({ type: "operator", value: character });
      index += 1;
      continue;
    }
    if (["(", ")", ".", ","].includes(character)) {
      tokens.push({
        type: "punctuation",
        value: character as "(" | ")" | "." | ",",
      });
      index += 1;
      continue;
    }
    throw new Error(`Unsupported token: ${character}`);
  }

  return [...tokens, { type: "eof" }];
}

/** A string literal closed by the quote that opened it; there are no escapes. */
function readString(
  source: string,
  start: number,
  quote: string,
): { value: string; next: number } {
  let value = "";
  let index = start + 1;
  while (index < source.length) {
    const character = source[index];
    if (character === undefined) break;
    if (character === quote) {
      return { value, next: index + 1 };
    }
    value += character;
    index += 1;
  }
  throw new Error("Unterminated string literal");
}

function readNumber(
  source: string,
  start: number,
): { value: number; next: number } {
  let index = start;
  while (/\d|\./.test(source[index] ?? "")) {
    index += 1;
  }
  return { value: Number(source.slice(start, index)), next: index };
}

function readIdentifier(
  source: string,
  start: number,
): { value: string; next: number } {
  let index = start;
  while (/[A-Za-z0-9_]/.test(source[index] ?? "")) {
    index += 1;
  }
  return { value: source.slice(start, index), next: index };
}

function compareValues(
  left: unknown,
  operator: string,
  right: unknown,
): boolean {
  if (operator === "==") return left === right;
  if (operator === "!=") return left !== right;
  const leftNumber = toNumber(left);
  const rightNumber = toNumber(right);
  if (operator === ">=") return leftNumber >= rightNumber;
  if (operator === "<=") return leftNumber <= rightNumber;
  if (operator === ">") return leftNumber > rightNumber;
  return leftNumber < rightNumber;
}

function applyArithmetic(
  left: unknown,
  operator: string,
  right: unknown,
): number {
  const leftNumber = toNumber(left);
  const rightNumber = toNumber(right);
  if (operator === "+") return leftNumber + rightNumber;
  if (operator === "-") return leftNumber - rightNumber;
  if (operator === "*") return leftNumber * rightNumber;
  if (operator === "/") return leftNumber / rightNumber;
  return leftNumber % rightNumber;
}

function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

/** Tags compare without "#" and without case, as Obsidian's do. */
const normalizeTag = (tag: string) => tag.replace(/^#/, "").toLowerCase();

function isFileMethod(method: string): method is FileMethod {
  return (
    method === "hasTag" || method === "inFolder" || method === "hasProperty"
  );
}
