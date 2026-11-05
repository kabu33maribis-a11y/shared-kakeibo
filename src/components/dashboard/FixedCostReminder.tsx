"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth_context";
import { addExpenses } from "@/features/expenses/expense_service";
import { parseAmountInput } from "@/features/expenses/expression";
import { dateStringForYearMonth } from "@/features/expenses/settlement";
import {
  pendingFixedCosts,
  skipFixedCost,
  subscribeFixedCosts,
} from "@/features/fixed_costs/fixed_cost_service";
import { cn } from "@/lib/utils";
import type { Expense, FixedCost } from "@/types";

interface FixedCostReminderProps {
  monthlyExpenses: Expense[];
  yearMonth: string;
}

export function FixedCostReminder({
  monthlyExpenses,
  yearMonth,
}: FixedCostReminderProps) {
  const { group } = useAuth();
  const [costs, setCosts] = useState<FixedCost[]>([]);
  const [open, setOpen] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!group) {
      return;
    }
    return subscribeFixedCosts(group.id, setCosts);
  }, [group]);

  const pending = pendingFixedCosts(costs, monthlyExpenses, yearMonth);

  if (!group || pending.length === 0) {
    return null;
  }

  const amountInputOf = (cost: FixedCost) =>
    amounts[cost.id] ?? (cost.amount > 0 ? String(cost.amount) : "");

  const record = async (cost: FixedCost) => {
    let amount = 0;
    try {
      amount = parseAmountInput(amountInputOf(cost));
    } catch {
      amount = 0;
    }
    if (!(amount > 0)) {
      setError(`「${cost.name}」の金額を入力してください`);
      return;
    }

    setBusyId(cost.id);
    setError(null);
    try {
      await addExpenses(group.id, [
        {
          date: dateStringForYearMonth(yearMonth),
          category: cost.category,
          title: cost.name,
          amount,
          paidBy: cost.paidBy,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました。");
    } finally {
      setBusyId(null);
    }
  };

  const skip = async (cost: FixedCost) => {
    setBusyId(cost.id);
    setError(null);
    try {
      await skipFixedCost(group.id, cost.id, yearMonth);
    } catch (e) {
      setError(e instanceof Error ? e.message : "スキップに失敗しました。");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card
      size="sm"
      className="gap-2 border-amber-400/50 bg-amber-50 py-2 dark:bg-amber-950/30"
    >
      <CardHeader className="px-4">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="min-w-0 truncate text-sm font-semibold">
            未記入: {pending.map((c) => c.name).join("・")}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-1.5 px-3">
          {pending.map((cost) => (
            <div key={cost.id} className="flex items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate text-sm">
                {cost.name}
              </span>
              <Input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                aria-label={`${cost.name}の金額`}
                className="h-8 w-20 shrink-0 bg-background/70 tabular-nums"
                value={amountInputOf(cost)}
                onChange={(event) =>
                  setAmounts((prev) => ({
                    ...prev,
                    [cost.id]: event.target.value,
                  }))
                }
                placeholder="金額"
              />
              <Button
                size="sm"
                className="h-8 shrink-0 px-2"
                disabled={busyId === cost.id}
                onClick={() => {
                  void record(cost);
                }}
              >
                記入
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 px-2"
                disabled={busyId === cost.id}
                onClick={() => {
                  void skip(cost);
                }}
              >
                スキップ
              </Button>
            </div>
          ))}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </CardContent>
      )}
    </Card>
  );
}
