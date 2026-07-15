"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PendingToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function PendingToggle({ checked, onChange }: PendingToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-warning/70 bg-warning/60 px-3 py-2.5">
      <div>
        <Label htmlFor="pending-toggle" className="text-xs font-semibold text-warning-foreground">
          未確定として保存
        </Label>
        <p className="mt-0.5 text-[10px] text-warning-foreground/70">
          金額が決まっていない支出
        </p>
      </div>
      <Switch
        id="pending-toggle"
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}
