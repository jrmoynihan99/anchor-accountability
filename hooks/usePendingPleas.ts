// hooks/usePendingPleas.ts - FILTERS OUT CURRENT USER'S OWN PLEAS
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

const MAX_RECENT_PLEAS = 20;

export function usePendingPleas() {
  const [pendingPleas, setPendingPleas] = useState<PleaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep track of all active encouragement listeners so we can unsubscribe
  const encouragementListenersRef = useRef<Record<string, Unsubscribe>>({});
  // Keep track of the current plea base data (without encouragement counts)
  const currentPleasRef = useRef<
    Map<string, Omit<PleaData, "encouragementCount" | "hasUserResponded">>
  >(new Map());

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      setPendingPleas([]);
      return;
    }

    const currentUserId = auth.currentUser.uid;

    const pleasQuery = query(
      collection(db, "pleas"),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc"),
      limit(MAX_RECENT_PLEAS)
    );

    // Top-level listener for latest pleas
    const unsubPleas = onSnapshot(
      pleasQuery,
      (snapshot) => {
        // Get the current plea IDs from the snapshot
        const currentPleaIds = new Set(snapshot.docs.map((doc) => doc.id));

        // Clean up listeners for pleas that are no longer in the result set
        Object.keys(encouragementListenersRef.current).forEach((pleaId) => {
          if (!currentPleaIds.has(pleaId)) {
            encouragementListenersRef.current[pleaId]();
            delete encouragementListenersRef.current[pleaId];
            currentPleasRef.current.delete(pleaId);
          }
        });

        // Update the base plea data
        const newPleasMap = new Map<
          string,
          Omit<PleaData, "encouragementCount" | "hasUserResponded">
        >();

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          // --- SKIP if it's the current user's own plea ---
          if (data.uid === currentUserId) return;

          const pleaBase = {
            id: doc.id,
            message: data.message || "",
            uid: data.uid,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
          newPleasMap.set(doc.id, pleaBase);
        });

        currentPleasRef.current = newPleasMap;

        // Set up encouragement listeners for any new pleas
        snapshot.docs.forEach((doc) => {
          const pleaId = doc.id;
          const data = doc.data();
          // --- Don't create listeners for your own pleas ---
          if (data.uid === currentUserId) return;

          // Only set up listener if we don't already have one
          if (encouragementListenersRef.current[pleaId]) {
            return;
          }

          const encouragementsQuery = query(
            collection(db, "pleas", pleaId, "encouragements"),
            where("status", "==", "approved")
          );

          const unsub = onSnapshot(encouragementsQuery, (encSnap) => {
            const encouragementCount = encSnap.size;
            const hasUserResponded = encSnap.docs.some(
              (doc) => doc.data().helperUid === currentUserId
            );

            // Update state using the current base plea data
            setPendingPleas((oldPleas) => {
              const pleaBase = currentPleasRef.current.get(pleaId);
              if (!pleaBase) return oldPleas; // Plea no longer exists

              // --- FILTER: Don't add/update current user's own plea ---
              if (pleaBase.uid === currentUserId) return oldPleas;

              // Remove old version of this plea and add updated version
              const otherPleas = oldPleas.filter((p) => p.id !== pleaId);
              const updatedPlea: PleaData = {
                ...pleaBase,
                encouragementCount,
                hasUserResponded,
              };

              const newPleas = [...otherPleas, updatedPlea];

              // Sort: lowest count first, then oldest first
              return newPleas.sort((a, b) => {
                if (a.encouragementCount !== b.encouragementCount) {
                  return a.encouragementCount - b.encouragementCount;
                }
                return a.createdAt.getTime() - b.createdAt.getTime();
              });
            });
          });

          encouragementListenersRef.current[pleaId] = unsub;
        });

        // Remove pleas from state that are no longer in the current set
        setPendingPleas(
          (oldPleas) =>
            oldPleas
              .filter((plea) => currentPleaIds.has(plea.id))
              .filter((plea) => plea.uid !== currentUserId) // <--- FILTER!
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
  }, [auth.currentUser]);

  return {
    pendingPleas, // These are ALREADY filtered!
    loading,
    error,
  };
}
