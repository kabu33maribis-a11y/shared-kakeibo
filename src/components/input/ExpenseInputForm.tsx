"use client";

import { useState } from "react";
import { CategoryGrid } from "@/components/input/CategoryGrid";
import { PayerToggle } from "@/components/input/PayerToggle";
import { PendingToggle } from "@/components/input/PendingToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth_context";
import { addExpense } from "@/features/expenses/expense_service";
import type { ExpenseCategory, MemberKey } from "@/types";

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ExpenseInputForm() {
  const { group, memberKey, memberLabels } = useAuth();
  const [amountInput, setAmountInput] = useState("");
  const [paidByOverride, setPaidByOverride] = useState<MemberKey | null>(null);
  const paidBy = paidByOverride ?? memberKey ?? "member1";
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const resetForm = () => {
    setAmountInput("");
    setTitle("");
    setNote("");
    setIsPending(false);
    setPaidByOverride(null);
    setCategory("food");
  };

  const handleSave = async () => {
    if (!group) {
      return;
    }

    const amount = Number(amountInput);
    if (!isPending && (!amountInput.trim() || amount <= 0 || Number.isNaN(amount))) {
      setMessage("金額を入力するか、未確定として保存してください。");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await addExpense(group.id, {
        date: todayString(),
        category,
        title: title.trim(),
        amount: isPending ? 0 : amount,
        paidBy,
        isPending,
        note: note.trim() || undefined,
      });
      resetForm();
      setMessage("保存しました");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "保存に失敗しました。",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card size="sm">
      <CardContent className="space-y-2.5 pt-0">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="amount" className="text-xs">
              金額
            </Label>
            <Input
              id="amount"
              type="number"
              inputMode="numeric"
              min={0}
              className="h-8"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              placeholder="0"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs">
              品名
            </Label>
            <Input
              id="title"
              className="h-8"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="スーパー買い物"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">支払い者</Label>
          <PayerToggle
            value={paidBy}
            labels={memberLabels}
            onChange={setPaidByOverride}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">カテゴリ</Label>
          <CategoryGrid value={category} onChange={setCategory} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="note" className="text-xs">
            備考
          </Label>
          <Input
            id="note"
            className="h-8"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="任意"
          />
        </div>

        <PendingToggle checked={isPending} onChange={setIsPending} />

        <Button
          size="sm"
          className="w-full"
          disabled={saving}
          onClick={() => {
            void handleSave();
          }}
        >
          {saving ? "保存中..." : "保存する"}
        </Button>

        {message && (
          <p className="rounded-md bg-muted px-3 py-1.5 text-xs">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
