import { Decimal } from "@/shared/lib/decimal";

type Variables = Readonly<Record<string, Decimal.Value>>;
type Token = { kind: "number" | "identifier" | "operator" | "end"; value: string };

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < expression.length) {
    const rest = expression.slice(index);
    const whitespace = rest.match(/^\s+/);
    if (whitespace) { index += whitespace[0].length; continue; }
    const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
    if (number) { tokens.push({ kind: "number", value: number[0] }); index += number[0].length; continue; }
    const identifier = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identifier) { tokens.push({ kind: "identifier", value: identifier[0] }); index += identifier[0].length; continue; }
    const operator = rest[0];
    if (["+", "-", "*", "/", "(", ")"].includes(operator)) { tokens.push({ kind: "operator", value: operator }); index += 1; continue; }
    throw new Error(`Unsupported character in payroll formula: ${operator}`);
  }
  tokens.push({ kind: "end", value: "" });
  return tokens;
}

/** Evaluates arithmetic expressions with Decimal.js. No eval, JS number arithmetic, or function calls. */
export function evaluatePayrollFormula(expression: string, variables: Variables): Decimal {
  const tokens = tokenize(expression);
  let index = 0;
  const peek = () => tokens[index]!;
  const take = () => tokens[index++]!;
  const parsePrimary = (): Decimal => {
    const token = take();
    if (token.kind === "number") return new Decimal(token.value);
    if (token.kind === "identifier") {
      const value = variables[token.value];
      if (value === undefined) throw new Error(`Unknown payroll formula variable: ${token.value}`);
      return new Decimal(value);
    }
    if (token.value === "(") {
      const value = parseExpression();
      if (take().value !== ")") throw new Error("Unclosed parenthesis in payroll formula.");
      return value;
    }
    throw new Error(`Expected a number, variable, or parenthesis in payroll formula near ${token.value}.`);
  };
  const parseUnary = (): Decimal => {
    if (peek().value === "+") { take(); return parseUnary(); }
    if (peek().value === "-") { take(); return parseUnary().negated(); }
    return parsePrimary();
  };
  const parseTerm = (): Decimal => {
    let value = parseUnary();
    while (peek().value === "*" || peek().value === "/") {
      const operator = take().value;
      const right = parseUnary();
      if (operator === "/" && right.isZero()) throw new Error("Division by zero in payroll formula.");
      value = operator === "*" ? value.mul(right) : value.div(right);
    }
    return value;
  };
  function parseExpression(): Decimal {
    let value = parseTerm();
    while (peek().value === "+" || peek().value === "-") {
      const operator = take().value;
      const right = parseTerm();
      value = operator === "+" ? value.plus(right) : value.minus(right);
    }
    return value;
  }
  const value = parseExpression();
  if (peek().kind !== "end") throw new Error(`Unexpected token in payroll formula: ${peek().value}`);
  return value;
}
