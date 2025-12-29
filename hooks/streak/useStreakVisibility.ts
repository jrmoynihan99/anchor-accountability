// hooks/useStreakVisibility.ts
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useStreakVisibility() {
  const [streakVisible, setStreakVisibleState] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(auth.currentUser);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  // Load streak visibility setting from Firebase
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const loadStreakVisibility = async () => {
      try {
        setLoading(true);
        setError(null);

        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setStreakVisibleState(userData.streakVisible ?? true);
        } else {
          setStreakVisibleState(true);
        }
      } catch (err) {
        console.error("Error loading streak visibility:", err);
        setError("Failed to load setting");
        setStreakVisibleState(true);
      } finally {
        setLoading(false);
      }
    };

    loadStreakVisibility();
  }, [user?.uid]);

  const setStreakVisible = async (visible: boolean) => {
    if (!user?.uid) return;

    try {
      setError(null);
      setStreakVisibleState(visible);

      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { streakVisible: visible }, { merge: true });
    } catch (err) {
      console.error("Error updating streak visibility:", err);
      setError("Failed to update setting");
      setStreakVisibleState(!visible);
    }
  };

  return {
    streakVisible,
    setStreakVisible,
    loading,
    error,
  };
}

export function useUserStreakVisibility(userId: string) {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsVisible(true);
      setLoading(false);
      return;
    }

    const checkUserStreakVisibility = async () => {
      try {
        setLoading(true);

        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsVisible(userData.streakVisible ?? true);
        } else {
          setIsVisible(true);
        }
      } catch (err) {
        console.error("Error checking user streak visibility:", err);
        setIsVisible(true);
      } finally {
        setLoading(false);
      }
    };

    checkUserStreakVisibility();
  }, [userId]);

  return { isVisible, loading };
}
