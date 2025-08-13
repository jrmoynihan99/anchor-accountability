import { StreakEntry } from "@/components/morphing/streak/streakUtils";
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
const getDate = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
};

export function useStreakData() {
  const [streakData, setStreakData] = useState<StreakEntry[]>([]);
  const [user, setUser] = useState(auth.currentUser);
  const lastCheckedDate = useRef<string>(getDate(0)); // Track when we last checked the date

  // Listen to auth state changes
  useEffect(() => {
    console.log(`🔍 useStreakData: Setting up auth state listener`);

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      console.log(`🔍 useStreakData: Auth state changed, user:`, user?.uid);
      setUser(user);
    });

    return () => {
      console.log(`🔍 useStreakData: Cleaning up auth listener`);
      unsubAuth();
    };
  }, []);

  // Function to ensure recent days exist
  const ensureRecentDaysExist = async (uid: string) => {
    console.log(`🔍 ensureRecentDaysExist: Current user UID:`, uid);

    const today = getDate(0);
    const yesterday = getDate(-1);

    console.log(`🔍 ensureRecentDaysExist: Today's date:`, today);
    console.log(`🔍 ensureRecentDaysExist: Yesterday's date:`, yesterday);

    // Check and create today's document
    const todayRef = doc(db, "users", uid, "streak", today);
    const yesterdayRef = doc(db, "users", uid, "streak", yesterday);

    try {
      // Check today
      const todaySnap = await getDoc(todayRef);
      console.log(
        `🔍 ensureRecentDaysExist: Today document exists?`,
        todaySnap.exists()
      );

      if (!todaySnap.exists()) {
        console.log(
          `🔍 ensureRecentDaysExist: Creating pending document for today`
        );
        await setDoc(todayRef, { status: "pending" });
      }

      // Check yesterday
      const yesterdaySnap = await getDoc(yesterdayRef);
      console.log(
        `🔍 ensureRecentDaysExist: Yesterday document exists?`,
        yesterdaySnap.exists()
      );

      if (!yesterdaySnap.exists()) {
        console.log(
          `🔍 ensureRecentDaysExist: Creating pending document for yesterday`
        );
        await setDoc(yesterdayRef, { status: "pending" });
      }

      console.log(
        `🔍 ensureRecentDaysExist: Successfully ensured recent days exist`
      );
    } catch (error) {
      console.error(`🔍 ensureRecentDaysExist: Error:`, error);
    }
  };

  // Function to check if date changed and refresh if needed
  const checkDateAndRefresh = async () => {
    const currentDate = getDate(0);

    if (currentDate !== lastCheckedDate.current) {
      console.log(
        `🔍 Date changed from ${lastCheckedDate.current} to ${currentDate}, refreshing data...`
      );
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
        console.log(`🔍 App became active, checking if date changed...`);
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
    console.log(`🔍 useStreakData: User effect triggered, UID:`, uid);

    if (!uid) {
      console.log(`🔍 useStreakData: No user authenticated, clearing data`);
      setStreakData([]);
      return;
    }

    const ref = collection(db, "users", uid, "streak");
    console.log(
      `🔍 useStreakData: Setting up listener for path: users/${uid}/streak`
    );

    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        console.log(
          `🔍 useStreakData: Snapshot received with ${snapshot.docs.length} documents`
        );

        const data: StreakEntry[] = snapshot.docs.map((doc) => {
          const entry = {
            date: doc.id,
            status: doc.data().status,
          };
          console.log(`🔍 useStreakData: Document ${doc.id}:`, doc.data());
          return entry;
        });

        console.log(`🔍 useStreakData: Final streak data:`, data);
        setStreakData(data);
      },
      (error) => {
        console.error(`🔍 useStreakData: Error in snapshot listener:`, error);
      }
    );

    return () => {
      console.log(`🔍 useStreakData: Cleaning up firestore listener`);
      unsub();
    };
  }, [user?.uid]);

  // Make sure today's and yesterday's records exist when user changes
  useEffect(() => {
    if (user?.uid) {
      ensureRecentDaysExist(user.uid);
      lastCheckedDate.current = getDate(0); // Update our reference date
    }
  }, [user?.uid]);

  // Update a specific day's status
  const updateStreakStatus = async (
    date: string,
    status: "success" | "fail"
  ) => {
    const uid = user?.uid;
    console.log(`🔍 updateStreakStatus: Current user UID:`, uid);
    console.log(
      `🔍 updateStreakStatus: Updating date ${date} to status ${status}`
    );

    if (!uid) {
      console.log(
        `🔍 updateStreakStatus: No user authenticated, returning early`
      );
      return;
    }

    const ref = doc(db, "users", uid, "streak", date);
    console.log(
      `🔍 updateStreakStatus: Updating document at: users/${uid}/streak/${date}`
    );

    try {
      await setDoc(ref, { status });
      console.log(`🔍 updateStreakStatus: Successfully updated document`);
    } catch (error) {
      console.error(`🔍 updateStreakStatus: Error:`, error);
    }
  };

  return { streakData, updateStreakStatus, user };
}
