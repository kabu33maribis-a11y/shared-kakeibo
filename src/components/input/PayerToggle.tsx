"use client";

import { cn } from "@/lib/utils";
import { MEMBER_KEYS, type MemberKey } from "@/types";

interface PayerToggleProps {
  value: MemberKey;
  labels: Record<MemberKey, string>;
  onChange: (value: MemberKey) => void;
}

export function PayerToggle({ value, labels, onChange }: PayerToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
      {MEMBER_KEYS.map((member) => (
        <button
          key={member}
          type="button"
          className={cn(
            "h-9 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-all",
            value === member && "bg-card text-primary shadow-sm",
          )}
          onClick={() => onChange(member)}
        >
          {labels[member]}
        </button>
      ))}
    </div>
  );
}
