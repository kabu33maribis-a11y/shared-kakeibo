"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, Ellipsis, History, Home, ShieldCheck } from "lucide-react";
import { useAuth } from "@/features/auth/auth_context";
import { cn } from "@/lib/utils";

const NAV_GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

export function AppNav() {
  const pathname = usePathname();
  const { isAdmin, group } = useAuth();

  const navItems = [
    ...(group
      ? [
          { href: "/dashboard", label: "ホーム", icon: Home },
          { href: "/history", label: "履歴", icon: History },
          { href: "/stats", label: "統計", icon: ChartColumn },
          { href: "/others", label: "その他", icon: Ellipsis },
        ]
      : []),
    ...(isAdmin ? [{ href: "/admin", label: "管理", icon: ShieldCheck }] : []),
  ];

  if (navItems.length === 0) {
    return null;
  }

  return (
    <nav className="bg-background/70 backdrop-blur-xl">
      <div
        className={cn(
          "mx-auto grid max-w-lg gap-1 rounded-b-2xl bg-muted/70 p-1.5",
          NAV_GRID_COLS[navItems.length] ?? "grid-cols-4",
        )}
      >
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center gap-1 rounded-xl py-2 text-center font-medium transition-all",
                navItems.length >= 5
                  ? "flex-col gap-0.5 px-1 text-[11px]"
                  : "gap-1.5 px-3 text-sm",
                active
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
