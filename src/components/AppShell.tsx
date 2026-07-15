"use client";

import { useState, type ReactNode } from "react";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOutUser } from "@/features/auth/auth_service";
import { useAuth } from "@/features/auth/auth_context";
import { updateMemberDisplayName } from "@/features/auth/group_service";
import { validateDisplayName } from "@/types";

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { group, memberKey, memberLabels, setGroup } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  const currentName = memberKey ? memberLabels[memberKey] : null;

  const startEditingName = () => {
    if (!currentName) {
      return;
    }
    setNameInput(currentName);
    setNameError(null);
    setEditingName(true);
  };

  const cancelEditingName = () => {
    setEditingName(false);
    setNameError(null);
  };

  const saveDisplayName = async () => {
    if (!group || !memberKey) {
      return;
    }

    const error = validateDisplayName(nameInput);
    if (error) {
      setNameError(error);
      return;
    }

    setSavingName(true);
    setNameError(null);

    try {
      const updatedGroup = await updateMemberDisplayName(
        group,
        memberKey,
        nameInput,
      );
      setGroup(updatedGroup);
      setEditingName(false);
    } catch (saveError) {
      setNameError(
        saveError instanceof Error
          ? saveError.message
          : "表示名の更新に失敗しました。",
      );
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <header className="sticky top-0 z-10 bg-background/85 shadow-[0_1px_0_rgb(0_0_0/0.04)] backdrop-blur-xl">
        <AppNav />
        <div className="px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              {group && (
                <span className="truncate rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wider text-muted-foreground">
                  {group.inviteCode}
                </span>
              )}
            </div>
            {group && (
              <div className="mt-0.5">
                {currentName && !editingName && (
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                    onClick={startEditingName}
                  >
                    {currentName}（変更）
                  </button>
                )}
                {editingName && (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        value={nameInput}
                        onChange={(event) => setNameInput(event.target.value)}
                        className="h-8 text-xs"
                        maxLength={20}
                      />
                      <Button
                        size="sm"
                        className="h-8 shrink-0"
                        disabled={savingName}
                        onClick={() => {
                          void saveDisplayName();
                        }}
                      >
                        保存
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 shrink-0"
                        disabled={savingName}
                        onClick={cancelEditingName}
                      >
                        取消
                      </Button>
                    </div>
                    {nameError && (
                      <p className="text-xs text-destructive">{nameError}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => {
              void signOutUser();
            }}
          >
            ログアウト
          </Button>
        </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 px-4 py-4 pb-8">
        {children}
      </main>
    </div>
  );
}
