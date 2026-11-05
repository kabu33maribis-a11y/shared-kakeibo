"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PayerToggle } from "@/components/input/PayerToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth_context";
import { parseAmountInput } from "@/features/expenses/expression";
import {
  addFixedCost,
  deleteFixedCost,
  subscribeFixedCosts,
} from "@/features/fixed_costs/fixed_cost_service";
import {
  CATEGORY_META,
  type ExpenseCategory,
  type FixedCost,
  type MemberKey,
} from "@/types";

export function FixedCostMaster() {
  const { group, memberKey, memberLabels } = useAuth();
  const [costs, setCosts] = useState<FixedCost[]>([]);
  const [name, setName] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("utility");
  const [paidByOverride, setPaidByOverride] = useState<MemberKey | null>(null);
  const paidBy = paidByOverride ?? memberKey ?? "member1";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!group) {
      return;
    }
    return subscribeFixedCosts(group.id, setCosts);
  }, [group]);

  const handleAdd = async () => {
    if (!group) {
      return;
    }

    let amount = 0;
    if (amountInput.trim()) {
      try {
        amount = parseAmountInput(amountInput);
      } catch {
        setError("金額を確認してください");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      await addFixedCost(group.id, { name, amount, category, paidBy });
      setName("");
      setAmountInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "追加に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cost: FixedCost) => {
    if (!group || !window.confirm(`「${cost.name}」を削除しますか？`)) {
      return;
    }
    try {
      await deleteFixedCost(group.id, cost.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました。");
    }
  };

  return (
    <Card size="sm" className="gap-2 py-2">
      <CardHeader className="px-4">
        <CardTitle className="text-sm">毎月の固定費</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-3">
        <div className="flex gap-1.5">
          <Input
            className="h-9 min-w-0 flex-1"
            aria-label="固定費の名前"
            value={name}
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            placeholder="電気 / ガス / wifi / 水道"
          />
          <Input
            className="h-9 w-24 shrink-0 tabular-nums"
            aria-label="金額"
            type="text"
            inputMode="decimal"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            placeholder="金額(任意)"
          />
        </div>
        <div className="flex gap-1.5">
          <select
            aria-label="カテゴリ"
            className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background/70 px-2 text-sm"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ExpenseCategory)
            }
          >
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.emoji} {meta.label}
              </option>
            ))}
          </select>
          <div className="min-w-0 flex-1">
            <PayerToggle
              value={paidBy}
              labels={memberLabels}
              onChange={setPaidByOverride}
            />
          </div>
        </div>
        <Button
          size="sm"
          className="w-full"
          disabled={saving || !name.trim()}
          onClick={() => {
            void handleAdd();
          }}
        >
          <Plus className="size-4" />
          追加
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}

        {costs.map((cost) => (
          <div
            key={cost.id}
            className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/20 px-3 py-1.5"
          >
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {CATEGORY_META[cost.category]?.emoji} {cost.name}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {cost.amount > 0
                ? `${cost.amount.toLocaleString("ja-JP")}円`
                : "金額未定"}
            </span>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => {
                void handleDelete(cost);
              }}
              aria-label={`${cost.name} を削除`}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
