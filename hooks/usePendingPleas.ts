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
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

// How many pleas to fetch
const MAX_RECENT_PLEAS = 20;

export function usePendingPleas() {
  const [pendingPleas, setPendingPleas] = useState<PleaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep track of all active encouragement listeners so we can unsubscribe
  const encouragementListenersRef = useRef<Record<string, Unsubscribe>>({});

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      setPendingPleas([]);
      return;
    }

    // Clean up any old listeners before setting new ones
    Object.values(encouragementListenersRef.current).forEach((unsub) =>
      unsub()
    );
    encouragementListenersRef.current = {};

    const pleasQuery = query(
      collection(db, "pleas"),
      orderBy("createdAt", "desc"),
      limit(MAX_RECENT_PLEAS)
    );

    // Top-level listener for latest pleas
    const unsubPleas = onSnapshot(
      pleasQuery,
      (snapshot) => {
        const currentUserId = auth.currentUser?.uid;
        let pleas: PleaData[] = [];

        // Optionally filter out current user's pleas
        // .filter(doc => doc.data().uid !== currentUserId)
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          pleas.push({
            id: doc.id,
            message: data.message || "",
            uid: data.uid,
            createdAt: data.createdAt?.toDate() || new Date(),
            encouragementCount: 0, // will be set live below
            hasUserResponded: false,
          });
        });

        // For each plea, set up a real-time encouragements listener
        pleas.forEach((plea) => {
          // If we already have a listener for this plea, skip
          if (encouragementListenersRef.current[plea.id]) return;

          const encouragementsQuery = collection(
            db,
            "pleas",
            plea.id,
            "encouragements"
          );
          const unsub = onSnapshot(encouragementsQuery, (encSnap) => {
            const encouragementCount = encSnap.size;
            const hasUserResponded = encSnap.docs.some(
              (doc) => doc.data().helperUid === currentUserId
            );

            // Update state for this plea
            setPendingPleas((oldPleas) => {
              const newPleas = oldPleas.map((p) =>
                p.id === plea.id
                  ? { ...p, encouragementCount, hasUserResponded }
                  : p
              );
              // Sort as you did before: lowest count first, then oldest first
              return newPleas.sort((a, b) => {
                if (a.encouragementCount !== b.encouragementCount) {
                  return a.encouragementCount - b.encouragementCount;
                }
                return a.createdAt.getTime() - b.createdAt.getTime();
              });
            });
          });
          encouragementListenersRef.current[plea.id] = unsub;
        });

        setPendingPleas(pleas);
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
    };
  }, [auth.currentUser]);

  return { pendingPleas, loading, error };
}
