// hooks/useBlockedUsers.ts
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useBlockedUsers() {
  const uid = auth.currentUser?.uid ?? null;
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Signed out: clear and stop
    if (!uid) {
      setBlockedUserIds(new Set());
      setLoading(false);
      return;
    }

    const blockListRef = collection(db, "users", uid, "blockList");
    const unsubscribe = onSnapshot(
      blockListRef,
      (snapshot) => {
        const ids = new Set<string>();
        snapshot.forEach((doc) => {
          // Rules enforce blockId === uid, so use the doc id as source of truth
          ids.add(doc.id);
        });
        setBlockedUserIds(ids);
        setLoading(false);
      },
      (error) => {
        console.error("[useBlockedUsers] onSnapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const isBlocked = useCallback(
    (userId: string) => blockedUserIds.has(userId),
    [blockedUserIds]
  );

  const filterBlocked = useCallback(
    <T extends { uid?: string; userId?: string }>(items: T[]) =>
      items.filter((item) => {
        const id = (item.uid ?? item.userId) as string | undefined;
        return !id || !blockedUserIds.has(id);
      }),
    [blockedUserIds]
  );

  // In case callers want an array for rendering keys, etc.
  const blockedIdsArray = useMemo(
    () => Array.from(blockedUserIds),
    [blockedUserIds]
  );

  return {
    blockedUserIds, // Set<string>
    blockedIdsArray, // string[]
    loading,
    isBlocked,
    filterBlocked,
  } as const;
}
