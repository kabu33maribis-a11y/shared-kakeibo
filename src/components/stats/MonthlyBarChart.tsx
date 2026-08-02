"use client";

import { cn } from "@/lib/utils";
import {
  formatCompactYen,
  formatShortMonthLabel,
  type MonthlyTotal,
} from "@/features/expenses/stats";

interface MonthlyBarChartProps {
  data: MonthlyTotal[];
  className?: string;
}

export function MonthlyBarChart({ data, className }: MonthlyBarChartProps) {
  const maxTotal = Math.max(...data.map((item) => item.total), 0);
  const hasAny = data.some((item) => item.total > 0);

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="flex h-52 items-end gap-1.5 sm:gap-2"
        role="img"
        aria-label="月ごとの支出棒グラフ"
      >
        {data.map((item) => {
          const heightPercent =
            maxTotal > 0 ? Math.max((item.total / maxTotal) * 100, 0) : 0;
          const barHeight =
            item.total > 0 ? Math.max(heightPercent, 4) : 0;

          return (
            <div
              key={item.yearMonth}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "h-4 text-[10px] font-medium tabular-nums leading-none text-muted-foreground",
                  item.total === 0 && "invisible",
                )}
              >
                {formatCompactYen(item.total)}
              </span>
              <div className="flex h-40 w-full items-end justify-center">
                <div
                  className={cn(
                    "w-full max-w-8 rounded-t-md transition-[height] duration-300",
                    item.total > 0
                      ? "bg-primary shadow-[0_6px_16px_rgb(15_118_110/0.18)]"
                      : "bg-muted",
                  )}
                  style={{ height: item.total > 0 ? `${barHeight}%` : "2px" }}
                  title={`${formatShortMonthLabel(item.yearMonth)}: ${item.total.toLocaleString("ja-JP")}円（${item.count}件）`}
                />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">
                {formatShortMonthLabel(item.yearMonth)}
              </span>
            </div>
          );
        })}
      </div>

      {!hasAny && (
        <p className="text-center text-sm text-muted-foreground">
          この年の支出記録はまだありません
        </p>
      )}
    </div>
  );
}
