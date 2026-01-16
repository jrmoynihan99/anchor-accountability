import {
  getLocalDateString,
  StreakEntry,
} from "@/components/morphing/home/streak/streakUtils";
import { useOrganization } from "@/context/OrganizationContext";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

// Helper to get YYYY-MM-DD string for a date offset
const getDate = getLocalDateString;

export function useStreakData() {
  const [streakData, setStreakData] = useState<StreakEntry[]>([]);
  const [user, setUser] = useState(auth.currentUser);
  const lastCheckedDate = useRef<string>(getLocalDateString(0)); // Track when we last checked the date

  // ✅ NEW: Get organizationId from context
  const { organizationId, loading: orgLoading } = useOrganization();

  // Listen to auth state changes
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => {
      unsubAuth();
    };
  }, []);

  // Function to ensure recent days exist
  const ensureRecentDaysExist = async (uid: string) => {
    // ✅ UPDATED: Wait for organizationId to be available
    if (!organizationId) return;

    const today = getLocalDateString(0);
    const yesterday = getLocalDateString(-1);

    // ✅ UPDATED: Use organizations path
    const todayRef = doc(
      db,
      "organizations",
      organizationId,
      "users",
      uid,
      "streak",
      today
    );
    const yesterdayRef = doc(
      db,
      "organizations",
      organizationId,
      "users",
      uid,
      "streak",
      yesterday
    );

    try {
      // Check today
      const todaySnap = await getDoc(todayRef);

      if (!todaySnap.exists()) {
        await setDoc(todayRef, { status: "pending" });
      }

      // Check yesterday
      const yesterdaySnap = await getDoc(yesterdayRef);

      if (!yesterdaySnap.exists()) {
        await setDoc(yesterdayRef, { status: "pending" });
      }
    } catch (error) {
      console.error(`🔍 ensureRecentDaysExist: Error:`, error);
    }
  };

  // Function to check if date changed and refresh if needed
  const checkDateAndRefresh = async () => {
    const currentDate = getDate(0);

    if (currentDate !== lastCheckedDate.current) {
      lastCheckedDate.current = currentDate;

      if (user?.uid) {
        await ensureRecentDaysExist(user.uid);
      }
    }
  };

  // Listen for app state changes to detect when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active") {
        checkDateAndRefresh();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
    };
  }, [user?.uid]);

  // Optional: Check for date change every minute while app is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (AppState.currentState === "active") {
        checkDateAndRefresh();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user?.uid]);

  // Load + watch all streak records when user changes
  useEffect(() => {
    const uid = user?.uid;

    // ✅ UPDATED: Wait for organizationId before setting up listener
    if (!uid || !organizationId || orgLoading) {
      setStreakData([]);
      return;
    }

    // ✅ UPDATED: Use organizations path
    const ref = collection(
      db,
      "organizations",
      organizationId,
      "users",
      uid,
      "streak"
    );

    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        const data: StreakEntry[] = snapshot.docs.map((doc) => {
          const entry = {
            date: doc.id,
            status: doc.data().status,
          };
          return entry;
        });

        setStreakData(data);
      },
      (error) => {
        console.error(`🔍 useStreakData: Error in snapshot listener:`, error);
      }
    );

    return () => {
      unsub();
    };
  }, [user?.uid, organizationId, orgLoading]); // ✅ UPDATED: Added dependencies

  // Make sure today's and yesterday's records exist when user changes
  useEffect(() => {
    if (user?.uid) {
      ensureRecentDaysExist(user.uid);
      lastCheckedDate.current = getDate(0); // Update our reference date
    }
  }, [user?.uid, organizationId]); // ✅ UPDATED: Added organizationId dependency

  // Update a specific day's status
  const updateStreakStatus = async (
    date: string,
    status: "success" | "fail"
  ) => {
    const uid = user?.uid;

    // ✅ UPDATED: Check for organizationId
    if (!uid || !organizationId) {
      return;
    }

    // ✅ UPDATED: Use organizations path
    const ref = doc(
      db,
      "organizations",
      organizationId,
      "users",
      uid,
      "streak",
      date
    );

    try {
      await setDoc(ref, { status });
    } catch (error) {
      console.error(`🔍 updateStreakStatus: Error:`, error);
    }
  };

  // Undo a specific day's status (revert to pending)
  const undoStreakStatus = async (date: string) => {
    const uid = user?.uid;

    // ✅ UPDATED: Check for organizationId
    if (!uid || !organizationId) {
      return;
    }

    // ✅ UPDATED: Use organizations path
    const ref = doc(
      db,
      "organizations",
      organizationId,
      "users",
      uid,
      "streak",
      date
    );

    try {
      await setDoc(ref, { status: "pending" });
    } catch (error) {
      console.error(`🔍 undoStreakStatus: Error:`, error);
    }
  };

  return { streakData, updateStreakStatus, undoStreakStatus, user };
}
