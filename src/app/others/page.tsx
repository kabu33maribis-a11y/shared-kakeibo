"use client";

import { AppShell } from "@/components/AppShell";
import { StoreMaster } from "@/components/others/StoreMaster";

export default function OthersPage() {
  return (
    <AppShell title="その他">
      <StoreMaster />
    </AppShell>
  );
}
