import { evaluateExpression, parseAmountInput } from "@/features/expenses/expression";
import { describe, expect, it } from "vitest";

describe("evaluateExpression", () => {
  it("evaluates subtraction", () => {
    expect(evaluateExpression("10000-2439")).toBe(7561);
  });

  it("evaluates chained operations", () => {
    expect(evaluateExpression("1000+500*2")).toBe(2000);
  });

  it("rejects invalid characters", () => {
    expect(() => evaluateExpression("alert(1)")).toThrow();
  });
});

describe("parseAmountInput", () => {
  it("parses plain numbers", () => {
    expect(parseAmountInput("1236")).toBe(1236);
  });

  it("strips currency symbols and commas", () => {
    expect(parseAmountInput("¥1,236")).toBe(1236);
    expect(parseAmountInput("1,236円")).toBe(1236);
  });

  it("parses full-width digits", () => {
    expect(parseAmountInput("１２３６")).toBe(1236);
  });

  it("evaluates expressions after normalizing", () => {
    expect(parseAmountInput("10000 - 2,439")).toBe(7561);
  });
});
