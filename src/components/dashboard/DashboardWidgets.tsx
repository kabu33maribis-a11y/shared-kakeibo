"use client";

import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateSettlement,
  formatSettlementMessage,
} from "@/features/expenses/settlement";
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
  const settlement = calculateSettlement(expenses, yearMonth);

  return (
    <Card size="sm">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ArrowRight className="size-3.5 text-primary" />
          精算
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-base font-semibold leading-snug">
          {formatSettlementMessage(settlement, memberLabels)}
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-muted/70 px-3 py-2">
            <span className="block truncate text-muted-foreground">{memberLabels.member1}</span>
            <span className="mt-0.5 block font-semibold tabular-nums">
              {settlement.totalMember1.toLocaleString("ja-JP")}円
            </span>
          </div>
          <div className="rounded-xl bg-muted/70 px-3 py-2">
            <span className="block truncate text-muted-foreground">{memberLabels.member2}</span>
            <span className="mt-0.5 block font-semibold tabular-nums">
              {settlement.totalMember2.toLocaleString("ja-JP")}円
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
