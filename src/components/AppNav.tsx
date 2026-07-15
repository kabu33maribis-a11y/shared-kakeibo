"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Home, ShieldCheck } from "lucide-react";
import { useAuth } from "@/features/auth/auth_context";
import { cn } from "@/lib/utils";

export function AppNav() {
  const pathname = usePathname();
  const { isAdmin, group } = useAuth();

  const navItems = [
    ...(group
      ? [
          { href: "/dashboard", label: "ホーム", icon: Home },
          { href: "/history", label: "履歴", icon: History },
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
          navItems.length >= 3
            ? "grid-cols-3"
            : navItems.length === 1
              ? "grid-cols-1"
              : "grid-cols-2",
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
                "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-center text-sm font-medium transition-all",
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
