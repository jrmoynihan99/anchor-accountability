// hooks/usePendingPleas.ts
import { PleaData } from "@/components/morphing/messages/plea/PleaCard";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useBlockedByUsers } from "./useBlockedByUsers";
import { useBlockedUsers } from "./useBlockedUsers";

const MAX_RECENT_PLEAS = 20;

export function usePendingPleas() {
  const uid = auth.currentUser?.uid ?? null;

  const [pendingPleas, setPendingPleas] = useState<PleaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // who I blocked / who blocked me
  const { blockedUserIds, loading: blockedLoading } = useBlockedUsers();
  const { blockedByUserIds, loading: blockedByLoading } = useBlockedByUsers();

  // encouragement listeners
  const encouragementListenersRef = useRef<Record<string, Unsubscribe>>({});
  // base plea data (without encouragement counts)
  const currentPleasRef = useRef<
    Map<string, Omit<PleaData, "encouragementCount" | "hasUserResponded">>
  >(new Map());

  // Utility: hide if self OR blocked either direction
  const shouldHide = (authorUid: string) => {
    if (!uid) return true;
    if (authorUid === uid) return true;
    return blockedUserIds.has(authorUid) || blockedByUserIds.has(authorUid);
  };

  useEffect(() => {
    if (!uid) {
      setPendingPleas([]);
      setLoading(false);
      return;
    }

    // Wait for both block lists
    if (blockedLoading || blockedByLoading) return;

    const pleasQuery = query(
      collection(db, "pleas"),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc"),
      limit(MAX_RECENT_PLEAS)
    );

    const unsubPleas = onSnapshot(
      pleasQuery,
      (snapshot) => {
        const currentPleaIds = new Set(snapshot.docs.map((d) => d.id));

        // Clean up listeners for pleas no longer present
        Object.keys(encouragementListenersRef.current).forEach((pleaId) => {
          if (!currentPleaIds.has(pleaId)) {
            encouragementListenersRef.current[pleaId]?.();
            delete encouragementListenersRef.current[pleaId];
            currentPleasRef.current.delete(pleaId);
          }
        });

        // Rebuild base map (skip hidden)
        const newPleasMap = new Map<
          string,
          Omit<PleaData, "encouragementCount" | "hasUserResponded">
        >();

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as any;
          if (shouldHide(data.uid)) return;

          newPleasMap.set(doc.id, {
            id: doc.id,
            message: data.message || "",
            uid: data.uid,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          });
        });

        currentPleasRef.current = newPleasMap;

        // Ensure encouragement listeners for visible pleas
        snapshot.docs.forEach((doc) => {
          const data = doc.data() as any;
          const pleaId = doc.id;
          if (shouldHide(data.uid)) return;

          if (encouragementListenersRef.current[pleaId]) return;

          const encouragementsQuery = query(
            collection(db, "pleas", pleaId, "encouragements"),
            where("status", "==", "approved")
          );

          const unsub = onSnapshot(encouragementsQuery, (encSnap) => {
            const encouragementCount = encSnap.size;
            const hasUserResponded = encSnap.docs.some(
              (d) => (d.data() as any).helperUid === uid
            );

            setPendingPleas((old) => {
              const base = currentPleasRef.current.get(pleaId);
              if (!base) return old;

              // re-check hidden in case block lists changed
              if (shouldHide(base.uid)) return old;

              const others = old.filter((p) => p.id !== pleaId);
              const updated: PleaData = {
                ...base,
                encouragementCount,
                hasUserResponded,
              };

              const next = [...others, updated];
              // Sort: fewest encouragements first, then oldest first
              next.sort((a, b) =>
                a.encouragementCount !== b.encouragementCount
                  ? a.encouragementCount - b.encouragementCount
                  : a.createdAt.getTime() - b.createdAt.getTime()
              );
              return next;
            });
          });

          encouragementListenersRef.current[pleaId] = unsub;
        });

        // Prune state to current & visible
        setPendingPleas((old) =>
          old
            .filter((p) => currentPleaIds.has(p.id))
            .filter((p) => !shouldHide(p.uid))
        );

        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to pending pleas:", err);
        setError("Failed to load pending requests");
        setLoading(false);
      }
    );

    return () => {
      unsubPleas();
      Object.values(encouragementListenersRef.current).forEach((unsub) =>
        unsub()
      );
      encouragementListenersRef.current = {};
      currentPleasRef.current.clear();
    };
  }, [
    uid,
    blockedLoading,
    blockedByLoading,
    // When either set changes, rebuild listeners/filters
    blockedUserIds,
    blockedByUserIds,
  ]);

  return {
    pendingPleas,
    loading: loading || blockedLoading || blockedByLoading,
    error,
  };
}
