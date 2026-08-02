import {
  CATEGORY_META,
  type Expense,
  type MemberKey,
} from "@/types";
import { filterByMonth } from "./settlement";

const CSV_HEADERS = [
  "日付",
  "カテゴリ",
  "品目",
  "金額",
  "支払者",
  "メモ",
] as const;

export function escapeCsvField(value: string | number): string {
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function buildMonthlyExpensesCsv(
  expenses: Expense[],
  yearMonth: string,
  memberLabels: Record<MemberKey, string>,
): string {
  const monthly = filterByMonth(expenses, yearMonth)
    .slice()
    .sort((a, b) => {
      if (a.date === b.date) {
        return a.title.localeCompare(b.title, "ja");
      }
      return a.date.localeCompare(b.date);
    });

  const rows = monthly.map((expense) =>
    [
      expense.date,
      CATEGORY_META[expense.category]?.label ?? expense.category,
      expense.title,
      expense.amount,
      memberLabels[expense.paidBy],
      expense.note ?? "",
    ]
      .map(escapeCsvField)
      .join(","),
  );

  return [CSV_HEADERS.join(","), ...rows].join("\r\n");
}

export function buildMonthlyCsvFilename(yearMonth: string): string {
  return `家計簿_${yearMonth}.csv`;
}

/** Excel で文字化けしないよう UTF-8 BOM 付きでダウンロードする */
export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
