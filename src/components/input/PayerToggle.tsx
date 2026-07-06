"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MEMBER_KEYS, type MemberKey } from "@/types";

interface PayerToggleProps {
  value: MemberKey;
  labels: Record<MemberKey, string>;
  onChange: (value: MemberKey) => void;
}

export function PayerToggle({ value, labels, onChange }: PayerToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {MEMBER_KEYS.map((member) => (
        <Button
          key={member}
          type="button"
          variant={value === member ? "default" : "outline"}
          className={cn("h-9 text-sm", value === member && "shadow-sm")}
          onClick={() => onChange(member)}
        >
          {labels[member]}
        </Button>
      ))}
    </div>
  );
}
