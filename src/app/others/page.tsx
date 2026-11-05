"use client";

import { AppShell } from "@/components/AppShell";
import { FixedCostMaster } from "@/components/others/FixedCostMaster";
import { StoreMaster } from "@/components/others/StoreMaster";

export default function OthersPage() {
  return (
    <AppShell title="その他">
      <FixedCostMaster />
      <StoreMaster />
    </AppShell>
  );
}
