"use client";

import { useRef, useState, type ClipboardEvent } from "react";
import { CategoryGrid } from "@/components/input/CategoryGrid";
import { PayerToggle } from "@/components/input/PayerToggle";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth_context";
import { parseAmountInput } from "@/features/expenses/expression";
import { addExpenses } from "@/features/expenses/expense_service";
import { dateStringForYearMonth } from "@/features/expenses/settlement";
import type { ExpenseCategory, MemberKey } from "@/types";

interface ExpenseInputFormProps {
  yearMonth: string;
}

interface ExpenseRow {
  id: number;
  amountInput: string;
  title: string;
  note: string;
}

function createExpenseRow(id: number): ExpenseRow {
  return { id, amountInput: "", title: "", note: "" };
}

export function ExpenseInputForm({ yearMonth }: ExpenseInputFormProps) {
  const { group, memberKey, memberLabels } = useAuth();
  const nextRowId = useRef(1);
  const [rows, setRows] = useState<ExpenseRow[]>(() => [createExpenseRow(0)]);
  const [paidByOverride, setPaidByOverride] = useState<MemberKey | null>(null);
  const paidBy = paidByOverride ?? memberKey ?? "member1";
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const resetForm = () => {
    setRows([createExpenseRow(nextRowId.current++)]);
    setPaidByOverride(null);
    setCategory("food");
  };

  const updateRow = (id: number, changes: Partial<Omit<ExpenseRow, "id">>) => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    );
  };

  const addRow = () => {
    setRows((currentRows) => [
      ...currentRows,
      createExpenseRow(nextRowId.current++),
    ]);
    setMessage(null);
  };

  const removeRow = (id: number) => {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id));
    setMessage(null);
  };

  const resolveAmount = (amountInput: string): number | null => {
    if (!amountInput.trim()) {
      return null;
    }

    try {
      return parseAmountInput(amountInput);
    } catch {
      return null;
    }
  };

  const commitAmountExpression = (row: ExpenseRow) => {
    if (!row.amountInput.trim()) {
      return;
    }

    try {
      const amount = parseAmountInput(row.amountInput);
      updateRow(row.id, { amountInput: String(amount) });
      setMessage(null);
    } catch {
      // 入力途中の数式はそのまま残す
    }
  };

  const handlePasteAmount = (
    event: ClipboardEvent<HTMLInputElement>,
    rowId: number,
  ) => {
    const pasted = event.clipboardData.getData("text");
    if (!pasted) {
      return;
    }

    event.preventDefault();

    try {
      const amount = parseAmountInput(pasted);
      updateRow(rowId, { amountInput: String(amount) });
      setMessage(null);
    } catch {
      updateRow(rowId, { amountInput: pasted.trim() });
      setMessage(
        "金額として解釈できませんでした。数式や数字を確認してください。",
      );
    }
  };

  const handleSave = async () => {
    if (!group) {
      return;
    }

    const resolvedRows = rows.map((row) => ({
      ...row,
      amount: resolveAmount(row.amountInput),
    }));
    const invalidIndex = resolvedRows.findIndex(
      (row) => row.amount === null || row.amount <= 0,
    );
    if (invalidIndex !== -1) {
      setMessage(`支出 ${invalidIndex + 1} に0より大きい金額を入力してください。`);
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const date = dateStringForYearMonth(yearMonth);
      await addExpenses(
        group.id,
        resolvedRows.map((row) => ({
          date,
          category,
          title: row.title.trim(),
          amount: row.amount!,
          paidBy,
          isPending: false,
          note: row.note.trim() || undefined,
        })),
      );
      resetForm();
      setMessage(`${rows.length}件保存しました`);
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
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={addRow}
            aria-label="入力欄を追加"
            title="入力欄を追加"
          >
            <Plus className="size-4" />
          </button>
          支出を追加
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">
                  支出 {index + 1}
                </p>
                {rows.length > 1 && (
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(row.id)}
                    aria-label={`支出 ${index + 1} の入力欄を削除`}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`amount-${row.id}`}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    金額
                  </Label>
                  <Input
                    id={`amount-${row.id}`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    className="h-10 bg-background/70 font-semibold tabular-nums"
                    value={row.amountInput}
                    onChange={(event) =>
                      updateRow(row.id, { amountInput: event.target.value })
                    }
                    onBlur={() => commitAmountExpression(row)}
                    onPaste={(event) => handlePasteAmount(event, row.id)}
                    placeholder="1200 または 10000-2439"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`title-${row.id}`}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    品名
                  </Label>
                  <Input
                    id={`title-${row.id}`}
                    className="h-10 bg-background/70"
                    value={row.title}
                    onChange={(event) =>
                      updateRow(row.id, { title: event.target.value })
                    }
                    placeholder="スーパー買い物"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor={`note-${row.id}`}
                  className="text-xs font-medium text-muted-foreground"
                >
                  備考
                </Label>
                <Input
                  id={`note-${row.id}`}
                  className="h-10 bg-background/70"
                  value={row.note}
                  onChange={(event) =>
                    updateRow(row.id, { note: event.target.value })
                  }
                  placeholder="任意"
                />
              </div>
            </div>
          ))}
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

        <Button
          className="h-10 w-full rounded-xl shadow-sm"
          disabled={saving}
          onClick={() => {
            void handleSave();
          }}
        >
          {saving ? "保存中..." : `${rows.length}件を保存する`}
        </Button>

        {message && (
          <p className="rounded-xl bg-muted px-3 py-2 text-xs">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
