"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CATEGORY_META,
  type ExpenseCategory,
} from "@/types";

interface CategoryGridProps {
  value: ExpenseCategory;
  onChange: (value: ExpenseCategory) => void;
}

const CATEGORIES = Object.entries(CATEGORY_META) as [
  ExpenseCategory,
  (typeof CATEGORY_META)[ExpenseCategory],
][];

export function CategoryGrid({ value, onChange }: CategoryGridProps) {
  return (
    <div className="flex gap-1">
      {CATEGORIES.map(([key, meta]) => (
        <Button
          key={key}
          type="button"
          variant={value === key ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-8 min-w-0 flex-1 px-1 text-xs",
            value === key && "shadow-sm",
          )}
          onClick={() => onChange(key)}
        >
          <span className="mr-0.5 shrink-0">{meta.emoji}</span>
          <span className="truncate">{meta.label}</span>
        </Button>
      ))}
    </div>
  );
}
