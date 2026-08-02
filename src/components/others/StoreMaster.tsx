"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth_context";
import {
  addStore,
  deleteStore,
  subscribeStores,
  updateStore,
} from "@/features/stores/store_service";
import type { Store } from "@/types";
import { validateStoreName } from "@/types";

export function StoreMaster() {
  const { group } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!group) {
      setStores([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeStores(group.id, (nextStores) => {
      setStores(nextStores);
      setLoading(false);
    });

    return unsubscribe;
  }, [group]);

  const handleAdd = async () => {
    if (!group) {
      return;
    }

    const validationError = validateStoreName(nameInput);
    if (validationError) {
      setError(validationError);
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await addStore(group.id, nameInput);
      setNameInput("");
      setMessage("店を追加しました。");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "店の追加に失敗しました。",
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (store: Store) => {
    setEditingId(store.id);
    setEditInput(store.name);
    setError(null);
    setMessage(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditInput("");
  };

  const handleUpdate = async () => {
    if (!group || !editingId) {
      return;
    }

    const validationError = validateStoreName(editInput);
    if (validationError) {
      setError(validationError);
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await updateStore(group.id, editingId, editInput);
      setEditingId(null);
      setEditInput("");
      setMessage("店名を更新しました。");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "店名の更新に失敗しました。",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (store: Store) => {
    if (!group) {
      return;
    }

    if (!window.confirm(`「${store.name}」を削除しますか？`)) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await deleteStore(group.id, store.id);
      if (editingId === store.id) {
        cancelEditing();
      }
      setMessage("店を削除しました。");
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "店の削除に失敗しました。",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Card size="sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">よく行く店を追加</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-2">
          <div className="space-y-1">
            <Label htmlFor="store-name" className="text-xs">
              店名
            </Label>
            <Input
              id="store-name"
              className="h-9"
              value={nameInput}
              maxLength={40}
              onChange={(event) => setNameInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleAdd();
                }
              }}
              placeholder="例: イオン / 業務スーパー"
            />
          </div>
          <Button
            size="sm"
            className="w-full"
            disabled={saving || !nameInput.trim()}
            onClick={() => {
              void handleAdd();
            }}
          >
            <Plus className="size-4" />
            {saving ? "処理中..." : "追加する"}
          </Button>
        </CardContent>
      </Card>

      {message && (
        <p className="rounded-xl bg-muted px-3 py-2 text-xs">{message}</p>
      )}
      {error && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <Card size="sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">店リスト（{stores.length}）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-2">
          {loading ? (
            <p className="text-xs text-muted-foreground">読み込み中...</p>
          ) : stores.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              まだ店が登録されていません
            </p>
          ) : (
            stores.map((store) => (
              <div
                key={store.id}
                className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2"
              >
                {editingId === store.id ? (
                  <div className="space-y-2">
                    <Input
                      className="h-8"
                      value={editInput}
                      maxLength={40}
                      onChange={(event) => setEditInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleUpdate();
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 flex-1"
                        disabled={saving}
                        onClick={() => {
                          void handleUpdate();
                        }}
                      >
                        保存
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 flex-1"
                        disabled={saving}
                        onClick={cancelEditing}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium">
                      {store.name}
                    </p>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        className="text-muted-foreground"
                        disabled={saving}
                        onClick={() => startEditing(store)}
                        aria-label={`${store.name} を編集`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        disabled={saving}
                        onClick={() => {
                          void handleDelete(store);
                        }}
                        aria-label={`${store.name} を削除`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
