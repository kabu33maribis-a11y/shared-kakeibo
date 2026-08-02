"use client";

import { useEffect, useRef, useState, type ClipboardEvent } from "react";
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
import { subscribeStores } from "@/features/stores/store_service";
import type { ExpenseCategory, MemberKey, Store } from "@/types";

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
  return { id, amountInput: "", title: "", titleMode: "item", note: "" };
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
                    placeholder="金額"
                  />
                </div>
                <div className="space-y-1.5">
                  <div
                    className="flex w-fit rounded-lg border border-border/70 bg-background/70 p-0.5"
                    role="group"
                    aria-label="品名または店名"
                  >
                    <button
                      type="button"
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        row.titleMode === "item"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() =>
                        updateRow(row.id, {
                          titleMode: "item",
                          title: "",
                        })
                      }
                    >
                      品名
                    </button>
                    <button
                      type="button"
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        row.titleMode === "store"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() =>
                        updateRow(row.id, {
                          titleMode: "store",
                          title: "",
                        })
                      }
                    >
                      店名
                    </button>
                  </div>
                  {row.titleMode === "store" ? (
                    <select
                      id={`title-${row.id}`}
                      aria-label="店名"
                      className="h-10 w-full rounded-lg border border-input bg-background/70 px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      value={row.title}
                      onChange={(event) =>
                        updateRow(row.id, { title: event.target.value })
                      }
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
                      className="h-10 bg-background/70"
                      value={row.title}
                      onChange={(event) =>
                        updateRow(row.id, { title: event.target.value })
                      }
                      placeholder="スーパー買い物"
                    />
                  )}
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
