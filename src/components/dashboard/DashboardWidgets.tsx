"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  calculateSettlement,
  formatSettlementMessage,
  formatYearMonth,
} from "@/features/expenses/settlement";
import type { Expense, MemberKey } from "@/types";

interface SettlementCardProps {
  expenses: Expense[];
  memberLabels: Record<MemberKey, string>;
}

export function SettlementCard({
  expenses,
  memberLabels,
}: SettlementCardProps) {
  const yearMonth = formatYearMonth(new Date());
  const settlement = calculateSettlement(expenses, yearMonth);

  return (
    <Card size="sm">
      <CardContent className="space-y-2 pt-0">
        <p className="text-sm leading-snug">
          {formatSettlementMessage(settlement, memberLabels)}
        </p>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div className="rounded-md bg-muted px-2 py-1.5">
            <span className="text-muted-foreground">{memberLabels.member1}</span>
            <span className="ml-1 font-medium">
              {settlement.totalMember1.toLocaleString("ja-JP")}円
            </span>
          </div>
          <div className="rounded-md bg-muted px-2 py-1.5">
            <span className="text-muted-foreground">{memberLabels.member2}</span>
            <span className="ml-1 font-medium">
              {settlement.totalMember2.toLocaleString("ja-JP")}円
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PendingAlertProps {
  count: number;
}

export function PendingAlert({ count }: PendingAlertProps) {
  if (count === 0) {
    return null;
  }

  return (
    <Alert className="border-amber-300 bg-amber-50 px-3 py-2 text-amber-950">
      <AlertDescription className="text-xs">
        未確定の支出が {count}件あります
      </AlertDescription>
    </Alert>
  );
}
