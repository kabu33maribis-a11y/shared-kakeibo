"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/features/auth/auth_service";
import { useAuth } from "@/features/auth/auth_context";
import {
  createGroup,
  joinGroupByInviteCode,
} from "@/features/auth/group_service";
import { validateDisplayName } from "@/types";

export default function HomePage() {
  const { user, group, firebaseReady, setGroup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (mode: "signin" | "signup") => {
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "認証に失敗しました。",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Googleログインに失敗しました。",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!user) {
      return;
    }

    const nameError = validateDisplayName(displayName);
    if (nameError) {
      setError(nameError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const nextGroup = await createGroup(user.uid, displayName);
      setGroup(nextGroup);
    } catch (groupError) {
      setError(
        groupError instanceof Error
          ? groupError.message
          : "グループ作成に失敗しました。",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user) {
      return;
    }

    const nameError = validateDisplayName(displayName);
    if (nameError) {
      setError(nameError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const nextGroup = await joinGroupByInviteCode(
        user.uid,
        inviteCode,
        displayName,
      );
      setGroup(nextGroup);
    } catch (groupError) {
      setError(
        groupError instanceof Error
          ? groupError.message
          : "グループ参加に失敗しました。",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!firebaseReady) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-lg flex-col justify-center gap-4 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">共有家計簿</CardTitle>
            <CardDescription className="text-base">
              Firebase の環境変数が未設定です。`.env.example` を
              `.env.local` にコピーして値を入力してください。
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (user && group) {
    return (
      <div className="flex min-h-svh flex-1 items-center justify-center p-6 text-base text-muted-foreground">
        ダッシュボードへ移動しています...
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-lg flex-col justify-center gap-4 p-4 sm:p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">共有家計簿</h1>
        <p className="text-sm text-muted-foreground">
          2人で支出を共有し、毎月の精算を自動計算します
        </p>
      </div>

      {!user ? (
        <Card>
          <CardHeader>
            <CardTitle>ログイン</CardTitle>
            <CardDescription>
              メール/パスワードまたは Google でログインしてください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                disabled={loading}
                onClick={() => {
                  void handleAuth("signin");
                }}
              >
                ログイン
              </Button>
              <Button
                variant="outline"
                disabled={loading}
                onClick={() => {
                  void handleAuth("signup");
                }}
              >
                新規登録
              </Button>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              disabled={loading}
              onClick={() => {
                void handleGoogleSignIn();
              }}
            >
              Google でログイン
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>グループ設定</CardTitle>
            <CardDescription>
              家計簿を新規作成するか、招待コードで参加してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">新規作成</TabsTrigger>
                <TabsTrigger value="join">参加</TabsTrigger>
              </TabsList>
              <TabsContent value="create" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="create-display-name">あなたの表示名</Label>
                  <Input
                    id="create-display-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="例: たろう"
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">
                    支出の支払い者や精算メッセージに表示されます
                  </p>
                </div>
                <Button
                  className="w-full"
                  disabled={loading}
                  onClick={() => {
                    void handleCreateGroup();
                  }}
                >
                  グループを作成
                </Button>
              </TabsContent>
              <TabsContent value="join" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="join-display-name">あなたの表示名</Label>
                  <Input
                    id="join-display-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="例: はなこ"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-code">招待コード</Label>
                  <Input
                    id="invite-code"
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value)}
                    placeholder="例: ABC123"
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={loading}
                  onClick={() => {
                    void handleJoinGroup();
                  }}
                >
                  グループに参加
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
