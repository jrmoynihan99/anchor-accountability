// hooks/useMyReachOuts.ts
import { MyReachOutData } from "@/components/morphing/messages/my-reach-outs/MyReachOutCard";
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

const MAX_RECENT_REACH_OUTS = 20;

// Encouragement stats cache (not for unreadCount!)
type EncouragementStats = {
  encouragementCount: number;
  lastEncouragementAt?: Date;
};

export function useMyReachOuts() {
  const [myReachOuts, setMyReachOuts] = useState<MyReachOutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Encourage listeners for cleanup
  const encouragementListenersRef = useRef<Record<string, Unsubscribe>>({});
  // Track encouragement stats for each reach out (NOT unreadCount)
  const encouragementStatsRef = useRef<Record<string, EncouragementStats>>({});

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      setMyReachOuts([]);
      return;
    }

    const currentUserId = auth.currentUser.uid;

    const pleasQuery = query(
      collection(db, "pleas"),
      where("uid", "==", currentUserId),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc"),
      limit(MAX_RECENT_REACH_OUTS)
    );

    // Top-level listener for latest pleas
    const unsubPleas = onSnapshot(
      pleasQuery,
      (snapshot) => {
        const currentReachOutIds = new Set(snapshot.docs.map((doc) => doc.id));

        // Clean up subcollection listeners for deleted pleas
        Object.keys(encouragementListenersRef.current).forEach((reachOutId) => {
          if (!currentReachOutIds.has(reachOutId)) {
            encouragementListenersRef.current[reachOutId]();
            delete encouragementListenersRef.current[reachOutId];
            delete encouragementStatsRef.current[reachOutId];
          }
        });

        // Set up subcollection listeners (if not already)
        snapshot.docs.forEach((doc) => {
          const reachOutId = doc.id;
          if (encouragementListenersRef.current[reachOutId]) return;

          const encouragementsQuery = query(
            collection(db, "pleas", reachOutId, "encouragements"),
            where("status", "==", "approved")
          );

          // Listen to subcollection to get encouragement stats (but not unreadCount)
          const unsub = onSnapshot(encouragementsQuery, (encSnap) => {
            const encouragementCount = encSnap.size;
            let lastEncouragementAt: Date | undefined = undefined;

            if (encouragementCount > 0) {
              const encouragements = encSnap.docs
                .map((d) => d.data())
                .filter((d) => !!d.createdAt)
                .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
              lastEncouragementAt = encouragements[0]?.createdAt?.toDate?.();
            }

            // Update cached stats
            encouragementStatsRef.current[reachOutId] = {
              encouragementCount,
              lastEncouragementAt,
            };

            // Patch the existing state to update only these fields
            setMyReachOuts((oldReachOuts) =>
              oldReachOuts.map((r) =>
                r.id === reachOutId
                  ? {
                      ...r,
                      encouragementCount,
                      lastEncouragementAt,
                      // NEVER patch unreadCount here!
                    }
                  : r
              )
            );
          });

          encouragementListenersRef.current[reachOutId] = unsub;
        });

        // Build the new reachOuts array using parent doc data + cached encouragement stats
        const newReachOuts: MyReachOutData[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const id = doc.id;
          const encouragementStats = encouragementStatsRef.current[id] || {
            encouragementCount: 0,
            lastEncouragementAt: undefined,
          };

          return {
            id,
            message: data.message || "",
            createdAt: data.createdAt?.toDate() || new Date(),
            encouragementCount: encouragementStats.encouragementCount,
            lastEncouragementAt: encouragementStats.lastEncouragementAt,
            unreadCount: data.unreadEncouragementCount || 0, // ← always from parent doc!
          };
        });

        setMyReachOuts(
          newReachOuts.sort((a, b) => {
            // 1. Sort by last encouragement received, descending
            const aDate = a.lastEncouragementAt || a.createdAt;
            const bDate = b.lastEncouragementAt || b.createdAt;
            return bDate.getTime() - aDate.getTime();
          })
        );

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
      Object.values(encouragementListenersRef.current).forEach((unsub) =>
        unsub()
      );
      encouragementListenersRef.current = {};
      encouragementStatsRef.current = {};
    };
  }, [auth.currentUser]);

  return { myReachOuts, loading, error };
}
