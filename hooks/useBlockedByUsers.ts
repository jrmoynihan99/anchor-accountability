// hooks/useBlockedByUsers.ts
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Realtime list of users who have blocked YOU, via /users/{you}/blockedBy/*
 * (Mirrored by Cloud Functions; clients must not write here.)
 */
export function useBlockedByUsers() {
  const uid = auth.currentUser?.uid ?? null;
  const [blockedByUserIds, setBlockedByUserIds] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setBlockedByUserIds(new Set());
      setLoading(false);
      return;
    }

    const colRef = collection(db, "users", uid, "blockedBy");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const ids = new Set<string>();
        snap.forEach((d) => ids.add(d.id)); // doc.id == blocker uid
        setBlockedByUserIds(ids);
        setLoading(false);
      },
      (err) => {
        console.error("[useBlockedByUsers] onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const isBlockedBy = useCallback(
    (userId: string) => blockedByUserIds.has(userId),
    [blockedByUserIds]
  );

  const blockedByIdsArray = useMemo(
    () => Array.from(blockedByUserIds),
    [blockedByUserIds]
  );

  return { blockedByUserIds, blockedByIdsArray, loading, isBlockedBy } as const;
}
