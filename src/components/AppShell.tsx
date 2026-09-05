"use client";

import { useEffect, type ReactNode } from "react";
import { AppNav } from "@/components/AppNav";

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    document.title = `${title} · 共有家計簿`;
  }, [title]);

  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <header className="sticky top-0 z-10 bg-background/85 shadow-[0_1px_0_rgb(0_0_0/0.04)] backdrop-blur-xl">
        <AppNav />
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 px-4 py-4 pb-8">
        <h1 className="sr-only">{title}</h1>
        {children}
      </main>
    </div>
  );
}
