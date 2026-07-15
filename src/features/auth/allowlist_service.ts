import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import type { AllowedEmail } from "@/types";
import { normalizeEmail, validateEmail } from "@/types";

function mapAllowedEmail(
  id: string,
  data: Record<string, unknown>,
): AllowedEmail {
  return {
    id,
    email: String(data.email ?? id),
    createdAt: (data.createdAt as Timestamp | null) ?? null,
    createdBy: data.createdBy ? String(data.createdBy) : null,
    note: data.note ? String(data.note) : undefined,
  };
}

export async function isEmailAllowed(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }

  const snapshot = await getDoc(
    doc(getFirestoreDb(), "allowedEmails", normalized),
  );
  return snapshot.exists();
}

export async function listAllowedEmails(): Promise<AllowedEmail[]> {
  const snapshot = await getDocs(collection(getFirestoreDb(), "allowedEmails"));
  return snapshot.docs
    .map((document) => mapAllowedEmail(document.id, document.data()))
    .sort((a, b) => a.email.localeCompare(b.email, "ja"));
}

export async function addAllowedEmail(
  email: string,
  createdBy: string,
  note?: string,
): Promise<AllowedEmail> {
  const emailError = validateEmail(email);
  if (emailError) {
    throw new Error(emailError);
  }

  const normalized = normalizeEmail(email);
  const ref = doc(getFirestoreDb(), "allowedEmails", normalized);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error("このメールアドレスは既に許可されています。");
  }

  await setDoc(ref, {
    email: normalized,
    createdAt: serverTimestamp(),
    createdBy,
    note: note?.trim() || null,
  });

  const snapshot = await getDoc(ref);
  return mapAllowedEmail(ref.id, snapshot.data() ?? { email: normalized });
}

export async function removeAllowedEmail(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  await deleteDoc(doc(getFirestoreDb(), "allowedEmails", normalized));
}
