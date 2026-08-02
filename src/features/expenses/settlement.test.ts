import { describe, expect, it } from "vitest";
import type { Expense, MemberKey } from "@/types";
import {
  calculateSettlement,
  dateStringForYearMonth,
  filterByMonth,
  formatSettlementMessage,
  shiftYearMonth,
} from "./settlement";

function createExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "expense-1",
    date: "2025-05-10",
    category: "food",
    title: "テスト",
    amount: 1000,
    paidBy: "member1",
    createdAt: {} as Expense["createdAt"],
    ...overrides,
  };
}

describe("settlement", () => {
  const labels: Record<MemberKey, string> = {
    member1: "たろう",
    member2: "はなこ",
  };

  it("filters expenses by month", () => {
    const expenses = [
      createExpense({ date: "2025-05-10" }),
      createExpense({ id: "expense-2", date: "2025-06-01" }),
    ];

    expect(filterByMonth(expenses, "2025-05")).toHaveLength(1);
  });

  it("calculates member2 to member1 settlement when member1 overpaid", () => {
    const expenses = [
      createExpense({ paidBy: "member1", amount: 239262 }),
      createExpense({ id: "expense-2", paidBy: "member2", amount: 137341 }),
    ];

    const result = calculateSettlement(expenses, "2025-05");

    expect(result.totalAll).toBe(376603);
    expect(result.target).toBe(188301);
    expect(result.amount).toBe(50961);
    expect(result.from).toBe("member2");
    expect(result.to).toBe("member1");
    expect(formatSettlementMessage(result, labels)).toBe(
      "はなこ から たろう へ 50,961円 の支払いが必要です",
    );
  });

  it("calculates member1 to member2 settlement when member2 overpaid", () => {
    const expenses = [
      createExpense({ paidBy: "member1", amount: 10000 }),
      createExpense({ id: "expense-2", paidBy: "member2", amount: 30000 }),
    ];

    const result = calculateSettlement(expenses, "2025-05");

    expect(result.amount).toBe(10000);
    expect(result.from).toBe("member1");
    expect(result.to).toBe("member2");
  });

  it("returns zero settlement when balanced", () => {
    const expenses = [
      createExpense({ paidBy: "member1", amount: 5000 }),
      createExpense({ id: "expense-2", paidBy: "member2", amount: 5000 }),
    ];

    const result = calculateSettlement(expenses, "2025-05");

    expect(result.amount).toBe(0);
    expect(result.from).toBeNull();
    expect(formatSettlementMessage(result, labels)).toContain("精算は不要");
  });

  it("shifts year-month across year boundaries", () => {
    expect(shiftYearMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftYearMonth("2025-12", 1)).toBe("2026-01");
  });

  it("uses today for current month and first day otherwise", () => {
    const now = new Date(2026, 6, 15);
    expect(dateStringForYearMonth("2026-07", now)).toBe("2026-07-15");
    expect(dateStringForYearMonth("2026-06", now)).toBe("2026-06-01");
  });
});
