// hooks/useOtherUserAccountability.ts
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useOtherUserAccountability(userId: string | null) {
  const [menteeCount, setMenteeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setMenteeCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Only fetch mentee count (that's all we need!)
    const fetchMenteeCount = async () => {
      try {
        const menteesQuery = query(
          collection(db, "accountabilityRelationships"),
          where("mentorUid", "==", userId),
          where("status", "==", "active")
        );
        const snapshot = await getDocs(menteesQuery);
        return snapshot.size;
      } catch (error) {
        console.error("Error fetching mentee count:", error);
        return 0;
      }
    };

    fetchMenteeCount()
      .then(setMenteeCount)
      .finally(() => setLoading(false));
  }, [userId]);

  return { menteeCount, loading };
}
