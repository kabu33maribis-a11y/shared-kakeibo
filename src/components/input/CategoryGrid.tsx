"use client";

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
    <div className="grid grid-cols-5 gap-1.5">
      {CATEGORIES.map(([key, meta]) => (
        <button
          key={key}
          type="button"
          className={cn(
            "flex min-w-0 flex-col items-center gap-1 rounded-xl border border-transparent bg-muted/60 px-1 py-2 text-[11px] font-medium text-muted-foreground transition-all sm:px-1.5 sm:text-xs",
            value === key &&
              "border-primary/20 bg-primary/10 text-primary shadow-sm",
          )}
          onClick={() => onChange(key)}
        >
          <span className="text-base leading-none sm:text-lg">{meta.emoji}</span>
          <span className="truncate">{meta.label}</span>
        </button>
      ))}
    </div>
  );
}
