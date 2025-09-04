// hooks/useReportCheck.ts
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useReportCheck(reportedUserId: string) {
  const [hasReported, setHasReported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkExistingReport = async () => {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId || !reportedUserId) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if current user has reported this user in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const reportsQuery = query(
          collection(db, "reports"),
          where("reporterUserId", "==", currentUserId),
          where("reportedUserId", "==", reportedUserId)
        );

        const querySnapshot = await getDocs(reportsQuery);

        // Check if any report exists within last 7 days
        const hasRecentReport = querySnapshot.docs.some((doc) => {
          const timestamp = doc.data().timestamp?.toDate();
          return timestamp && timestamp > sevenDaysAgo;
        });

        setHasReported(hasRecentReport);
      } catch (error) {
        console.error("Error checking existing reports:", error);
        // If there's an error, allow reporting (fail open)
        setHasReported(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingReport();
  }, [reportedUserId]);

  return { hasReported, isLoading };
}
