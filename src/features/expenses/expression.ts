const ALLOWED_PATTERN = /^[\d+\-*/().\s]+$/;

export function evaluateExpression(expression: string): number {
  const normalized = expression.replace(/\s/g, "");
  if (!normalized || !ALLOWED_PATTERN.test(normalized)) {
    throw new Error("使用できない文字が含まれています");
  }

  const tokens = tokenize(normalized);
  let index = 0;

  function parseExpression(): number {
    let value = parseTerm();

    while (index < tokens.length && (tokens[index] === "+" || tokens[index] === "-")) {
      const operator = tokens[index];
      index += 1;
      const right = parseTerm();
      value = operator === "+" ? value + right : value - right;
    }

    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();

    while (index < tokens.length && (tokens[index] === "*" || tokens[index] === "/")) {
      const operator = tokens[index];
      index += 1;
      const right = parseFactor();
      if (operator === "/" && right === 0) {
        throw new Error("0で割ることはできません");
      }
      value = operator === "*" ? value * right : value / right;
    }

    return value;
  }

  function parseFactor(): number {
    const token = tokens[index];

    if (token === "(") {
      index += 1;
      const value = parseExpression();
      if (tokens[index] !== ")") {
        throw new Error("括弧が閉じられていません");
      }
      index += 1;
      return value;
    }

    if (token === "-") {
      index += 1;
      return -parseFactor();
    }

    if (!token || Number.isNaN(Number(token))) {
      throw new Error("数式が不正です");
    }

    index += 1;
    return Number(token);
  }

  const result = parseExpression();
  if (index !== tokens.length) {
    throw new Error("数式が不正です");
  }

  if (!Number.isFinite(result)) {
    throw new Error("計算結果が不正です");
  }

  return Math.round(result);
}

function tokenize(expression: string): string[] {
  const tokens: string[] = [];
  let current = "";

  for (const char of expression) {
    if ("+-*/()".includes(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      tokens.push(char);
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}
