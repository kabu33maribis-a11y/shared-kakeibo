import type { Expense } from "@/types";

export interface MonthlyTotal {
  yearMonth: string;
  total: number;
  count: number;
}

export function aggregateByMonthForYear(
  expenses: Expense[],
  year: number,
): MonthlyTotal[] {
  const totals = new Map<string, { total: number; count: number }>();

  for (const expense of expenses) {
    if (!expense.date.startsWith(`${year}-`)) {
      continue;
    }
    const yearMonth = expense.date.slice(0, 7);
    const current = totals.get(yearMonth) ?? { total: 0, count: 0 };
    current.total += expense.amount;
    current.count += 1;
    totals.set(yearMonth, current);
  }

  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    const yearMonth = `${year}-${month}`;
    const data = totals.get(yearMonth) ?? { total: 0, count: 0 };
    return { yearMonth, ...data };
  });
}

export function getAvailableYears(
  expenses: Expense[],
  now = new Date(),
): number[] {
  const years = new Set(
    expenses
      .map((expense) => Number(expense.date.slice(0, 4)))
      .filter((year) => Number.isFinite(year) && year > 0),
  );
  years.add(now.getFullYear());
  return Array.from(years).sort((a, b) => b - a);
}

export function formatShortMonthLabel(yearMonth: string): string {
  const month = Number(yearMonth.slice(5, 7));
  return `${month}月`;
}

export function formatCompactYen(amount: number): string {
  if (amount >= 10_000) {
    const man = amount / 10_000;
    const formatted =
      man >= 10 ? man.toFixed(0) : man.toFixed(man % 1 === 0 ? 0 : 1);
    return `${formatted}万`;
  }
  return amount.toLocaleString("ja-JP");
}
