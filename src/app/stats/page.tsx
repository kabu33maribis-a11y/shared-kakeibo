"use client";

import { useMemo, useState } from "react";
import { ChartColumn } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MonthlyBarChart } from "@/components/stats/MonthlyBarChart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth_context";
import {
  aggregateByMonthForYear,
  getAvailableYears,
} from "@/features/expenses/stats";

export default function StatsPage() {
  const { expenses } = useAuth();
  const years = useMemo(() => getAvailableYears(expenses), [expenses]);
  const [selectedYear, setSelectedYear] = useState(
    () => new Date().getFullYear(),
  );

  const monthlyData = useMemo(
    () => aggregateByMonthForYear(expenses, selectedYear),
    [expenses, selectedYear],
  );

  const yearTotal = monthlyData.reduce((sum, item) => sum + item.total, 0);
  const yearCount = monthlyData.reduce((sum, item) => sum + item.count, 0);

  return (
    <AppShell title="統計">
      <div className="flex flex-wrap gap-1.5">
        {years.map((year) => (
          <Button
            key={year}
            type="button"
            size="sm"
            variant={year === selectedYear ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => setSelectedYear(year)}
          >
            {year}年
          </Button>
        ))}
      </div>

      <Card size="sm" className="border-primary/15 bg-primary text-primary-foreground shadow-[0_14px_36px_rgb(15_118_110/0.18)]">
        <CardContent className="flex items-end justify-between gap-3 pt-0">
          <div>
            <span className="text-xs font-medium text-primary-foreground/70">
              {selectedYear}年の支出
            </span>
            <p className="mt-1 text-sm font-medium">年間合計</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tracking-tight tabular-nums">
              {yearTotal.toLocaleString("ja-JP")}
              <span className="ml-1 text-sm font-medium text-primary-foreground/70">
                円
              </span>
            </p>
            <p className="mt-0.5 text-xs text-primary-foreground/70">
              {yearCount.toLocaleString("ja-JP")}件
            </p>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ChartColumn className="size-3.5 text-primary" />
            月別支出
          </CardTitle>
          <CardDescription>
            {selectedYear}年の各月の合計金額
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <MonthlyBarChart data={monthlyData} />
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            月別一覧
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/60 pt-1">
          {monthlyData.map((item) => (
            <div
              key={item.yearMonth}
              className="flex items-center justify-between gap-3 py-2.5 text-sm"
            >
              <div>
                <p className="font-medium">
                  {Number(item.yearMonth.slice(5, 7))}月
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.count > 0
                    ? `${item.count.toLocaleString("ja-JP")}件`
                    : "記録なし"}
                </p>
              </div>
              <p className="font-semibold tabular-nums">
                {item.total.toLocaleString("ja-JP")}
                <span className="ml-0.5 text-xs font-medium text-muted-foreground">
                  円
                </span>
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
