// hooks/useTimezoneComparison.ts
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

interface TimezoneComparisonResult {
  shouldShowWarning: boolean;
  currentUserTimezone: string | null;
  otherUserTimezone: string | null;
  timeDifference: number; // in hours
  otherUserLocalTime: string;
  loading: boolean;
  error: string | null;
}

/**
 * Hook that compares timezones between the current user and another user.
 * Returns whether to show a timezone warning (if difference >= 3 hours).
 */
export function useTimezoneComparison(
  otherUserId: string
): TimezoneComparisonResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserTimezone, setCurrentUserTimezone] = useState<string | null>(
    null
  );
  const [otherUserTimezone, setOtherUserTimezone] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchTimezones = async () => {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError("You must be signed in.");
        setLoading(false);
        return;
      }

      if (!otherUserId) {
        setError("Invalid user ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch current user's timezone
        const currentUserRef = doc(db, "users", currentUser.uid);
        const currentUserSnap = await getDoc(currentUserRef);

        if (!currentUserSnap.exists()) {
          setError("Current user data not found.");
          setLoading(false);
          return;
        }

        const currentUserData = currentUserSnap.data();
        const currentTz = currentUserData.timezone || null;
        setCurrentUserTimezone(currentTz);

        // Fetch other user's timezone
        const otherUserRef = doc(db, "users", otherUserId);
        const otherUserSnap = await getDoc(otherUserRef);

        if (!otherUserSnap.exists()) {
          setError("Other user data not found.");
          setLoading(false);
          return;
        }

        const otherUserData = otherUserSnap.data();
        const otherTz = otherUserData.timezone || null;
        setOtherUserTimezone(otherTz);

        console.log(
          `✅ Fetched timezones - Current: ${currentTz}, Other: ${otherTz}`
        );
      } catch (err: any) {
        console.error("Error fetching timezones:", err);
        setError(err.message || "Failed to fetch timezones.");
      } finally {
        setLoading(false);
      }
    };

    fetchTimezones();
  }, [otherUserId]);

  // Calculate time difference using Intl.DateTimeFormat
  const getTimeDifference = (userTz: string, otherTz: string): number => {
    try {
      // Use a known date to calculate offset differences
      const date = new Date();

      // Format to get the hour in each timezone
      const userHour = new Intl.DateTimeFormat("en-US", {
        timeZone: userTz,
        hour: "numeric",
        hour12: false,
      }).format(date);

      const otherHour = new Intl.DateTimeFormat("en-US", {
        timeZone: otherTz,
        hour: "numeric",
        hour12: false,
      }).format(date);

      const userDay = new Intl.DateTimeFormat("en-US", {
        timeZone: userTz,
        day: "numeric",
      }).format(date);

      const otherDay = new Intl.DateTimeFormat("en-US", {
        timeZone: otherTz,
        day: "numeric",
      }).format(date);

      let diff = parseInt(otherHour) - parseInt(userHour);
      const dayDiff = parseInt(otherDay) - parseInt(userDay);

      // Adjust for day boundary
      // If they're a day ahead, add 24 hours to the difference
      if (dayDiff === 1 || dayDiff < -25) diff += 24;
      // If they're a day behind, subtract 24 hours
      if (dayDiff === -1 || dayDiff > 25) diff -= 24;

      return diff;
    } catch (error) {
      console.error("Error calculating time difference:", error);
      return 0;
    }
  };

  // Get local time with date in another timezone
  const getLocalTime = (timezone: string): string => {
    try {
      const date = new Date();
      const timeString = date.toLocaleString("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        month: "short",
        day: "numeric",
      });
      return timeString;
    } catch (error) {
      console.error("Error getting local time:", error);
      return "";
    }
  };

  // Determine if we should show warning
  const shouldShowWarning =
    !loading &&
    !error &&
    currentUserTimezone !== null &&
    otherUserTimezone !== null &&
    currentUserTimezone !== otherUserTimezone &&
    Math.abs(getTimeDifference(currentUserTimezone, otherUserTimezone)) >= 3;

  const timeDifference =
    currentUserTimezone && otherUserTimezone
      ? getTimeDifference(currentUserTimezone, otherUserTimezone)
      : 0;

  const otherUserLocalTime = otherUserTimezone
    ? getLocalTime(otherUserTimezone)
    : "";

  return {
    shouldShowWarning,
    timeDifference,
    otherUserLocalTime,
    loading,
    error,
    currentUserTimezone,
    otherUserTimezone,
  };
}
