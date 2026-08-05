"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckSquare, Download, FolderInput, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExpenseList } from "@/components/history/ExpenseCard";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/auth_context";
import {
  buildMonthlyCsvFilename,
  buildMonthlyExpensesCsv,
  downloadCsv,
} from "@/features/expenses/csv";
import { moveExpensesToMonth } from "@/features/expenses/expense_service";
import {
  formatMonthLabel,
  formatYearMonth,
  shiftYearMonth,
} from "@/features/expenses/settlement";
import type { HistoryFilter } from "@/types";

export default function HistoryPage() {
  const { expenses, memberLabels, group } = useAuth();

  const filters = useMemo(
    (): { value: HistoryFilter; label: string }[] => [
      { value: "all", label: "すべて" },
      { value: "member1", label: memberLabels.member1 },
      { value: "member2", label: memberLabels.member2 },
    ],
    [memberLabels],
  );

  const [selectedMonth, setSelectedMonth] = useState(
    () => formatYearMonth(new Date()),
  );
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [moving, setMoving] = useState(false);
  const [showMovePanel, setShowMovePanel] = useState(false);
  const [targetMonth, setTargetMonth] = useState(() =>
    shiftYearMonth(formatYearMonth(new Date()), -1),
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.startsWith(selectedMonth)),
    [expenses, selectedMonth],
  );

  const filteredExpenses = useMemo(() => {
    return monthExpenses.filter((expense) => {
      if (filter === "all") {
        return true;
      }
      return expense.paidBy === filter;
    });
  }, [filter, monthExpenses]);

  useEffect(() => {
    setSelectedIds(new Set());
    setShowMovePanel(false);
    setActionError(null);
  }, [selectedMonth, filter]);

  useEffect(() => {
    if (!selectionMode) {
      setSelectedIds(new Set());
      setShowMovePanel(false);
      setActionError(null);
    }
  }, [selectionMode]);

  function handleExportCsv() {
    const csv = buildMonthlyExpensesCsv(
      expenses,
      selectedMonth,
      memberLabels,
    );
    downloadCsv(buildMonthlyCsvFilename(selectedMonth), csv);
  }

  function toggleSelect(expenseId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(expenseId)) {
        next.delete(expenseId);
      } else {
        next.add(expenseId);
      }
      return next;
    });
    setActionError(null);
  }

  function selectAllVisible() {
    setSelectedIds(new Set(filteredExpenses.map((expense) => expense.id)));
    setActionError(null);
  }

  function openMovePanel() {
    // 誤登録の多い「前月へ戻す」を初期値にする
    setTargetMonth(shiftYearMonth(selectedMonth, -1));
    setShowMovePanel(true);
    setActionError(null);
  }

  async function handleMove() {
    if (!group || selectedIds.size === 0) {
      return;
    }
    if (targetMonth === selectedMonth) {
      setActionError("別の月を選んでください。");
      return;
    }

    const toMove = filteredExpenses.filter((expense) =>
      selectedIds.has(expense.id),
    );
    if (toMove.length === 0) {
      return;
    }

    setMoving(true);
    setActionError(null);

    try {
      await moveExpensesToMonth(group.id, toMove, targetMonth);
      setSelectionMode(false);
      setSelectedMonth(targetMonth);
    } catch {
      setActionError("移動に失敗しました。もう一度お試しください。");
    } finally {
      setMoving(false);
    }
  }

  const selectedCount = selectedIds.size;

  return (
    <AppShell title="明細一覧">
      <MonthSwitcher
        value={selectedMonth}
        onChange={setSelectedMonth}
        disabled={selectionMode}
      />

      <div className="flex items-center justify-between gap-2">
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as HistoryFilter)}
          className="min-w-0 flex-1"
        >
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl p-1">
            {filters.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="h-8 rounded-lg text-xs"
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex shrink-0 gap-1.5">
          <Button
            type="button"
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            className="rounded-xl"
            disabled={filteredExpenses.length === 0 && !selectionMode}
            onClick={() => setSelectionMode((current) => !current)}
          >
            {selectionMode ? (
              <>
                <X data-icon="inline-start" />
                完了
              </>
            ) : (
              <>
                <CheckSquare data-icon="inline-start" />
                選択
              </>
            )}
          </Button>
          {!selectionMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={monthExpenses.length === 0}
              onClick={handleExportCsv}
            >
              <Download data-icon="inline-start" />
              CSV
            </Button>
          )}
        </div>
      </div>

      {selectionMode && filteredExpenses.length > 0 && (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {selectedCount > 0
              ? `${selectedCount}件選択中`
              : "移動する明細を選んでください"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={selectAllVisible}
          >
            すべて選択
          </Button>
        </div>
      )}

      <ExpenseList
        expenses={filteredExpenses}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />

      {selectionMode && selectedCount > 0 && (
        <div className="sticky bottom-3 z-20 space-y-2 rounded-2xl border border-border/60 bg-card/95 p-3 shadow-lg backdrop-blur-md">
          {showMovePanel ? (
            <>
              <p className="text-sm font-medium">
                {selectedCount}件を移動先の月へ
              </p>
              <MonthSwitcher value={targetMonth} onChange={setTargetMonth} />
              <p className="text-xs text-muted-foreground">
                移動先: {formatMonthLabel(targetMonth)}
              </p>
              {actionError && (
                <p className="text-sm text-destructive">{actionError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={moving}
                  onClick={() => {
                    setShowMovePanel(false);
                    setActionError(null);
                  }}
                >
                  戻る
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-xl"
                  disabled={moving || targetMonth === selectedMonth}
                  onClick={() => {
                    void handleMove();
                  }}
                >
                  {moving ? "移動中..." : "移動する"}
                </Button>
              </div>
            </>
          ) : (
            <>
              {actionError && (
                <p className="text-sm text-destructive">{actionError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setSelectedIds(new Set())}
                >
                  選択解除
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-xl"
                  onClick={openMovePanel}
                >
                  <FolderInput data-icon="inline-start" />
                  別の月へ移動
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
