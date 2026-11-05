"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  calculateSettlement,
  formatSettlementMessage,
} from "@/features/expenses/settlement";
import { cn } from "@/lib/utils";
import type { Expense, MemberKey } from "@/types";

interface SettlementCardProps {
  expenses: Expense[];
  memberLabels: Record<MemberKey, string>;
  yearMonth: string;
}

export function SettlementCard({
  expenses,
  memberLabels,
  yearMonth,
}: SettlementCardProps) {
  const [open, setOpen] = useState(false);
  const settlement = calculateSettlement(expenses, yearMonth);

  return (
    <Card size="sm" className="gap-2 py-2">
      <CardHeader className="px-4">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="text-sm font-semibold leading-snug">
            {formatSettlementMessage(settlement, memberLabels)}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </CardHeader>
      {open ? (
        <CardContent className="px-4 pt-0">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-muted/70 px-3 py-2">
              <span className="block truncate text-muted-foreground">
                {memberLabels.member1}
              </span>
              <span className="mt-0.5 block font-semibold tabular-nums">
                {settlement.totalMember1.toLocaleString("ja-JP")}円
              </span>
            </div>
            <div className="rounded-xl bg-muted/70 px-3 py-2">
              <span className="block truncate text-muted-foreground">
                {memberLabels.member2}
              </span>
              <span className="mt-0.5 block font-semibold tabular-nums">
                {settlement.totalMember2.toLocaleString("ja-JP")}円
              </span>
            </div>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
