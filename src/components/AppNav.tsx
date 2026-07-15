"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/auth_context";
import { cn } from "@/lib/utils";

export function AppNav() {
  const pathname = usePathname();
  const { isAdmin, group } = useAuth();

  const navItems = [
    ...(group
      ? [
          { href: "/dashboard", label: "ホーム" },
          { href: "/history", label: "履歴" },
        ]
      : []),
    ...(isAdmin ? [{ href: "/admin", label: "管理" }] : []),
  ];

  if (navItems.length === 0) {
    return null;
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div
        className={cn(
          "mx-auto grid max-w-lg gap-1 px-2 py-1",
          navItems.length >= 3
            ? "grid-cols-3"
            : navItems.length === 1
              ? "grid-cols-1"
              : "grid-cols-2",
        )}
      >
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
