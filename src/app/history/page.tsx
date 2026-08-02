"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExpenseList } from "@/components/history/ExpenseCard";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/auth_context";
import {
  buildMonthlyCsvFilename,
  buildMonthlyExpensesCsv,
  downloadCsv,
} from "@/features/expenses/csv";
import { formatYearMonth } from "@/features/expenses/settlement";
import type { HistoryFilter } from "@/types";

export default function HistoryPage() {
  const { expenses, memberLabels } = useAuth();

  const filters = useMemo(
    (): { value: HistoryFilter; label: string }[] => [
      { value: "all", label: "すべて" },
      { value: "member1", label: memberLabels.member1 },
      { value: "member2", label: memberLabels.member2 },
    ],
    [memberLabels],
  );

  const [selectedMonth, setSelectedMonth] = useState(
    () => formatYearMonth(new Date()),
  );
  const [filter, setFilter] = useState<HistoryFilter>("all");

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.startsWith(selectedMonth)),
    [expenses, selectedMonth],
  );

  const filteredExpenses = useMemo(() => {
    return monthExpenses.filter((expense) => {
      if (filter === "all") {
        return true;
      }
      return expense.paidBy === filter;
    });
  }, [filter, monthExpenses]);

  function handleExportCsv() {
    const csv = buildMonthlyExpensesCsv(
      expenses,
      selectedMonth,
      memberLabels,
    );
    downloadCsv(buildMonthlyCsvFilename(selectedMonth), csv);
  }

  return (
    <AppShell title="明細一覧">
      <MonthSwitcher value={selectedMonth} onChange={setSelectedMonth} />

      <div className="flex items-center justify-between gap-2">
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as HistoryFilter)}
          className="min-w-0 flex-1"
        >
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl p-1">
            {filters.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="h-8 rounded-lg text-xs"
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-xl"
          disabled={monthExpenses.length === 0}
          onClick={handleExportCsv}
        >
          <Download data-icon="inline-start" />
          CSV
        </Button>
      </div>

      <ExpenseList expenses={filteredExpenses} />
    </AppShell>
  );
}
