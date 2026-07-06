import {
  type Expense,
  type MemberKey,
  type SettlementResult,
} from "@/types";

export function filterConfirmedExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((expense) => !expense.isPending);
}

export function filterByMonth(expenses: Expense[], yearMonth: string): Expense[] {
  return expenses.filter((expense) => expense.date.startsWith(yearMonth));
}

export function sumByMember(expenses: Expense[], member: MemberKey): number {
  return expenses
    .filter((expense) => expense.paidBy === member)
    .reduce((sum, expense) => sum + expense.amount, 0);
}

export function countPending(expenses: Expense[]): number {
  return expenses.filter((expense) => expense.isPending).length;
}

export function calculateSettlement(
  expenses: Expense[],
  yearMonth: string,
): SettlementResult {
  const monthlyConfirmed = filterConfirmedExpenses(
    filterByMonth(expenses, yearMonth),
  );

  const totalMember1 = sumByMember(monthlyConfirmed, "member1");
  const totalMember2 = sumByMember(monthlyConfirmed, "member2");
  const totalAll = totalMember1 + totalMember2;
  const target = Math.floor(totalAll / 2);

  if (totalMember1 > target) {
    return {
      totalMember1,
      totalMember2,
      totalAll,
      target,
      amount: Math.floor(totalMember1 - target),
      from: "member2",
      to: "member1",
    };
  }

  if (totalMember2 > target) {
    return {
      totalMember1,
      totalMember2,
      totalAll,
      target,
      amount: Math.floor(totalMember2 - target),
      from: "member1",
      to: "member2",
    };
  }

  return {
    totalMember1,
    totalMember2,
    totalAll,
    target,
    amount: 0,
    from: null,
    to: null,
  };
}

export function formatSettlementMessage(
  result: SettlementResult,
  labels: Record<MemberKey, string>,
): string {
  if (result.amount <= 0 || !result.from || !result.to) {
    return "精算は不要です";
  }

  return `${labels[result.from]} から ${labels[result.to]} へ ${result.amount.toLocaleString("ja-JP")}円 の支払いが必要です`;
}

export function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${Number(month)}月分（${year}年）`;
}

export function getAvailableMonths(expenses: Expense[]): string[] {
  const months = new Set(expenses.map((expense) => expense.date.slice(0, 7)));
  return Array.from(months).sort((a, b) => b.localeCompare(a));
}
