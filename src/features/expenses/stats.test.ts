import { describe, expect, it } from "vitest";
import type { Expense } from "@/types";
import {
  aggregateByMonthForYear,
  formatCompactYen,
  formatShortMonthLabel,
  getAvailableYears,
} from "./stats";

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

describe("stats", () => {
  it("aggregates monthly totals for a year including empty months", () => {
    const expenses = [
      createExpense({ date: "2025-01-05", amount: 1000 }),
      createExpense({ id: "2", date: "2025-01-20", amount: 500 }),
      createExpense({ id: "3", date: "2025-03-01", amount: 2000 }),
      createExpense({ id: "4", date: "2024-12-01", amount: 9999 }),
    ];

    const result = aggregateByMonthForYear(expenses, 2025);

    expect(result).toHaveLength(12);
    expect(result[0]).toEqual({
      yearMonth: "2025-01",
      total: 1500,
      count: 2,
    });
    expect(result[1]).toEqual({
      yearMonth: "2025-02",
      total: 0,
      count: 0,
    });
    expect(result[2]).toEqual({
      yearMonth: "2025-03",
      total: 2000,
      count: 1,
    });
  });

  it("lists available years with current year always included", () => {
    const expenses = [
      createExpense({ date: "2024-01-01" }),
      createExpense({ id: "2", date: "2025-06-01" }),
    ];

    expect(getAvailableYears(expenses, new Date(2026, 0, 1))).toEqual([
      2026, 2025, 2024,
    ]);
  });

  it("formats short month labels and compact yen", () => {
    expect(formatShortMonthLabel("2025-05")).toBe("5月");
    expect(formatCompactYen(0)).toBe("0");
    expect(formatCompactYen(3500)).toBe("3,500");
    expect(formatCompactYen(12000)).toBe("1.2万");
    expect(formatCompactYen(100000)).toBe("10万");
  });
});
