"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SettlementCard } from "@/components/dashboard/DashboardWidgets";
import { ExpenseInputForm } from "@/components/input/ExpenseInputForm";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth_context";
import {
  filterByMonth,
  formatYearMonth,
} from "@/features/expenses/settlement";

export default function DashboardPage() {
  const { expenses, memberLabels } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(
    () => formatYearMonth(new Date()),
  );
  const monthlyExpenses = filterByMonth(expenses, selectedMonth);
  const total = monthlyExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  return (
    <AppShell title="ホーム">
      <MonthSwitcher value={selectedMonth} onChange={setSelectedMonth} />

      <Card size="sm" className="border-primary/15 bg-primary text-primary-foreground shadow-[0_14px_36px_rgb(15_118_110/0.18)]">
        <CardContent className="flex items-end justify-between gap-3 pt-0">
          <div>
            <span className="text-xs font-medium text-primary-foreground/70">
              この月の支出
            </span>
            <p className="mt-1 text-sm font-medium">合計</p>
          </div>
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            {total.toLocaleString("ja-JP")}
            <span className="ml-1 text-sm font-medium text-primary-foreground/70">
              円
            </span>
          </p>
        </CardContent>
      </Card>

      <SettlementCard
        expenses={expenses}
        memberLabels={memberLabels}
        yearMonth={selectedMonth}
      />

      <ExpenseInputForm yearMonth={selectedMonth} />
    </AppShell>
  );
}
