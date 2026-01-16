import { useOrganization } from "@/context/OrganizationContext";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export function useReport(reportedUserId: string) {
  const { organizationId, loading: orgLoading } = useOrganization();
  const [hasReported, setHasReported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId || !reportedUserId || !organizationId || orgLoading) {
      setIsLoading(false);
      return;
    }

    // Query for reports from this user about the other user
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const reportsQuery = query(
      collection(db, "organizations", organizationId, "reports"),
      where("reporterUserId", "==", currentUserId),
      where("reportedUserId", "==", reportedUserId)
    );

    // Subscribe for live updates!
    const unsubscribe = onSnapshot(
      reportsQuery,
      (querySnapshot) => {
        // Check if any report exists within last 7 days
        const hasRecentReport = querySnapshot.docs.some((doc) => {
          const timestamp = doc.data().timestamp?.toDate();
          return timestamp && timestamp > sevenDaysAgo;
        });
        setHasReported(hasRecentReport);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error checking existing reports:", error);
        setHasReported(false);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [reportedUserId, organizationId, orgLoading]);

  const reportUser = async (): Promise<boolean> => {
    const currentUserId = auth.currentUser?.uid;

    if (!currentUserId) {
      console.error("No user logged in");
      return false;
    }

    if (!organizationId) {
      console.error("No organization ID available");
      return false;
    }

    if (hasReported) {
      console.warn("User already reported");
      return false;
    }

    setReporting(true);

    try {
      await addDoc(collection(db, "organizations", organizationId, "reports"), {
        reportedUserId: reportedUserId,
        reporterUserId: currentUserId,
        timestamp: serverTimestamp(),
      });

      setReporting(false);
      return true;
    } catch (error) {
      console.error("Error reporting user:", error);
      setReporting(false);
      return false;
    }
  };

  return { hasReported, isLoading, reportUser, reporting };
}
