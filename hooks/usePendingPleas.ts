// hooks/usePendingPleas.ts
import { PleaData } from "@/components/morphing/messages/plea/PleaCard";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";

const MAX_RECENT_PLEAS = 20; // Only fetch the most recent 20 pleas to sort

export function usePendingPleas() {
  const [pendingPleas, setPendingPleas] = useState<PleaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    console.log("🔍 usePendingPleas: Setting up listener for pending pleas");

    // Simple query: get the most recent pleas ordered by creation time
    // We'll filter out current user's pleas and count encouragements client-side
    const pleasQuery = query(
      collection(db, "pleas"),
      orderBy("createdAt", "desc"),
      limit(MAX_RECENT_PLEAS)
    );

    const unsubscribe = onSnapshot(
      pleasQuery,
      async (snapshot) => {
        try {
          console.log(
            "🔍 usePendingPleas: Received snapshot with",
            snapshot.docs.length,
            "pleas"
          );

          const currentUserId = auth.currentUser?.uid;
          if (!currentUserId) {
            console.log("🔍 usePendingPleas: No current user found");
            setLoading(false);
            return;
          }

          const pleasPromises = snapshot.docs
            // TODO: Re-enable this filter later to hide current user's pleas
            // .filter(doc => {
            //   // Filter out current user's pleas client-side
            //   const data = doc.data();
            //   return data.uid !== currentUserId;
            // })
            .map(async (doc) => {
              const data = doc.data();

              // Count encouragements for this plea and check if current user responded
              try {
                const encouragementsSnapshot = await new Promise(
                  (resolve, reject) => {
                    const encouragementsQuery = collection(
                      db,
                      "pleas",
                      doc.id,
                      "encouragements"
                    );
                    const unsubscribeEncouragements = onSnapshot(
                      encouragementsQuery,
                      (snap) => {
                        unsubscribeEncouragements();
                        resolve(snap);
                      },
                      reject
                    );
                  }
                );

                const encouragementCount = (encouragementsSnapshot as any).size;

                // Check if current user has responded to this plea
                const hasUserResponded = (
                  encouragementsSnapshot as any
                ).docs.some((encouragementDoc: any) => {
                  const encouragementData = encouragementDoc.data();
                  return encouragementData.helperUid === currentUserId;
                });

                console.log(
                  `🔍 usePendingPleas: Plea ${doc.id} has ${encouragementCount} encouragements, user responded: ${hasUserResponded}`
                );

                return {
                  id: doc.id,
                  message: data.message || "",
                  uid: data.uid,
                  createdAt: data.createdAt?.toDate() || new Date(),
                  encouragementCount,
                  hasUserResponded,
                } as PleaData;
              } catch (encouragementError) {
                console.error(
                  `Error fetching encouragements for plea ${doc.id}:`,
                  encouragementError
                );
                // Return plea with 0 encouragements if counting fails
                return {
                  id: doc.id,
                  message: data.message || "",
                  uid: data.uid,
                  createdAt: data.createdAt?.toDate() || new Date(),
                  encouragementCount: 0,
                  hasUserResponded: false,
                } as PleaData;
              }
            });

          const pleas = await Promise.all(pleasPromises);

          // Sort by encouragement count (least first), then by creation time (oldest first for same encouragement count)
          const sortedPleas = pleas.sort((a, b) => {
            // Primary sort: encouragement count (ascending - least encouragements first)
            if (a.encouragementCount !== b.encouragementCount) {
              return a.encouragementCount - b.encouragementCount;
            }
            // Secondary sort: for pleas with same encouragement count, prioritize older ones (ascending time)
            return a.createdAt.getTime() - b.createdAt.getTime();
          });

          console.log("🔍 usePendingPleas: Sorting debug:");
          sortedPleas.forEach((plea, index) => {
            console.log(
              `  ${index + 1}. ${plea.id} - ${
                plea.encouragementCount
              } encouragements - ${plea.createdAt.toLocaleString()}`
            );
          });

          console.log(
            "🔍 usePendingPleas: Final sorted pleas:",
            sortedPleas.length
          );
          setPendingPleas(sortedPleas);
          setError(null);
        } catch (err) {
          console.error("Error processing pending pleas:", err);
          setError("Failed to load pending requests");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error listening to pending pleas:", err);
        setError("Failed to load pending requests");
        setLoading(false);
      }
    );

    return () => {
      console.log("🔍 usePendingPleas: Cleaning up listener");
      unsubscribe();
    };
  }, [auth.currentUser]);

  return { pendingPleas, loading, error };
}
