"use client";

import { AppShell } from "@/components/AppShell";
import {
  PendingAlert,
  SettlementCard,
} from "@/components/dashboard/DashboardWidgets";
import { ExpenseInputForm } from "@/components/input/ExpenseInputForm";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth_context";
import {
  countPending,
  filterByMonth,
  filterConfirmedExpenses,
  formatYearMonth,
} from "@/features/expenses/settlement";

export default function DashboardPage() {
  const { expenses, memberLabels } = useAuth();
  const yearMonth = formatYearMonth(new Date());
  const monthlyConfirmed = filterConfirmedExpenses(
    filterByMonth(expenses, yearMonth),
  );
  const total = monthlyConfirmed.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const pendingCount = countPending(filterByMonth(expenses, yearMonth));

  return (
    <AppShell title="ホーム">
      <PendingAlert count={pendingCount} />

      <Card size="sm">
        <CardContent className="flex items-baseline justify-between gap-3 pt-0">
          <span className="shrink-0 text-sm text-muted-foreground">今月</span>
          <p className="text-2xl font-bold tracking-tight">
            {total.toLocaleString("ja-JP")}
            <span className="ml-0.5 text-sm font-medium text-muted-foreground">
              円
            </span>
          </p>
        </CardContent>
      </Card>

      <SettlementCard expenses={expenses} memberLabels={memberLabels} />

      <ExpenseInputForm />
    </AppShell>
  );
}
