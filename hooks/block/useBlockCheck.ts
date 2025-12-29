// hooks/useBlockCheck.ts
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useBlockCheck(userIdToCheck: string) {
  const [hasBlocked, setHasBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkBlockStatus = async () => {
      const currentUser = auth.currentUser;

      if (!currentUser || !userIdToCheck) {
        setIsLoading(false);
        return;
      }

      // Don't check if it's the same user
      if (currentUser.uid === userIdToCheck) {
        setHasBlocked(false);
        setIsLoading(false);
        return;
      }

      try {
        const blockListRef = collection(
          db,
          "users",
          currentUser.uid,
          "blockList"
        );

        const q = query(blockListRef, where("uid", "==", userIdToCheck));
        const snapshot = await getDocs(q);

        setHasBlocked(!snapshot.empty);
      } catch (error) {
        console.error("Error checking block status:", error);
        setHasBlocked(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkBlockStatus();
  }, [userIdToCheck]);

  return { hasBlocked, isLoading };
}
