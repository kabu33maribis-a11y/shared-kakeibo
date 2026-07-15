"use client";

import { useState, type ClipboardEvent } from "react";
import { CategoryGrid } from "@/components/input/CategoryGrid";
import { PayerToggle } from "@/components/input/PayerToggle";
import { PendingToggle } from "@/components/input/PendingToggle";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth_context";
import { parseAmountInput } from "@/features/expenses/expression";
import { addExpense } from "@/features/expenses/expense_service";
import { dateStringForYearMonth } from "@/features/expenses/settlement";
import type { ExpenseCategory, MemberKey } from "@/types";

interface ExpenseInputFormProps {
  yearMonth: string;
}

export function ExpenseInputForm({ yearMonth }: ExpenseInputFormProps) {
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

  const resolveAmount = (): number | null => {
    if (!amountInput.trim()) {
      return null;
    }

    try {
      return parseAmountInput(amountInput);
    } catch {
      return null;
    }
  };

  const commitAmountExpression = () => {
    if (!amountInput.trim() || isPending) {
      return;
    }

    try {
      const amount = parseAmountInput(amountInput);
      setAmountInput(String(amount));
      setMessage(null);
    } catch {
      // 入力途中の数式はそのまま残す
    }
  };

  const handlePasteAmount = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text");
    if (!pasted) {
      return;
    }

    event.preventDefault();

    try {
      const amount = parseAmountInput(pasted);
      setAmountInput(String(amount));
      setMessage(null);
    } catch {
      setAmountInput(pasted.trim());
      setMessage(
        "金額として解釈できませんでした。数式や数字を確認してください。",
      );
    }
  };

  const handleSave = async () => {
    if (!group) {
      return;
    }

    const amount = resolveAmount();
    if (!isPending && (amount === null || amount <= 0)) {
      setMessage("金額を入力するか、未確定として保存してください。");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await addExpense(group.id, {
        date: dateStringForYearMonth(yearMonth),
        category,
        title: title.trim(),
        amount: isPending ? 0 : (amount ?? 0),
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
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Plus className="size-4" />
          </span>
          支出を追加
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs font-medium text-muted-foreground">
              金額
            </Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              className="h-10 bg-background/70 font-semibold tabular-nums"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              onBlur={commitAmountExpression}
              onPaste={handlePasteAmount}
              placeholder="0 または 10000-2439"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium text-muted-foreground">
              品名
            </Label>
            <Input
              id="title"
              className="h-10 bg-background/70"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="スーパー買い物"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">支払い者</Label>
          <PayerToggle
            value={paidBy}
            labels={memberLabels}
            onChange={setPaidByOverride}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">カテゴリ</Label>
          <CategoryGrid value={category} onChange={setCategory} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="note" className="text-xs font-medium text-muted-foreground">
            備考
          </Label>
          <Input
            id="note"
            className="h-10 bg-background/70"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="任意"
          />
        </div>

        <PendingToggle checked={isPending} onChange={setIsPending} />

        <Button
          className="h-10 w-full rounded-xl shadow-sm"
          disabled={saving}
          onClick={() => {
            void handleSave();
          }}
        >
          {saving ? "保存中..." : "保存する"}
        </Button>

        {message && (
          <p className="rounded-xl bg-muted px-3 py-2 text-xs">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
