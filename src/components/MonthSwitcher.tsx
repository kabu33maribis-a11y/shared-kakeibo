"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatMonthLabel,
  formatYearMonth,
  shiftYearMonth,
} from "@/features/expenses/settlement";

interface MonthSwitcherProps {
  value: string;
  onChange: (yearMonth: string) => void;
  className?: string;
  disabled?: boolean;
}

export function MonthSwitcher({
  value,
  onChange,
  className,
  disabled = false,
}: MonthSwitcherProps) {
  const current = formatYearMonth(new Date());
  const label =
    value === current ? `今月（${formatMonthLabel(value)}）` : formatMonthLabel(value);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/70 p-1.5 shadow-sm backdrop-blur-sm">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="rounded-xl text-muted-foreground hover:text-primary"
          aria-label="前の月"
          disabled={disabled}
          onClick={() => onChange(shiftYearMonth(value, -1))}
        >
          <ChevronLeft />
        </Button>
        <p className="min-w-0 flex-1 text-center text-sm font-semibold tracking-tight">
          {label}
        </p>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="rounded-xl text-muted-foreground hover:text-primary"
          aria-label="次の月"
          disabled={disabled}
          onClick={() => onChange(shiftYearMonth(value, 1))}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
