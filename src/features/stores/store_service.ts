import {
  addDoc,
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
import type { Store } from "@/types";
import { validateStoreName } from "@/types";

function mapStoreDocument(
  id: string,
  data: Record<string, unknown>,
): Store {
  return {
    id,
    name: String(data.name ?? ""),
    createdAt: data.createdAt as Store["createdAt"],
  };
}

function storesCollection(groupId: string) {
  return collection(getFirestoreDb(), "groups", groupId, "stores");
}

export async function addStore(groupId: string, name: string): Promise<void> {
  const nameError = validateStoreName(name);
  if (nameError) {
    throw new Error(nameError);
  }

  await addDoc(storesCollection(groupId), {
    name: name.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function updateStore(
  groupId: string,
  storeId: string,
  name: string,
): Promise<void> {
  const nameError = validateStoreName(name);
  if (nameError) {
    throw new Error(nameError);
  }

  await updateDoc(doc(storesCollection(groupId), storeId), {
    name: name.trim(),
  });
}

export async function deleteStore(
  groupId: string,
  storeId: string,
): Promise<void> {
  await deleteDoc(doc(storesCollection(groupId), storeId));
}

export function subscribeStores(
  groupId: string,
  callback: (stores: Store[]) => void,
): Unsubscribe {
  const storesQuery = query(storesCollection(groupId), orderBy("name", "asc"));

  return onSnapshot(storesQuery, (snapshot) => {
    const stores = snapshot.docs.map((document) =>
      mapStoreDocument(document.id, document.data()),
    );
    callback(stores);
  });
}
