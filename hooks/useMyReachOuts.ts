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
import { useEffect, useState } from "react";

const MAX_RECENT_REACH_OUTS = 20; // Only fetch the most recent 20 reach outs

export function useMyReachOuts() {
  const [myReachOuts, setMyReachOuts] = useState<MyReachOutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    console.log("🔍 useMyReachOuts: Setting up listener for my reach outs");

    // Simple query: get recent pleas ordered by creation time
    // We'll filter for current user's pleas client-side
    const pleasQuery = query(
      collection(db, "pleas"),
      orderBy("createdAt", "desc"),
      limit(MAX_RECENT_REACH_OUTS)
    );

    const unsubscribe = onSnapshot(
      pleasQuery,
      async (snapshot) => {
        try {
          console.log(
            "🔍 useMyReachOuts: Received snapshot with",
            snapshot.docs.length,
            "pleas"
          );

          const currentUserId = auth.currentUser?.uid;
          if (!currentUserId) {
            console.log("🔍 useMyReachOuts: No current user found");
            setLoading(false);
            return;
          }

          const reachOutPromises = snapshot.docs
            .filter((doc) => {
              // Filter for current user's pleas client-side
              const data = doc.data();
              return data.uid === currentUserId;
            })
            .map(async (doc) => {
              const data = doc.data();

              // Count encouragements for this reach out and get the last encouragement time
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

                // Find the most recent encouragement
                let lastEncouragementAt: Date | undefined;
                if (encouragementCount > 0) {
                  const encouragements = (
                    encouragementsSnapshot as any
                  ).docs.map((doc: any) => ({
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                  }));

                  // Sort by creation time and get the most recent
                  encouragements.sort(
                    (a: any, b: any) =>
                      b.createdAt.getTime() - a.createdAt.getTime()
                  );
                  lastEncouragementAt = encouragements[0]?.createdAt;
                }

                console.log(
                  `🔍 useMyReachOuts: Reach out ${doc.id} has ${encouragementCount} encouragements`
                );

                return {
                  id: doc.id,
                  message: data.message || "",
                  createdAt: data.createdAt?.toDate() || new Date(),
                  encouragementCount,
                  lastEncouragementAt,
                } as MyReachOutData;
              } catch (encouragementError) {
                console.error(
                  `Error fetching encouragements for reach out ${doc.id}:`,
                  encouragementError
                );
                // Return reach out with 0 encouragements if counting fails
                return {
                  id: doc.id,
                  message: data.message || "",
                  createdAt: data.createdAt?.toDate() || new Date(),
                  encouragementCount: 0,
                } as MyReachOutData;
              }
            });

          const reachOuts = await Promise.all(reachOutPromises);

          // Already sorted by creation time from the query (newest first)
          console.log("🔍 useMyReachOuts: Final reach outs:", reachOuts.length);
          setMyReachOuts(reachOuts);
          setError(null);
        } catch (err) {
          console.error("Error processing my reach outs:", err);
          setError("Failed to load your reach outs");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error listening to my reach outs:", err);
        setError("Failed to load your reach outs");
        setLoading(false);
      }
    );

    return () => {
      console.log("🔍 useMyReachOuts: Cleaning up listener");
      unsubscribe();
    };
  }, [auth.currentUser]);

  return { myReachOuts, loading, error };
}
