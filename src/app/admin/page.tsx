"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth_context";
import {
  addAllowedEmail,
  listAllowedEmails,
  removeAllowedEmail,
} from "@/features/auth/allowlist_service";
import {
  formatTimestamp,
  listAppUsers,
} from "@/features/auth/user_service";
import type { AllowedEmail, AppUser } from "@/types";

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const [allowedEmails, setAllowedEmails] = useState<AllowedEmail[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextAllowed, nextUsers] = await Promise.all([
        listAllowedEmails(),
        listAppUsers(),
      ]);
      setAllowedEmails(nextAllowed);
      setUsers(nextUsers);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "管理データの読み込みに失敗しました。",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    void loadData();
  }, [isAdmin, loadData]);

  const handleAddEmail = async () => {
    if (!user) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await addAllowedEmail(emailInput, user.uid, noteInput);
      setEmailInput("");
      setNoteInput("");
      setMessage("許可メールを追加しました。");
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "許可メールの追加に失敗しました。",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    if (!window.confirm(`${email} を許可リストから削除しますか？`)) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await removeAllowedEmail(email);
      setMessage("許可メールを削除しました。");
      await loadData();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "許可メールの削除に失敗しました。",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <AppShell title="管理">
        <p className="text-sm text-muted-foreground">管理者のみ利用できます。</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="ユーザー管理">
      <Card size="sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">許可メールを追加</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-2">
          <div className="space-y-1">
            <Label htmlFor="allow-email" className="text-xs">
              メールアドレス
            </Label>
            <Input
              id="allow-email"
              type="email"
              className="h-8"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="allow-note" className="text-xs">
              メモ（任意）
            </Label>
            <Input
              id="allow-note"
              className="h-8"
              value={noteInput}
              onChange={(event) => setNoteInput(event.target.value)}
              placeholder="例: 同居のパートナー"
            />
          </div>
          <Button
            size="sm"
            className="w-full"
            disabled={saving || !emailInput.trim()}
            onClick={() => {
              void handleAddEmail();
            }}
          >
            {saving ? "処理中..." : "許可リストに追加"}
          </Button>
        </CardContent>
      </Card>

      {message && (
        <p className="rounded-md bg-muted px-3 py-1.5 text-xs">{message}</p>
      )}
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          {error}
        </p>
      )}

      <Card size="sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">
            許可リスト（{allowedEmails.length}）
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 pt-2">
          {loading ? (
            <p className="text-xs text-muted-foreground">読み込み中...</p>
          ) : allowedEmails.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              まだ許可メールがありません
            </p>
          ) : (
            allowedEmails.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.email}</p>
                  {item.note && (
                    <p className="truncate text-xs text-muted-foreground">
                      {item.note}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 text-xs"
                  disabled={saving}
                  onClick={() => {
                    void handleRemoveEmail(item.email);
                  }}
                >
                  削除
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">
            ログインしたユーザー（{users.length}）
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 pt-2">
          {loading ? (
            <p className="text-xs text-muted-foreground">読み込み中...</p>
          ) : users.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              まだログイン履歴がありません
            </p>
          ) : (
            users.map((item) => (
              <div
                key={item.id}
                className="rounded-md border px-2 py-1.5 text-xs"
              >
                <p className="truncate text-sm font-medium">{item.email}</p>
                <p className="text-muted-foreground">
                  表示名: {item.displayName || "—"}
                </p>
                <p className="text-muted-foreground">
                  最終ログイン: {formatTimestamp(item.lastLoginAt)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
