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

  // block lists
  const { blockedUserIds, loading: blockedLoading } = useBlockedUsers();
  const { blockedByUserIds, loading: blockedByLoading } = useBlockedByUsers();

  const encouragementListenersRef = useRef<Record<string, Unsubscribe>>({});
  const currentPleasRef = useRef<
    Map<string, Omit<PleaData, "encouragementCount" | "hasUserResponded">>
  >(new Map());

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

    // wait for block list readiness
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

        // cleanup removed pleas
        Object.keys(encouragementListenersRef.current).forEach((id) => {
          if (!currentPleaIds.has(id)) {
            encouragementListenersRef.current[id]?.();
            delete encouragementListenersRef.current[id];
            currentPleasRef.current.delete(id);
          }
        });

        // rebuild base plea map
        const newMap = new Map<
          string,
          Omit<PleaData, "encouragementCount" | "hasUserResponded">
        >();

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as any;
          if (shouldHide(data.uid)) return;

          newMap.set(doc.id, {
            id: doc.id,
            message: data.message || "",
            uid: data.uid,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          });
        });

        currentPleasRef.current = newMap;

        // ensure encouragement listeners exist
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

            setPendingPleas((prev) => {
              // merge only this specific plea’s encouragement data
              const base = currentPleasRef.current.get(pleaId);
              if (!base || shouldHide(base.uid)) return prev;

              const others = prev.filter((p) => p.id !== pleaId);

              const merged = [
                ...others,
                {
                  ...base,
                  encouragementCount,
                  hasUserResponded,
                },
              ];

              // always sort by recency
              return merged.sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
              );
            });
          });

          encouragementListenersRef.current[pleaId] = unsub;
        });

        //
        // 🔥 FULL REBUILD of state on outer snapshot
        //
        setPendingPleas((prev) => {
          const merged: PleaData[] = [];

          currentPleasRef.current.forEach((base, id) => {
            if (shouldHide(base.uid)) return;

            const prevEntry = prev.find((p) => p.id === id);

            merged.push({
              ...base,
              encouragementCount: prevEntry?.encouragementCount ?? 0,
              hasUserResponded: prevEntry?.hasUserResponded ?? false,
            });
          });

          return merged.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          );
        });

        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("pending pleas error:", err);
        setError("Failed to load pending requests");
        setLoading(false);
      }
    );

    return () => {
      unsubPleas();
      Object.values(encouragementListenersRef.current).forEach((u) => u());
      encouragementListenersRef.current = {};
      currentPleasRef.current.clear();
    };
  }, [uid, blockedLoading, blockedByLoading, blockedUserIds, blockedByUserIds]);

  return {
    pendingPleas,
    loading: loading || blockedLoading || blockedByLoading,
    error,
  };
}
