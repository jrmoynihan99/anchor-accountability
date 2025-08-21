// hooks/useUserStreak.ts
import {
  getCurrentStreak,
  type StreakEntry,
} from "@/components/morphing/home/streak/streakUtils";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useUserStreak(userId: string) {
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setStreak(0);
      setLoading(false);
      return;
    }

    const fetchUserStreak = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the user's streak data using your existing structure
        const streakRef = collection(db, "users", userId, "streak");
        const streakQuery = query(
          streakRef,
          orderBy("__name__", "desc"),
          limit(30)
        ); // Get last 30 days

        const snapshot = await getDocs(streakQuery);

        const streakData: StreakEntry[] = snapshot.docs.map((doc) => ({
          date: doc.id,
          status: doc.data().status as "success" | "fail" | "pending",
        }));

        // Use your existing getCurrentStreak function
        const currentStreak = getCurrentStreak(streakData);
        setStreak(currentStreak);
      } catch (err) {
        console.error("Error fetching user streak:", err);
        setError("Failed to load streak");
        setStreak(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStreak();
  }, [userId]);

  return { streak, loading, error };
}

// Optimized version for multiple users - batches requests
export function useMultipleUserStreaks(userIds: string[]) {
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userIds || userIds.length === 0) {
      setStreaks({});
      setLoading(false);
      return;
    }

    const fetchMultipleStreaks = async () => {
      try {
        setLoading(true);
        setError(null);

        // Batch fetch user streaks
        const streakPromises = userIds.map(async (userId) => {
          try {
            const streakRef = collection(db, "users", userId, "streak");
            const streakQuery = query(
              streakRef,
              orderBy("__name__", "desc"),
              limit(30)
            );

            const snapshot = await getDocs(streakQuery);

            const streakData: StreakEntry[] = snapshot.docs.map((doc) => ({
              date: doc.id,
              status: doc.data().status as "success" | "fail" | "pending",
            }));

            const currentStreak = getCurrentStreak(streakData);
            return { userId, streak: currentStreak };
          } catch {
            return { userId, streak: 0 };
          }
        });

        const results = await Promise.all(streakPromises);

        const streakMap: Record<string, number> = {};
        results.forEach(({ userId, streak }) => {
          streakMap[userId] = streak;
        });

        setStreaks(streakMap);
      } catch (err) {
        console.error("Error fetching multiple user streaks:", err);
        setError("Failed to load streaks");
        setStreaks({});
      } finally {
        setLoading(false);
      }
    };

    fetchMultipleStreaks();
  }, [userIds.join(",")]); // Re-run when userIds array changes

  return { streaks, loading, error };
}
