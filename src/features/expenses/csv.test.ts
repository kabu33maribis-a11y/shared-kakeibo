import { describe, expect, it } from "vitest";
import type { Expense, MemberKey } from "@/types";
import {
  buildMonthlyCsvFilename,
  buildMonthlyExpensesCsv,
  escapeCsvField,
} from "./csv";

const labels: Record<MemberKey, string> = {
  member1: "かい",
  member2: "みゆう",
};

function createExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "expense-1",
    date: "2026-03-10",
    category: "food",
    title: "スーパー",
    amount: 1200,
    paidBy: "member1",
    createdAt: {} as Expense["createdAt"],
    ...overrides,
  };
}

describe("escapeCsvField", () => {
  it("quotes fields that contain commas, quotes, or newlines", () => {
    expect(escapeCsvField("普通")).toBe("普通");
    expect(escapeCsvField("a,b")).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField("a\nb")).toBe('"a\nb"');
  });
});

describe("buildMonthlyExpensesCsv", () => {
  it("builds header and rows for the selected month only", () => {
    const expenses = [
      createExpense({
        id: "2",
        date: "2026-03-15",
        title: "ドラッグストア,特売",
        amount: 800,
        paidBy: "member2",
        note: 'メモ"あり"',
      }),
      createExpense({ id: "1", date: "2026-03-10", amount: 1200 }),
      createExpense({
        id: "3",
        date: "2026-02-28",
        title: "先月分",
        amount: 999,
      }),
    ];

    const csv = buildMonthlyExpensesCsv(expenses, "2026-03", labels);

    expect(csv).toBe(
      [
        "日付,カテゴリ,品目,金額,支払者,メモ",
        "2026-03-10,食費,スーパー,1200,かい,",
        '2026-03-15,食費,"ドラッグストア,特売",800,みゆう,"メモ""あり"""',
      ].join("\r\n"),
    );
  });

  it("returns only header when there are no expenses in the month", () => {
    const csv = buildMonthlyExpensesCsv([], "2026-04", labels);
    expect(csv).toBe("日付,カテゴリ,品目,金額,支払者,メモ");
  });
});

describe("buildMonthlyCsvFilename", () => {
  it("includes the year-month in the filename", () => {
    expect(buildMonthlyCsvFilename("2026-03")).toBe("家計簿_2026-03.csv");
  });
});
