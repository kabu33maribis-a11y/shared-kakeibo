import type { Timestamp } from "firebase/firestore";

export type MemberKey = "member1" | "member2";

export const MEMBER_KEYS: MemberKey[] = ["member1", "member2"];

export type ExpenseCategory =
  | "lifestyle"
  | "food"
  | "furniture"
  | "utility"
  | "other";

export interface GroupMembers {
  member1: string | null;
  member2: string | null;
}

export interface MemberDisplayNames {
  member1: string;
  member2: string;
}

export interface Group {
  id: string;
  members: GroupMembers;
  displayNames: MemberDisplayNames;
  inviteCode: string;
  createdAt: Timestamp;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  paidBy: MemberKey;
  note?: string;
  createdAt: Timestamp;
}

export type ExpenseInput = Omit<Expense, "id" | "createdAt">;

export interface SettlementResult {
  totalMember1: number;
  totalMember2: number;
  totalAll: number;
  target: number;
  amount: number;
  from: MemberKey | null;
  to: MemberKey | null;
}

export const FALLBACK_MEMBER_LABELS: Record<MemberKey, string> = {
  member1: "メンバー1",
  member2: "メンバー2",
};

const LEGACY_MEMBER_KEY_MAP: Record<string, MemberKey> = {
  kai: "member1",
  miyuu: "member2",
};

export function normalizeMemberKey(value: unknown): MemberKey | null {
  if (value === "member1" || value === "member2") {
    return value;
  }
  if (typeof value === "string" && value in LEGACY_MEMBER_KEY_MAP) {
    return LEGACY_MEMBER_KEY_MAP[value];
  }
  return null;
}

export function getOtherMemberKey(memberKey: MemberKey): MemberKey {
  return memberKey === "member1" ? "member2" : "member1";
}

export function getMemberLabels(
  group: Group | null,
): Record<MemberKey, string> {
  if (!group?.displayNames) {
    return FALLBACK_MEMBER_LABELS;
  }

  return {
    member1:
      group.displayNames.member1.trim() || FALLBACK_MEMBER_LABELS.member1,
    member2:
      group.displayNames.member2.trim() || FALLBACK_MEMBER_LABELS.member2,
  };
}

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "表示名を入力してください";
  }
  if (trimmed.length > 20) {
    return "表示名は20文字以内で入力してください";
  }
  return null;
}

export const CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; emoji: string }
> = {
  lifestyle: { label: "生活用品", emoji: "🏠" },
  food: { label: "食費", emoji: "🍚" },
  furniture: { label: "家具・家電", emoji: "🛋️" },
  utility: { label: "光熱費", emoji: "💡" },
  other: { label: "その他", emoji: "🧺" },
};

export type HistoryFilter = "all" | MemberKey;

export interface Store {
  id: string;
  name: string;
  createdAt: Timestamp;
}

export type StoreInput = Omit<Store, "id" | "createdAt">;

export function validateStoreName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "店名を入力してください";
  }
  if (trimmed.length > 40) {
    return "店名は40文字以内で入力してください";
  }
  return null;
}

export interface AppConfig {
  adminEmails: string[];
}

export interface AllowedEmail {
  id: string;
  email: string;
  createdAt: Timestamp | null;
  createdBy: string | null;
  note?: string;
}

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: Timestamp | null;
  lastLoginAt: Timestamp | null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return "メールアドレスを入力してください";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return "メールアドレスの形式が正しくありません";
  }
  return null;
}
