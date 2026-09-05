"use client";

import { AppShell } from "@/components/AppShell";
import { AccountPanel } from "@/components/others/AccountPanel";
import { StoreMaster } from "@/components/others/StoreMaster";

export default function OthersPage() {
  return (
    <AppShell title="その他">
      <AccountPanel />
      <StoreMaster />
    </AppShell>
  );
}
