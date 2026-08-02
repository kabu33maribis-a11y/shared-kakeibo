import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

export async function signUpWithEmail(email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );
  return credential.user;
}

export async function signInWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );
  return credential.user;
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
}

export async function signOutUser() {
  await signOut(getFirebaseAuth());
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}
