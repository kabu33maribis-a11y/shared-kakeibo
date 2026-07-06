import { evaluateExpression } from "@/features/expenses/expression";
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
