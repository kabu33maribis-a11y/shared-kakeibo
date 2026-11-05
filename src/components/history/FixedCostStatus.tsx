"use client";

import { useEffect, useState } from "react";
import { Check, Minus } from "lucide-react";
import { useAuth } from "@/features/auth/auth_context";
import {
  subscribeFixedCosts,
  unskipFixedCost,
} from "@/features/fixed_costs/fixed_cost_service";
import { cn } from "@/lib/utils";
import type { Expense, FixedCost } from "@/types";

interface FixedCostStatusProps {
  monthExpenses: Expense[];
  yearMonth: string;
}

/** 選択した月の固定費が 記入済み / スキップ / 未記入 のどれかを一覧表示する */
export function FixedCostStatus({
  monthExpenses,
  yearMonth,
}: FixedCostStatusProps) {
  const { group } = useAuth();
  const [costs, setCosts] = useState<FixedCost[]>([]);

  useEffect(() => {
    if (!group) {
      return;
    }
    return subscribeFixedCosts(group.id, setCosts);
  }, [group]);

  if (!group || costs.length === 0) {
    return null;
  }

  const recorded = new Set(monthExpenses.map((expense) => expense.title));

  return (
    <div className="flex flex-wrap gap-1.5" aria-label="固定費の記入状況">
      {costs.map((cost) => {
        const done = recorded.has(cost.name);
        const skipped = !done && cost.skippedMonths.includes(yearMonth);
        const className = cn(
          "flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium",
          done && "border-primary/30 bg-primary/10 text-primary",
          skipped && "border-border bg-muted text-muted-foreground",
          !done &&
            !skipped &&
            "border-amber-400/60 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200",
        );

        if (skipped) {
          return (
            <button
              key={cost.id}
              type="button"
              className={className}
              title="タップでスキップを取り消す"
              onClick={() => {
                void unskipFixedCost(group.id, cost.id, yearMonth);
              }}
            >
              <Minus className="size-3" />
              {cost.name}
              <span className="font-normal">スキップ</span>
            </button>
          );
        }

        return (
          <span key={cost.id} className={className}>
            {done && <Check className="size-3" />}
            {cost.name}
            {!done && <span className="font-normal">未記入</span>}
          </span>
        );
      })}
    </div>
  );
}
