"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { signOutUser, subscribeToAuth } from "@/features/auth/auth_service";
import { isEmailAllowed } from "@/features/auth/allowlist_service";
import {
  findGroupByMemberUid,
  getMemberKeyForUid,
} from "@/features/auth/group_service";
import {
  isAdminEmail,
  upsertUserProfile,
} from "@/features/auth/user_service";
import { subscribeExpenses } from "@/features/expenses/expense_service";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { Expense, Group, MemberKey } from "@/types";
import { getMemberLabels } from "@/types";

interface AuthContextValue {
  user: User | null;
  group: Group | null;
  memberKey: MemberKey | null;
  memberLabels: Record<MemberKey, string>;
  expenses: Expense[];
  loading: boolean;
  firebaseReady: boolean;
  isAdmin: boolean;
  accessDeniedMessage: string | null;
  clearAccessDeniedMessage: () => void;
  refreshGroup: () => Promise<void>;
  setGroup: (group: Group | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const firebaseReady = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [rawExpenses, setRawExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(firebaseReady);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(
    null,
  );

  const expenses = useMemo(
    () => (group ? rawExpenses : []),
    [group, rawExpenses],
  );

  const clearAccessDeniedMessage = useCallback(() => {
    setAccessDeniedMessage(null);
  }, []);

  const refreshGroup = useCallback(async () => {
    if (!user) {
      setGroup(null);
      return;
    }

    const nextGroup = await findGroupByMemberUid(user.uid);
    setGroup(nextGroup);
  }, [user]);

  useEffect(() => {
    if (!firebaseReady) {
      return;
    }

    const unsubscribe = subscribeToAuth(async (nextUser) => {
      setLoading(true);

      if (!nextUser) {
        setUser(null);
        setGroup(null);
        setRawExpenses([]);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (!nextUser.email) {
        setAccessDeniedMessage(
          "メールアドレスが取得できないためログインできません。",
        );
        setUser(null);
        setGroup(null);
        setIsAdmin(false);
        await signOutUser();
        setLoading(false);
        return;
      }

      try {
        const allowed = await isEmailAllowed(nextUser.email);
        if (!allowed) {
          setAccessDeniedMessage(
            `「${nextUser.email}」は許可されていません。管理者に連絡してください。`,
          );
          setUser(null);
          setGroup(null);
          setIsAdmin(false);
          await signOutUser();
          setLoading(false);
          return;
        }

        await upsertUserProfile(nextUser);
        const admin = await isAdminEmail(nextUser.email);
        const nextGroup = await findGroupByMemberUid(nextUser.uid);

        setAccessDeniedMessage(null);
        setIsAdmin(admin);
        setUser(nextUser);
        setGroup(nextGroup);
      } catch (error) {
        console.error(error);
        setAccessDeniedMessage(
          "アクセス確認に失敗しました。しばらくしてから再度お試しください。",
        );
        setUser(null);
        setGroup(null);
        setIsAdmin(false);
        await signOutUser();
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [firebaseReady]);

  useEffect(() => {
    if (!group) {
      setRawExpenses([]);
      return;
    }

    const unsubscribe = subscribeExpenses(group.id, setRawExpenses);
    return unsubscribe;
  }, [group]);

  const memberKey = useMemo(() => {
    if (!user || !group) {
      return null;
    }
    return getMemberKeyForUid(group, user.uid);
  }, [group, user]);

  const memberLabels = useMemo(() => getMemberLabels(group), [group]);

  const value = useMemo(
    () => ({
      user,
      group,
      memberKey,
      memberLabels,
      expenses,
      loading,
      firebaseReady,
      isAdmin,
      accessDeniedMessage,
      clearAccessDeniedMessage,
      refreshGroup,
      setGroup,
    }),
    [
      user,
      group,
      memberKey,
      memberLabels,
      expenses,
      loading,
      firebaseReady,
      isAdmin,
      accessDeniedMessage,
      clearAccessDeniedMessage,
      refreshGroup,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
