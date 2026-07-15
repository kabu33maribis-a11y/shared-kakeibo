import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirestoreDb } from "@/lib/firebase";
import type { AppConfig, AppUser } from "@/types";
import { normalizeEmail } from "@/types";

function mapAppUser(id: string, data: Record<string, unknown>): AppUser {
  return {
    id,
    email: String(data.email ?? ""),
    displayName: String(data.displayName ?? ""),
    createdAt: (data.createdAt as Timestamp | null) ?? null,
    lastLoginAt: (data.lastLoginAt as Timestamp | null) ?? null,
  };
}

export async function getAppConfig(): Promise<AppConfig | null> {
  const snapshot = await getDoc(doc(getFirestoreDb(), "config", "app"));
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  const adminEmails = Array.isArray(data.adminEmails)
    ? data.adminEmails.map((email: unknown) => normalizeEmail(String(email)))
    : [];

  return { adminEmails };
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) {
    return false;
  }

  const config = await getAppConfig();
  if (!config) {
    return false;
  }

  return config.adminEmails.includes(normalizeEmail(email));
}

export async function upsertUserProfile(user: User): Promise<void> {
  if (!user.email) {
    return;
  }

  const ref = doc(getFirestoreDb(), "users", user.uid);
  const existing = await getDoc(ref);
  const email = normalizeEmail(user.email);
  const displayName = user.displayName?.trim() || email.split("@")[0] || "";

  if (existing.exists()) {
    await setDoc(
      ref,
      {
        email,
        displayName,
        lastLoginAt: serverTimestamp(),
      },
      { merge: true },
    );
    return;
  }

  await setDoc(ref, {
    email,
    displayName,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
}

export async function listAppUsers(): Promise<AppUser[]> {
  const snapshot = await getDocs(collection(getFirestoreDb(), "users"));
  return snapshot.docs
    .map((document) => mapAppUser(document.id, document.data()))
    .sort((a, b) => a.email.localeCompare(b.email, "ja"));
}

export function formatTimestamp(value: Timestamp | null): string {
  if (!value) {
    return "—";
  }

  return value.toDate().toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
