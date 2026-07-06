import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import type { Expense, ExpenseInput } from "@/types";
import { normalizeMemberKey } from "@/types";

function mapExpenseDocument(
  id: string,
  data: Record<string, unknown>,
): Expense {
  return {
    id,
    date: String(data.date ?? ""),
    category: data.category as Expense["category"],
    title: String(data.title ?? ""),
    amount: Number(data.amount ?? 0),
    paidBy: normalizeMemberKey(data.paidBy) ?? "member1",
    isPending: Boolean(data.isPending),
    note: data.note ? String(data.note) : undefined,
    createdAt: data.createdAt as Expense["createdAt"],
  };
}

export async function deleteExpense(groupId: string, expenseId: string) {
  const expenseRef = doc(
    getFirestoreDb(),
    "groups",
    groupId,
    "expenses",
    expenseId,
  );

  await deleteDoc(expenseRef);
}

export async function addExpense(groupId: string, input: ExpenseInput) {
  const expensesRef = collection(
    getFirestoreDb(),
    "groups",
    groupId,
    "expenses",
  );

  await addDoc(expensesRef, {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export function subscribeExpenses(
  groupId: string,
  callback: (expenses: Expense[]) => void,
): Unsubscribe {
  const expensesRef = collection(
    getFirestoreDb(),
    "groups",
    groupId,
    "expenses",
  );
  const expensesQuery = query(expensesRef, orderBy("date", "desc"));

  return onSnapshot(expensesQuery, (snapshot) => {
    const expenses = snapshot.docs.map((document) =>
      mapExpenseDocument(document.id, document.data()),
    );
    callback(expenses);
  });
}

export { countPending } from "@/features/expenses/settlement";
