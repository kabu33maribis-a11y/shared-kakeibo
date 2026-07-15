"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ExpenseList } from "@/components/history/ExpenseCard";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/auth_context";
import { formatYearMonth } from "@/features/expenses/settlement";
import type { HistoryFilter } from "@/types";

export default function HistoryPage() {
  const { expenses, memberLabels } = useAuth();

  const filters = useMemo(
    (): { value: HistoryFilter; label: string }[] => [
      { value: "all", label: "すべて" },
      { value: "member1", label: `${memberLabels.member1}の支出` },
      { value: "member2", label: `${memberLabels.member2}の支出` },
      { value: "pending", label: "未確定のみ" },
    ],
    [memberLabels],
  );

  const [selectedMonth, setSelectedMonth] = useState(
    () => formatYearMonth(new Date()),
  );
  const [filter, setFilter] = useState<HistoryFilter>("all");

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((expense) => expense.date.startsWith(selectedMonth))
      .filter((expense) => {
        if (filter === "all") {
          return true;
        }
        if (filter === "pending") {
          return expense.isPending;
        }
        return expense.paidBy === filter;
      });
  }, [expenses, filter, selectedMonth]);

  return (
    <AppShell title="明細一覧">
      <MonthSwitcher value={selectedMonth} onChange={setSelectedMonth} />

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as HistoryFilter)}
      >
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl p-1 sm:grid-cols-4">
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

      <ExpenseList expenses={filteredExpenses} />
    </AppShell>
  );
}
