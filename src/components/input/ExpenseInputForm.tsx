"use client";

import { useEffect, useRef, useState, type ClipboardEvent } from "react";
import { CategoryGrid } from "@/components/input/CategoryGrid";
import { PayerToggle } from "@/components/input/PayerToggle";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth_context";
import {
  isAmountMissing,
  parseAmountInput,
  resolveAmountInput,
} from "@/features/expenses/expression";
import { addExpenses } from "@/features/expenses/expense_service";
import { dateStringForYearMonth } from "@/features/expenses/settlement";
import { subscribeStores } from "@/features/stores/store_service";
import { scheduleKeepInputVisible } from "@/lib/keep_input_visible";
import type { ExpenseCategory, MemberKey, Store } from "@/types";

function handleFieldFocus(event: { target: EventTarget }) {
  if (event.target instanceof HTMLElement) {
    scheduleKeepInputVisible(event.target);
  }
}

interface ExpenseInputFormProps {
  yearMonth: string;
}

type TitleMode = "item" | "store";

interface ExpenseRow {
  id: number;
  amountInput: string;
  title: string;
  titleMode: TitleMode;
  note: string;
}

function createExpenseRow(id: number): ExpenseRow {
  return { id, amountInput: "", title: "", titleMode: "store", note: "" };
}

export function ExpenseInputForm({ yearMonth }: ExpenseInputFormProps) {
  const { group, memberKey, memberLabels } = useAuth();
  const nextRowId = useRef(1);
  const [rows, setRows] = useState<ExpenseRow[]>(() => [createExpenseRow(0)]);
  const [stores, setStores] = useState<Store[]>([]);
  const [paidByOverride, setPaidByOverride] = useState<MemberKey | null>(null);
  const paidBy = paidByOverride ?? memberKey ?? "member1";
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!group) {
      setStores([]);
      return;
    }

    return subscribeStores(group.id, setStores);
  }, [group]);

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
      amount: resolveAmountInput(row.amountInput),
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

  const missingAmount = rows.some((row) => isAmountMissing(row.amountInput));

  return (
    <>
      <Card size="sm" className="gap-2 py-2 pb-20 [overflow-anchor:none]">
        <CardContent className="space-y-2 px-3">
          <div className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <PayerToggle
                value={paidBy}
                labels={memberLabels}
                onChange={setPaidByOverride}
              />
            </div>
            <button
              type="button"
              className="flex h-9 shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2 text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={addRow}
              aria-label="連続で記入"
              title="連続で記入"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <div className="space-y-2">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="space-y-1.5 rounded-xl border border-border/70 bg-muted/20 p-2"
              >
                <div className="flex items-center gap-1.5">
                  <Input
                    id={`amount-${row.id}`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-label="金額"
                    className="h-9 w-24 shrink-0 bg-background/70 font-semibold tabular-nums"
                    value={row.amountInput}
                    onChange={(event) =>
                      updateRow(row.id, { amountInput: event.target.value })
                    }
                    onFocus={handleFieldFocus}
                    onBlur={() => commitAmountExpression(row)}
                    onPaste={(event) => handlePasteAmount(event, row.id)}
                    placeholder="金額"
                  />
                  <button
                    type="button"
                    className="h-9 shrink-0 rounded-lg bg-primary px-2 text-[11px] font-medium text-primary-foreground"
                    aria-label="品名と店名を切り替え"
                    onClick={() =>
                      updateRow(row.id, {
                        titleMode: row.titleMode === "item" ? "store" : "item",
                        title: "",
                      })
                    }
                  >
                    {row.titleMode === "item" ? "品名" : "店名"}
                  </button>
                  {row.titleMode === "store" ? (
                    <select
                      id={`title-${row.id}`}
                      aria-label="店名"
                      className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background/70 px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      value={row.title}
                      onChange={(event) =>
                        updateRow(row.id, { title: event.target.value })
                      }
                      onFocus={handleFieldFocus}
                    >
                      <option value="">
                        {stores.length === 0
                          ? "その他タブで店を追加"
                          : "店を選択"}
                      </option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.name}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={`title-${row.id}`}
                      aria-label="品名"
                      className="h-9 min-w-0 flex-1 bg-background/70"
                      value={row.title}
                      onChange={(event) =>
                        updateRow(row.id, { title: event.target.value })
                      }
                      onFocus={handleFieldFocus}
                      placeholder="スーパー買い物"
                    />
                  )}
                </div>

                {rows.length > 1 && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(row.id)}
                      aria-label={`支出 ${index + 1} の入力欄を削除`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <CategoryGrid value={category} onChange={setCategory} />
        </CardContent>

      </Card>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-3 pb-2 pt-4">
        <div
          data-sticky-footer
          className="pointer-events-auto mx-auto max-w-lg space-y-1.5 rounded-2xl border border-border/60 bg-card/95 p-2 shadow-lg backdrop-blur-md"
        >
          <Button
            className={`h-10 w-full rounded-xl shadow-sm ${
              missingAmount ? "disabled:opacity-100" : ""
            }`}
            variant={missingAmount ? "secondary" : "default"}
            disabled={saving || missingAmount}
            onClick={() => {
              void handleSave();
            }}
          >
            {saving
              ? "保存中..."
              : missingAmount
                ? "金額を入力してください。"
                : `${rows.length}件を保存する`}
          </Button>

          {message && (
            <p className="rounded-xl bg-muted px-3 py-1.5 text-xs">{message}</p>
          )}
        </div>
      </div>
    </>
  );
}
