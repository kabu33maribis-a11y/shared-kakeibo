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
import { subscribeToAuth } from "@/features/auth/auth_service";
import {
  findGroupByMemberUid,
  getMemberKeyForUid,
} from "@/features/auth/group_service";
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

  const expenses = useMemo(
    () => (group ? rawExpenses : []),
    [group, rawExpenses],
  );

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
      setUser(nextUser);

      if (!nextUser) {
        setGroup(null);
        setRawExpenses([]);
        setLoading(false);
        return;
      }

      const nextGroup = await findGroupByMemberUid(nextUser.uid);
      setGroup(nextGroup);
      setLoading(false);
    });

    return unsubscribe;
  }, [firebaseReady]);

  useEffect(() => {
    if (!group) {
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
      refreshGroup,
      setGroup,
    }),
    [user, group, memberKey, memberLabels, expenses, loading, firebaseReady, refreshGroup],
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
