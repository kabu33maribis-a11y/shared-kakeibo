"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth_context";

const PUBLIC_PATHS = ["/"];

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, group, loading, firebaseReady, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!firebaseReady) {
      return;
    }

    if (!user && !PUBLIC_PATHS.includes(pathname)) {
      router.replace("/");
      return;
    }

    if (user && pathname.startsWith("/admin")) {
      if (!isAdmin) {
        router.replace(group ? "/dashboard" : "/");
      }
      return;
    }

    if (user && group && pathname === "/") {
      router.replace("/dashboard");
      return;
    }

    if (user && !group && pathname !== "/") {
      router.replace("/");
    }
  }, [user, group, loading, firebaseReady, isAdmin, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-svh flex-1 items-center justify-center p-8 text-base text-muted-foreground">
        読み込み中...
      </div>
    );
  }

  if (!firebaseReady && pathname !== "/") {
    return (
      <div className="flex min-h-svh flex-1 items-center justify-center p-8 text-base text-destructive">
        Firebase の設定がありません。.env.local を確認してください。
      </div>
    );
  }

  return <>{children}</>;
}
