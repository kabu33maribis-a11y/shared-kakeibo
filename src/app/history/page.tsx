"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ExpenseList } from "@/components/history/ExpenseCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/auth_context";
import {
  formatMonthLabel,
  formatYearMonth,
  getAvailableMonths,
} from "@/features/expenses/settlement";
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

  const months = useMemo(() => {
    const available = getAvailableMonths(expenses);
    const current = formatYearMonth(new Date());
    if (!available.includes(current)) {
      return [current, ...available];
    }
    return available.length > 0 ? available : [current];
  }, [expenses]);

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
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">月別</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {months.map((month) => (
            <Button
              key={month}
              size="sm"
              variant={selectedMonth === month ? "default" : "outline"}
              onClick={() => setSelectedMonth(month)}
            >
              {formatMonthLabel(month)}
            </Button>
          ))}
        </div>
      </div>

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as HistoryFilter)}
      >
        <TabsList className="grid w-full grid-cols-4">
          {filters.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ExpenseList expenses={filteredExpenses} />
    </AppShell>
  );
}
