"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signOutUser } from "@/features/auth/auth_service";
import { useAuth } from "@/features/auth/auth_context";
import { updateMemberDisplayName } from "@/features/auth/group_service";
import { validateDisplayName } from "@/types";

export function AccountPanel() {
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

  if (!group) {
    return null;
  }

  return (
    <Card size="sm">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm">アカウント</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">招待コード</p>
          <p className="text-sm font-medium tracking-wider">{group.inviteCode}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">表示名</p>
          {currentName && !editingName && (
            <button
              type="button"
              className="text-sm font-medium text-foreground transition-colors hover:text-primary"
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

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            void signOutUser();
          }}
        >
          <LogOut className="size-4" />
          ログアウト
        </Button>
      </CardContent>
    </Card>
  );
}
