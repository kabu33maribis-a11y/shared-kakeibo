import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import type { Group, GroupMembers, MemberDisplayNames, MemberKey } from "@/types";
import { validateDisplayName } from "@/types";

const INVITE_CODE_LENGTH = 6;
const INVITE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(): string {
  let code = "";
  for (let index = 0; index < INVITE_CODE_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * INVITE_CHARSET.length);
    code += INVITE_CHARSET[randomIndex];
  }
  return code;
}

async function isInviteCodeTaken(code: string): Promise<boolean> {
  const groupsRef = collection(getFirestoreDb(), "groups");
  const snapshot = await getDocs(
    query(groupsRef, where("inviteCode", "==", code)),
  );
  return !snapshot.empty;
}

async function createUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = generateInviteCode();
    if (!(await isInviteCodeTaken(code))) {
      return code;
    }
  }

  throw new Error("招待コードの生成に失敗しました。もう一度お試しください。");
}

function mapMembers(data: Record<string, unknown> | undefined): GroupMembers {
  const members = data as Record<string, string | null> | undefined;
  return {
    member1: members?.member1 ?? members?.kai ?? null,
    member2: members?.member2 ?? members?.miyuu ?? null,
  };
}

function mapDisplayNames(
  data: Record<string, unknown> | undefined,
): MemberDisplayNames {
  const displayNames = data as Record<string, string> | undefined;
  return {
    member1: displayNames?.member1 ?? displayNames?.kai ?? "",
    member2: displayNames?.member2 ?? displayNames?.miyuu ?? "",
  };
}

function mapGroupDocument(
  id: string,
  data: Record<string, unknown>,
): Group {
  return {
    id,
    members: mapMembers(data.members as Record<string, unknown> | undefined),
    displayNames: mapDisplayNames(
      data.displayNames as Record<string, unknown> | undefined,
    ),
    inviteCode: String(data.inviteCode ?? ""),
    createdAt: data.createdAt as Timestamp,
  };
}

export function getMemberKeyForUid(
  group: Group,
  uid: string,
): MemberKey | null {
  if (group.members.member1 === uid) {
    return "member1";
  }
  if (group.members.member2 === uid) {
    return "member2";
  }
  return null;
}

export async function findGroupByMemberUid(uid: string): Promise<Group | null> {
  const groupsRef = collection(getFirestoreDb(), "groups");
  const [member1Snapshot, member2Snapshot, legacy1Snapshot, legacy2Snapshot] =
    await Promise.all([
      getDocs(query(groupsRef, where("members.member1", "==", uid))),
      getDocs(query(groupsRef, where("members.member2", "==", uid))),
      getDocs(query(groupsRef, where("members.kai", "==", uid))),
      getDocs(query(groupsRef, where("members.miyuu", "==", uid))),
    ]);

  const docSnapshot =
    member1Snapshot.docs[0] ??
    member2Snapshot.docs[0] ??
    legacy1Snapshot.docs[0] ??
    legacy2Snapshot.docs[0];
  if (!docSnapshot) {
    return null;
  }

  return mapGroupDocument(docSnapshot.id, docSnapshot.data());
}

export async function listAllGroups(): Promise<Group[]> {
  const snapshot = await getDocs(collection(getFirestoreDb(), "groups"));
  return snapshot.docs
    .map((document) => mapGroupDocument(document.id, document.data()))
    .sort((a, b) => a.inviteCode.localeCompare(b.inviteCode, "ja"));
}

export async function removeGroupMember(
  groupId: string,
  memberKey: MemberKey,
): Promise<void> {
  const groupRef = doc(getFirestoreDb(), "groups", groupId);

  await runTransaction(getFirestoreDb(), async (transaction) => {
    const snapshot = await transaction.get(groupRef);
    if (!snapshot.exists()) {
      throw new Error("グループが見つかりません。");
    }

    const group = mapGroupDocument(snapshot.id, snapshot.data());
    if (!group.members[memberKey]) {
      throw new Error("このメンバーは既に排除されています。");
    }

    transaction.update(groupRef, {
      members: {
        ...group.members,
        [memberKey]: null,
      },
      displayNames: {
        ...group.displayNames,
        [memberKey]: "",
      },
    });
  });
}

export async function createGroup(
  uid: string,
  displayName: string,
): Promise<Group> {
  const nameError = validateDisplayName(displayName);
  if (nameError) {
    throw new Error(nameError);
  }

  const inviteCode = await createUniqueInviteCode();
  const groupRef = doc(collection(getFirestoreDb(), "groups"));
  const members: GroupMembers = {
    member1: uid,
    member2: null,
  };
  const displayNames: MemberDisplayNames = {
    member1: displayName.trim(),
    member2: "",
  };

  await setDoc(groupRef, {
    members,
    displayNames,
    inviteCode,
    createdAt: serverTimestamp(),
  });

  const snapshot = await getDoc(groupRef);
  return mapGroupDocument(groupRef.id, snapshot.data() ?? {});
}

export async function joinGroupByInviteCode(
  uid: string,
  inviteCode: string,
  displayName: string,
): Promise<Group> {
  const nameError = validateDisplayName(displayName);
  if (nameError) {
    throw new Error(nameError);
  }

  const normalizedCode = inviteCode.trim().toUpperCase();
  const groupsRef = collection(getFirestoreDb(), "groups");
  const snapshot = await getDocs(
    query(groupsRef, where("inviteCode", "==", normalizedCode)),
  );

  if (snapshot.empty) {
    throw new Error("招待コードが見つかりません。");
  }

  const groupDoc = snapshot.docs[0];
  const group = mapGroupDocument(groupDoc.id, groupDoc.data());

  if (group.members.member1 === uid || group.members.member2 === uid) {
    return group;
  }

  if (group.members.member1 && group.members.member2) {
    throw new Error("このグループは既に2人で満員です。");
  }

  const updatedMembers: GroupMembers = { ...group.members };
  const updatedDisplayNames: MemberDisplayNames = { ...group.displayNames };
  const trimmedName = displayName.trim();

  if (!updatedMembers.member1) {
    updatedMembers.member1 = uid;
    updatedDisplayNames.member1 = trimmedName;
  } else if (!updatedMembers.member2) {
    updatedMembers.member2 = uid;
    updatedDisplayNames.member2 = trimmedName;
  }

  await updateDoc(doc(getFirestoreDb(), "groups", group.id), {
    members: updatedMembers,
    displayNames: updatedDisplayNames,
  });

  return {
    ...group,
    members: updatedMembers,
    displayNames: updatedDisplayNames,
  };
}

export async function updateMemberDisplayName(
  group: Group,
  memberKey: MemberKey,
  displayName: string,
): Promise<Group> {
  const nameError = validateDisplayName(displayName);
  if (nameError) {
    throw new Error(nameError);
  }

  const updatedDisplayNames: MemberDisplayNames = {
    ...group.displayNames,
    [memberKey]: displayName.trim(),
  };

  await updateDoc(doc(getFirestoreDb(), "groups", group.id), {
    displayNames: updatedDisplayNames,
  });

  return {
    ...group,
    displayNames: updatedDisplayNames,
  };
}

export async function getGroupById(groupId: string): Promise<Group | null> {
  const snapshot = await getDoc(doc(getFirestoreDb(), "groups", groupId));
  if (!snapshot.exists()) {
    return null;
  }

  return mapGroupDocument(snapshot.id, snapshot.data());
}
