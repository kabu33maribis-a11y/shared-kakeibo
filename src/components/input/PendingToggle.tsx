"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PendingToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function PendingToggle({ checked, onChange }: PendingToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-amber-50/80 px-2.5 py-1.5">
      <Label htmlFor="pending-toggle" className="text-xs">
        未確定（仮登録）
      </Label>
      <Switch
        id="pending-toggle"
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}
