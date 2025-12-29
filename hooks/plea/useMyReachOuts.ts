// hooks/useMyReachOuts.ts
import { MyReachOutData } from "@/components/morphing/pleas/my-reach-outs/MyReachOutCard";
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
import { useBlockedByUsers } from "../block/useBlockedByUsers";
import { useBlockedUsers } from "../block/useBlockedUsers";

const MAX_RECENT_REACH_OUTS = 20;

type EncouragementStats = {
  encouragementCount: number;
  lastEncouragementAt?: Date;
};

interface UseMyReachOutsOptions {
  pageSize?: number;
  enablePagination?: boolean;
}

export function useMyReachOuts(options: UseMyReachOutsOptions = {}) {
  const { pageSize = MAX_RECENT_REACH_OUTS, enablePagination = false } =
    options;

  const uid = auth.currentUser?.uid ?? null;

  const [myReachOuts, setMyReachOuts] = useState<MyReachOutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLimit, setCurrentLimit] = useState(pageSize);
  const [hasMore, setHasMore] = useState(true);

  // 2-way block state
  const { blockedUserIds, loading: blockedLoading } = useBlockedUsers(); // who I blocked
  const { blockedByUserIds, loading: blockedByLoading } = useBlockedByUsers(); // who blocked me

  const encouragementListenersRef = useRef<Record<string, Unsubscribe>>({});
  const encouragementStatsRef = useRef<Record<string, EncouragementStats>>({});

  // helper: hide items from helperUid if blocked either direction
  const shouldHideHelper = (helperUid: string) =>
    blockedUserIds.has(helperUid) || blockedByUserIds.has(helperUid);

  // Function to load more reach outs
  const loadMore = () => {
    if (!enablePagination || !hasMore) return;
    setCurrentLimit((prev) => prev + pageSize);
  };

  useEffect(() => {
    if (!uid) {
      setMyReachOuts([]);
      setLoading(false);
      return;
    }
    // wait until both block lists are resolved
    if (blockedLoading || blockedByLoading) return;

    const pleasQuery = query(
      collection(db, "pleas"),
      where("uid", "==", uid),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc"),
      limit(enablePagination ? currentLimit : pageSize)
    );

    const unsubPleas = onSnapshot(
      pleasQuery,
      (snapshot) => {
        const currentReachOutIds = new Set(snapshot.docs.map((d) => d.id));

        // Check if we've reached the end
        if (enablePagination) {
          // If we got fewer total docs than requested, there's definitely no more
          if (snapshot.docs.length < currentLimit) {
            setHasMore(false);
          } else {
            // If we got the full limit, there might be more
            setHasMore(true);
          }
        }

        // cleanup listeners for pleads no longer in set
        Object.keys(encouragementListenersRef.current).forEach((id) => {
          if (!currentReachOutIds.has(id)) {
            encouragementListenersRef.current[id]?.();
            delete encouragementListenersRef.current[id];
            delete encouragementStatsRef.current[id];
          }
        });

        // ensure sublisteners
        snapshot.docs.forEach((docSnap) => {
          const reachOutId = docSnap.id;
          if (encouragementListenersRef.current[reachOutId]) return;

          const encouragementsQuery = query(
            collection(db, "pleas", reachOutId, "encouragements"),
            where("status", "==", "approved")
          );

          const unsub = onSnapshot(encouragementsQuery, (encSnap) => {
            // filter out encouragements from helpers in either block direction
            const allowed = encSnap.docs
              .map((d) => d.data() as any)
              .filter((d) => d?.helperUid && !shouldHideHelper(d.helperUid));

            const encouragementCount = allowed.length;

            let lastEncouragementAt: Date | undefined = undefined;
            if (encouragementCount > 0) {
              allowed
                .filter((d) => !!d.createdAt)
                .sort(
                  (a, b) =>
                    (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
                );
              lastEncouragementAt = allowed[0]?.createdAt?.toDate?.();
            }

            encouragementStatsRef.current[reachOutId] = {
              encouragementCount,
              lastEncouragementAt,
            };

            // patch state for this reach out (do NOT touch unreadCount here)
            setMyReachOuts((old) =>
              old.map((r) =>
                r.id === reachOutId
                  ? { ...r, encouragementCount, lastEncouragementAt }
                  : r
              )
            );
          });

          encouragementListenersRef.current[reachOutId] = unsub;
        });

        // build rows (parent doc + cached stats)
        const rows: MyReachOutData[] = snapshot.docs.map((d) => {
          const data = d.data() as any;
          const cached = encouragementStatsRef.current[d.id] ?? {
            encouragementCount: 0,
            lastEncouragementAt: undefined,
          };
          return {
            id: d.id,
            message: data.message || "",
            createdAt: data.createdAt?.toDate?.() || new Date(),
            encouragementCount: cached.encouragementCount,
            lastEncouragementAt: cached.lastEncouragementAt,
            // unread count always comes from parent doc (server-managed)
            unreadCount: data.unreadEncouragementCount || 0,
          };
        });

        // sort: most recent activity (lastEncouragementAt fallback to createdAt)
        rows.sort((a, b) => {
          const aDate = a.lastEncouragementAt || a.createdAt;
          const bDate = b.lastEncouragementAt || b.createdAt;
          return bDate.getTime() - aDate.getTime();
        });

        setMyReachOuts(rows);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to my reach outs:", err);
        setError("Failed to load your reach outs");
        setLoading(false);
      }
    );

    return () => {
      unsubPleas();
      Object.values(encouragementListenersRef.current).forEach((u) => u());
      encouragementListenersRef.current = {};
      encouragementStatsRef.current = {};
    };
  }, [
    uid,
    blockedLoading,
    blockedByLoading,
    blockedUserIds,
    blockedByUserIds,
    currentLimit,
    enablePagination,
    pageSize,
  ]);

  return {
    myReachOuts,
    loading: loading || blockedLoading || blockedByLoading,
    error,
    loadMore: enablePagination ? loadMore : undefined,
    hasMore: enablePagination ? hasMore : undefined,
  };
}
