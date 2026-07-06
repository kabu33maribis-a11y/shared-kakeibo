"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth_context";
import { deleteExpense } from "@/features/expenses/expense_service";
import { cn } from "@/lib/utils";
import { CATEGORY_META, type Expense } from "@/types";

interface ExpenseCardProps {
  expense: Expense;
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
  const { memberLabels, group } = useAuth();
  const category = CATEGORY_META[expense.category];
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!group) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteExpense(group.id, expense.id);
    } catch {
      setDeleting(false);
      setError("削除に失敗しました。もう一度お試しください。");
    }
  };

  if (confirming) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
        <p className="text-sm font-medium">この明細を削除しますか？</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {expense.title || "（品名なし）"} ·{" "}
          {expense.amount.toLocaleString("ja-JP")}円
        </p>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            disabled={deleting}
          >
            キャンセル
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "削除中..." : "削除する"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3",
        expense.isPending && "border-amber-200 bg-amber-50",
      )}
    >
      <div className="text-2xl">{category.emoji}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">
            {expense.title || "（品名なし）"}
          </p>
          {expense.isPending && <Badge variant="secondary">未確定</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {expense.date} · {memberLabels[expense.paidBy]}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold">
          {expense.amount.toLocaleString("ja-JP")}円
        </p>
        {expense.note && (
          <p className="max-w-28 truncate text-xs text-muted-foreground">
            {expense.note}
          </p>
        )}
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        className="shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => setConfirming(true)}
        aria-label="削除"
      >
        <Trash2 />
      </Button>
    </div>
  );
}

interface ExpenseListProps {
  expenses: Expense[];
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        表示できる明細がありません
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <ExpenseCard key={expense.id} expense={expense} />
      ))}
    </div>
  );
}
