import {
  type Expense,
  type MemberKey,
  type SettlementResult,
} from "@/types";

export function filterByMonth(expenses: Expense[], yearMonth: string): Expense[] {
  return expenses.filter((expense) => expense.date.startsWith(yearMonth));
}

export function sumByMember(expenses: Expense[], member: MemberKey): number {
  return expenses
    .filter((expense) => expense.paidBy === member)
    .reduce((sum, expense) => sum + expense.amount, 0);
}

export function calculateSettlement(
  expenses: Expense[],
  yearMonth: string,
): SettlementResult {
  const monthly = filterByMonth(expenses, yearMonth);

  const totalMember1 = sumByMember(monthly, "member1");
  const totalMember2 = sumByMember(monthly, "member2");
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

export function shiftYearMonth(yearMonth: string, delta: number): string {
  const [yearText, monthText] = yearMonth.split("-");
  const date = new Date(Number(yearText), Number(monthText) - 1 + delta, 1);
  return formatYearMonth(date);
}

/** Selected month の保存日。当月なら今日、それ以外は月初。 */
export function dateStringForYearMonth(yearMonth: string, now = new Date()): string {
  if (yearMonth === formatYearMonth(now)) {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return `${yearMonth}-01`;
}

/** 日付の日を保ったまま別の年月へ移す。末日を超える場合は月末に丸める。 */
export function moveDateToYearMonth(date: string, targetYearMonth: string): string {
  const day = Number(date.slice(8, 10));
  if (!Number.isFinite(day) || day < 1) {
    return `${targetYearMonth}-01`;
  }

  const [yearText, monthText] = targetYearMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const lastDay = new Date(year, month, 0).getDate();
  const clampedDay = Math.min(day, lastDay);

  return `${targetYearMonth}-${String(clampedDay).padStart(2, "0")}`;
}

export function getAvailableMonths(expenses: Expense[]): string[] {
  const months = new Set(expenses.map((expense) => expense.date.slice(0, 7)));
  return Array.from(months).sort((a, b) => b.localeCompare(a));
}
