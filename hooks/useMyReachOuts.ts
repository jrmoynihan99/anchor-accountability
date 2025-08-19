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
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

const MAX_RECENT_REACH_OUTS = 20;

export function useMyReachOuts() {
  const [myReachOuts, setMyReachOuts] = useState<MyReachOutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep track of all active encouragement listeners so we can unsubscribe
  const encouragementListenersRef = useRef<Record<string, Unsubscribe>>({});

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      setMyReachOuts([]);
      return;
    }

    const currentUserId = auth.currentUser.uid;

    // Clean up any old listeners before setting new ones
    Object.values(encouragementListenersRef.current).forEach((unsub) =>
      unsub()
    );
    encouragementListenersRef.current = {};

    const pleasQuery = query(
      collection(db, "pleas"),
      orderBy("createdAt", "desc"),
      limit(MAX_RECENT_REACH_OUTS)
    );

    // Top-level listener for latest pleas
    const unsubPleas = onSnapshot(
      pleasQuery,
      (snapshot) => {
        let reachOuts: MyReachOutData[] = [];

        // Filter for current user's pleas and build initial array
        snapshot.docs.forEach((doc) => {
          const data = doc.data();

          // Only process pleas that belong to current user
          if (data.uid === currentUserId) {
            reachOuts.push({
              id: doc.id,
              message: data.message || "",
              createdAt: data.createdAt?.toDate() || new Date(),
              encouragementCount: 0, // will be set live below
              lastEncouragementAt: undefined,
            });
          }
        });

        // For each of MY reach outs, set up a real-time encouragements listener
        reachOuts.forEach((reachOut) => {
          // If we already have a listener for this reach out, skip
          if (encouragementListenersRef.current[reachOut.id]) return;

          const encouragementsQuery = collection(
            db,
            "pleas",
            reachOut.id,
            "encouragements"
          );

          const unsub = onSnapshot(encouragementsQuery, (encSnap) => {
            const encouragementCount = encSnap.size;
            let lastEncouragementAt: Date | undefined = undefined;

            if (encouragementCount > 0) {
              // Sort encouragements by createdAt to get most recent
              const encouragements = encSnap.docs
                .map((d) => d.data())
                .filter((d) => !!d.createdAt)
                .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

              lastEncouragementAt = encouragements[0]?.createdAt?.toDate?.();
            }

            // Update state for this reach out
            setMyReachOuts((oldReachOuts) => {
              const newReachOuts = oldReachOuts.map((r) =>
                r.id === reachOut.id
                  ? { ...r, encouragementCount, lastEncouragementAt }
                  : r
              );
              // Sort by creation date, newest first
              return newReachOuts.sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
              );
            });
          });

          encouragementListenersRef.current[reachOut.id] = unsub;
        });

        setMyReachOuts(reachOuts);
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
    };
  }, [auth.currentUser]);

  return { myReachOuts, loading, error };
}
