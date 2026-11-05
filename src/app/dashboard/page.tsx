"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FixedCostReminder } from "@/components/dashboard/FixedCostReminder";
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

      <Card size="sm" className="gap-0 border-primary/15 bg-primary py-2 text-primary-foreground">
        <CardContent className="flex items-baseline justify-end px-4">
          <p className="text-2xl font-bold tracking-tight tabular-nums">
            {total.toLocaleString("ja-JP")}
            <span className="ml-1 text-sm font-medium text-primary-foreground/70">
              円
            </span>
          </p>
        </CardContent>
      </Card>

      <FixedCostReminder
        monthlyExpenses={monthlyExpenses}
        yearMonth={selectedMonth}
      />

      <SettlementCard
        expenses={expenses}
        memberLabels={memberLabels}
        yearMonth={selectedMonth}
      />

      <ExpenseInputForm yearMonth={selectedMonth} />
    </AppShell>
  );
}
