import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
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
  await addExpenses(groupId, [input]);
}

export async function addExpenses(groupId: string, inputs: ExpenseInput[]) {
  if (inputs.length === 0) {
    return;
  }
  if (inputs.length > 500) {
    throw new Error("一度に保存できる支出は500件までです。");
  }

  const db = getFirestoreDb();
  const expensesRef = collection(
    db,
    "groups",
    groupId,
    "expenses",
  );
  const batch = writeBatch(db);

  inputs.forEach((input) => {
    const { note, ...requiredFields } = input;
    batch.set(doc(expensesRef), {
      ...requiredFields,
      ...(note === undefined ? {} : { note }),
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
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
