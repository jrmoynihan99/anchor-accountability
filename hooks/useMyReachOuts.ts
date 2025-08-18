// hooks/useMyReachOuts.ts
import { MyReachOutData } from "@/components/morphing/messages/my-reach-outs/MyReachOutCard";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

const MAX_RECENT_REACH_OUTS = 20; // Only fetch the most recent 20 reach outs

export function useMyReachOuts() {
  const [myReachOuts, setMyReachOuts] = useState<MyReachOutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track subcollection listeners for cleanup
  const encouragementUnsubs = useRef<Record<string, () => void>>({});

  useEffect(() => {
    if (!auth.currentUser) {
      setMyReachOuts([]);
      setLoading(false);
      return;
    }

    const currentUserId = auth.currentUser.uid;

    const pleasQuery = query(
      collection(db, "pleas"),
      orderBy("createdAt", "desc"),
      limit(MAX_RECENT_REACH_OUTS)
    );

    let isUnmounted = false;

    const unsubscribePleas = onSnapshot(
      pleasQuery,
      (snapshot) => {
        if (isUnmounted) return;
        // Filter for current user's pleas
        const myDocs = snapshot.docs.filter(
          (doc) => doc.data().uid === currentUserId
        );

        // Remove listeners for reach outs that no longer exist
        const newDocIds = new Set(myDocs.map((doc) => doc.id));
        for (const id in encouragementUnsubs.current) {
          if (!newDocIds.has(id)) {
            encouragementUnsubs.current[id]();
            delete encouragementUnsubs.current[id];
          }
        }

        // Temp object to accumulate live reach out data
        const nextReachOuts: Record<string, MyReachOutData> = {};

        myDocs.forEach((doc) => {
          const data = doc.data();
          const docId = doc.id;

          // Only create a listener if not already listening
          if (!encouragementUnsubs.current[docId]) {
            const encouragementsRef = collection(
              db,
              "pleas",
              docId,
              "encouragements"
            );
            const unsub = onSnapshot(encouragementsRef, (snap) => {
              const encouragementCount = snap.size;
              let lastEncouragementAt: Date | undefined = undefined;

              if (encouragementCount > 0) {
                // Sort encouragements by createdAt to get most recent
                const encouragements = snap.docs
                  .map((d) => d.data())
                  .filter((d) => !!d.createdAt)
                  .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

                lastEncouragementAt = encouragements[0]?.createdAt?.toDate?.();
              }

              nextReachOuts[docId] = {
                id: docId,
                message: data.message || "",
                createdAt: data.createdAt?.toDate() || new Date(),
                encouragementCount,
                lastEncouragementAt,
              };

              // When all listeners have reported, update the state
              if (Object.keys(nextReachOuts).length === myDocs.length) {
                setMyReachOuts(
                  myDocs
                    .map((d) => nextReachOuts[d.id])
                    .filter(Boolean)
                    .sort(
                      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                    )
                );
                setLoading(false);
              }
            });
            encouragementUnsubs.current[docId] = unsub;
          }
        });

        setError(null);
        setLoading(false);
      },
      (err) => {
        setError("Failed to load your reach outs");
        setLoading(false);
      }
    );

    // Cleanup: remove all sublisteners on unmount
    return () => {
      isUnmounted = true;
      unsubscribePleas();
      for (const unsub of Object.values(encouragementUnsubs.current)) {
        unsub();
      }
      encouragementUnsubs.current = {};
    };
  }, [auth.currentUser]);

  return { myReachOuts, loading, error };
}
