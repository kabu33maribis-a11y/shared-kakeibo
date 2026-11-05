"use client";

import { AppShell } from "@/components/AppShell";
import { AccountPanel } from "@/components/others/AccountPanel";
import { FixedCostMaster } from "@/components/others/FixedCostMaster";
import { StoreMaster } from "@/components/others/StoreMaster";

export default function OthersPage() {
  return (
    <AppShell title="その他">
      <AccountPanel />
      <FixedCostMaster />
      <StoreMaster />
    </AppShell>
  );
}
