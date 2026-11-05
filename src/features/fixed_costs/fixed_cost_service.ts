import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import type { Expense, ExpenseCategory, FixedCost, MemberKey } from "@/types";
import { normalizeMemberKey, validateFixedCostName } from "@/types";

function fixedCostsCollection(groupId: string) {
  return collection(getFirestoreDb(), "groups", groupId, "fixedCosts");
}

function mapFixedCost(id: string, data: Record<string, unknown>): FixedCost {
  return {
    id,
    name: String(data.name ?? ""),
    amount: Number(data.amount ?? 0),
    category: (data.category as ExpenseCategory) ?? "utility",
    paidBy: normalizeMemberKey(data.paidBy) ?? "member1",
    skippedMonths: Array.isArray(data.skippedMonths)
      ? data.skippedMonths.map(String)
      : [],
    createdAt: data.createdAt as FixedCost["createdAt"],
  };
}

export async function addFixedCost(
  groupId: string,
  input: {
    name: string;
    amount: number;
    category: ExpenseCategory;
    paidBy: MemberKey;
  },
): Promise<void> {
  const error = validateFixedCostName(input.name);
  if (error) {
    throw new Error(error);
  }

  await addDoc(fixedCostsCollection(groupId), {
    name: input.name.trim(),
    amount: input.amount,
    category: input.category,
    paidBy: input.paidBy,
    skippedMonths: [],
    createdAt: serverTimestamp(),
  });
}

export async function deleteFixedCost(
  groupId: string,
  id: string,
): Promise<void> {
  await deleteDoc(doc(fixedCostsCollection(groupId), id));
}

export async function skipFixedCost(
  groupId: string,
  id: string,
  yearMonth: string,
): Promise<void> {
  await updateDoc(doc(fixedCostsCollection(groupId), id), {
    skippedMonths: arrayUnion(yearMonth),
  });
}

export async function unskipFixedCost(
  groupId: string,
  id: string,
  yearMonth: string,
): Promise<void> {
  await updateDoc(doc(fixedCostsCollection(groupId), id), {
    skippedMonths: arrayRemove(yearMonth),
  });
}

export function subscribeFixedCosts(
  groupId: string,
  callback: (costs: FixedCost[]) => void,
): Unsubscribe {
  const q = query(fixedCostsCollection(groupId), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => mapFixedCost(d.id, d.data())));
  });
}

/** その月に未記入かつ未スキップの固定費 */
export function pendingFixedCosts(
  costs: FixedCost[],
  monthlyExpenses: Expense[],
  yearMonth: string,
): FixedCost[] {
  const recorded = new Set(monthlyExpenses.map((e) => e.title));
  return costs.filter(
    (cost) =>
      !cost.skippedMonths.includes(yearMonth) && !recorded.has(cost.name),
  );
}
